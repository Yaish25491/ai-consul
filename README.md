# AI Consul

Multi-agent deliberation CLI - AI models debate to reach consensus.

## Overview

AI Consul replaces single-model AI responses with structured multi-agent deliberation. Multiple AI agents from different providers (Claude, Gemini) independently propose solutions, debate each other's reasoning through multiple rounds, and converge on a consensus answer before presenting to the user.

## Three-Phase Deliberation Process

Every query flows through three sequential phases:

1. **PROPOSALS** - All agents propose solutions independently in parallel
2. **DEBATE** - Agents review proposals, challenge weaknesses, and refine positions over multiple rounds
3. **SYNTHESIS** - Lead agent consolidates the debate history into a single consensus answer

## Key Features

✨ **Multi-Agent Deliberation** - Multiple AI models debate to find the best answer  
📊 **Token Usage Tracking** - Monitor API consumption per agent across the session  
🎯 **Debate Strategy Modes** - Choose between normal (2 rounds), extra (up to 10), or unlimited debate depth  
📋 **Smart Paste Detection** - Automatically handles large multi-line inputs  
⚡ **ESC to Cancel** - Abort long-running operations anytime  
🔄 **Two Working Modes** - Consulting (deliberation) and Developer (iterative code development)  
🤖 **Dynamic Model Selection** - Each agent automatically selects optimal model based on query complexity  

## Requirements

- Node.js 18.0.0+
- npm 8.0.0+
- **At least 2 API keys** from supported providers (minimum for deliberation)

## Quick Start

### 1. Clone and Install

```bash
git clone git@github.com:Yaish25491/ai-consul.git
cd ai-consul
npm install
```

### 2. Configure API Keys

**You need at least 2 API keys from different providers.** Choose from:

#### Claude (Option A: Anthropic API - Recommended)
```bash
export ANTHROPIC_API_KEY=sk-ant-api-xxxxx
```
Get your key at: https://console.anthropic.com/account/keys

#### Claude (Option B: Google Cloud Vertex AI)
```bash
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLOUD_ML_REGION=us-east5  # Your GCP region
```
Requirements:
- GCP project with Vertex AI API enabled
- Application Default Credentials: `gcloud auth application-default login`

#### Gemini (Google AI)
```bash
export GEMINI_API_KEY=AIza-xxxxx
```
Get your key at: https://aistudio.google.com/app/apikey

### 3. Run the Tool

**Option A: Install globally (recommended)**
```bash
npm install -g .
consul
```

**Option B: Run locally**
```bash
# Using environment variables
npm start

# Or using .env file
cp .env.example .env
# Edit .env with your API keys
npm start
```

## First Time Usage

Once you start the tool, you'll see:

```
   ╔═══════════════════════════════════════════════════════════╗
   ║                                                           ║
   ║    ██████╗  ██████╗ ███╗   ██╗███████╗██╗   ██╗██╗        ║
   ║   ██╔════╝ ██╔═══██╗████╗  ██║██╔════╝██║   ██║██║        ║
   ║   ██║      ██║   ██║██╔██╗ ██║███████╗██║   ██║██║        ║
   ║   ██║      ██║   ██║██║╚██╗██║╚════██║██║   ██║██║        ║
   ║   ╚██████╗ ╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗   ║
   ║    ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝   ║
   ║                                                           ║
   ║             AI Multi-Agent Deliberation v1.1              ║
   ║                                                           ║
   ╚═══════════════════════════════════════════════════════════╝

Council Members:
  🔵 Claude [api-key] - claude-sonnet-4-6
  🟢 Gemini [api-key] - gemini-2.5-flash

Mode: consulting
Debate: normal
Switch modes with /consulting or /developer
Debate modes: /normal-debate, /extra-debate, /unlimited-debate

Type / and press TAB to see available commands
Press ESC to abort request, Ctrl+C twice to exit

> 
```

Just type your question and press Enter!

### Example Session

```bash
> What are the best practices for error handling in async JavaScript?

▸ PHASE 1: PROPOSALS
──────────────────────────────────────────────────
⠋ Generating proposals... (Press ESC to cancel)

┌─ 🔵 Claude claude-haiku-4-5 ────────────────────┐
│ For async error handling, I recommend:          │
│ 1. Always use try-catch in async functions...   │
└──────────────────────────────────────────────────┘

┌─ 🟢 Gemini gemini-2.5-flash ────────────────────┐
│ The most robust approach is:                    │
│ 1. Centralized error handling middleware...     │
└──────────────────────────────────────────────────┘

▸ PHASE 2: DEBATE
──────────────────────────────────────────────────

▸ Round 1

┌─ 🔵 Claude claude-sonnet-4-6 ───────────────────┐
│ I agree with Gemini's point about centralized   │
│ error handling, but would add...                │
└──────────────────────────────────────────────────┘

...

▸ PHASE 3: SYNTHESIS
──────────────────────────────────────────────────

╔═══════════════ ✨ CONSENSUS ═══════════════╗
║                                              ║
║ The best practices for error handling in    ║
║ async JavaScript combine several approaches: ║
║                                              ║
║ 1. Always use try-catch blocks in async...  ║
║ 2. Implement centralized error handling...  ║
║ 3. Use Promise.catch() for chains...        ║
║ ...                                          ║
╚══════════════════════════════════════════════╝

> 
```

