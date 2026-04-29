import { describe, test, expect } from '@jest/globals';
import { Agent } from '../../src/agents/base.js';

describe('Agent base class', () => {
  test('should define required interface methods', () => {
    const agent = new Agent('TestAgent', '🧪', 'test-model');

    expect(agent.name).toBe('TestAgent');
    expect(agent.emoji).toBe('🧪');
    expect(agent.model).toBe('test-model');
    expect(typeof agent.propose).toBe('function');
    expect(typeof agent.debate).toBe('function');
    expect(typeof agent.synthesize).toBe('function');
  });

  test('should throw on unimplemented methods', async () => {
    const agent = new Agent('TestAgent', '🧪', 'test-model');

    await expect(agent.propose('query')).rejects.toThrow('propose() must be implemented');
    await expect(agent.debate('query', [], 1)).rejects.toThrow('debate() must be implemented');
    await expect(agent.synthesize('query', [])).rejects.toThrow('synthesize() must be implemented');
  });
});
