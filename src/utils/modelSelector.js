/**
 * Analyze query complexity to recommend model tier
 *
 * @param {string} query - User's query
 * @param {string} phase - 'proposal' | 'debate' | 'synthesis'
 * @param {string} context - Additional context (e.g., proposals, debates)
 * @returns {'fast' | 'balanced' | 'best' | 'thinking'}
 */
export function selectModelTier(query, phase, context = '') {
  // Allow environment override for testing/debugging
  const forcedTier = process.env.AI_CONSUL_FORCE_MODEL_TIER;
  if (forcedTier && ['fast', 'balanced', 'best', 'thinking'].includes(forcedTier)) {
    return forcedTier;
  }

  const combinedText = `${query} ${context}`.toLowerCase();
  const wordCount = combinedText.split(/\s+/).length;

  // Phase-based defaults
  const phaseDefaults = {
    proposal: 'fast',      // Speed matters, parallelized
    debate: 'balanced',    // Need reasoning but not slowest
    synthesis: 'best'      // Final answer, use best model
  };

  // Complexity indicators
  const complexityMarkers = {
    high: [
      'explain in detail',
      'comprehensive',
      'analyze',
      'compare and contrast',
      'step by step',
      'detailed explanation',
      'in depth',
      'thorough',
      'research',
      'multi-step',
      'reasoning',
      'elaborate',
      'extensively'
    ],
    low: [
      'what is',
      'define',
      'list',
      'name',
      'simple',
      'quick',
      'briefly',
      'tldr',
      'summary',
      'summarize'
    ],
    thinking: [
      'mathematical',
      'proof',
      'solve',
      'calculate',
      'logic puzzle',
      'reasoning chain',
      'deduce',
      'derive',
      'theorem',
      'equation',
      'algorithm'
    ]
  };

  // Check for explicit complexity markers
  const hasHighComplexity = complexityMarkers.high.some(marker =>
    combinedText.includes(marker)
  );
  const hasLowComplexity = complexityMarkers.low.some(marker =>
    combinedText.includes(marker)
  );
  const needsThinking = complexityMarkers.thinking.some(marker =>
    combinedText.includes(marker)
  );

  // Decision logic
  if (needsThinking && phase !== 'proposal') {
    return 'thinking'; // Use thinking model for complex reasoning
  }

  if (hasHighComplexity || wordCount > 100) {
    // Complex query: upgrade from phase default
    if (phase === 'proposal') return 'balanced';
    if (phase === 'debate') return 'best';
    return 'best';
  }

  if (hasLowComplexity && wordCount < 20) {
    // Simple query: downgrade to fast model
    return 'fast';
  }

  // Default to phase-based recommendation
  return phaseDefaults[phase] || 'balanced';
}
