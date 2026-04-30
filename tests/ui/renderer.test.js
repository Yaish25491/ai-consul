import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Renderer } from '../../src/ui/renderer.js';

describe('Renderer', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('should display banner with agent list', () => {
    const agents = [
      { name: 'Claude', emoji: '🔵', model: 'claude-opus-4-5' },
      { name: 'Gemini', emoji: '🟢', model: 'gemini-3-flash-preview' }
    ];

    Renderer.displayBanner(agents);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Multi-Agent Deliberation');
    expect(output).toContain('Council Members');
    expect(output).toContain('Claude');
    expect(output).toContain('Gemini');
  });

  test('should display phase header', () => {
    Renderer.displayPhaseHeader('PROPOSALS');

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('PROPOSALS');
  });

  test('should display agent response', () => {
    const agent = { name: 'Claude', emoji: '🔵' };

    Renderer.displayAgentResponse(agent, 'Test response');

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Claude');
    expect(output).toContain('Test response');
  });

  test('should display verdict in box', () => {
    Renderer.displayVerdict('Final consensus answer');

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Final consensus answer');
  });

  test('should display auth type in banner when available (vertex)', () => {
    const agents = [
      { name: 'Claude', emoji: '🔵', model: 'claude-sonnet-4-5@20250929', authType: 'vertex' },
      { name: 'Gemini', emoji: '🟢', model: 'gemini-3-flash-preview' }
    ];

    Renderer.displayBanner(agents);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('[vertex]');
    expect(output).not.toContain('[api-key]');
  });

  test('should display api-key auth type in banner', () => {
    const agents = [
      { name: 'Claude', emoji: '🔵', model: 'claude-opus-4-5', authType: 'api-key' },
      { name: 'Gemini', emoji: '🟢', model: 'gemini-3-flash-preview' }
    ];

    Renderer.displayBanner(agents);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('[api-key]');
  });
});
