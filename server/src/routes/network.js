import express from 'express';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const departments = dbRepository.getDepartments();

  const nodes = [
    { id: 'internet', name: 'Internet Gateway', type: 'internet', ip: '203.0.113.1' },
    { id: 'r1-edge', name: 'R1-EDGE Router', type: 'router', ip: '203.0.113.2', interface: 'Gi0/0' },
    { id: 'core-sw', name: 'CORE-SW Switch', type: 'switch', role: 'core', interface: 'Gi0/1' }
  ];

  const links = [
    { source: 'internet', target: 'r1-edge', label: 'Gi0/0 (203.0.113.0/30)' },
    { source: 'r1-edge', target: 'core-sw', label: 'Gi0/1 Trunk (VLANs 10-60)' }
  ];

  let portIdx = 1;
  for (const dept of departments) {
    const swId = `sw-${dept.id.toLowerCase()}`;
    nodes.push({
      id: swId,
      name: `SW-${dept.id.toUpperCase()} Switch`,
      type: 'switch',
      role: 'access',
      department: dept.id,
      vlan: dept.vlan,
      subnet: dept.subnet
    });

    links.push({
      source: 'core-sw',
      target: swId,
      label: `Fa0/${portIdx} Trunk (VLAN ${dept.vlan})`
    });

    if (dept.id.toLowerCase() === 'servers') {
      nodes.push({
        id: 'srv-dns',
        name: 'DNS Server',
        type: 'server',
        department: 'Servers',
        ip: '192.168.60.10',
        service: 'dns'
      });
      nodes.push({
        id: 'srv-web',
        name: 'Web Server',
        type: 'server',
        department: 'Servers',
        ip: '192.168.60.11',
        service: 'http'
      });

      links.push({ source: swId, target: 'srv-dns', label: 'Fa0/1 Access VLAN 60' });
      links.push({ source: swId, target: 'srv-web', label: 'Fa0/2 Access VLAN 60' });
    } else {
      nodes.push({
        id: `pc-${dept.id.toLowerCase()}-1`,
        name: `${dept.name} Workstation 1`,
        type: 'pc',
        department: dept.id,
        ip: dept.subnet.replace('.0/24', '.11')
      });
      nodes.push({
        id: `pc-${dept.id.toLowerCase()}-2`,
        name: `${dept.name} Workstation 2`,
        type: 'pc',
        department: dept.id,
        ip: dept.subnet.replace('.0/24', '.12')
      });

      links.push({ source: swId, target: `pc-${dept.id.toLowerCase()}-1`, label: 'Fa0/1 Access' });
      links.push({ source: swId, target: `pc-${dept.id.toLowerCase()}-2`, label: 'Fa0/2 Access' });
    }

    portIdx++;
  }

  res.json({
    departments,
    nodes,
    links
  });
});

export default router;
