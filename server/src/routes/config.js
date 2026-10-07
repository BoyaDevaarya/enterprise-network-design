import express from 'express';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';
import {
  generateRouterConfig,
  generateCoreSwitchConfig,
  generateAccessSwitchConfig,
  generateConfigDiff
} from '../config/configGenerator.js';

const router = express.Router();

function buildDeviceConfig(device) {
  const departments = dbRepository.getDepartments();
  const rules = dbRepository.getRules();
  const devKey = device.toLowerCase();

  if (devKey === 'router' || devKey === 'r1-edge') {
    return generateRouterConfig(departments, rules);
  }

  if (devKey === 'core' || devKey === 'core-sw') {
    return generateCoreSwitchConfig(departments);
  }

  if (devKey.startsWith('sw-')) {
    const deptId = devKey.replace('sw-', '');
    const dept = departments.find(d => d.id.toLowerCase() === deptId);
    if (dept) {
      return generateAccessSwitchConfig(dept);
    }
  }

  return null;
}

router.get('/:device', authenticate, (req, res) => {
  const { device } = req.params;
  const config = buildDeviceConfig(device);

  if (config === null) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Device '${device}' not found. Valid options: router, core, sw-<deptId>`
      }
    });
  }

  // Update history
  const history = dbRepository.getConfigHistory();
  if (history[device] && history[device] !== config) {
    history[`${device}_prev`] = history[device];
  }
  history[device] = config;
  dbRepository.saveConfigHistory(history);

  res.setHeader('Content-Type', 'text/plain');
  res.send(config);
});

router.get('/:device/diff', authenticate, (req, res) => {
  const { device } = req.params;
  const currentConfig = buildDeviceConfig(device);

  if (currentConfig === null) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Device '${device}' not found.`
      }
    });
  }

  const history = dbRepository.getConfigHistory();
  const prevConfig = history[`${device}_prev`] || '';
  const diff = generateConfigDiff(prevConfig, currentConfig);

  res.setHeader('Content-Type', 'text/plain');
  res.send(diff);
});

export default router;
