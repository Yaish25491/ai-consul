#!/usr/bin/env node

import readline from 'readline';
import ora from 'ora';
import chalk from 'chalk';
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
    await processQuery(trimmed, council, agents, rl);
    rl.prompt();
  });

  // Handle Ctrl+C (double press to exit)
  let lastSigint = 0;
  rl.on('SIGINT', () => {
    const now = Date.now();
    if (now - lastSigint < 1000) {
      console.log('\n\nGoodbye!\n');
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
async function processQuery(query, council, agents, rl) {
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

      console.log(`\n--- Round ${round} ---\n`);
      if (abortedResponsesCount > 0) {
        const abortedAgents = responses.filter(r => r.aborted).map(r => r.agent);
        console.log(chalk.dim(`(Canceled: ${abortedAgents.join(', ')})\n`));
      }

      completedResponses.forEach(({ agent, response }) => {
        const agentObj = agents.find(a => a.name === agent);
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
