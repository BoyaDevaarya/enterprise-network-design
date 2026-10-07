function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^\w\-\.\/ ]/gi, '').trim();
}

function sanitizeVlan(vlan) {
  const v = parseInt(vlan, 10);
  if (isNaN(v) || v < 1 || v > 4094) return 10;
  return v;
}

export function generateRouterConfig(departments, rules) {
  const lines = [];

  lines.push('! ===================================================');
  lines.push('! Cisco IOS Router Configuration - R1-EDGE');
  lines.push('! Generated automatically by EnterpriseNet Access Portal');
  lines.push('! ===================================================');
  lines.push('! Enter global configuration mode');
  lines.push('configure terminal');
  lines.push('! Set device hostname');
  lines.push('hostname R1-EDGE');
  lines.push('!');

  lines.push('! --- WAN Interface Configuration ---');
  lines.push('! Configure primary ISP uplink interface');
  lines.push('interface GigabitEthernet0/0');
  lines.push(' ! Assign public WAN IP address and subnet mask (/30)');
  lines.push(' ip address 203.0.113.2 255.255.255.252');
  lines.push(' ! Enable interface');
  lines.push(' no shutdown');
  lines.push('!');

  lines.push('! Configure default gateway route out to ISP router');
  lines.push('ip route 0.0.0.0 0.0.0.0 203.0.113.1');
  lines.push('!');

  lines.push('! --- LAN Trunk Interface ---');
  lines.push('! Configure internal trunk interface to CORE-SW switch');
  lines.push('interface GigabitEthernet0/1');
  lines.push(' ! Keep physical port active without L3 IP');
  lines.push(' no ip address');
  lines.push(' no shutdown');
  lines.push('!');

  // Excluded DHCP addresses & Pools
  lines.push('! --- DHCP Server Configurations ---');
  for (const dept of departments) {
    const baseIp = dept.subnet.split('.')[0] + '.' + dept.subnet.split('.')[1] + '.' + dept.subnet.split('.')[2];
    lines.push(`! Exclude static IPs (.1 gateway to .10 servers/mgmt) for ${dept.name}`);
    lines.push(`ip dhcp excluded-address ${baseIp}.1 ${baseIp}.10`);
    lines.push(`! Configure DHCP pool for VLAN ${dept.vlan} (${dept.name})`);
    lines.push(`ip dhcp pool VLAN${dept.vlan}_POOL`);
    lines.push(` network ${baseIp}.0 255.255.255.0`);
    lines.push(` default-router ${baseIp}.1`);
    lines.push(` dns-server 192.168.60.10`);
    lines.push('!');
  }

  // Determine ACL requirements per department
  const activeRules = rules.filter(r => r.enabled);
  const deptAcls = {};

  for (const dept of departments) {
    // Collect rules that apply to this srcDept or 'any'
    const relevantRules = activeRules.filter(r => r.srcDept === dept.id || r.srcDept === 'any');
    // Check if department has rules other than default permit-all
    const nonDefault = relevantRules.some(r => r.action === 'deny' || (r.srcDept === dept.id && r.dstDept !== 'any'));
    if (nonDefault) {
      deptAcls[dept.id] = relevantRules;
    }
  }

  lines.push('! --- Dynamic Access Control Lists (ACLs) ---');
  for (const [deptId, deptRules] of Object.entries(deptAcls)) {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) continue;

    const aclName = `ACL_${dept.id.toUpperCase()}_IN`;
    lines.push(`! Define extended named ACL for ${dept.name} inbound traffic`);
    lines.push(`ip access-list extended ${aclName}`);
    lines.push(` ! Permit ICMP echo replies for return stateful traffic`);
    lines.push(` permit icmp any any echo-reply`);

    const srcSubnet = dept.subnet.split('/')[0];

    for (const rule of deptRules) {
      // Resolve target destination subnet
      let dstStr = 'any';
      if (rule.dstDept !== 'any') {
        const dstDeptObj = departments.find(d => d.id === rule.dstDept);
        if (dstDeptObj) {
          const dstSubnet = dstDeptObj.subnet.split('/')[0];
          dstStr = `${dstSubnet} 0.0.0.255`;
        }
      }

      const action = rule.action; // permit or deny
      const srcStr = `${srcSubnet} 0.0.0.255`;

      if (rule.service === 'any') {
        lines.push(` ! Rule #${rule.order}: ${rule.comment || ''}`);
        lines.push(` ${action} ip ${srcStr} ${dstStr}`);
      } else if (rule.service === 'http') {
        lines.push(` ! Rule #${rule.order} (HTTP/HTTPS): ${rule.comment || ''}`);
        lines.push(` ${action} tcp ${srcStr} ${dstStr} eq 80`);
        lines.push(` ${action} tcp ${srcStr} ${dstStr} eq 443`);
      } else if (rule.service === 'dns') {
        lines.push(` ! Rule #${rule.order} (DNS): ${rule.comment || ''}`);
        lines.push(` ${action} udp ${srcStr} ${dstStr} eq 53`);
      } else if (rule.service === 'icmp') {
        lines.push(` ! Rule #${rule.order} (ICMP): ${rule.comment || ''}`);
        lines.push(` ${action} icmp ${srcStr} ${dstStr}`);
      }
    }

    lines.push(` ! Default permit remaining outbound traffic for ${dept.name}`);
    lines.push(` permit ip any any`);
    lines.push('!');
  }

  lines.push('! --- VLAN Subinterface Router-on-a-Stick ---');
  for (const dept of departments) {
    const baseIp = dept.subnet.split('.')[0] + '.' + dept.subnet.split('.')[1] + '.' + dept.subnet.split('.')[2];
    lines.push(`! Configure subinterface for VLAN ${dept.vlan} (${dept.name})`);
    lines.push(`interface GigabitEthernet0/1.${dept.vlan}`);
    lines.push(` ! Set 802.1Q VLAN encapsulation tag`);
    lines.push(` encapsulation dot1Q ${dept.vlan}`);
    lines.push(` ! Set Gateway IP address`);
    lines.push(` ip address ${baseIp}.1 255.255.255.0`);

    if (deptAcls[dept.id]) {
      const aclName = `ACL_${dept.id.toUpperCase()}_IN`;
      lines.push(` ! Apply inbound Access Group filtering`);
      lines.push(` ip access-group ${aclName} in`);
    }
    lines.push('!');
  }

  lines.push('end');
  return lines.join('\n');
}

