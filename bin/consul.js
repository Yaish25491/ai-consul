#!/usr/bin/env node

import readline from 'readline';
import ora from 'ora';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { loadAgents } from '../src/agents/index.js';
import { Council } from '../src/core/council.js';
import { Renderer } from '../src/ui/renderer.js';

/**
 * Process request in developer mode (iterative code development)
 */
async function processDeveloperMode(task, agents, rl, lastResponses) {
  // Clear previous responses
  Object.keys(lastResponses).forEach(key => delete lastResponses[key]);

  // Assign roles
  const developer = agents.find(a => a.name === 'Gemini') || agents[0];
  const reviewer = agents.find(a => a.name === 'Claude') || agents[1];

  console.log(chalk.bold.cyan('\n▸ DEVELOPER MODE'));
  console.log(chalk.dim(`Developer: ${developer.emoji} ${developer.name}`));
  console.log(chalk.dim(`Reviewer: ${reviewer.emoji} ${reviewer.name}`));
  console.log(chalk.dim('─'.repeat(50)));
  console.log('');

  const MAX_ITERATIONS = 5;
  let currentCode = null;
  let iteration = 1;

  for (iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(chalk.bold.yellow(`\n▸ Iteration ${iteration}/${MAX_ITERATIONS}\n`));

    // Developer writes/updates code
    const devSpinner = ora(`${developer.name} ${currentCode ? 'updating' : 'writing'} code...`).start();

    let devPrompt;
    if (!currentCode) {
      devPrompt = `You are a software developer. Write code for the following task:

${task}

Provide clean, working code with brief comments. Include the full implementation.`;
    } else {
      devPrompt = `You previously wrote this code:

\`\`\`
${currentCode}
\`\`\`

The code reviewer provided this feedback:

${lastResponses[reviewer.name]}

Update the code to address all the feedback. Provide the complete updated code.`;
    }

    try {
      currentCode = await developer.propose(devPrompt);
      devSpinner.stop();

      lastResponses[developer.name] = currentCode;
      Renderer.displayAgentResponse(developer, currentCode, developer.currentModel);
    } catch (error) {
      devSpinner.stop();
      Renderer.displayError(`${developer.name} error: ${error.message}`);
      return;
    }

    // Reviewer checks code
    const reviewSpinner = ora(`${reviewer.name} reviewing code...`).start();

    const reviewPrompt = `You are a code reviewer. Review the following code:

\`\`\`
${currentCode}
\`\`\`

Original task:
${task}

Provide feedback on:
1. Correctness and completeness
2. Code quality and best practices
3. Potential bugs or issues

If there are NO MAJOR ISSUES, start your response with "APPROVED:" and explain why.
If there ARE issues, start with "ISSUES FOUND:" and list them clearly.`;

    let review;
    try {
      review = await reviewer.propose(reviewPrompt);
      reviewSpinner.stop();

      lastResponses[reviewer.name] = review;
      Renderer.displayAgentResponse(reviewer, review, reviewer.currentModel);
    } catch (error) {
      reviewSpinner.stop();
      Renderer.displayError(`${reviewer.name} error: ${error.message}`);
      return;
    }

    // Check if approved
    if (review.toUpperCase().includes('APPROVED:')) {
      console.log(chalk.green.bold('\n✓ Code approved by reviewer!\n'));
      break;
    }

    if (iteration === MAX_ITERATIONS) {
      console.log(chalk.yellow(`\n⚠️  Reached maximum iterations (${MAX_ITERATIONS}). Presenting current version.\n`));
    }
  }

  // Display final code
  Renderer.displayFinalCode(currentCode, iteration <= MAX_ITERATIONS ? 'Approved' : 'Max iterations reached');
}

/**
 * Main REPL loop
 */