## Working Modes

AI Consul has two distinct working modes:

### Consulting Mode (Default)
Multi-agent deliberation for finding the best answer to questions.
- Agents propose solutions independently
- Debate through multiple rounds
- Synthesize consensus from all perspectives
- Best for: questions, analysis, recommendations

**Switch to consulting mode:**
```bash
> /consulting
```

### Developer Mode
Iterative code development with automated review cycles.
- Developer agent writes/updates code
- Reviewer agent provides feedback
- Iterates until code is approved or max iterations reached
- Best for: code implementation tasks

**Switch to developer mode:**
```bash
> /developer
```

## Debate Strategy Modes

Control how deeply agents deliberate in **Consulting Mode**:

### Normal Debate (Default)
```bash
> /normal-debate
```
- Standard 2-round debate process
- Fast, balanced approach
- Good for most queries

### Extra Debate
```bash
> /extra-debate
```
- Extended debate up to 10 rounds
- Exits early when consensus is detected (≥75% agreement)
- Best for: complex questions requiring deeper analysis

### Unlimited Debate
```bash
> /unlimited-debate
```
- No round limit (continues until consensus)
- Best for: critical decisions requiring perfect agreement
- ⚠️ Can consume significant API tokens

**Consensus Detection:** In extra/unlimited modes, the system automatically detects when agents reach agreement by analyzing responses for consensus keywords vs. objection keywords.

## Input Methods

### 1. Simple Single-Line Input
Just type and press Enter:
```bash
> What is the difference between let and const?
```

### 2. Paste Multi-Line Content
Paste directly - the tool automatically detects and buffers multi-line input:
```bash
> [Paste your long error trace, code, or documentation]
```
After 1 second with no new lines, it processes as a single query.  
Large inputs (>3 lines) show as: `📋 Pasted text #1 +59 lines`

### 3. Multi-Line Mode
For manual multi-line input:
```bash
> /prompt
Entering multi-line mode. Type your prompt across multiple lines.
Type END on a new line to finish and submit.

... Here is my long question
... that spans multiple lines
... with code examples
... END
```

### 4. Load from File
Execute prompts from text files:
```bash
> /file path/to/my-prompt.txt
```

## Available Commands

Type `/` and press **TAB** for autocomplete.

### Mode Commands
| Command | Description |
|---------|-------------|
| `/consulting` | Switch to consulting mode (multi-agent deliberation) |
| `/developer` | Switch to developer mode (iterative code development) |

### Debate Strategy
| Command | Description |
|---------|-------------|
| `/normal-debate` | Standard 2-round debate (default) |
| `/extra-debate` | Extended debate up to 10 rounds with consensus detection |
| `/unlimited-debate` | Unlimited rounds until perfect consensus |

### Input Commands
| Command | Description |
|---------|-------------|
| `/prompt` | Enter multi-line mode (type END to finish) |
| `/file <path>` | Load and execute prompt from a text file |

### Information & Control
| Command | Description |
|---------|-------------|
| `/help` | Display all available commands |
| `/agents` | List active council members and their models |
| `/view <agent>` | View full response from a specific agent (e.g., `/view claude`) |
| `/stats` | Show token usage statistics for the current session |
| `/exit` or `/quit` | Exit the session (shows token stats) |
| `ESC` | Abort current request (returns to prompt) |
| `Ctrl+C` (twice) | Exit the session (shows token stats) |

## Supported Providers & Models

### Claude (Anthropic)

**Via Anthropic API:**
- `claude-haiku-4-5` - Fast proposals and simple queries
- `claude-sonnet-4-6` - Balanced debate and medium queries
- `claude-opus-4-7` - Best synthesis and complex queries

**Via Google Cloud Vertex AI:**
- `claude-3-5-haiku@20241022` - All phases (only model available on Vertex)

### Gemini (Google AI)

- `gemini-3-flash-preview` - Fast proposals
- `gemini-2.5-flash` - Balanced debate
- `gemini-3-pro-preview` - Best synthesis and complex queries

