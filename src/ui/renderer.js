import chalk from 'chalk';
import boxen from 'boxen';

export class Renderer {
  /**
   * Display startup banner with council members
   */
  static displayBanner(agents) {
    console.log('\n');
console.log(chalk.bold.cyan('   ╔═══════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('   ║                                                           ║'));
console.log(chalk.bold.cyan('   ║    ██████╗  ██████╗ ███╗   ██╗███████╗██╗   ██╗██╗        ║'));
console.log(chalk.bold.cyan('   ║   ██╔════╝ ██╔═══██╗████╗  ██║██╔════╝██║   ██║██║        ║'));
console.log(chalk.bold.cyan('   ║   ██║      ██║   ██║██╔██╗ ██║███████╗██║   ██║██║        ║'));
console.log(chalk.bold.cyan('   ║   ██║      ██║   ██║██║╚██╗██║╚════██║██║   ██║██║        ║'));
console.log(chalk.bold.cyan('   ║   ╚██████╗ ╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗   ║'));
console.log(chalk.bold.cyan('   ║    ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝   ║'));
console.log(chalk.bold.cyan('   ║                                                           ║'));
console.log(chalk.bold.cyan('   ║             AI Multi-Agent Deliberation v1.1              ║'));
console.log(chalk.bold.cyan('   ║                                                           ║'));
console.log(chalk.bold.cyan('   ╚═══════════════════════════════════════════════════════════╝'));
console.log('');
    console.log(chalk.bold('Council Members:'));
    agents.forEach(agent => {
      const authInfo = agent.authType ? chalk.dim(` [${agent.authType}]`) : '';
      const modelInfo = agent.currentModel ? chalk.dim(` - ${agent.currentModel}`) : '';
      console.log(`  ${agent.emoji} ${chalk.bold(agent.name)}${authInfo}${modelInfo}`);
    });
    console.log('\n');
    console.log(chalk.dim('Type / and press TAB to see available commands'));
    console.log(chalk.dim('Press ESC to abort request, Ctrl+C twice to exit\n'));
  }

  /**
   * Display phase transition header
   */
  static displayPhaseHeader(phaseName) {
    console.log('\n');
    console.log(chalk.bold.yellow(`▸ ${phaseName}`));
    console.log(chalk.dim('─'.repeat(50)));
    console.log('');
  }

  /**
   * Display agent's response in a contained box
   */
  static displayAgentResponse(agent, response, modelUsed = null) {
    const color = this._getAgentColor(agent.name);
    const modelInfo = modelUsed ? chalk.dim(` ${modelUsed}`) : '';

    // Truncate response if too long (keep first 500 chars)
    const isTruncated = response.length > 500;
    const truncated = isTruncated
      ? response.substring(0, 500) + chalk.dim(`...\n[Truncated - use /view ${agent.name.toLowerCase()} for full response]`)
      : response;

    const boxContent = boxen(truncated, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: color,
      title: `${agent.emoji} ${agent.name}${modelInfo}`,
      titleAlignment: 'left'
    });

    console.log(boxContent);
  }

  /**
   * Display full agent response (for /view command)
   */
  static displayFullResponse(agent, response) {
    const color = this._getAgentColor(agent.name);

    const boxContent = boxen(response, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'double',
      borderColor: color,
      title: `${agent.emoji} ${agent.name} - Full Response`,
      titleAlignment: 'left'
    });

    console.log(boxContent);
  }

  /**
   * Display final verdict in a box
   */
  static displayVerdict(consensus) {
    const boxContent = boxen(consensus, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderStyle: 'double',
      borderColor: 'green',
      title: '✨ CONSENSUS',
      titleAlignment: 'center'
    });

    console.log(boxContent);
    console.log('');
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
    console.log(chalk.dim('\nTip: Type / and press TAB for autocomplete\n'));
    console.log(chalk.bold.cyan('Modes:'));
    console.log('  /consulting     - Multi-agent deliberation mode (default)');
    console.log('  /developer      - Iterative code development mode');
    console.log('\n' + chalk.bold.cyan('General:'));
    console.log('  /help           - Display this help message');
    console.log('  /agents         - List active council members');
    console.log('  /view <agent>   - View full response from an agent');
    console.log('  /exit           - Exit the session');
    console.log('  /quit           - Exit the session');
    console.log('  ESC             - Abort current request');
    console.log('  Ctrl+C x2       - Exit the session');
    console.log('\n');
  }

  /**
   * Display final code (for developer mode)
   */
  static displayFinalCode(code, status) {
    const boxContent = boxen(code, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderStyle: 'double',
      borderColor: 'cyan',
      title: `💻 FINAL CODE - ${status}`,
      titleAlignment: 'center'
    });

    console.log(boxContent);
    console.log('');
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
