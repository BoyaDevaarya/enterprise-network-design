/**
 * Pure policy engine for evaluating network access rules.
 */

export function evaluatePolicy(rules, srcDept, dstDept, service = 'any', now = new Date()) {
  const currentTimestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // Rule 0: Same department access is always permitted
  if (srcDept && dstDept && srcDept.toLowerCase() === dstDept.toLowerCase()) {
    return {
      allowed: true,
      matchedRuleId: null,
      reason: `Permitted by default: Intra-department access (${srcDept} -> ${dstDept}) is always allowed.`
    };
  }

  // Active rules sorted by order
  const activeRules = rules
    .filter(rule => {
      if (!rule.enabled) return false;
      if (rule.expiresAt) {
        const expTime = new Date(rule.expiresAt).getTime();
        if (expTime <= currentTimestamp) return false;
      }
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const rule of activeRules) {
    const srcMatch = rule.srcDept === 'any' || rule.srcDept.toLowerCase() === srcDept.toLowerCase();
    const dstMatch = rule.dstDept === 'any' || rule.dstDept.toLowerCase() === dstDept.toLowerCase();
    
    // Service match logic:
    // If request service is 'any', it matches rule if rule is 'any'
    // If request service is specific ('http', 'dns', 'icmp'), it matches if rule is 'any' or exact match
    let serviceMatch = false;
    if (rule.service === 'any') {
      serviceMatch = true;
    } else if (service === 'any') {
      serviceMatch = rule.service === 'any';
    } else {
      serviceMatch = rule.service.toLowerCase() === service.toLowerCase();
    }

    if (srcMatch && dstMatch && serviceMatch) {
      const actionText = rule.action === 'permit' ? 'Permitted' : 'Denied';
      const ruleNum = rule.order || rule.id;
      return {
        allowed: rule.action === 'permit',
        matchedRuleId: rule.id,
        reason: `${actionText} by rule #${ruleNum}: ${rule.srcDept} to ${rule.dstDept}, ${rule.service} service`
      };
    }
  }

  // Implicit deny if no rules matched
  return {
    allowed: false,
    matchedRuleId: null,
    reason: `Denied by implicit default deny: No explicit permit rule found for ${srcDept} to ${dstDept} (${service})`
  };
}

export function generatePolicyMatrix(departments, rules, now = new Date()) {
  const matrix = {};
  const services = ['icmp', 'http', 'dns'];

  for (const src of departments) {
    matrix[src.id] = {};
    for (const dst of departments) {
      matrix[src.id][dst.id] = {};
      for (const srv of services) {
        matrix[src.id][dst.id][srv] = evaluatePolicy(rules, src.id, dst.id, srv, now);
      }
    }
  }

  return matrix;
}

export function evaluateResourceAccess(userDepartment, resource, rules, now = new Date()) {
  if (!resource || !resource.ownerDepartment) {
    return {
      allowed: false,
      matchedRuleId: null,
      reason: 'Invalid resource configuration'
    };
  }

  return evaluatePolicy(
    rules,
    userDepartment,
    resource.ownerDepartment,
    resource.service || 'http',
    now
  );
}
