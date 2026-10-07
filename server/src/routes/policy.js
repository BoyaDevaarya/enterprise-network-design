import express from 'express';
import { z } from 'zod';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';
import { evaluatePolicy, generatePolicyMatrix } from '../policy/policyEngine.js';
import { computePolicyScore } from '../risk/riskEngine.js';

const router = express.Router();

const SimulateSchema = z.object({
  srcDept: z.string().min(1),
  dstDept: z.string().min(1),
  test: z.enum(['ping', 'tracert', 'http', 'dns'])
});

export function handleSimulate(req, res, next) {
  try {
    const { srcDept, dstDept, test } = SimulateSchema.parse(req.body);

    const departments = dbRepository.getDepartments();
    const rules = dbRepository.getRules();

    const srcObj = departments.find(d => d.id.toLowerCase() === srcDept.toLowerCase());
    const dstObj = departments.find(d => d.id.toLowerCase() === dstDept.toLowerCase());

    if (!srcObj || !dstObj) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid source or destination department: ${srcDept} / ${dstDept}`
        }
      });
    }

    const serviceMap = {
      ping: 'icmp',
      tracert: 'icmp',
      http: 'http',
      dns: 'dns'
    };
    const service = serviceMap[test];

    const evalResult = evaluatePolicy(rules, srcObj.id, dstObj.id, service);

    const srcKey = srcObj.id.toLowerCase();
    const dstKey = dstObj.id.toLowerCase();

    const srcNode = srcKey === 'servers' ? 'srv-web' : `pc-${srcKey}-1`;
    const dstNode = dstKey === 'servers' ? (test === 'dns' ? 'srv-dns' : 'srv-web') : `pc-${dstKey}-1`;

    const path = [
      srcNode,
      `sw-${srcKey}`,
      'core-sw',
      'r1-edge'
    ];

    if (evalResult.allowed) {
      path.push(`sw-${dstKey}`);
      path.push(dstNode);
    }

    const outputLines = [
      `Cisco Packet Tracer Simulation Output`,
      `=====================================`,
      `Test Type: ${test.toUpperCase()} (${service.toUpperCase()})`,
      `Source: ${srcObj.name} (${srcObj.subnet})`,
      `Destination: ${dstObj.name} (${dstObj.subnet})`,
      ``,
      `1. [${srcNode}] Generated packet payload for ${test.toUpperCase()}.`,
      `2. [sw-${srcKey}] Ingress port Fa0/1 -> Encapsulated in VLAN ${srcObj.vlan}.`,
      `3. [core-sw] Forwarded frame over 802.1Q trunk to Gateway R1-EDGE.`,
      `4. [r1-edge] Ingress on Gi0/1.${srcObj.vlan} -> Evaluated ACL rules...`
    ];

    if (evalResult.allowed) {
      outputLines.push(`   >>> MATCH: ${evalResult.reason}`);
      outputLines.push(`   >>> ACTION: PERMITTED. Route lookup to Gi0/1.${dstObj.vlan}.`);
      outputLines.push(`5. [sw-${dstKey}] Egress access port to ${dstNode}.`);
      outputLines.push(`6. [${dstNode}] Packet received successfully. Response Echo-Reply returned.`);
      outputLines.push(`STATUS: SUCCESS (200 OK / Reply received)`);
    } else {
      outputLines.push(`   >>> MATCH: ${evalResult.reason}`);
      outputLines.push(`   >>> ACTION: DENIED. ICMP Destination Unreachable / Packet Dropped.`);
      outputLines.push(`STATUS: BLOCKED (Filtered by Firewall / ACL)`);
    }

    res.json({
      allowed: evalResult.allowed,
      reason: evalResult.reason,
      matchedRuleId: evalResult.matchedRuleId,
      output: outputLines.join('\n'),
      path
    });
  } catch (err) {
    next(err);
  }
}

router.get('/matrix', authenticate, (req, res) => {
  const departments = dbRepository.getDepartments();
  const rules = dbRepository.getRules();
  const matrix = generatePolicyMatrix(departments, rules);
  res.json(matrix);
});

router.get('/score', authenticate, (req, res) => {
  const departments = dbRepository.getDepartments();
  const rules = dbRepository.getRules();
  const resources = dbRepository.getResources();
  const scoreResult = computePolicyScore(departments, rules, resources);
  res.json(scoreResult);
});

router.post('/simulate', authenticate, handleSimulate);

export default router;