async function main() {
  let agents;
  let council;
  let lastResponses = {}; // Store full responses for /view command
  let currentMode = 'consulting'; // Default mode
  let tokenUsage = {}; // Track token usage per agent

  // Load agents and validate
  try {
    agents = loadAgents();
    council = new Council(agents);

    // Initialize token tracking
    agents.forEach(agent => {
      tokenUsage[agent.name] = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      };
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  // Display banner
  Renderer.displayBanner(agents);
  console.log(chalk.bold.cyan(`Mode: ${currentMode}`));
  console.log(chalk.dim('Switch modes with /consulting or /developer\n'));

  // Available commands for autocomplete
  const commands = [
    '/help',
    '/consulting',
    '/developer',
    '/agents',
    '/view',
    '/stats',
    '/prompt',
    '/file',
    '/exit',
    '/quit'
  ];

  // Autocomplete function
  const completer = (line) => {
    const hits = commands.filter((c) => c.startsWith(line));
    // Show all commands if empty line or no matches
    return [hits.length ? hits : commands, line];
  };

  // Create readline interface with autocomplete
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: completer,
    terminal: true
  });

  // Multi-line input state
  let multiLineMode = false;
  let multiLineBuffer = [];
  let pastedTextCounter = 1;

  // Handle user input
  rl.on('line', async (input) => {
    // Multi-line mode handling
    if (multiLineMode) {
      if (input.trim() === 'END') {
        // Exit multi-line mode and process accumulated input
        multiLineMode = false;
        const fullInput = multiLineBuffer.join('\n');
        const lineCount = multiLineBuffer.length;
        multiLineBuffer = [];

        // Display compressed representation if more than 3 lines
        if (lineCount > 3) {
          console.log(chalk.dim(`\n📋 Pasted text #${pastedTextCounter} +${lineCount} lines\n`));
          pastedTextCounter++;
        } else {
          console.log(chalk.dim('\n[Multi-line input received - processing...]\n'));
        }

        // Process the full multi-line input
        try {
          if (currentMode === 'consulting') {
            await processQuery(fullInput, council, agents, rl, lastResponses);
          } else if (currentMode === 'developer') {
            await processDeveloperMode(fullInput, agents, rl, lastResponses);
          }

          // Sync token usage from agents
          agents.forEach(agent => {
            const usage = agent.getUsage();
            tokenUsage[agent.name] = usage;
          });
        } catch (error) {
          console.error(chalk.red('\nUnexpected error during query:'), error.message);
        }

        setImmediate(() => rl.prompt());
        return;
      } else {
        // Accumulate line
        multiLineBuffer.push(input);
        rl.setPrompt(chalk.dim('... '));
        rl.prompt();
        return;
      }
    }

    const trimmed = input.trim();

    // Handle empty input
    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Handle commands
    if (trimmed.startsWith('/')) {
      const commandResult = handleCommand(trimmed, agents, council, rl, lastResponses, currentMode, tokenUsage, pastedTextCounter);
      if (commandResult.action === 'multiline') {
        multiLineMode = true;
        multiLineBuffer = [];
        console.log(chalk.cyan('\nEntering multi-line mode. Type your prompt across multiple lines.'));
        console.log(chalk.dim('Type END on a new line to finish and submit.\n'));
        rl.setPrompt(chalk.dim('... '));
        rl.prompt();
        return;
      } else if (commandResult.counter !== undefined) {
        pastedTextCounter = commandResult.counter;
      }
      if (commandResult.mode) {
        currentMode = commandResult.mode;
      }
      return;
    }

    // Process query based on current mode
    try {
      if (currentMode === 'consulting') {
        await processQuery(trimmed, council, agents, rl, lastResponses);
      } else if (currentMode === 'developer') {
        await processDeveloperMode(trimmed, agents, rl, lastResponses);
      }

      // Sync token usage from agents
      agents.forEach(agent => {
        const usage = agent.getUsage();
        tokenUsage[agent.name] = usage;
      });
    } catch (error) {
      console.error(chalk.red('\nUnexpected error during query:'), error.message);
    }
    // Always return to prompt
    setImmediate(() => rl.prompt());
  });

  // Handle Ctrl+C (double press to exit)
  let lastSigint = 0;
  rl.on('SIGINT', () => {
    const now = Date.now();
    if (now - lastSigint < 1000) {
      console.log('\n');
      Renderer.displayTokenStats(tokenUsage);
      console.log(chalk.dim('Goodbye!\n'));
      process.exit(0);
    } else {
      console.log('\n(Press Ctrl+C again to exit)');
      lastSigint = now;
      rl.prompt();
    }
  });

  // Start prompt
  rl.prompt();
}

/**
 * Handle special commands
 * Returns object with: { action, mode, counter }
 */
