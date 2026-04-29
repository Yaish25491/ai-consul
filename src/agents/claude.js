import Anthropic from '@anthropic-ai/sdk';
import { Agent } from './base.js';

export class ClaudeAgent extends Agent {
  constructor(config) {
    if (!config) {
      throw new Error('ClaudeAgent requires a config object');
    }

    super('Claude', '🔵', 'claude-sonnet-4-5@20250929');

    if (config.useVertex) {
      if (!config.projectId || !config.region) {
        throw new Error('Vertex AI authentication requires projectId and region');
      }
      // Vertex AI authentication
      this.authType = 'vertex';
      const baseURL = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}/publishers/anthropic/models`;
      this.client = new Anthropic({
        apiKey: config.apiKey,
        baseURL
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

  async propose(query) {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are participating in a multi-agent deliberation council. Propose your independent solution to this query without knowing what other agents will suggest.

Query: ${query}

Provide a complete, well-reasoned solution.`
      }]
    });

    return message.content?.[0]?.text || '';
  }

  async debate(query, proposals, round) {
    const proposalText = proposals
      .map(p => `**${p.agent}**: ${p.proposal}`)
      .join('\n\n');

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are in debate round ${round} of a multi-agent deliberation council.

Original Query: ${query}

Proposals from all agents:
${proposalText}

Review all proposals. Identify strengths and weaknesses. State your refined position or explain why you hold firm. Be constructive and specific.`
      }]
    });

    return message.content?.[0]?.text || '';
  }

  async synthesize(query, history) {
    const debateText = history
      .map(h => {
        const responses = h.responses
          .map(r => `**${r.agent}**: ${r.response}`)
          .join('\n\n');
        return `## Round ${h.round}\n${responses}`;
      })
      .join('\n\n');

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are synthesizing the final consensus from a multi-agent deliberation.

Original Query: ${query}

Debate History:
${debateText}

Produce a single, clean consensus answer that incorporates the best reasoning from all rounds. Write directly to the user with no meta-commentary about the debate process.`
      }]
    });

    return message.content?.[0]?.text || '';
  }
}
