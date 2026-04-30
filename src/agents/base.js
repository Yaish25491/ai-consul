/**
 * Base Agent class defining the uniform interface
 * All agent implementations must extend this class
 */
export class Agent {
  constructor(name, emoji, model) {
    this.name = name;
    this.emoji = emoji;
    this.model = model;
    this.usage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };
  }

  /**
   * Track token usage
   * @param {number} inputTokens - Input tokens used
   * @param {number} outputTokens - Output tokens generated
   */
  trackUsage(inputTokens, outputTokens) {
    this.usage.inputTokens += inputTokens;
    this.usage.outputTokens += outputTokens;
    this.usage.totalTokens += (inputTokens + outputTokens);
  }

  /**
   * Get current usage stats
   * @returns {Object} - Usage statistics
   */
  getUsage() {
    return { ...this.usage };
  }

  /**
   * Phase 1: Generate independent proposal
   * @param {string} query - User's question
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<string>} - Agent's proposal
   */
  async propose(query, signal = null) {
    throw new Error('propose() must be implemented by subclass');
  }

  /**
   * Phase 2: Review proposals and debate
   * @param {string} query - Original user question
   * @param {Array<{agent: string, proposal: string}>} proposals - All proposals from Phase 1
   * @param {number} round - Current debate round number
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<string>} - Agent's debate response
   */
  async debate(query, proposals, round, signal = null) {
    throw new Error('debate() must be implemented by subclass');
  }

  /**
   * Phase 3: Synthesize consensus from debate
   * @param {string} query - Original user question
   * @param {Array<{round: number, responses: Array}>} history - Full debate history
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<string>} - Final consensus answer
   */
  async synthesize(query, history, signal = null) {
    throw new Error('synthesize() must be implemented by subclass');
  }
}