function handleCommand(command, agents, council, rl, lastResponses, currentMode, tokenUsage, pastedTextCounter) {
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const arg = parts[1];

  switch (cmd) {
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

    case '/consulting':
      console.log(chalk.green('\n✓ Switched to CONSULTING mode'));
      console.log(chalk.dim('Agents deliberate to find the best answer\n'));
      rl.prompt();
      return { mode: 'consulting' };

    case '/developer':
      console.log(chalk.green('\n✓ Switched to DEVELOPER mode'));
      console.log(chalk.dim('Iterative code development with review cycles\n'));
      rl.prompt();
      return { mode: 'developer' };

    case '/stats':
      Renderer.displayTokenStats(tokenUsage);
      break;

    case '/prompt':
      rl.prompt();
      return { action: 'multiline' };

    case '/file':
      if (!arg) {
        console.log('\n' + chalk.yellow('Usage: /file <path>'));
        console.log(chalk.dim('Load and execute a prompt from a text file\n'));
      } else {
        try {
          const fileContent = readFileSync(arg, 'utf-8');
          const lineCount = fileContent.split('\n').length;
          let newCounter = pastedTextCounter;

          // Display compressed representation if more than 3 lines
          if (lineCount > 3) {
            console.log(chalk.dim(`\n📋 Pasted text #${pastedTextCounter} +${lineCount} lines (from ${arg})\n`));
            newCounter = pastedTextCounter + 1;
          } else {
            console.log(chalk.dim(`\n[Loaded ${lineCount} lines from ${arg}]\n`));
          }

          // Process the file content immediately
          setImmediate(async () => {
            try {
              if (currentMode === 'consulting') {
                await processQuery(fileContent, council, agents, rl, lastResponses);
              } else if (currentMode === 'developer') {
                await processDeveloperMode(fileContent, agents, rl, lastResponses);
              }

              // Sync token usage from agents
              agents.forEach(agent => {
                const usage = agent.getUsage();
                tokenUsage[agent.name] = usage;
              });
            } catch (error) {
              console.error(chalk.red('\nUnexpected error during query:'), error.message);
            }
            rl.prompt();
          });

          return { counter: newCounter };
        } catch (error) {
          console.log(chalk.red(`\n✗ Error reading file: ${error.message}\n`));
        }
      }
      break;

    case '/view':
      if (!arg) {
        console.log('\n' + chalk.yellow('Usage: /view <agent-name>'));
        console.log('Available agents:');
        Object.keys(lastResponses).forEach(name => {
          console.log(`  - ${name}`);
        });
        console.log('');
      } else {
        const agentName = arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase();
        const fullResponse = lastResponses[agentName];

        if (fullResponse) {
          const agent = agents.find(a => a.name === agentName);
          Renderer.displayFullResponse(agent, fullResponse);
        } else {
          console.log(chalk.red(`\n✗ No response found for agent: ${agentName}\n`));
        }
      }
      break;

    case '/exit':
    case '/quit':
      console.log('');
      Renderer.displayTokenStats(tokenUsage);
      console.log(chalk.dim('Goodbye!\n'));
      process.exit(0);
      break;

    default:
      console.log(`\nUnknown command: ${command}`);
      console.log('Type /help for available commands\n');
  }

  rl.prompt();
  return {};
}

/**
 * Process user query through deliberation
 */