**Dynamic Model Selection:** Agents automatically select the optimal model tier for each phase based on query complexity and context length.

### Coming Soon

- **OpenAI** (GPT-4 series) - Planned
- **Mistral** (Large) - Planned

## Token Usage Tracking

Monitor API consumption throughout your session:

```bash
> /stats

📊 Session Token Usage
────────────────────────────────────────────────────────────

Claude:
  Input:  45,234 tokens
  Output: 12,456 tokens
  Total:  57,690 tokens

Gemini:
  Input:  42,189 tokens
  Output: 11,890 tokens
  Total:  54,079 tokens

────────────────────────────────────────────────────────────

Session Total:
  Input:  87,423 tokens
  Output: 24,346 tokens
  Total:  111,769 tokens
```

Stats are automatically shown when you exit with `/exit`, `/quit`, or `Ctrl+C` twice.

## Aborting Operations

Press **ESC** at any time to cancel the current request:
- Stops ongoing API calls
- Shows partial results from completed agents
- Returns to prompt immediately
- No need to restart the session

Perfect for:
- Long-running queries you want to cancel
- Accidentally pasted wrong content
- Testing different debate strategies

## Architecture

```
bin/
  consul.js              # REPL entry point, command parsing, user I/O

src/
  core/
    council.js           # Three-phase deliberation orchestrator
  agents/
    index.js             # Dynamic agent loader
    base.js              # Agent interface definition
    claude.js            # Claude agent implementation
    gemini.js            # Gemini agent implementation
  ui/
    renderer.js          # Terminal output formatting
  utils/
    retry.js             # Exponential backoff for rate limits
    modelSelector.js     # Dynamic model tier selection
```

## Development

### Running Tests
```bash
# Full test suite
npm test

# Watch mode
npm test -- --watch

# Single test file
npm test -- agents/claude
```

### Linting
```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Adding New Agents

1. Create agent file in `src/agents/` implementing the Agent interface:
   ```javascript
   import { Agent } from './base.js';
   
   export class MyAgent extends Agent {
     async propose(query, signal) { /* ... */ }
     async debate(query, proposals, round, signal) { /* ... */ }
     async synthesize(query, history, signal) { /* ... */ }
   }
   ```

2. Register in `src/agents/index.js`:
   ```javascript
   if (process.env.MY_AGENT_API_KEY) {
     agents.push(new MyAgent(process.env.MY_AGENT_API_KEY));
   }
   ```

3. Document the environment variable in `.env.example`

See `docs/plans/2026-04-30-ai-consul-initial-implementation-design.md` for detailed architecture.

## Cost & Performance

### Latency
- **Normal debate (2 rounds):** 20-40 seconds per query
- **Extra debate (10 rounds max):** 60-180 seconds per query
- **Unlimited debate:** Variable, depends on consensus

### API Costs
- Scales linearly with number of agents and debate rounds
- Every query hits all active agents across all phases
- Use `/stats` to monitor token consumption
- Normal mode recommended for general use
- Extra/Unlimited modes for complex queries only

### Example Token Usage (2 agents, normal mode)
- Simple query: ~5,000-10,000 tokens
- Medium query: ~20,000-40,000 tokens  
- Complex query: ~50,000-100,000 tokens

## Troubleshooting

### "At least 2 API keys required"
- You need API keys from at least 2 different providers
- Set `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`
- Or use Vertex AI for Claude + Gemini API key

### Rate Limits (429 errors)
- AI Consul automatically retries with exponential backoff
- You'll see: `⚠️ Claude (model) rate limited (attempt 1). Retrying in 2s...`
- Waits between retries: 2s, 4s, 8s
- Press ESC to cancel if retries take too long

### Paste Not Detected
- Ensure you paste all content in one action
- Wait 1 second after pasting before typing
- Alternative: Use `/prompt` mode manually

### Vertex AI Authentication Failed
- Run: `gcloud auth application-default login`
- Verify project ID: `gcloud config get-value project`
- Check region is correct: `us-east5`, `us-central1`, etc.

## Tips for Best Results

✅ **Start with normal debate mode** - Switch to extra/unlimited only for complex queries  
✅ **Use /view to see full responses** - Truncated boxes show first 500 chars  
✅ **Monitor token usage with /stats** - Keep track of API consumption  
✅ **Press ESC if query takes too long** - You can always try again with different debate mode  
✅ **Use developer mode for code tasks** - Better suited for implementation than consulting mode  
✅ **Paste large content directly** - No need to use `/prompt` mode manually  

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- Issues: https://github.com/Yaish25491/ai-consul/issues
- Documentation: See `docs/` directory
- Architecture: `CLAUDE.md` and design documents in `docs/plans/`
