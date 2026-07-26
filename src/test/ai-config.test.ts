import { describe, it, expect } from 'vitest';
import { MODELS, ASSESSMENT_EXPERT_INSTRUCTION, CHAT_DEFAULT_SYSTEM_INSTRUCTION, REPORT_SECTIONS } from '../config/ai';

describe('MODELS config', () => {
  it('has valid model IDs for non-TTS models', () => {
    expect(MODELS.flash_lite).toBe('deepseek/deepseek-v4-flash-free');
    expect(MODELS.flash).toBe('deepseek/deepseek-v4-flash-free');
    expect(MODELS.pro).toBe('deepseek/deepseek-v3-0324');
  });

  it('defines tts as browser-speechsynthesis', () => {
    expect(MODELS.tts).toBe('browser-speechsynthesis');
  });

  it('has exactly four model entries', () => {
    expect(Object.keys(MODELS)).toHaveLength(4);
  });
});

describe('system instructions', () => {
  it('ASSESSMENT_EXPERT_INSTRUCTION is a non-empty string', () => {
    expect(ASSESSMENT_EXPERT_INSTRUCTION).toBeTruthy();
    expect(typeof ASSESSMENT_EXPERT_INSTRUCTION).toBe('string');
  });

  it('ASSESSMENT_EXPERT_INSTRUCTION mentions DoE', () => {
    expect(ASSESSMENT_EXPERT_INSTRUCTION).toContain('DoE');
  });

  it('CHAT_DEFAULT_SYSTEM_INSTRUCTION is a non-empty string', () => {
    expect(CHAT_DEFAULT_SYSTEM_INSTRUCTION).toBeTruthy();
    expect(typeof CHAT_DEFAULT_SYSTEM_INSTRUCTION).toBe('string');
  });

  it('CHAT_DEFAULT_SYSTEM_INSTRUCTION references Mazingira Rafiki', () => {
    expect(CHAT_DEFAULT_SYSTEM_INSTRUCTION).toContain('Mazingira Rafiki');
  });
});

describe('REPORT_SECTIONS', () => {
  it('is an array with 8 sections', () => {
    expect(REPORT_SECTIONS).toHaveLength(8);
  });

  it('starts with Introduction', () => {
    expect(REPORT_SECTIONS[0]).toBe('1.0 Introduction');
  });

  it('ends with Conclusion and Recommendations', () => {
    expect(REPORT_SECTIONS[REPORT_SECTIONS.length - 1]).toBe('8.0 Conclusion and Recommendations');
  });

  it('includes Carbon Sequestration Potential section', () => {
    expect(REPORT_SECTIONS).toContain('6.0 Carbon Sequestration Potential');
  });

  it('includes Community Conservation Impact section', () => {
    expect(REPORT_SECTIONS).toContain('7.0 Community Conservation Impact');
  });

  it('sections are numbered sequentially', () => {
    REPORT_SECTIONS.forEach((section, index) => {
      expect(section).toMatch(new RegExp(`^${index + 1}\\.0`));
    });
  });
});
