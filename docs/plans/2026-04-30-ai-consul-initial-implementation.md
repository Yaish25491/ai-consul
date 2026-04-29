# AI Consul Initial Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-agent deliberation CLI that orchestrates AI agents from multiple providers to debate and reach consensus on user queries.

**Architecture:** Three-phase deliberation system (Proposals → Debate → Synthesis) with dynamic agent loading based on environment variables, coordinated by a council orchestrator, rendered to terminal via REPL.

**Tech Stack:** Node.js 18+, @anthropic-ai/sdk, @google/generative-ai, chalk, boxen, ora, jest

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Initialize package.json**

Create:
```json
{
  "name": "ai-consul",
  "version": "1.0.0",
  "description": "Multi-agent deliberation CLI",
  "type": "module",
  "main": "bin/consul.js",
  "bin": {
    "consul": "./bin/consul.js"
  },
  "scripts": {
    "start": "node bin/consul.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "keywords": ["ai", "cli", "multi-agent", "deliberation"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@google/generative-ai": "^0.21.0",
    "chalk": "^5.3.0",
    "boxen": "^8.0.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "jest": "^29.7.0"
  }
}
```

**Step 2: Create .env.example**

Create:
```
# AI Consul requires at least 2 API keys to function

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Google (Gemini)
GEMINI_API_KEY=AIza-your-key-here

# OpenAI (Planned)
# OPENAI_API_KEY=sk-your-key-here

# Mistral (Planned)
# MISTRAL_API_KEY=your-key-here
```

**Step 3: Create .gitignore**

Create:
```
node_modules/
.env
.env.local
*.log
.DS_Store
coverage/
dist/
```

**Step 4: Create basic README.md**

Create:
```markdown
# AI Consul

Multi-agent deliberation CLI - AI models debate to reach consensus.

## Quick Start

```bash
# Install dependencies
npm install

# Configure API keys (minimum 2 required)
cp .env.example .env
# Edit .env with your API keys

# Run
npm start
```

## Requirements

- Node.js 18.0.0+
- At least 2 API keys from: ANTHROPIC_API_KEY, GEMINI_API_KEY
```

**Step 5: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 6: Commit project setup**

```bash
git init
git add package.json .env.example .gitignore README.md
git commit -m "feat: initialize project structure"
```

---

## Task 2: Agent Base Interface

**Files:**
- Create: `src/agents/base.js`
- Create: `tests/agents/base.test.js`

**Step 1: Write the failing test**

Create `tests/agents/base.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/agents/base.test.js`
Expected: FAIL - "Cannot find module '../../src/agents/base.js'"

**Step 3: Write minimal implementation**

Create `src/agents/base.js`:
```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/agents/base.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/agents/base.js tests/agents/base.test.js
git commit -m "feat: add agent base class with interface contract"
```

---

## Task 3: Claude Agent Implementation

**Files:**
- Create: `src/agents/claude.js`
- Create: `tests/agents/claude.test.js`

**Step 1: Write the failing test**

Create `tests/agents/claude.test.js`:
```javascript
import { describe, test, expect, jest } from '@jest/globals';
import { ClaudeAgent } from '../../src/agents/claude.js';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Mocked response' }]
        })
      }
    }))
  };
});

describe('ClaudeAgent', () => {
  test('should create agent with correct properties', () => {
    const agent = new ClaudeAgent('test-key');
    
    expect(agent.name).toBe('Claude');
    expect(agent.emoji).toBe('🔵');
    expect(agent.model).toBe('claude-opus-4-5');
  });

  test('should propose a solution', async () => {
    const agent = new ClaudeAgent('test-key');
    const result = await agent.propose('What is 2+2?');
    
    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const agent = new ClaudeAgent('test-key');
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];
    
    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const agent = new ClaudeAgent('test-key');
    const history = [
      { round: 1, responses: [{ agent: 'Claude', response: 'Debate 1' }] }
    ];
    
    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/agents/claude.test.js`
Expected: FAIL - "Cannot find module '../../src/agents/claude.js'"

**Step 3: Write minimal implementation**

