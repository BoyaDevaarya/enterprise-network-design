import { describe, it, expect } from 'vitest';
import { calculateChangeRisk, computePolicyScore } from '../risk/riskEngine.js';
import { getSeedData } from '../seed/seedData.js';

describe('Risk Engine Pure Unit Tests', () => {
  const seed = getSeedData();

  it('evaluates CRITICAL risk for lower trust source accessing critical resource via any service', () => {
    const risk = calculateChangeRisk({
      srcDept: 'HR', // Trust 3
      dstDept: 'Finance', // Trust 4, has critical resource
      service: 'any',
      action: 'permit',
      expiresInMinutes: null
    }, seed.departments, seed.resources);

    expect(risk.level).toBe('CRITICAL');
    expect(risk.requiresReason).toBe(true);
    expect(risk.requiresPhrase).toBe(true);
    expect(risk.phrase).toBe('ALLOW HR TO FINANCE');
  });

  it('calculates policy overall security score', () => {
    const scoreResult = computePolicyScore(seed.departments, seed.rules, seed.resources);
    expect(scoreResult.score).toBeGreaterThanOrEqual(0);
    expect(scoreResult.score).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(scoreResult.grade);
    expect(Array.isArray(scoreResult.topRisks)).toBe(true);
  });
});
