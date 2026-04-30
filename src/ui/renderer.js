import chalk from 'chalk';
import boxen from 'boxen';

export class Renderer {
  /**
   * Display startup banner with council members
   */
  static displayBanner(agents) {
    console.log('\n');
console.log(chalk.bold.cyan('   ╔════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('   ║                                                        ║'));
console.log(chalk.bold.cyan('   ║    ██████╗  ██████╗ ███╗   ██╗███████╗██╗   ██╗██╗     ║'));
console.log(chalk.bold.cyan('   ║   ██╔════╝ ██╔═══██╗████╗  ██║██╔════╝██║   ██║██║     ║'));
console.log(chalk.bold.cyan('   ║   ██║      ██║   ██║██╔██╗ ██║███████╗██║   ██║██║     ║'));
console.log(chalk.bold.cyan('   ║   ██║      ██║   ██║██║╚██╗██║╚════██║██║   ██║██║     ║'));
console.log(chalk.bold.cyan('   ║   ╚██████╗ ╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗║'));
console.log(chalk.bold.cyan('   ║    ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝║'));
console.log(chalk.bold.cyan('   ║                                                        ║'));
console.log(chalk.bold.cyan('   ║             AI Multi-Agent Deliberation v1.1           ║'));
console.log(chalk.bold.cyan('   ║                                                        ║'));
console.log(chalk.bold.cyan('   ╚════════════════════════════════════════════════════════╝'));
console.log('');
    console.log(chalk.bold('Council Members:'));
    agents.forEach(agent => {
      const authInfo = agent.authType ? chalk.dim(` [${agent.authType}]`) : '';
      const modelInfo = agent.currentModel ? chalk.dim(` - ${agent.currentModel}`) : '';
      console.log(`  ${agent.emoji} ${chalk.bold(agent.name)}${authInfo}${modelInfo}`);
    });
    console.log('\n');
    console.log(chalk.dim('Type /help for commands, /exit to quit'));
    console.log(chalk.dim('Press ESC during deliberation to cancel\n'));
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
  static displayAgentResponse(agent, response, modelUsed = null) {
    const color = this._getAgentColor(agent.name);
    const modelInfo = modelUsed ? chalk.dim(` [${modelUsed}]`) : '';
    const header = `${agent.emoji} ${chalk.bold[color](agent.name)}${modelInfo}`;

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
