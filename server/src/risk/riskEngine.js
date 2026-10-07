/**
 * Pure risk engine for policy changes and security posture scoring.
 */

export function calculateChangeRisk({ srcDept, dstDept, service, action, expiresInMinutes }, departments, resources) {
  // If the action is DENY, it reduces exposure, low risk
  if (action === 'deny') {
    return {
      score: 5,
      level: 'LOW',
      reasons: ['Deny rule reduces attack surface and limits network exposure.'],
      requiresReason: false,
      requiresPhrase: false,
      phrase: null,
      alternatives: []
    };
  }

  const reasons = [];

  // Find src & dst department trust levels
  const srcObj = departments.find(d => d.id.toLowerCase() === (srcDept || '').toLowerCase());
  const dstObj = departments.find(d => d.id.toLowerCase() === (dstDept || '').toLowerCase());

  const srcTrust = srcObj ? srcObj.trust : (srcDept === 'any' ? 1 : 3);
  const dstTrust = dstObj ? dstObj.trust : (dstDept === 'any' ? 5 : 3);

  // 1. Destination Sensitivity
  let sensitivityScore = 4;
  let dstHasCriticalResource = false;
  if (dstDept === 'any') {
    sensitivityScore = 40;
    dstHasCriticalResource = resources.some(r => r.sensitivity === 'critical');
    reasons.push('Destination is set to "any", exposing all corporate network segments (+40 risk)');
  } else {
    const dstResources = resources.filter(r => r.ownerDepartment.toLowerCase() === dstDept.toLowerCase());
    const sensitivities = dstResources.map(r => r.sensitivity);
    if (sensitivities.includes('critical')) {
      sensitivityScore = 40;
      dstHasCriticalResource = true;
      reasons.push(`Destination (${dstDept}) hosts CRITICAL sensitivity resources (+40 risk)`);
    } else if (sensitivities.includes('high')) {
      sensitivityScore = 28;
      reasons.push(`Destination (${dstDept}) hosts HIGH sensitivity resources (+28 risk)`);
    } else if (sensitivities.includes('medium')) {
      sensitivityScore = 16;
      reasons.push(`Destination (${dstDept}) hosts MEDIUM sensitivity resources (+16 risk)`);
    } else {
      sensitivityScore = 4;
      reasons.push(`Destination (${dstDept}) hosts LOW sensitivity resources (+4 risk)`);
    }
  }

  // 2. Service Scope
  let serviceScore = 10;
  const srv = (service || 'any').toLowerCase();
  if (srv === 'any') {
    serviceScore = 30;
    reasons.push('Service scope is unrestricted ("any"), allowing all TCP/UDP/ICMP protocols (+30 risk)');
  } else if (srv === 'icmp') {
    serviceScore = 8;
    reasons.push('Service scope limited to ICMP (+8 risk)');
  } else if (srv === 'http') {
    serviceScore = 10;
    reasons.push('Service scope limited to HTTP/HTTPS (+10 risk)');
  } else if (srv === 'dns') {
    serviceScore = 6;
    reasons.push('Service scope limited to DNS (+6 risk)');
  }

  // 3. Trust Gap
  const rawGap = Math.max(0, dstTrust - srcTrust);
  const trustGapScore = Math.min(20, rawGap * 5);
  if (trustGapScore > 0) {
    reasons.push(`Trust gap between source (Trust ${srcTrust}) and destination (Trust ${dstTrust}) is +${trustGapScore} risk points`);
  }

  // 4. Rule Duration
  const isPermanent = !expiresInMinutes || Number(expiresInMinutes) <= 0;
  const durationScore = isPermanent ? 10 : 0;
  if (isPermanent) {
    reasons.push('Rule is PERMANENT without expiration (+10 risk)');
  } else {
    reasons.push(`Rule is temporary (${expiresInMinutes} minutes)`);
  }

  let totalScore = sensitivityScore + serviceScore + trustGapScore + durationScore;

  // Special CRITICAL override requirement:
  // "CRITICAL if a critical resource is exposed to a source with lower trust using 'any' service."
  const isCriticalOverride = dstHasCriticalResource && srcTrust < dstTrust && srv === 'any';
  if (isCriticalOverride) {
    totalScore = Math.max(totalScore, 85);
    reasons.unshift('CRITICAL SECURITY OVERRIDE: Exposing critical resource to lower-trust source via "any" service');
  }

  totalScore = Math.min(100, Math.max(0, totalScore));

  let level = 'LOW';
  if (totalScore >= 76) level = 'CRITICAL';
  else if (totalScore >= 51) level = 'HIGH';
  else if (totalScore >= 26) level = 'MEDIUM';

  const requiresReason = level === 'HIGH' || level === 'CRITICAL';
  const requiresPhrase = level === 'CRITICAL';
  const phrase = `ALLOW ${(srcDept || 'ANY').toUpperCase()} TO ${(dstDept || 'ANY').toUpperCase()}`;

  const alternatives = [];
  if (srv === 'any') {
    alternatives.push(`Allow HTTP/DNS web services only instead of "any"`);
  }
  if (isPermanent) {
    alternatives.push(`Allow temporary access for 60 minutes instead of permanent`);
  }
  if (srv !== 'icmp') {
    alternatives.push(`Allow ICMP ping diagnostics only`);
  }

  return {
    score: totalScore,
    level,
    reasons,
    requiresReason,
    requiresPhrase,
    phrase,
    alternatives
  };
}

export function computePolicyScore(departments, rules, resources) {
  let riskPenalties = 0;
  const topRisks = [];

  const activePermits = rules.filter(r => r.enabled && r.action === 'permit');

  for (const rule of activePermits) {
    if (rule.srcDept === 'any' && rule.dstDept === 'any') continue; // default fallback rule

    const risk = calculateChangeRisk({
      srcDept: rule.srcDept,
      dstDept: rule.dstDept,
      service: rule.service,
      action: rule.action,
      expiresInMinutes: rule.expiresAt ? 30 : null
    }, departments, resources);

    if (risk.level === 'CRITICAL') {
      riskPenalties += 25;
      topRisks.push(`Critical exposure: ${rule.srcDept} -> ${rule.dstDept} (${rule.service})`);
    } else if (risk.level === 'HIGH') {
      riskPenalties += 15;
      topRisks.push(`High risk permit: ${rule.srcDept} -> ${rule.dstDept} (${rule.service})`);
    } else if (risk.level === 'MEDIUM') {
      riskPenalties += 8;
      if (topRisks.length < 3) {
        topRisks.push(`Medium risk permit: ${rule.srcDept} -> ${rule.dstDept} (${rule.service})`);
      }
    }
  }

  const score = Math.max(0, Math.min(100, 100 - riskPenalties));

  let grade = 'A';
  if (score < 60) grade = 'F';
  else if (score < 70) grade = 'D';
  else if (score < 80) grade = 'C';
  else if (score < 90) grade = 'B';

  return {
    score,
    grade,
    topRisks: topRisks.slice(0, 3)
  };
}
