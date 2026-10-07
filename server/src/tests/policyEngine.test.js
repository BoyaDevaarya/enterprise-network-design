import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from '../policy/policyEngine.js';
import { getSeedData } from '../seed/seedData.js';

describe('Policy Engine Pure Unit Tests', () => {
  const seed = getSeedData();
  const rules = seed.rules;

  it('allows same-department access by default', () => {
    const res = evaluatePolicy(rules, 'HR', 'HR', 'any');
    expect(res.allowed).toBe(true);
    expect(res.reason).toContain('Intra-department access');
  });

  it('denies HR to Finance access based on Rule #1', () => {
    const res = evaluatePolicy(rules, 'HR', 'Finance', 'any');
    expect(res.allowed).toBe(false);
    expect(res.matchedRuleId).toBe('rule-1');
    expect(res.reason).toContain('Denied by rule #1');
  });

  it('permits Sales to Servers http and dns, but denies other services', () => {
    const httpRes = evaluatePolicy(rules, 'Sales', 'Servers', 'http');
    expect(httpRes.allowed).toBe(true);
    expect(httpRes.matchedRuleId).toBe('rule-2');

    const dnsRes = evaluatePolicy(rules, 'Sales', 'Servers', 'dns');
    expect(dnsRes.allowed).toBe(true);
    expect(dnsRes.matchedRuleId).toBe('rule-3');

    const icmpRes = evaluatePolicy(rules, 'Sales', 'Servers', 'icmp');
    expect(icmpRes.allowed).toBe(false);
    expect(icmpRes.matchedRuleId).toBe('rule-5');
  });

  it('allows Finance to HR ping while blocking HR to Finance ping', () => {
    const finToHr = evaluatePolicy(rules, 'Finance', 'HR', 'icmp');
    expect(finToHr.allowed).toBe(true);

    const hrToFin = evaluatePolicy(rules, 'HR', 'Finance', 'icmp');
    expect(hrToFin.allowed).toBe(false);
  });
});