Create `src/agents/claude.js`:
```javascript
import Anthropic from '@anthropic-ai/sdk';
import { Agent } from './base.js';

export class ClaudeAgent extends Agent {
  constructor(apiKey) {
    super('Claude', '🔵', 'claude-opus-4-5');
    this.client = new Anthropic({ apiKey });
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

    return message.content[0].text;
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

    return message.content[0].text;
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

    return message.content[0].text;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/agents/claude.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/agents/claude.js tests/agents/claude.test.js
git commit -m "feat: implement Claude agent with propose/debate/synthesize"
```

---

## Task 4: Gemini Agent Implementation

**Files:**
- Create: `src/agents/gemini.js`
- Create: `tests/agents/gemini.test.js`

**Step 1: Write the failing test**

Create `tests/agents/gemini.test.js`:
```javascript
import { describe, test, expect, jest } from '@jest/globals';
import { GeminiAgent } from '../../src/agents/gemini.js';

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('Mocked response')
          }
        })
      })
    }))
  };
});

describe('GeminiAgent', () => {
  test('should create agent with correct properties', () => {
    const agent = new GeminiAgent('test-key');
    
    expect(agent.name).toBe('Gemini');
    expect(agent.emoji).toBe('🟢');
    expect(agent.model).toBe('gemini-2.0-flash');
  });

  test('should propose a solution', async () => {
    const agent = new GeminiAgent('test-key');
    const result = await agent.propose('What is 2+2?');
    
    expect(result).toBe('Mocked response');
  });

  test('should participate in debate', async () => {
    const agent = new GeminiAgent('test-key');
    const proposals = [
      { agent: 'Claude', proposal: 'First proposal' },
      { agent: 'Gemini', proposal: 'Second proposal' }
    ];
    
    const result = await agent.debate('What is 2+2?', proposals, 1);
    expect(result).toBe('Mocked response');
  });

  test('should synthesize consensus', async () => {
    const agent = new GeminiAgent('test-key');
    const history = [
      { round: 1, responses: [{ agent: 'Gemini', response: 'Debate 1' }] }
    ];
    
    const result = await agent.synthesize('What is 2+2?', history);
    expect(result).toBe('Mocked response');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/agents/gemini.test.js`
Expected: FAIL - "Cannot find module '../../src/agents/gemini.js'"

**Step 3: Write minimal implementation**

Create `src/agents/gemini.js`:
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent } from './base.js';

