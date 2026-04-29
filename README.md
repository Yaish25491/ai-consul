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
