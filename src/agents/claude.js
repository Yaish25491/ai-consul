import Anthropic from '@anthropic-ai/sdk';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import chalk from 'chalk';
import { Agent } from './base.js';
import { withRetry } from '../utils/retry.js';
import { selectModelTier } from '../utils/modelSelector.js';

export class ClaudeAgent extends Agent {
  constructor(config) {
    if (!config) {
      throw new Error('ClaudeAgent requires a config object');
    }

    // Define model tiers based on auth type
    if (config.useVertex) {
      // Vertex AI models (only claude-3-5-haiku@20241022 available in this project)
      super('Claude', '🔵', 'claude-3-5-haiku@20241022');
      this.models = {
        fast: 'claude-3-5-haiku@20241022',       // Proposals
        balanced: 'claude-3-5-haiku@20241022',    // Debate
        best: 'claude-3-5-haiku@20241022'         // Synthesis
      };
    } else {
      // API Key models (Claude 4 series)
      super('Claude', '🔵', 'claude-sonnet-4-6');
      this.models = {
        fast: 'claude-haiku-4-5',      // Proposals, simple queries
        balanced: 'claude-sonnet-4-6',  // Debate, medium queries
        best: 'claude-opus-4-7'         // Synthesis, complex queries
      };
    }

    this.defaultModel = this.models.balanced;
    this.currentModel = this.defaultModel;

    if (config.useVertex) {
      if (!config.projectId || !config.region) {
        throw new Error('Vertex AI authentication requires projectId and region');
      }
      // Vertex AI authentication
      this.authType = 'vertex';
      this.client = new AnthropicVertex({
        projectId: config.projectId,
        region: config.region
      });
    } else {
      if (!config.apiKey) {
        throw new Error('API key authentication requires apiKey');
      }
      // API key authentication
      this.authType = 'api-key';
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
  }

  /**
   * Select optimal model for current request
   */
  selectModel(query, phase, context = '') {
    const tier = selectModelTier(query, phase, context);
    this.currentModel = this.models[tier] || this.defaultModel;
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
        const requestOptions = {
          model: model, // Use selected model
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are participating in a multi-agent deliberation council. Propose your independent solution to this query without knowing what other agents will suggest.

Query: ${query}

Provide a complete, well-reasoned solution. Use your full reasoning capabilities.`
          }]
        };

        // Only enable thinking for Sonnet/Opus models (Haiku doesn't support it)
        if (model.includes('sonnet') || model.includes('opus')) {
          requestOptions.thinking = {
            type: 'enabled',
            budget_tokens: 4000
          };
        }

        // Add signal if provided (only standard Anthropic SDK supports AbortSignal, not Vertex)
        if (abortSignal && this.authType !== 'vertex') {
          requestOptions.signal = abortSignal;
        }

        const message = await this.client.messages.create(requestOptions);

        // Track token usage
        if (message.usage) {
          this.trackUsage(message.usage.input_tokens || 0, message.usage.output_tokens || 0);
        }

        // Extract text from response (may include thinking blocks)
        const textContent = message.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        return textContent || '';
      },
      {}, // Use default retry config
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
        const proposalText = proposals
          .map(p => `**${p.agent}**: ${p.proposal}`)
          .join('\n\n');

        const requestOptions = {
          model: model, // Use selected model
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are in debate round ${round} of a multi-agent deliberation council.

Original Query: ${query}

Proposals from all agents:
${proposalText}

Review all proposals. Identify strengths and weaknesses. State your refined position or explain why you hold firm. Be constructive and specific. Use your full reasoning capabilities.`
          }]
        };

        // Only enable thinking for Sonnet/Opus models (Haiku doesn't support it)
        if (model.includes('sonnet') || model.includes('opus')) {
          requestOptions.thinking = {
            type: 'enabled',
            budget_tokens: 4000
          };
        }

        // Add signal if provided (only standard Anthropic SDK supports AbortSignal, not Vertex)
        if (abortSignal && this.authType !== 'vertex') {
          requestOptions.signal = abortSignal;
        }

        const message = await this.client.messages.create(requestOptions);

        // Track token usage
        if (message.usage) {
          this.trackUsage(message.usage.input_tokens || 0, message.usage.output_tokens || 0);
        }

        // Extract text from response (may include thinking blocks)
        const textContent = message.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        return textContent || '';
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
        const debateText = history
          .map(h => {
            const responses = h.responses
              .map(r => `**${r.agent}**: ${r.response}`)
              .join('\n\n');
            return `## Round ${h.round}\n${responses}`;
          })
          .join('\n\n');

        const requestOptions = {
          model: model, // Use selected model
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are synthesizing the final consensus from a multi-agent deliberation.

Original Query: ${query}

Debate History:
${debateText}

Produce a single, clean consensus answer that incorporates the best reasoning from all rounds. Write directly to the user with no meta-commentary about the debate process. Use your full reasoning capabilities to synthesize the best answer.`
          }]
        };

        // Only enable thinking for Sonnet/Opus models (Haiku doesn't support it)
        if (model.includes('sonnet') || model.includes('opus')) {
          requestOptions.thinking = {
            type: 'enabled',
            budget_tokens: 5000
          };
        }

        // Add signal if provided (only standard Anthropic SDK supports AbortSignal, not Vertex)
        if (abortSignal && this.authType !== 'vertex') {
          requestOptions.signal = abortSignal;
        }

        const message = await this.client.messages.create(requestOptions);

        // Track token usage
        if (message.usage) {
          this.trackUsage(message.usage.input_tokens || 0, message.usage.output_tokens || 0);
        }

        // Extract text from response (may include thinking blocks)
        const textContent = message.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        return textContent || '';
      },
      {},
      retryCallback,
      signal
    );
  }
}