export class GeminiAgent extends Agent {
  constructor(apiKey) {
    super('Gemini', '🟢', 'gemini-2.0-flash');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: this.model });
  }

  async propose(query) {
    const prompt = `You are participating in a multi-agent deliberation council. Propose your independent solution to this query without knowing what other agents will suggest.

Query: ${query}

Provide a complete, well-reasoned solution.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async debate(query, proposals, round) {
    const proposalText = proposals
      .map(p => `**${p.agent}**: ${p.proposal}`)
      .join('\n\n');

    const prompt = `You are in debate round ${round} of a multi-agent deliberation council.

Original Query: ${query}

Proposals from all agents:
${proposalText}

Review all proposals. Identify strengths and weaknesses. State your refined position or explain why you hold firm. Be constructive and specific.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
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

    const prompt = `You are synthesizing the final consensus from a multi-agent deliberation.

Original Query: ${query}

Debate History:
${debateText}

Produce a single, clean consensus answer that incorporates the best reasoning from all rounds. Write directly to the user with no meta-commentary about the debate process.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/agents/gemini.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/agents/gemini.js tests/agents/gemini.test.js
git commit -m "feat: implement Gemini agent with propose/debate/synthesize"
```

---

## Task 5: Agent Loader

**Files:**
- Create: `src/agents/index.js`
- Create: `tests/agents/index.test.js`

**Step 1: Write the failing test**

Create `tests/agents/index.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/agents/index.test.js`
Expected: FAIL - "Cannot find module '../../src/agents/index.js'"

**Step 3: Write minimal implementation**

Create `src/agents/index.js`:
```javascript
import { ClaudeAgent } from './claude.js';
import { GeminiAgent } from './gemini.js';

/**
 * Dynamically load agents based on available API keys
 * @returns {Array<Agent>} Array of initialized agents
 * @throws {Error} If fewer than 2 agents are available
 */
export function loadAgents() {
  const agents = [];

  // Load Claude if API key is present
  if (process.env.ANTHROPIC_API_KEY) {
    agents.push(new ClaudeAgent(process.env.ANTHROPIC_API_KEY));
  }

  // Load Gemini if API key is present
  if (process.env.GEMINI_API_KEY) {
    agents.push(new GeminiAgent(process.env.GEMINI_API_KEY));
  }

  // TODO: Add OpenAI agent when implemented
  // if (process.env.OPENAI_API_KEY) {
  //   agents.push(new OpenAIAgent(process.env.OPENAI_API_KEY));
  // }

  // TODO: Add Mistral agent when implemented
  // if (process.env.MISTRAL_API_KEY) {
  //   agents.push(new MistralAgent(process.env.MISTRAL_API_KEY));
  // }

  // Minimum 2 agents required for deliberation
  if (agents.length < 2) {
    const available = agents.map(a => a.name).join(', ') || 'none';
    throw new Error(
      `At least 2 API keys required for multi-agent deliberation.\n` +
      `Available agents: ${available}\n` +
      `Configure at least 2 of: ANTHROPIC_API_KEY, GEMINI_API_KEY`
    );
  }

  return agents;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/agents/index.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/agents/index.js tests/agents/index.test.js
git commit -m "feat: add dynamic agent loader with env-based activation"
```

---

## Task 6: Council Orchestrator

**Files:**
- Create: `src/core/council.js`
- Create: `tests/core/council.test.js`

**Step 1: Write the failing test**

Create `tests/core/council.test.js`:
```javascript
import { describe, test, expect, jest } from '@jest/globals';
import { Council, DEBATE_ROUNDS } from '../../src/core/council.js';

// Mock Agent for testing
class MockAgent {
  constructor(name) {
    this.name = name;
    this.emoji = '🧪';
    this.model = 'mock-model';
  }

  async propose(query) {
    return `${this.name} proposal for: ${query}`;
  }

  async debate(query, proposals, round) {
    return `${this.name} debate round ${round}`;
  }

  async synthesize(query, history) {
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
        expect.objectContaining({ agent: 'Agent1' }),
        expect.objectContaining({ agent: 'Agent2' })
      ]),
      expect.any(Number)
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/core/council.test.js`
Expected: FAIL - "Cannot find module '../../src/core/council.js'"

**Step 3: Write minimal implementation**

Create `src/core/council.js`:
```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/core/council.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/core/council.js tests/core/council.test.js
git commit -m "feat: add council orchestrator for three-phase deliberation"
```

---

## Task 7: Terminal Renderer

**Files:**
- Create: `src/ui/renderer.js`
- Create: `tests/ui/renderer.test.js`

**Step 1: Write the failing test**

Create `tests/ui/renderer.test.js`:
```javascript
import { describe, test, expect, jest } from '@jest/globals';
import { Renderer } from '../../src/ui/renderer.js';

describe('Renderer', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('should display banner with agent list', () => {
    const agents = [
      { name: 'Claude', emoji: '🔵', model: 'claude-opus-4-5' },
      { name: 'Gemini', emoji: '🟢', model: 'gemini-2.0-flash' }
    ];
    
    Renderer.displayBanner(agents);
    
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('AI CONSUL');
    expect(output).toContain('Claude');
    expect(output).toContain('Gemini');
  });

  test('should display phase header', () => {
    Renderer.displayPhaseHeader('PROPOSALS');
    
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('PROPOSALS');
  });

  test('should display agent response', () => {
    const agent = { name: 'Claude', emoji: '🔵' };
    
    Renderer.displayAgentResponse(agent, 'Test response');
    
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Claude');
    expect(output).toContain('Test response');
  });

  test('should display verdict in box', () => {
    Renderer.displayVerdict('Final consensus answer');
    
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Final consensus answer');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/ui/renderer.test.js`
Expected: FAIL - "Cannot find module '../../src/ui/renderer.js'"

**Step 3: Write minimal implementation**

Create `src/ui/renderer.js`:
```javascript
import chalk from 'chalk';
import boxen from 'boxen';

export class Renderer {
  /**
   * Display startup banner with council members
   */
  static displayBanner(agents) {
    console.log('\n');
    console.log(chalk.bold.cyan('╔══════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║            AI CONSUL v1.0                ║'));
    console.log(chalk.bold.cyan('║   Multi-Agent Deliberation Council       ║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝'));
    console.log('\n');
    console.log(chalk.bold('Council Members:'));
    agents.forEach(agent => {
      console.log(`  ${agent.emoji} ${chalk.bold(agent.name)} (${agent.model})`);
    });
    console.log('\n');
    console.log(chalk.dim('Type /help for commands, /exit to quit\n'));
  }

  /**
   * Display phase transition header
   */
  static displayPhaseHeader(phaseName) {
    const width = 60;
    const padding = Math.floor((width - phaseName.length - 2) / 2);
    const line = '═'.repeat(width);
    const header = '═'.repeat(padding) + ` ${phaseName} ` + '═'.repeat(padding);
    
    console.log('\n');
    console.log(chalk.yellow(header));
    console.log('\n');
  }

  /**
   * Display agent's response with color coding
   */
  static displayAgentResponse(agent, response) {
    const color = this._getAgentColor(agent.name);
    const header = `${agent.emoji} ${chalk.bold[color](agent.name)}`;
    
    console.log(header);
    console.log(chalk[color](response));
    console.log('\n');
  }

  /**
   * Display final verdict in a box
   */
  static displayVerdict(consensus) {
    const boxContent = boxen(consensus, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      title: '✨ CONSENSUS',
      titleAlignment: 'center'
    });
    
    console.log('\n');
    console.log(boxContent);
    console.log('\n');
  }

  /**
   * Get color for agent based on name
   */
  static _getAgentColor(agentName) {
    const colorMap = {
      'Claude': 'blue',
      'Gemini': 'green',
      'GPT-4': 'magenta',
      'Mistral': 'cyan'
    };
    return colorMap[agentName] || 'white';
  }

  /**
   * Display help text
   */
  static displayHelp() {
    console.log('\n');
    console.log(chalk.bold('Available Commands:'));
    console.log('  /help    - Display this help message');
    console.log('  /agents  - List active council members');
    console.log('  /exit    - Exit the session');
    console.log('  /quit    - Exit the session');
    console.log('  Ctrl+C   - Graceful exit');
    console.log('\n');
  }

  /**
   * Display error message
   */
  static displayError(message) {
    console.log('\n');
    console.log(chalk.red.bold('ERROR: ') + chalk.red(message));
    console.log('\n');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/ui/renderer.test.js`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/ui/renderer.js tests/ui/renderer.test.js
git commit -m "feat: add terminal renderer with phase headers and verdict boxes"
```

---

## Task 8: REPL Entry Point

**Files:**
- Create: `bin/consul.js`
- Create: `tests/integration/repl.test.js`

**Step 1: Write the integration test**

Create `tests/integration/repl.test.js`:
```javascript
import { describe, test, expect } from '@jest/globals';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binPath = join(__dirname, '../../bin/consul.js');

describe('REPL Integration', () => {
  test('should exit with error when insufficient API keys', (done) => {
    const proc = spawn('node', [binPath], {
      env: { ...process.env, ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '' }
    });

    let output = '';
    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      expect(code).toBe(1);
      expect(output).toContain('At least 2 API keys required');
      done();
    });
  }, 10000);

  test('should display banner when sufficient API keys present', (done) => {
    const proc = spawn('node', [binPath], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: 'test-key',
        GEMINI_API_KEY: 'test-key'
      }
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('AI CONSUL')) {
        proc.kill();
      }
    });

    proc.on('close', () => {
      expect(output).toContain('AI CONSUL');
      expect(output).toContain('Council Members');
      done();
    });
  }, 10000);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/integration/repl.test.js`
Expected: FAIL - "Cannot find module 'bin/consul.js'"

**Step 3: Write minimal implementation**

Create `bin/consul.js`:
```javascript
#!/usr/bin/env node

