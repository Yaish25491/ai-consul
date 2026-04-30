import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import { Agent } from './base.js';
import { withRetry } from '../utils/retry.js';

export class GeminiAgent extends Agent {
  constructor(apiKey) {
    super('Gemini', '🟢', 'gemini-2.0-flash');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.client = genAI.getGenerativeModel({ model: this.model });
  }

  async propose(query, signal = null) {
    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} rate limited (attempt ${attempt}). ` +
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
    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} rate limited (attempt ${attempt}). ` +
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
    const retryCallback = (attempt, error, delayMs) => {
      console.log(chalk.yellow(
        `\n⚠️  ${this.name} rate limited (attempt ${attempt}). ` +
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