async function processQuery(query, council, agents, rl, lastResponses) {
  // Clear previous responses
  Object.keys(lastResponses).forEach(key => delete lastResponses[key]);
  const abortController = new AbortController();
  let isProcessing = true;
  let currentSpinner = null;

  // Enable raw mode to capture ESC key
  // Note: Don't call resume() - readline already has stdin active
  try {
    process.stdin.setRawMode(true);
  } catch (error) {
    console.warn(chalk.yellow('⚠️  ESC cancellation unavailable (raw mode not supported)'));
  }

  // ESC key handler (byte code 27)
  const escHandler = (chunk) => {
    if (chunk[0] === 27) {
      console.log('\n\n⚠️  Aborting current request...\n');
      if (currentSpinner) {
        currentSpinner.stop();
      }
      abortController.abort();
      cleanup();
    }
  };

  process.stdin.on('data', escHandler);

  const cleanup = () => {
    if (isProcessing) {
      isProcessing = false;
      process.stdin.removeListener('data', escHandler);

      try {
        process.stdin.setRawMode(false);
      } catch (error) {
        // Ignore cleanup errors
      }

      // Ensure readline interface stays active
      setImmediate(() => {
        if (rl && !rl.closed) {
          // Make sure stdin is flowing and readline can read from it
          if (process.stdin.isPaused()) {
            process.stdin.resume();
          }
        }
      });
    }
  };

  try {
    // Phase 1: Proposals
    Renderer.displayPhaseHeader('PHASE 1: PROPOSALS');
    currentSpinner = ora('Generating proposals... (Press ESC to cancel)').start();

    const proposals = await council._runProposals(query, abortController.signal);
    currentSpinner.stop();
    currentSpinner = null;

    // Filter out aborted agents
    const completedProposals = proposals.filter(p => !p.aborted);
    const abortedProposalsCount = proposals.filter(p => p.aborted).length;

    if (completedProposals.length === 0) {
      console.log(chalk.yellow('\n✗ All agents canceled. No proposals to show.\n'));
      return;
    }

    if (abortedProposalsCount > 0) {
      const abortedAgents = proposals.filter(p => p.aborted).map(p => p.agent);
      console.log(chalk.dim(`\n(Canceled: ${abortedAgents.join(', ')})\n`));
    }

    completedProposals.forEach(({ agent, proposal }) => {
      const agentObj = agents.find(a => a.name === agent);
      lastResponses[agent] = proposal; // Store full response
      Renderer.displayAgentResponse(agentObj, proposal, agentObj.currentModel);
    });

    // Check if aborted before continuing
    if (abortController.signal.aborted) {
      console.log(chalk.yellow('\n✗ Deliberation canceled by user.\n'));
      return;
    }

    // Phase 2: Debate
    Renderer.displayPhaseHeader('PHASE 2: DEBATE');
    const debates = [];

    for (let round = 1; round <= 2; round++) {
      if (abortController.signal.aborted) {
        break;
      }

      currentSpinner = ora(`Debate round ${round}... (Press ESC to cancel)`).start();

      const debatePromises = agents.map(async (agent) => {
        const response = await agent.debate(query, completedProposals, round, abortController.signal);
        return { agent: agent.name, response };
      });

      const responses = await Promise.all(debatePromises);
      currentSpinner.stop();
      currentSpinner = null;

      // Filter out aborted responses
      const completedResponses = responses.filter(r => !r.aborted);
      const abortedResponsesCount = responses.filter(r => r.aborted).length;

      if (completedResponses.length === 0) {
        console.log(chalk.yellow(`\n✗ Round ${round} canceled.\n`));
        break;
      }

      console.log(chalk.bold.cyan(`\n▸ Round ${round}\n`));
      if (abortedResponsesCount > 0) {
        const abortedAgents = responses.filter(r => r.aborted).map(r => r.agent);
        console.log(chalk.dim(`  (Canceled: ${abortedAgents.join(', ')})\n`));
      }

      completedResponses.forEach(({ agent, response }) => {
        const agentObj = agents.find(a => a.name === agent);
        lastResponses[agent] = response; // Store full response (overwrite with latest)
        Renderer.displayAgentResponse(agentObj, response, agentObj.currentModel);
      });

      debates.push({ round, responses: completedResponses });
    }

    if (abortController.signal.aborted || debates.length === 0) {
      console.log(chalk.yellow('\n✗ Deliberation canceled by user.\n'));
      return;
    }

    // Phase 3: Synthesis
    Renderer.displayPhaseHeader('PHASE 3: SYNTHESIS');
    currentSpinner = ora('Synthesizing consensus... (Press ESC to cancel)').start();

    const consensus = await council._runSynthesis(query, debates, abortController.signal);
    currentSpinner.stop();
    currentSpinner = null;

    if (consensus) {
      Renderer.displayVerdict(consensus);
    } else {
      console.log(chalk.yellow('\n✗ Synthesis canceled by user.\n'));
    }

  } catch (error) {
    if (currentSpinner) {
      currentSpinner.stop();
    }
    if (error.name === 'AbortError') {
      Renderer.displayError('Request canceled by user');
    } else {
      Renderer.displayError(error.message);
    }
  } finally {
    cleanup();
  }
}

// Run main
main().catch(console.error);
