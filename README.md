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
# 1. Clone and install
git clone git@github.com:Yaish25491/ai-consul.git
cd ai-consul
npm install

# 2. Install globally to use 'consul' command anywhere
npm install -g .

# 3. Configure API keys (minimum 2 required)

# Claude Option A: Anthropic API
export ANTHROPIC_API_KEY=sk-ant-api-xxxxx

# Claude Option B: Google Cloud Vertex AI
# export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
# export CLOUD_ML_REGION=us-east5

# Gemini (Required)
export GEMINI_API_KEY=AIza-xxxxx

# 4. Run from anywhere
consul
```

### Alternative: Run locally without global install

```bash
# Configure API keys
cp .env.example .env
# Edit .env with your keys

# Run from project directory
npm start
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
| Claude | `ANTHROPIC_API_KEY` or Vertex AI* | claude-sonnet-4-5@20250929 |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenAI | `OPENAI_API_KEY` | (planned) |
| Mistral | `MISTRAL_API_KEY` | (planned) |

*See Authentication Methods below for Vertex AI setup

## Authentication Methods

### Claude Authentication

AI Consul supports two authentication methods for Claude:

**Option A: Anthropic API Key (Recommended for individual use)**
```bash
export ANTHROPIC_API_KEY=sk-ant-api-xxxxx
```

Get your key at: https://console.anthropic.com/

**Option B: Google Cloud Vertex AI (For enterprise/GCP users)**
```bash
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLOUD_ML_REGION=us-east5
```

Requirements:
- GCP project with Vertex AI API enabled
- Application Default Credentials configured (`gcloud auth application-default login`)

The tool automatically detects which method to use based on environment variables. Vertex AI takes priority if both are configured.

### Gemini Authentication

Requires Google AI API key:
```bash
export GEMINI_API_KEY=AIza-xxxxx
```

Get your key at: https://aistudio.google.com/app/apikey

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
