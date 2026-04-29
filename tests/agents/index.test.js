import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { loadAgents } from '../../src/agents/index.js';

describe('Agent Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should load Claude agent when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.GEMINI_API_KEY = 'test-key';

    const agents = loadAgents();

    expect(agents.length).toBeGreaterThanOrEqual(1);
    const claudeAgent = agents.find(a => a.name === 'Claude');
    expect(claudeAgent).toBeDefined();
  });

  test('should load Gemini agent when GEMINI_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.GEMINI_API_KEY = 'test-key';

    const agents = loadAgents();

    expect(agents.length).toBeGreaterThanOrEqual(1);
    const geminiAgent = agents.find(a => a.name === 'Gemini');
    expect(geminiAgent).toBeDefined();
  });

  test('should throw error when fewer than 2 agents available', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    delete process.env.GEMINI_API_KEY;

    expect(() => loadAgents()).toThrow('At least 2 API keys required');
  });

  test('should load multiple agents when multiple keys are set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.GEMINI_API_KEY = 'test-key';

    const agents = loadAgents();

    expect(agents.length).toBe(2);
  });
});
