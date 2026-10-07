import bcrypt from 'bcryptjs';

export function getSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', salt);
  const demoPasswordHash = bcrypt.hashSync('Demo@123', salt);

  const departments = [
    { id: 'HR', name: 'HR', vlan: 10, subnet: '192.168.10.0/24', gateway: '192.168.10.1', color: '#22d3ee', trust: 3 },
    { id: 'Finance', name: 'Finance', vlan: 20, subnet: '192.168.20.0/24', gateway: '192.168.20.1', color: '#3b82f6', trust: 4 },
    { id: 'IT', name: 'IT', vlan: 30, subnet: '192.168.30.0/24', gateway: '192.168.30.1', color: '#8b5cf6', trust: 5 },
    { id: 'Sales', name: 'Sales', vlan: 40, subnet: '192.168.40.0/24', gateway: '192.168.40.1', color: '#10b981', trust: 2 },
    { id: 'Management', name: 'Management', vlan: 50, subnet: '192.168.50.0/24', gateway: '192.168.50.1', color: '#f59e0b', trust: 5 },
    { id: 'Servers', name: 'Servers', vlan: 60, subnet: '192.168.60.0/24', gateway: '192.168.60.1', color: '#f43f5e', trust: 4 }
  ];

  const resources = [
    {
      id: 'res-hr',
      name: 'HR Records',
      ownerDepartment: 'HR',
      service: 'http',
      sensitivity: 'critical',
      description: 'Confidential employee records, contracts, and payroll data.',
      content: {
        title: 'HR Employee Database',
        table: [
          { empId: 'EMP-001', name: 'Alice Smith', role: 'HR Manager', salary: '$110,000', status: 'Active' },
          { empId: 'EMP-002', name: 'Bob Jones', role: 'Financial Analyst', salary: '$95,000', status: 'Active' },
          { empId: 'EMP-003', name: 'Carol Danvers', role: 'Lead Architect', salary: '$140,000', status: 'Active' }
        ]
      }
    },
    {
      id: 'res-finance',
      name: 'Finance Ledger',
      ownerDepartment: 'Finance',
      service: 'http',
      sensitivity: 'critical',
      description: 'Corporate general ledger and financial transaction history.',
      content: {
        title: 'General Ledger Q3 2026',
        table: [
          { txId: 'TX-9012', date: '2026-09-01', type: 'Revenue', amount: '$1,250,000', desc: 'Enterprise Client Renewal' },
          { txId: 'TX-9013', date: '2026-09-05', type: 'Expense', amount: '$45,000', desc: 'Cloud Infrastructure' },
          { txId: 'TX-9014', date: '2026-09-12', type: 'Payroll', amount: '$380,000', desc: 'Monthly Payroll Run' }
        ]
      }
    },
    {
      id: 'res-it',
      name: 'IT Admin Console',
      ownerDepartment: 'IT',
      service: 'http',
      sensitivity: 'critical',
      description: 'Central infrastructure control, key vault, and cluster management.',
      content: {
        title: 'IT Infrastructure Management',
        table: [
          { server: 'k8s-master-01', status: 'HEALTHY', uptime: '142 days', load: '12%' },
          { server: 'db-primary', status: 'HEALTHY', uptime: '89 days', load: '34%' },
          { server: 'firewall-core', status: 'ACTIVE', uptime: '210 days', load: '5%' }
        ]
      }
    },
    {
      id: 'res-mgmt',
      name: 'Management Dashboard',
      ownerDepartment: 'Management',
      service: 'http',
      sensitivity: 'high',
      description: 'Executive KPI tracking, strategic goals, and board reports.',
      content: {
        title: 'Executive Strategic KPIs',
        table: [
          { metric: 'ARR Growth', target: '25%', actual: '28.4%', trend: 'UP' },
          { metric: 'Customer Retention', target: '95%', actual: '96.2%', trend: 'UP' },
          { metric: 'Operating Margin', target: '30%', actual: '32.1%', trend: 'UP' }
        ]
      }
    },
    {
      id: 'res-sales',
      name: 'Sales CRM',
      ownerDepartment: 'Sales',
      service: 'http',
      sensitivity: 'medium',
      description: 'Customer pipeline, deal tracking, and lead contacts.',
      content: {
        title: 'Sales Pipeline Q4',
        table: [
          { lead: 'Acme Corp', stage: 'Negotiation', value: '$500,000', probability: '80%' },
          { lead: 'Globex Inc', stage: 'Proposal', value: '$250,000', probability: '60%' },
          { lead: 'Soylent Ltd', stage: 'Closed Won', value: '$150,000', probability: '100%' }
        ]
      }
    },
    {
      id: 'res-web',
      name: 'Company Web Portal',
      ownerDepartment: 'Servers',
      service: 'http',
      sensitivity: 'low',
      description: 'Internal employee intranet portal and announcement hub.',
      content: {
        title: 'EnterpriseNet Intranet Portal',
        table: [
          { date: '2026-10-01', category: 'Announcement', title: 'Q4 All-Hands Scheduled for Friday' },
          { date: '2026-09-28', category: 'Policy', title: 'Updated Remote Work Guidelines Released' },
          { date: '2026-09-15', category: 'Events', title: 'Annual Charity Cyber Run Signups Open' }
        ]
      }
    },
    {
      id: 'res-dns',
      name: 'DNS Service',
      ownerDepartment: 'Servers',
      service: 'dns',
      sensitivity: 'low',
      description: 'Internal domain name resolution lookup service.',
      content: {
        title: 'Internal DNS Zone Records',
        table: [
          { hostname: 'portal.enterprisenet.local', recordType: 'A', address: '192.168.60.11' },
          { hostname: 'dns.enterprisenet.local', recordType: 'A', address: '192.168.60.10' },
          { hostname: 'gateway.enterprisenet.local', recordType: 'A', address: '203.0.113.2' }
        ]
      }
    }
  ];

  const users = [
    {
      id: 'user-admin',
      email: 'admin@enterprisenet.local',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      role: 'ADMIN',
      department: 'IT',
      disabled: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-hr',
      email: 'hr@enterprisenet.local',
      passwordHash: demoPasswordHash,
      name: 'HR Member',
      role: 'MEMBER',
      department: 'HR',
      disabled: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-finance',
      email: 'finance@enterprisenet.local',
      passwordHash: demoPasswordHash,
      name: 'Finance Member',
      role: 'MEMBER',
      department: 'Finance',
      disabled: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-it',
      email: 'it@enterprisenet.local',
      passwordHash: demoPasswordHash,
      name: 'IT Member',
      role: 'MEMBER',
      department: 'IT',
      disabled: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-sales',
      email: 'sales@enterprisenet.local',
      passwordHash: demoPasswordHash,
      name: 'Sales Member',
      role: 'MEMBER',
      department: 'Sales',
      disabled: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-mgmt',
      email: 'mgmt@enterprisenet.local',
      passwordHash: demoPasswordHash,
      name: 'Management Member',
      role: 'MEMBER',
      department: 'Management',
      disabled: false,
      createdAt: new Date().toISOString()
    }
  ];

  const rules = [
    {
      id: 'rule-1',
      order: 1,
      srcDept: 'HR',
      dstDept: 'Finance',
      service: 'any',
      action: 'deny',
      enabled: true,
      expiresAt: null,
      comment: 'Isolate Finance ledger from HR staff',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-2',
      order: 2,
      srcDept: 'Sales',
      dstDept: 'Servers',
      service: 'http',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Allow Sales HTTP access to Company Web Portal',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-3',
      order: 3,
      srcDept: 'Sales',
      dstDept: 'Servers',
      service: 'dns',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Allow Sales DNS queries',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-4',
      order: 4,
      srcDept: 'Sales',
      dstDept: 'IT',
      service: 'any',
      action: 'deny',
      enabled: true,
      expiresAt: null,
      comment: 'Block Sales from accessing IT infrastructure',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-5',
      order: 5,
      srcDept: 'Sales',
      dstDept: 'Servers',
      service: 'any',
      action: 'deny',
      enabled: true,
      expiresAt: null,
      comment: 'Block remaining Sales traffic to Servers (e.g. ping)',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-6',
      order: 6,
      srcDept: 'IT',
      dstDept: 'any',
      service: 'any',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Full IT administrative outbound access',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-7',
      order: 7,
      srcDept: 'Management',
      dstDept: 'any',
      service: 'any',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Full Management outbound access',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-8',
      order: 8,
      srcDept: 'Finance',
      dstDept: 'any',
      service: 'any',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Full Finance outbound access',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-9',
      order: 9,
      srcDept: 'any',
      dstDept: 'Servers',
      service: 'http',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Allow Intranet HTTP access for all departments',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-10',
      order: 10,
      srcDept: 'any',
      dstDept: 'Servers',
      service: 'dns',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Allow DNS resolution for all departments',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-11',
      order: 11,
      srcDept: 'any',
      dstDept: 'any',
      service: 'any',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: 'Default permit all remaining traffic',
      createdBy: 'admin@enterprisenet.local',
      createdAt: new Date().toISOString()
    }
  ];

  return {
    departments,
    resources,
    users,
    rules,
    accessRequests: [],
    auditLogs: [],
    configHistory: {}
  };
}
