import { ClaudeAgent } from './claude.js';
import { GeminiAgent } from './gemini.js';

/**
 * Dynamically load agents based on available API keys
 * @returns {Array<Agent>} Array of initialized agents
 * @throws {Error} If fewer than 2 agents are available
 */
export function loadAgents() {
  const agents = [];

  // Load Claude if API key is present
  if (process.env.ANTHROPIC_API_KEY) {
    agents.push(new ClaudeAgent(process.env.ANTHROPIC_API_KEY));
  }

  // Load Gemini if API key is present
  if (process.env.GEMINI_API_KEY) {
    agents.push(new GeminiAgent(process.env.GEMINI_API_KEY));
  }

  // TODO: Add OpenAI agent when implemented
  // if (process.env.OPENAI_API_KEY) {
  //   agents.push(new OpenAIAgent(process.env.OPENAI_API_KEY));
  // }

  // TODO: Add Mistral agent when implemented
  // if (process.env.MISTRAL_API_KEY) {
  //   agents.push(new MistralAgent(process.env.MISTRAL_API_KEY));
  // }

  // Minimum 2 agents required for deliberation
  if (agents.length < 2) {
    const available = agents.map(a => a.name).join(', ') || 'none';
    throw new Error(
      `At least 2 API keys required for multi-agent deliberation.\n` +
      `Available agents: ${available}\n` +
      `Configure at least 2 of: ANTHROPIC_API_KEY, GEMINI_API_KEY`
    );
  }

  return agents;
}
