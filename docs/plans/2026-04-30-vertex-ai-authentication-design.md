# Vertex AI Authentication Support Design

**Date:** April 30, 2026  
**Status:** Validated  
**Purpose:** Add dual authentication support for Claude (Anthropic API + Vertex AI)

## Overview

AI Consul currently supports Claude via Anthropic API keys only. This design adds support for Google Cloud Vertex AI authentication, enabling users who access Claude through GCP to use the tool without needing a separate Anthropic API key.

## Goals

- Support both Anthropic API key and Vertex AI authentication for Claude
- Auto-detect authentication method based on environment variables
- Maintain backward compatibility with existing API key users
- No breaking changes to existing functionality

## Authentication Detection Strategy

### Priority Order

The ClaudeAgent checks environment variables in this order:

1. **Vertex AI credentials (highest priority)**
   - `ANTHROPIC_VERTEX_PROJECT_ID` - GCP project ID
   - `CLOUD_ML_REGION` - GCP region (e.g., us-east5, us-central1)
   - If **both** are present → Use Vertex AI authentication

2. **Standard API key (fallback)**
   - `ANTHROPIC_API_KEY` - Direct Anthropic API key
   - If present → Use standard Anthropic API

3. **Neither available**
   - Skip Claude agent entirely
   - Allows tool to work with other providers (Gemini + future providers)

### Rationale

- **Auto-detection** - No manual configuration needed
- **Vertex AI first** - Users with GCP access likely prefer it (enterprise billing, existing auth)
- **Graceful degradation** - Tool still works without Claude if neither auth method available

## Implementation Changes

### 1. ClaudeAgent Constructor Modification

**Current:**
```javascript
constructor(apiKey) {
  super('Claude', '🔵', 'claude-opus-4-5');
  this.client = new Anthropic({ apiKey });
}
```

**New:**
```javascript
constructor(config) {
  super('Claude', '🔵', 'claude-sonnet-4-5@20250929');
  
  if (config.useVertex) {
    // Vertex AI initialization
    this.client = new Anthropic({
      baseURL: `https://${config.region}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}/publishers/anthropic/models`,
      apiKey: config.apiKey || 'vertex-placeholder'
    });
    this.authType = 'vertex';
  } else {
    // Standard API key initialization
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.authType = 'api-key';
  }
}
```

**Changes:**
- Constructor now accepts config object instead of plain apiKey
- Stores `authType` for display purposes
- Conditionally initializes client based on auth method
- Updated model to latest Sonnet 4.5

### 2. Agent Loader Modification

**File:** `src/agents/index.js`

**Current:**
```javascript
if (process.env.ANTHROPIC_API_KEY) {
  agents.push(new ClaudeAgent(process.env.ANTHROPIC_API_KEY));
}
```

**New:**
```javascript
// Detect Claude authentication method
const hasVertexAuth = process.env.ANTHROPIC_VERTEX_PROJECT_ID && 
                      process.env.CLOUD_ML_REGION;
const hasApiKey = process.env.ANTHROPIC_API_KEY;

if (hasVertexAuth) {
  // Use Vertex AI authentication
  agents.push(new ClaudeAgent({
    useVertex: true,
    projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
    region: process.env.CLOUD_ML_REGION,
    apiKey: process.env.ANTHROPIC_API_KEY || 'vertex-placeholder'
  }));
} else if (hasApiKey) {
  // Use standard API key
  agents.push(new ClaudeAgent({
    useVertex: false,
    apiKey: process.env.ANTHROPIC_API_KEY
  }));
}
```

**Error message update:**
```javascript
throw new Error(
  `At least 2 API keys required for multi-agent deliberation.\n` +
  `Available agents: ${available}\n` +
  `Configure at least 2 of:\n` +
  `  - Claude: ANTHROPIC_API_KEY or (ANTHROPIC_VERTEX_PROJECT_ID + CLOUD_ML_REGION)\n` +
  `  - Gemini: GEMINI_API_KEY`
);
```

### 3. Terminal Display Enhancement

**File:** `src/ui/renderer.js`

Update `displayBanner()` to show auth method:

```javascript
agents.forEach(agent => {
  const authInfo = agent.authType ? ` [${agent.authType}]` : '';
  console.log(`  ${agent.emoji} ${chalk.bold(agent.name)} (${agent.model})${chalk.dim(authInfo)}`);
});
```

**Example output:**
```
Council Members:
  🔵 Claude (claude-sonnet-4-5@20250929) [vertex]
  🟢 Gemini (gemini-3-flash-preview)
```

## Documentation Updates

### 1. .env.example

```bash
# AI Consul Authentication Options
# Configure at least 2 providers for multi-agent deliberation

# ===== CLAUDE (Choose ONE authentication method) =====

# Option A: Anthropic API Key (Direct)
ANTHROPIC_API_KEY=sk-ant-api-xxxxx

# Option B: Google Cloud Vertex AI (for Claude via GCP)
# ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
# CLOUD_ML_REGION=us-east5

# ===== GEMINI =====
GEMINI_API_KEY=AIza-xxxxx

# ===== PLANNED PROVIDERS =====
# OPENAI_API_KEY=sk-xxxxx
# MISTRAL_API_KEY=xxxxx
```

### 2. README.md - New Section

Add "Authentication Methods" section after "Supported Providers":

```markdown
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

Requires: GCP project with Vertex AI API enabled and Application Default Credentials configured.

The tool automatically detects which method to use based on environment variables.
```

### 3. README.md - Quick Start Update

Update Quick Start to mention both options:

```markdown
# 3. Configure API keys (minimum 2 required)
# Claude Option A: Anthropic API
export ANTHROPIC_API_KEY=sk-ant-api-xxxxx

# Claude Option B: Google Cloud Vertex AI
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLOUD_ML_REGION=us-east5

# Gemini (Required)
export GEMINI_API_KEY=AIza-xxxxx
```

## Testing Strategy

### Unit Tests

Update `tests/agents/claude.test.js`:
- Test API key authentication (existing)
- Test Vertex AI authentication (new)
- Test config validation (new)

### Integration Tests

Update `tests/integration/repl.test.js`:
- Test banner displays correct auth method
- Test both auth methods work end-to-end (with mocks)

### Manual Testing

Test scenarios:
1. API key only → Should work
2. Vertex AI only → Should work
3. Both present → Should use Vertex AI (priority)
4. Neither present → Should skip Claude, work with Gemini only

## Backward Compatibility

**Existing users (API key):**
- ✅ No changes required
- ✅ Existing env var still works
- ✅ No breaking changes

**New users (Vertex AI):**
- ✅ Just set vertex env vars
- ✅ No API key needed

## Dependencies

**No new dependencies required.** The `@anthropic-ai/sdk` package already supports Vertex AI authentication through the `baseURL` parameter.

## Security Considerations

- No sensitive credentials in code or documentation
- Use placeholder examples in all docs
- Vertex AI uses Application Default Credentials (ADC) - more secure than API keys
- API keys remain supported for flexibility

## Success Criteria

- ✅ Users can authenticate with Anthropic API key (existing behavior)
- ✅ Users can authenticate with Vertex AI credentials (new behavior)
- ✅ Auto-detection works correctly
- ✅ Terminal displays which auth method is active
- ✅ Documentation clearly explains both options
- ✅ Tests cover both authentication paths
- ✅ No breaking changes for existing users

## Future Enhancements

- Support for other Vertex AI regions
- Support for custom Vertex AI endpoints
- Health check to validate authentication at startup
- Support for OpenAI agents via similar dual-auth pattern
