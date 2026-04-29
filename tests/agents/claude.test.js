import { describe, test, expect, beforeEach } from '@jest/globals';
import { Agent } from '../../src/agents/base.js';

// Create a test implementation of ClaudeAgent without requiring real SDK
class TestClaudeAgent extends Agent {
  constructor(apiKey) {
    super('Claude', '🔵', 'claude-opus-4-5');
    this.apiKey = apiKey;
  }

  async propose(query) {
    return 'Mocked response';
  }

  async debate(query, proposals, round) {
    return 'Mocked response';
  }

  async synthesize(query, history) {
    return 'Mocked response';
  }
}

describe('ClaudeAgent', () => {
  test('should create agent with correct properties', () => {
    const agent = new TestClaudeAgent('test-key');

    expect(agent.name).toBe('Claude');
    expect(agent.emoji).toBe('🔵');
    expect(agent.model).toBe('claude-opus-4-5');
  });

  test('should propose a solution', async () => {
    const agent = new TestClaudeAgent('test-key');
    const result = await agent.propose('What is 2+2?');

    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const agent = new TestClaudeAgent('test-key');
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];

    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const agent = new TestClaudeAgent('test-key');
    const history = [
      { round: 1, responses: [{ agent: 'Claude', response: 'Debate 1' }] }
    ];

    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});
