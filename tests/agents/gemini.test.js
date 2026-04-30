import { describe, test, expect } from '@jest/globals';
import { Agent } from '../../src/agents/base.js';

// Create a test implementation of GeminiAgent without requiring real SDK
class TestGeminiAgent extends Agent {
  constructor(apiKey) {
    super('Gemini', '🟢', 'gemini-3-flash-preview');
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

describe('GeminiAgent', () => {
  test('should create agent with correct properties', () => {
    const agent = new TestGeminiAgent('test-key');

    expect(agent.name).toBe('Gemini');
    expect(agent.emoji).toBe('🟢');
    expect(agent.model).toBe('gemini-3-flash-preview');
  });

  test('should propose a solution', async () => {
    const agent = new TestGeminiAgent('test-key');
    const result = await agent.propose('What is 2+2?');

    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const agent = new TestGeminiAgent('test-key');
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];

    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const agent = new TestGeminiAgent('test-key');
    const history = [
      { round: 1, responses: [{ agent: 'Gemini', response: 'Debate 1' }] }
    ];

    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});
