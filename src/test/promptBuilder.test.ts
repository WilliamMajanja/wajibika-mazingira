import { describe, it, expect } from 'vitest';
import { getSectionPrompt } from '../utils/promptBuilder';
import type { AssessmentType } from '../types';

const baseDetails = {
  projectName: 'Solar Farm Alpha',
  projectProponent: 'Green Energy Ltd',
  location: 'Nairobi',
  projectType: 'Renewable Energy',
  description: 'A 50MW solar farm on 200 acres.',
  assessmentType: 'Environmental' as AssessmentType,
};

describe('getSectionPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getSectionPrompt(baseDetails, '1.0 Introduction');
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
  });

  it('includes the section name in the prompt', () => {
    const prompt = getSectionPrompt(baseDetails, '3.0 Baseline Conditions');
    expect(prompt).toContain('3.0 Baseline Conditions');
  });

  it('includes all project details', () => {
    const prompt = getSectionPrompt(baseDetails, '1.0 Introduction');
    expect(prompt).toContain('Solar Farm Alpha');
    expect(prompt).toContain('Green Energy Ltd');
    expect(prompt).toContain('Nairobi');
    expect(prompt).toContain('Renewable Energy');
    expect(prompt).toContain('A 50MW solar farm on 200 acres.');
  });

  it('includes the assessment type', () => {
    const prompt = getSectionPrompt(baseDetails, '1.0 Introduction');
    expect(prompt).toContain('Environmental');
  });

  it('includes Environmental-specific guidance', () => {
    const prompt = getSectionPrompt(
      { ...baseDetails, assessmentType: 'Environmental' },
      '4.0 Impact Assessment'
    );
    expect(prompt).toContain('ecosystems');
    expect(prompt).toContain('biodiversity');
    expect(prompt).toContain('water resources');
  });

  it('includes Social-specific guidance', () => {
    const prompt = getSectionPrompt(
      { ...baseDetails, assessmentType: 'Social' },
      '4.0 Impact Assessment'
    );
    expect(prompt).toContain('community displacement');
    expect(prompt).toContain('cultural heritage');
  });

  it('includes Health-specific guidance', () => {
    const prompt = getSectionPrompt(
      { ...baseDetails, assessmentType: 'Health' },
      '4.0 Impact Assessment'
    );
    expect(prompt).toContain('public health');
    expect(prompt).toContain('noise-related stress');
  });

  it('includes Climate-specific guidance', () => {
    const prompt = getSectionPrompt(
      { ...baseDetails, assessmentType: 'Climate' },
      '4.0 Impact Assessment'
    );
    expect(prompt).toContain('greenhouse gas');
    expect(prompt).toContain('carbon footprint');
  });

  it('includes Cumulative-specific guidance', () => {
    const prompt = getSectionPrompt(
      { ...baseDetails, assessmentType: 'Cumulative' },
      '4.0 Impact Assessment'
    );
    expect(prompt).toContain('Cumulative Impact Assessment');
    expect(prompt).toContain('Additive & Synergistic');
  });

  it('includes Kenya in the location context', () => {
    const prompt = getSectionPrompt(baseDetails, '1.0 Introduction');
    expect(prompt).toContain('Kenya');
  });

  it('includes Markdown formatting instructions', () => {
    const prompt = getSectionPrompt(baseDetails, '1.0 Introduction');
    expect(prompt).toContain('Markdown');
  });
});
