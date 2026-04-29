/**
 * Base Agent class defining the uniform interface
 * All agent implementations must extend this class
 */
export class Agent {
  constructor(name, emoji, model) {
    this.name = name;
    this.emoji = emoji;
    this.model = model;
  }

  /**
   * Phase 1: Generate independent proposal
   * @param {string} query - User's question
   * @returns {Promise<string>} - Agent's proposal
   */
  async propose(query) {
    throw new Error('propose() must be implemented by subclass');
  }

  /**
   * Phase 2: Review proposals and debate
   * @param {string} query - Original user question
   * @param {Array<{agent: string, proposal: string}>} proposals - All proposals from Phase 1
   * @param {number} round - Current debate round number
   * @returns {Promise<string>} - Agent's debate response
   */
  async debate(query, proposals, round) {
    throw new Error('debate() must be implemented by subclass');
  }

  /**
   * Phase 3: Synthesize consensus from debate
   * @param {string} query - Original user question
   * @param {Array<{round: number, responses: Array}>} history - Full debate history
   * @returns {Promise<string>} - Final consensus answer
   */
  async synthesize(query, history) {
    throw new Error('synthesize() must be implemented by subclass');
  }
}
