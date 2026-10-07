import { describe, it, expect } from 'vitest';
import { generateRouterConfig, generateCoreSwitchConfig, generateAccessSwitchConfig } from '../config/configGenerator.js';
import { getSeedData } from '../seed/seedData.js';

describe('Config Generator Tests', () => {
  const seed = getSeedData();

  it('generates valid router configuration with dot1Q subinterfaces and ACLs matching seed rules', () => {
    const config = generateRouterConfig(seed.departments, seed.rules);

    expect(config).toContain('hostname R1-EDGE');
    expect(config).toContain('interface GigabitEthernet0/1.10');
    expect(config).toContain('encapsulation dot1Q 10');
    expect(config).toContain('ip address 192.168.10.1 255.255.255.0');
    expect(config).toContain('ip dhcp pool VLAN10_POOL');

    // Test Acceptance Criterion 10: Parse CLI output to verify generated ACLs match seed rules
    expect(config).toContain('ip access-list extended ACL_HR_IN');
    expect(config).toContain('permit icmp any any echo-reply');
    expect(config).toContain('deny ip 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255');

    expect(config).toContain('ip access-list extended ACL_SALES_IN');
    expect(config).toContain('permit tcp 192.168.40.0 0.0.0.255 192.168.60.0 0.0.0.255 eq 80');
    expect(config).toContain('permit udp 192.168.40.0 0.0.0.255 192.168.60.0 0.0.0.255 eq 53');
    expect(config).toContain('deny ip 192.168.40.0 0.0.0.255 192.168.30.0 0.0.0.255');
  });

  it('generates core and access switch configurations', () => {
    const coreCfg = generateCoreSwitchConfig(seed.departments);
    expect(coreCfg).toContain('hostname CORE-SW');
    expect(coreCfg).toContain('vlan 10');

    const swHr = generateAccessSwitchConfig(seed.departments[0]);
    expect(swHr).toContain('hostname SW-HR');
    expect(swHr).toContain('vlan 10');
  });
});
