# AI Consul - Initial Implementation Design

**Date:** April 30, 2026  
**Status:** Validated  
**Purpose:** Multi-agent deliberation CLI - initial implementation

## Overview

AI Consul is a command-line tool that replaces single-model AI responses with structured multi-agent deliberation. Multiple AI agents from different providers independently propose solutions, debate each other's reasoning through multiple rounds, and converge on a consensus answer.

## Architecture

### Three-Phase Deliberation Process

Every user query flows through three sequential phases:

**Phase 1 - PROPOSALS**
- All agents receive the user query simultaneously via parallel async calls
- Each agent produces a complete, independent solution without knowledge of other proposals
- Parallelism is critical to prevent anchoring effects

**Phase 2 - DEBATE**
- Each agent reviews all proposals from Phase 1
- Agents identify strengths, surface weaknesses, and refine their positions
- Runs for configurable number of rounds (default: 2)
- Each round allows positions to evolve based on critiques

**Phase 3 - SYNTHESIS**
- A lead agent (currently first available, rotation planned) receives full debate history
- Produces single consensus answer incorporating best reasoning from all rounds
- Output written directly to user with no meta-commentary

### Component Structure

```
ai-consul/
├── bin/
│   └── consul.js           # REPL entry point, command parsing, user I/O
├── src/
│   ├── core/
│   │   └── council.js      # Orchestrator for three-phase lifecycle
│   ├── agents/
│   │   ├── index.js        # Dynamic agent loader
│   │   ├── claude.js       # Claude agent implementation
│   │   └── gemini.js       # Gemini agent implementation
│   └── ui/
│       └── renderer.js     # Terminal output rendering
├── package.json
└── .env.example
```

## Agent Interface

All agents implement a uniform contract:

```javascript
interface Agent {
  name: string          // Display name (e.g., "Claude")
  emoji: string         // Visual identifier (e.g., "🔵")
  model: string         // Model ID (e.g., "claude-opus-4-5")
  
  propose(query: string): Promise<string>
  debate(query: string, proposals: Proposal[], round: number): Promise<string>
  synthesize(query: string, history: DebateRound[]): Promise<string>
}
```

## Data Flow

```
User Query
    ↓
Council.orchestrate()
    ↓
Phase 1: Promise.all(agents.map(a => a.propose(query)))
    ↓
Phase 2: For each round:
           Promise.all(agents.map(a => a.debate(query, proposals, round)))
    ↓
Phase 3: synthesizer.synthesize(query, debateHistory)
    ↓
Renderer.displayVerdict(consensusAnswer)
```

## Environment Configuration

Agent availability determined by environment variables:

- `ANTHROPIC_API_KEY` → Claude (claude-opus-4-5)
- `GEMINI_API_KEY` → Gemini (gemini-3-flash-preview)
- `OPENAI_API_KEY` → GPT-4 (planned)
- `MISTRAL_API_KEY` → Mistral Large (planned)

**Minimum Requirement:** 2 active agents (tool exits with error if < 2 keys configured)

## User Experience

### REPL Commands
- `/help` - Display available commands
- `/agents` - List active council members
- `/exit` or `/quit` - Exit session
- `Ctrl+C` - Graceful exit

### Terminal Output Design
- Phase transitions use full-width dividers
- Agent color-coding persists throughout session
- Final verdict boxed and visually distinct
- Live progress indicators during long model calls

## Error Handling

- Insufficient API keys (< 2) → Clear error message on startup
- Agent API failures → Retry with exponential backoff, fall back to remaining agents
- Network timeouts → Graceful degradation with partial results
- Invalid commands → Help text with command suggestions

## Testing Strategy

- **Unit tests:** Individual agent implementations (propose, debate, synthesize)
- **Integration tests:** Full council orchestration with mock agents
- **E2E tests:** Complete REPL session flows
- **Mock mode:** Test council logic without real API calls

## Dependencies

### Core Runtime
- `@anthropic-ai/sdk` - Claude API client
- `@google/generative-ai` - Gemini API client
- `chalk` - Terminal styling
- `boxen` - Verdict box rendering
- `ora` - Progress indicators
- `readline` (built-in) - REPL management

### Development
- `jest` - Testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

## Configuration Constants

In `src/core/council.js`:

```javascript
export const DEBATE_ROUNDS = 2;  // Number of debate rounds
export const REQUEST_TIMEOUT = 60000;  // API timeout in ms
```

## Performance Characteristics

Expected latency with 2 agents, 2 rounds:

```
Phase 1: max(agent1, agent2) latency        ~5-10s
Phase 2: max(agent1, agent2) × 2 rounds     ~10-20s
Phase 3: synthesizer latency                ~5-10s
Total:                                      ~20-40s
```

API cost scales linearly with number of agents and rounds.

## Constraints & Tradeoffs

- **Quality over speed:** Deliberation optimized for answer quality, not response time
- **No conversation memory:** Each query is independent (future enhancement)
- **Consensus not guaranteed:** Synthesizer produces best available consensus
- **Cost scaling:** Every query hits all agents across all phases

## Success Criteria

- Tool launches successfully with 2+ configured API keys
- User can submit queries and receive consensus answers
- All three phases execute and display correctly
- Agents can be dynamically loaded based on environment
- Terminal output is readable and well-formatted
- Graceful error handling for API failures

## Future Enhancements

- Synthesizer rotation (reduce single-model bias)
- `--rounds` CLI flag for debate depth control
- Consensus detection (early termination)
- Session logging (persist debate transcripts)
- Streaming output (token-by-token)
- Agent personas (role-based system prompts)
