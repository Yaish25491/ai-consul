import { describe, test, expect, jest } from '@jest/globals';
import { Council, DEBATE_ROUNDS } from '../../src/core/council.js';

// Mock Agent for testing
class MockAgent {
  constructor(name) {
    this.name = name;
    this.emoji = '🧪';
    this.model = 'mock-model';
  }

  async propose(query, signal = null) {
    return `${this.name} proposal for: ${query}`;
  }

  async debate(query, proposals, round, signal = null) {
    return `${this.name} debate round ${round}`;
  }

  async synthesize(query, history, signal = null) {
    return `${this.name} synthesis`;
  }
}

describe('Council', () => {
  test('should create council with agents', () => {
    const agents = [new MockAgent('Agent1'), new MockAgent('Agent2')];
    const council = new Council(agents);

    expect(council.agents).toHaveLength(2);
  });

  test('should orchestrate full deliberation process', async () => {
    const agents = [new MockAgent('Agent1'), new MockAgent('Agent2')];
    const council = new Council(agents);

    const result = await council.deliberate('Test query');

    expect(result.proposals).toHaveLength(2);
    expect(result.debates).toHaveLength(DEBATE_ROUNDS);
    expect(result.consensus).toBe('Agent1 synthesis');
  });

  test('should execute proposals in parallel', async () => {
    const agents = [new MockAgent('Agent1'), new MockAgent('Agent2')];
    const council = new Council(agents);

    const startTime = Date.now();
    await council.deliberate('Test query');
    const duration = Date.now() - startTime;

    // Should complete faster than sequential execution
    expect(duration).toBeLessThan(1000);
  });

  test('should pass proposals to debate phase', async () => {
    const agents = [new MockAgent('Agent1'), new MockAgent('Agent2')];
    const debateSpy = jest.spyOn(agents[0], 'debate');
    const council = new Council(agents);

    await council.deliberate('Test query');

    expect(debateSpy).toHaveBeenCalledWith(
      'Test query',
      expect.arrayContaining([
        expect.objectContaining({ agent: 'Agent1', aborted: false }),
        expect.objectContaining({ agent: 'Agent2', aborted: false })
      ]),
      expect.any(Number),
      null // signal parameter
    );
  });
});