export function generateCoreSwitchConfig(departments) {
  const lines = [];

  lines.push('! ===================================================');
  lines.push('! Cisco IOS Switch Configuration - CORE-SW');
  lines.push('! Generated automatically by EnterpriseNet Access Portal');
  lines.push('! ===================================================');
  lines.push('configure terminal');
  lines.push('hostname CORE-SW');
  lines.push('!');

  lines.push('! --- VLAN Definitions ---');
  for (const dept of departments) {
    lines.push(`! Define VLAN ${dept.vlan} for ${dept.name}`);
    lines.push(`vlan ${dept.vlan}`);
    lines.push(` name ${dept.name}`);
    lines.push('!');
  }

  lines.push('! --- Router Uplink Trunk ---');
  lines.push('! Configure Gigabit link to R1-EDGE Router');
  lines.push('interface GigabitEthernet0/1');
  lines.push(' switchport mode trunk');
  const vlanList = departments.map(d => d.vlan).join(',');
  lines.push(` switchport trunk allowed vlan ${vlanList}`);
  lines.push(' no shutdown');
  lines.push('!');

  lines.push('! --- Access Switches Trunks ---');
  let portIndex = 1;
  for (const dept of departments) {
    lines.push(`! Configure trunk connection to SW-${dept.id.toUpperCase()} Access Switch`);
    lines.push(`interface FastEthernet0/${portIndex}`);
    lines.push(' switchport mode trunk');
    lines.push(` switchport trunk allowed vlan ${dept.vlan},60`);
    lines.push(' no shutdown');
    lines.push('!');
    portIndex++;
  }

  lines.push('end');
  return lines.join('\n');
}

export function generateAccessSwitchConfig(department) {
  const lines = [];
  const deptKey = department.id.toUpperCase();

  lines.push('! ===================================================');
  lines.push(`! Cisco IOS Switch Configuration - SW-${deptKey}`);
  lines.push(`! Dedicated Access Switch for ${department.name} Department`);
  lines.push('! Generated automatically by EnterpriseNet Access Portal');
  lines.push('! ===================================================');
  lines.push('configure terminal');
  lines.push(`hostname SW-${deptKey}`);
  lines.push('!');

  lines.push(`! Define Local Department VLAN ${department.vlan}`);
  lines.push(`vlan ${department.vlan}`);
  lines.push(` name ${department.name}`);
  lines.push('!');

  lines.push('! --- Core Switch Uplink Trunk ---');
  lines.push('interface GigabitEthernet0/1');
  lines.push(' switchport mode trunk');
  lines.push(' no shutdown');
  lines.push('!');

  lines.push('! --- Access Ports Configuration ---');
  if (department.id.toLowerCase() === 'servers') {
    lines.push('! Configure dedicated server access ports (Fa0/1 to Fa0/2)');
    lines.push('interface range FastEthernet0/1 - 2');
    lines.push(' switchport mode access');
    lines.push(` switchport access vlan ${department.vlan}`);
    lines.push(' spanning-tree portfast');
    lines.push(' no shutdown');
  } else {
    lines.push(`! Configure workstation access ports (Fa0/1 to Fa0/3) for ${department.name}`);
    lines.push('interface range FastEthernet0/1 - 3');
    lines.push(' switchport mode access');
    lines.push(` switchport access vlan ${department.vlan}`);
    lines.push(' spanning-tree portfast');
    lines.push(' no shutdown');
  }

  lines.push('!');
  lines.push('end');
  return lines.join('\n');
}

export function generateConfigDiff(oldConfig, newConfig) {
  if (!oldConfig) return newConfig || '';
  if (oldConfig === newConfig) return '! No configuration changes detected.\n';

  const oldLines = oldConfig.split('\n');
  const newLines = newConfig.split('\n');

  const diffLines = [];
  diffLines.push('! --- CONFIGURATION DIFF SUMMARY ---');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  for (const line of newLines) {
    if (!oldSet.has(line) && line.trim() && !line.startsWith('! ===')) {
      diffLines.push(`+ ${line}`);
    }
  }

  for (const line of oldLines) {
    if (!newSet.has(line) && line.trim() && !line.startsWith('! ===')) {
      diffLines.push(`- ${line}`);
    }
  }

  return diffLines.join('\n');
}