import readline from 'readline';
import ora from 'ora';
import { loadAgents } from '../src/agents/index.js';
import { Council } from '../src/core/council.js';
import { Renderer } from '../src/ui/renderer.js';

/**
 * Main REPL loop
 */
async function main() {
  let agents;
  let council;

  // Load agents and validate
  try {
    agents = loadAgents();
    council = new Council(agents);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  // Display banner
  Renderer.displayBanner(agents);

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  // Handle user input
  rl.on('line', async (input) => {
    const trimmed = input.trim();

    // Handle empty input
    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Handle commands
    if (trimmed.startsWith('/')) {
      handleCommand(trimmed, agents, rl);
      return;
    }

    // Process query
    await processQuery(trimmed, council, agents);
    rl.prompt();
  });

  // Handle Ctrl+C
  rl.on('SIGINT', () => {
    console.log('\n\nGoodbye!\n');
    process.exit(0);
  });

  // Start prompt
  rl.prompt();
}

/**
 * Handle special commands
 */
function handleCommand(command, agents, rl) {
  switch (command.toLowerCase()) {
    case '/help':
      Renderer.displayHelp();
      break;

    case '/agents':
      console.log('\nActive Council Members:');
      agents.forEach(agent => {
        console.log(`  ${agent.emoji} ${agent.name} (${agent.model})`);
      });
      console.log('\n');
      break;

    case '/exit':
    case '/quit':
      console.log('\nGoodbye!\n');
      process.exit(0);
      break;

    default:
      console.log(`\nUnknown command: ${command}`);
      console.log('Type /help for available commands\n');
  }

  rl.prompt();
}

/**
 * Process user query through deliberation
 */
async function processQuery(query, council, agents) {
  try {
    // Phase 1: Proposals
    Renderer.displayPhaseHeader('PHASE 1: PROPOSALS');
    const spinner1 = ora('Generating proposals...').start();
    
    const proposals = await council._runProposals(query);
    spinner1.stop();
    
    proposals.forEach(({ agent, proposal }) => {
      const agentObj = agents.find(a => a.name === agent);
      Renderer.displayAgentResponse(agentObj, proposal);
    });

    // Phase 2: Debate
    Renderer.displayPhaseHeader('PHASE 2: DEBATE');
    const debates = [];
    
    for (let round = 1; round <= 2; round++) {
      const spinner2 = ora(`Debate round ${round}...`).start();
      
      const debatePromises = agents.map(async (agent) => {
        const response = await agent.debate(query, proposals, round);
        return { agent: agent.name, response };
      });
      
      const responses = await Promise.all(debatePromises);
      spinner2.stop();
      
      console.log(`\n--- Round ${round} ---\n`);
      responses.forEach(({ agent, response }) => {
        const agentObj = agents.find(a => a.name === agent);
        Renderer.displayAgentResponse(agentObj, response);
      });
      
      debates.push({ round, responses });
    }

    // Phase 3: Synthesis
    Renderer.displayPhaseHeader('PHASE 3: SYNTHESIS');
    const spinner3 = ora('Synthesizing consensus...').start();
    
    const consensus = await council._runSynthesis(query, debates);
    spinner3.stop();
    
    Renderer.displayVerdict(consensus);

  } catch (error) {
    Renderer.displayError(error.message);
  }
}

// Run main
main().catch(console.error);
```

**Step 4: Make executable**

Run: `chmod +x bin/consul.js`
Expected: File is now executable

**Step 5: Test manually with mock keys**

Run: `ANTHROPIC_API_KEY=test GEMINI_API_KEY=test node bin/consul.js`
Expected: Banner displays, REPL starts (will fail on actual queries without real keys, but startup should work)

**Step 6: Run integration test**

Run: `npm test tests/integration/repl.test.js`
Expected: PASS - All tests passing

**Step 7: Commit**

```bash
git add bin/consul.js tests/integration/repl.test.js
git commit -m "feat: add REPL entry point with command handling and deliberation flow"
```

---

## Task 9: Final Testing and Documentation

**Files:**
- Modify: `README.md`
- Create: `jest.config.js`

**Step 1: Create Jest configuration**

Create `jest.config.js`:
```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'bin/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ]
};
```

**Step 2: Update README with complete usage**

Edit `README.md`:
```markdown
# AI Consul

