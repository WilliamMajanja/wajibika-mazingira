import { describe, it, expect } from 'vitest';
import { MODELS, ASSESSMENT_EXPERT_INSTRUCTION, CHAT_DEFAULT_SYSTEM_INSTRUCTION, REPORT_SECTIONS } from '../config/ai';

describe('MODELS config', () => {
  it('defines flash_lite model', () => {
    expect(MODELS.flash_lite).toBe('gemini-2.0-flash-lite');
  });

  it('defines flash model', () => {
    expect(MODELS.flash).toBe('gemini-2.0-flash');
  });

  it('defines pro model', () => {
    expect(MODELS.pro).toBe('gemini-2.5-flash');
  });

  it('defines tts model', () => {
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

  it('ASSESSMENT_EXPERT_INSTRUCTION mentions NEMA', () => {
    expect(ASSESSMENT_EXPERT_INSTRUCTION).toContain('NEMA');
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
  it('is an array with 6 sections', () => {
    expect(REPORT_SECTIONS).toHaveLength(6);
  });

  it('starts with Introduction', () => {
    expect(REPORT_SECTIONS[0]).toBe('1.0 Introduction');
  });

  it('ends with Conclusion and Recommendations', () => {
    expect(REPORT_SECTIONS[REPORT_SECTIONS.length - 1]).toBe('6.0 Conclusion and Recommendations');
  });

  it('sections are numbered sequentially', () => {
    REPORT_SECTIONS.forEach((section, index) => {
      expect(section).toMatch(new RegExp(`^${index + 1}\\.0`));
    });
  });
});
