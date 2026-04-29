/**
 * Number of debate rounds (configurable)
 */
export const DEBATE_ROUNDS = 2;

/**
 * Council orchestrates the three-phase deliberation process
 */
export class Council {
  constructor(agents) {
    this.agents = agents;
  }

  /**
   * Execute full deliberation: Proposals → Debate → Synthesis
   * @param {string} query - User's question
   * @returns {Promise<{proposals: Array, debates: Array, consensus: string}>}
   */
  async deliberate(query) {
    // Phase 1: Parallel proposals
    const proposals = await this._runProposals(query);

    // Phase 2: Multiple debate rounds
    const debates = await this._runDebates(query, proposals);

    // Phase 3: Synthesis
    const consensus = await this._runSynthesis(query, debates);

    return { proposals, debates, consensus };
  }

  /**
   * Phase 1: All agents propose independently in parallel
   */
  async _runProposals(query) {
    const proposalPromises = this.agents.map(async (agent) => {
      const proposal = await agent.propose(query);
      return { agent: agent.name, proposal };
    });

    return await Promise.all(proposalPromises);
  }

  /**
   * Phase 2: Agents debate proposals over multiple rounds
   */
  async _runDebates(query, proposals) {
    const debates = [];

    for (let round = 1; round <= DEBATE_ROUNDS; round++) {
      const debatePromises = this.agents.map(async (agent) => {
        const response = await agent.debate(query, proposals, round);
        return { agent: agent.name, response };
      });

      const responses = await Promise.all(debatePromises);
      debates.push({ round, responses });
    }

    return debates;
  }

  /**
   * Phase 3: First agent synthesizes consensus
   */
  async _runSynthesis(query, debates) {
    const synthesizer = this.agents[0]; // TODO: Implement rotation
    return await synthesizer.synthesize(query, debates);
  }
}