Multi-agent deliberation CLI - AI models debate to reach consensus.

## Overview

AI Consul replaces single-model AI responses with structured multi-agent deliberation. Multiple AI agents from different providers (Claude, Gemini) independently propose solutions, debate each other's reasoning through multiple rounds, and converge on a consensus answer before presenting to the user.

## Three-Phase Process

1. **PROPOSALS** - All agents propose independently in parallel
2. **DEBATE** - Agents review proposals and refine positions over multiple rounds
3. **SYNTHESIS** - Lead agent consolidates debate into consensus answer

## Requirements

- Node.js 18.0.0+
- npm 8.0.0+
- **At least 2 API keys** from supported providers

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys (minimum 2 required)
cp .env.example .env

# Edit .env and add your keys:
export ANTHROPIC_API_KEY=sk-ant-...
export GEMINI_API_KEY=AIza...

# 3. Run
npm start

# Or install globally
npm install -g .
consul
```

## Usage

```bash
> What is the best way to handle errors in async JavaScript?

# Council will deliberate and present consensus...

> /help         # Show available commands
> /agents       # List active council members
> /exit         # Exit session
```

## Supported Providers

| Provider | Environment Variable | Model |
|----------|---------------------|-------|
| Claude | `ANTHROPIC_API_KEY` | claude-opus-4-5 |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenAI | `OPENAI_API_KEY` | (planned) |
| Mistral | `MISTRAL_API_KEY` | (planned) |

## Development

```bash
# Run tests
npm test

