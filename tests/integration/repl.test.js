import { describe, test, expect } from '@jest/globals';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binPath = join(__dirname, '../../bin/consul.js');

describe('REPL Integration', () => {
  test('should exit with error when insufficient API keys', (done) => {
    const proc = spawn('node', [binPath], {
      env: { ...process.env, ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '' }
    });

    let output = '';
    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      expect(code).toBe(1);
      expect(output).toContain('At least 2 API keys required');
      done();
    });
  }, 10000);

  test('should display banner when sufficient API keys present', (done) => {
    const proc = spawn('node', [binPath], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: 'test-key',
        GEMINI_API_KEY: 'test-key'
      }
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('AI CONSUL')) {
        proc.kill();
      }
    });

    proc.on('close', () => {
      expect(output).toContain('AI CONSUL');
      expect(output).toContain('Council Members');
      done();
    });
  }, 10000);
});
