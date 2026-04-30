import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import { Agent } from './base.js';
import { withRetry } from '../utils/retry.js';
import { selectModelTier } from '../utils/modelSelector.js';

export class GeminiAgent extends Agent {
  constructor(apiKey) {
    super('Gemini', '🟢', 'gemini-3-flash-preview');

    // Define model tiers
    this.models = {
      fast: 'gemini-3-flash-preview',           // Optimized for speed
      balanced: 'gemini-2.5-flash',     // Chat, coding, files
      best: 'gemini-3-pro-preview',             // High-level reasoning
      thinking: 'gemini-3.1-pro-preview'        // Advanced testing, complex reasoning
    };

    this.defaultModel = this.models.balanced;
    this.currentModel = this.defaultModel;

    const genAI = new GoogleGenerativeAI(apiKey);
    this.genAI = genAI; // Store reference to create models dynamically
    this.client = genAI.getGenerativeModel({ model: this.currentModel });
  }

  /**
   * Select optimal model for current request
   */
  selectModel(query, phase, context = '') {
    const tier = selectModelTier(query, phase, context);
    const targetModel = this.models[tier] || this.defaultModel;

    // Gemini requires new client instance for different model
    if (targetModel !== this.currentModel) {
      this.currentModel = targetModel;
      this.client = this.genAI.getGenerativeModel({ model: this.currentModel });
    }

    return this.currentModel;
  }

  async propose(query, signal = null) {
    // Select model for this phase
    const model = this.selectModel(query, 'proposal');

    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} (${model}) rate limited (attempt ${attempt}). ` +
        `Retrying in ${Math.round(delayMs / 1000)}s...\n`
      ));
    };

    return await withRetry(
      async (abortSignal) => {
        // Early abort check (Gemini SDK doesn't support AbortSignal natively)
        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        const prompt = `You are participating in a multi-agent deliberation council. Propose your independent solution to this query without knowing what other agents will suggest.

Query: ${query}

Provide a complete, well-reasoned solution.`;

        const result = await this.client.generateContent(prompt);

        // Late abort check (in case aborted during request)
        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        return result.response.text();
      },
      {},
      retryCallback,
      signal
    );
  }

  async debate(query, proposals, round, signal = null) {
    // Context includes all proposals
    const context = proposals.map(p => p.proposal).join('\n');
    const model = this.selectModel(query, 'debate', context);

    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} (${model}) rate limited (attempt ${attempt}). ` +
        `Retrying in ${Math.round(delayMs / 1000)}s...\n`
      ));
    };

    return await withRetry(
      async (abortSignal) => {
        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        const proposalText = proposals
          .map(p => `**${p.agent}**: ${p.proposal}`)
          .join('\n\n');

        const prompt = `You are in debate round ${round} of a multi-agent deliberation council.

Original Query: ${query}

Proposals from all agents:
${proposalText}

Review all proposals. Identify strengths and weaknesses. State your refined position or explain why you hold firm. Be constructive and specific.`;

        const result = await this.client.generateContent(prompt);

        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        return result.response.text();
      },
      {},
      retryCallback,
      signal
    );
  }

  async synthesize(query, history, signal = null) {
    // Context includes all debates
    const context = history.map(h =>
      h.responses.map(r => r.response).join('\n')
    ).join('\n');

    const model = this.selectModel(query, 'synthesis', context);

    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} (${model}) rate limited (attempt ${attempt}). ` +
        `Retrying in ${Math.round(delayMs / 1000)}s...\n`
      ));
    };

    return await withRetry(
      async (abortSignal) => {
        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        const debateText = history
          .map(h => {
            const responses = h.responses
              .map(r => `**${r.agent}**: ${r.response}`)
              .join('\n\n');
            return `## Round ${h.round}\n${responses}`;
          })
          .join('\n\n');

        const prompt = `You are synthesizing the final consensus from a multi-agent deliberation.

Original Query: ${query}

Debate History:
${debateText}

Produce a single, clean consensus answer that incorporates the best reasoning from all rounds. Write directly to the user with no meta-commentary about the debate process.`;

        const result = await this.client.generateContent(prompt);

        if (abortSignal?.aborted) {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          throw error;
        }

        return result.response.text();
      },
      {},
      retryCallback,
      signal
    );
  }
}
