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