# Watch mode
npm test:watch

# Lint
npm run lint
npm run lint:fix
```

## Configuration

Debate depth can be configured in `src/core/council.js`:

```javascript
export const DEBATE_ROUNDS = 2; // Default: 2 rounds
```

## Adding New Agents

See `docs/plans/2026-04-30-ai-consul-initial-implementation-design.md` for architecture details.

1. Create agent file implementing the Agent interface
2. Register in `src/agents/index.js`
3. Document environment variable

## Cost & Performance

- Expected latency: 20-40 seconds per query (2 agents, 2 rounds)
- API cost scales linearly with number of agents and rounds
- Every query hits all active agents across all phases

## License

MIT
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests passing

**Step 4: Commit**

```bash
git add README.md jest.config.js
git commit -m "docs: complete README with usage and configuration details"
```

---

## Task 10: Verification & Final Touches

**Step 1: Verify project structure**

Run: `find . -type f -name "*.js" | grep -v node_modules | sort`
Expected: All source and test files listed correctly

**Step 2: Test with real API keys (if available)**

Run: `npm start`
Expected: Banner displays, prompt appears, can handle queries

**Step 3: Test error cases**

Run: `ANTHROPIC_API_KEY=invalid node bin/consul.js`
Expected: Proper error message about insufficient keys

**Step 4: Create final commit**

```bash
git add -A
git commit -m "feat: AI Consul v1.0 - complete multi-agent deliberation CLI"
```

**Step 5: Tag release**

```bash
git tag -a v1.0.0 -m "Initial release: AI Consul multi-agent deliberation CLI"
```

---

## Next Steps

After implementation, consider these enhancements:

1. **Synthesizer Rotation** - Rotate which agent synthesizes to reduce bias
2. **CLI Flags** - Add `--rounds N` for configurable debate depth
3. **Consensus Detection** - Early termination when agents converge
4. **Session Logging** - Persist debate transcripts to disk
5. **Streaming Output** - Token-by-token agent responses
6. **Agent Personas** - Role-based system prompts (security, performance, etc.)
7. **OpenAI Agent** - Add GPT-4 support
8. **Mistral Agent** - Add Mistral Large support
