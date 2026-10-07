import { dbRepository } from '../repo/db.js';
import { broadcastSSE } from './sse.js';

let timerId = null;

export function checkAndPurgeExpiredRules(now = new Date()) {
  const rules = dbRepository.getRules();
  const currentTimestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  
  let changed = false;
  const remainingRules = [];
  const expiredRules = [];

  for (const rule of rules) {
    if (rule.enabled && rule.expiresAt) {
      const expTime = new Date(rule.expiresAt).getTime();
      if (expTime <= currentTimestamp) {
        changed = true;
        expiredRules.push(rule);
        continue;
      }
    }
    remainingRules.push(rule);
  }

  if (changed) {
    dbRepository.saveRules(remainingRules);

    for (const expRule of expiredRules) {
      // Audit log entry
      dbRepository.addAuditLog({
        userId: 'system-timer',
        userEmail: 'system@enterprisenet.local',
        userName: 'System Expiry Timer',
        action: 'RULE_EXPIRED',
        resourceOrRuleId: expRule.id,
        riskLevel: 'LOW',
        reason: `Temporary rule #${expRule.order} (${expRule.srcDept} -> ${expRule.dstDept}, ${expRule.service}) expired automatically`,
        before: expRule,
        after: null
      });

      // Broadcast SSE
      broadcastSSE('rule-expired', { ruleId: expRule.id, rule: expRule });
    }

    broadcastSSE('policy-changed', { reason: 'Temporary rule expired' });
  }

  return expiredRules;
}

export function startExpiryTimer(intervalMs = 5000) {
  if (!timerId) {
    timerId = setInterval(() => {
      checkAndPurgeExpiredRules();
    }, intervalMs);
    if (timerId.unref) {
      timerId.unref();
    }
  }
}

export function stopExpiryTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}
