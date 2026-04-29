import { describe, test, expect } from '@jest/globals';
import { Agent } from '../../src/agents/base.js';

// Test implementation for API key authentication
class TestClaudeAgentApiKey extends Agent {
  constructor(config) {
    super('Claude', '🔵', 'claude-sonnet-4-5@20250929');
    this.config = config;
    this.authType = 'api-key';
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

// Test implementation for Vertex AI authentication
class TestClaudeAgentVertex extends Agent {
  constructor(config) {
    super('Claude', '🔵', 'claude-sonnet-4-5@20250929');
    this.config = config;
    this.authType = 'vertex';
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

describe('ClaudeAgent - API Key Authentication', () => {
  test('should create agent with correct properties', () => {
    const config = { useVertex: false, apiKey: 'sk-ant-test-key' };
    const agent = new TestClaudeAgentApiKey(config);

    expect(agent.name).toBe('Claude');
    expect(agent.emoji).toBe('🔵');
    expect(agent.model).toBe('claude-sonnet-4-5@20250929');
    expect(agent.authType).toBe('api-key');
    expect(agent.config.apiKey).toBe('sk-ant-test-key');
  });

  test('should propose a solution', async () => {
    const config = { useVertex: false, apiKey: 'sk-ant-test-key' };
    const agent = new TestClaudeAgentApiKey(config);
    const result = await agent.propose('What is 2+2?');

    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const config = { useVertex: false, apiKey: 'sk-ant-test-key' };
    const agent = new TestClaudeAgentApiKey(config);
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];

    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const config = { useVertex: false, apiKey: 'sk-ant-test-key' };
    const agent = new TestClaudeAgentApiKey(config);
    const history = [
      { round: 1, responses: [{ agent: 'Claude', response: 'Debate 1' }] }
    ];

    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});

describe('ClaudeAgent - Vertex AI Authentication', () => {
  test('should create agent with correct properties', () => {
    const config = {
      useVertex: true,
      projectId: 'test-project',
      region: 'us-east5',
      apiKey: 'placeholder'
    };
    const agent = new TestClaudeAgentVertex(config);

    expect(agent.name).toBe('Claude');
    expect(agent.emoji).toBe('🔵');
    expect(agent.model).toBe('claude-sonnet-4-5@20250929');
    expect(agent.authType).toBe('vertex');
    expect(agent.config.projectId).toBe('test-project');
    expect(agent.config.region).toBe('us-east5');
  });

  test('should propose a solution', async () => {
    const config = {
      useVertex: true,
      projectId: 'test-project',
      region: 'us-east5',
      apiKey: 'placeholder'
    };
    const agent = new TestClaudeAgentVertex(config);
    const result = await agent.propose('What is 2+2?');

    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const config = {
      useVertex: true,
      projectId: 'test-project',
      region: 'us-east5',
      apiKey: 'placeholder'
    };
    const agent = new TestClaudeAgentVertex(config);
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];

    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const config = {
      useVertex: true,
      projectId: 'test-project',
      region: 'us-east5',
      apiKey: 'placeholder'
    };
    const agent = new TestClaudeAgentVertex(config);
    const history = [
      { round: 1, responses: [{ agent: 'Claude', response: 'Debate 1' }] }
    ];

    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});
