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
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'HR',
      accessLevel: 'confidential',
      ipAddress: '192.168.10.15',
      endpoint: 'hr-db.enterprisenet.local:8443',
      service: 'http',
      sensitivity: 'critical',
      description: 'Confidential employee records, compensation packages, contracts, and payroll data.',
      permissions: {
        allowedDepartments: ['HR', 'Management', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
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
      id: 'res-hr-portal',
      name: 'HR Self-Service Portal',
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'HR',
      accessLevel: 'restricted',
      ipAddress: '192.168.10.20',
      endpoint: 'hr-portal.enterprisenet.local',
      service: 'http',
      sensitivity: 'medium',
      description: 'Employee self-service intranet for PTO requests, benefit enrollment, and performance reviews.',
      permissions: {
        allowedDepartments: ['HR', 'IT', 'Finance', 'Sales', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
      content: {
        title: 'HR Self-Service & Benefits Hub',
        table: [
          { module: 'PTO Requests', pendingCount: '14', avgApprovalHours: '4.2h', systemStatus: 'ONLINE' },
          { module: 'Benefits Enrollment', pendingCount: '3', avgApprovalHours: '12.0h', systemStatus: 'ONLINE' },
          { module: 'Performance Reviews', pendingCount: '28', avgApprovalHours: '48.0h', systemStatus: 'ONLINE' }
        ]
      }
    },
    {
      id: 'res-db-hr-mongo',
      name: 'HR MongoDB Cluster',
      category: 'database_instance',
      status: 'ONLINE',
      ownerDepartment: 'HR',
      accessLevel: 'confidential',
      ipAddress: '192.168.10.50',
      endpoint: 'mongo-hr.internal:27017',
      service: 'http',
      sensitivity: 'critical',
      description: 'NoSQL document database powering HR employee documents, resumes, and background verification records.',
      permissions: {
        allowedDepartments: ['HR', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'HR Document Store Collections',
        table: [
          { collection: 'resumes_archive', docsCount: '1,450', sizeMb: '820 MB', replicaState: 'PRIMARY' },
          { collection: 'background_checks', docsCount: '320', sizeMb: '140 MB', replicaState: 'PRIMARY' },
          { collection: 'tax_forms_w2', docsCount: '980', sizeMb: '450 MB', replicaState: 'PRIMARY' }
        ]
      }
    },
    {
      id: 'res-finance',
      name: 'Finance Ledger',
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'Finance',
      accessLevel: 'confidential',
      ipAddress: '192.168.20.25',
      endpoint: 'ledger.finance.enterprisenet.local',
      service: 'http',
      sensitivity: 'critical',
      description: 'Corporate general ledger and financial transaction history.',
      permissions: {
        allowedDepartments: ['Finance', 'Management', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
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
      id: 'res-db-finance-pg',
      name: 'Production Finance PostgreSQL DB',
      category: 'database_instance',
      status: 'ONLINE',
      ownerDepartment: 'Finance',
      accessLevel: 'confidential',
      ipAddress: '192.168.20.50',
      endpoint: 'pg-finance.db.internal:5432',
      service: 'http',
      sensitivity: 'critical',
      description: 'ACID-compliant relational database holding enterprise banking details, accounts payable, and auditing tables.',
      permissions: {
        allowedDepartments: ['Finance', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'PostgreSQL Financial Master Database',
        table: [
          { table: 'accounts_payable', rowCount: '45,210', indexSize: '42 MB', health: 'HEALTHY' },
          { table: 'wire_transfers', rowCount: '12,890', indexSize: '18 MB', health: 'HEALTHY' },
          { table: 'tax_provisions', rowCount: '3,410', indexSize: '8 MB', health: 'HEALTHY' }
        ]
      }
    },
    {
      id: 'res-app-finance-erp',
      name: 'Corporate ERP & Billing Hub',
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'Finance',
      accessLevel: 'restricted',
      ipAddress: '192.168.20.100',
      endpoint: 'erp.enterprisenet.local',
      service: 'http',
      sensitivity: 'high',
      description: 'Enterprise Resource Planning system for vendor invoicing, procurement, and billing management.',
      permissions: {
        allowedDepartments: ['Finance', 'Sales', 'Management', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
      content: {
        title: 'ERP Billing & Accounts Overview',
        table: [
          { invoiceId: 'INV-2026-089', vendor: 'Amazon Web Services', amount: '$32,450.00', status: 'Approved' },
          { invoiceId: 'INV-2026-090', vendor: 'Cisco Systems', amount: '$118,000.00', status: 'Pending Review' },
          { invoiceId: 'INV-2026-091', vendor: 'Datadog Inc', amount: '$14,200.00', status: 'Paid' }
        ]
      }
    },
    {
      id: 'res-it',
      name: 'IT Admin Console',
      category: 'network_tool',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'top_secret',
      ipAddress: '192.168.30.10',
      endpoint: 'admin-console.it.enterprisenet.local:8443',
      service: 'http',
      sensitivity: 'critical',
      description: 'Central infrastructure control, key vault, and cluster management.',
      permissions: {
        allowedDepartments: ['IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
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
      id: 'res-cloud-k8s',
      name: 'AWS EKS Production K8s Cluster',
      category: 'cloud_infrastructure',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'top_secret',
      ipAddress: '10.0.12.44',
      endpoint: 'k8s-prod.us-east-1.cloud.internal:6443',
      service: 'http',
      sensitivity: 'critical',
      description: 'Primary cloud container orchestration cluster running production microservices and api gateways.',
      permissions: {
        allowedDepartments: ['IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'EKS Kubernetes Node Pools',
        table: [
          { nodeGroup: 'nodepool-general-01', instanceType: 't3.xlarge', nodeCount: '6', cpuUtilization: '42%' },
          { nodeGroup: 'nodepool-highmem-02', instanceType: 'r5.2xlarge', nodeCount: '4', cpuUtilization: '65%' },
          { nodeGroup: 'nodepool-edge-ingress', instanceType: 'c5.large', nodeCount: '3', cpuUtilization: '18%' }
        ]
      }
    },
    {
      id: 'res-net-siem',
      name: 'SIEM Security Event Monitor',
      category: 'network_tool',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'restricted',
      ipAddress: '192.168.30.50',
      endpoint: 'siem.security.enterprisenet.local:9200',
      service: 'http',
      sensitivity: 'high',
      description: 'Security Information & Event Management engine analyzing firewall syslogs, intrusion detection alerts, and audit streams.',
      permissions: {
        allowedDepartments: ['IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'SIEM Active Threat & Alert Feed',
        table: [
          { alertId: 'ALT-8821', severity: 'HIGH', ruleName: 'Port Scan Detected', srcIp: '192.168.40.89', status: 'Investigating' },
          { alertId: 'ALT-8822', severity: 'MEDIUM', ruleName: 'Failed SSH Login', srcIp: '192.168.10.4', status: 'Auto-Blocked' },
          { alertId: 'ALT-8823', severity: 'LOW', ruleName: 'Cert Expiring Soon', srcIp: '192.168.60.11', status: 'Open' }
        ]
      }
    },
    {
      id: 'res-net-vault',
      name: 'Enterprise Key Vault Engine',
      category: 'network_tool',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'top_secret',
      ipAddress: '192.168.30.100',
      endpoint: 'keyvault.it.internal:8200',
      service: 'http',
      sensitivity: 'critical',
      description: 'HashiCorp Vault secret storage engine for PKI certificates, database credentials, and symmetric encryption keys.',
      permissions: {
        allowedDepartments: ['IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'Key Vault Secret Mount Points',
        table: [
          { path: 'secret/data/db-credentials', engine: 'kv-v2', leaseDuration: '3600s', sealed: 'FALSE' },
          { path: 'pki/ca/root', engine: 'pki', leaseDuration: '8760h', sealed: 'FALSE' },
          { path: 'transit/keys/field-encryption', engine: 'transit', leaseDuration: 'N/A', sealed: 'FALSE' }
        ]
      }
    },
    {
      id: 'res-mgmt',
      name: 'Management Dashboard',
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'Management',
      accessLevel: 'confidential',
      ipAddress: '192.168.50.5',
      endpoint: 'exec-dash.management.enterprisenet.local',
      service: 'http',
      sensitivity: 'high',
      description: 'Executive KPI tracking, strategic goals, and board reports.',
      permissions: {
        allowedDepartments: ['Management', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
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
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'Sales',
      accessLevel: 'restricted',
      ipAddress: '192.168.40.12',
      endpoint: 'crm.sales.enterprisenet.local',
      service: 'http',
      sensitivity: 'medium',
      description: 'Customer pipeline, deal tracking, and lead contacts.',
      permissions: {
        allowedDepartments: ['Sales', 'Management', 'IT'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
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
      id: 'res-cloud-s3',
      name: 'Enterprise S3 Data Lake',
      category: 'cloud_infrastructure',
      status: 'ONLINE',
      ownerDepartment: 'Servers',
      accessLevel: 'restricted',
      ipAddress: '10.0.4.15',
      endpoint: 's3.data-lake.cloud.internal',
      service: 'http',
      sensitivity: 'high',
      description: 'Scalable object store housing analytical datasets, system backups, and media artifacts.',
      permissions: {
        allowedDepartments: ['Servers', 'IT', 'Finance', 'Management', 'Sales', 'HR'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'S3 Storage Bucket Metrics',
        table: [
          { bucketName: 'prod-analytics-dump-2026', objectCount: '4,520,100', storageClass: 'STANDARD', totalGb: '14,250 GB' },
          { bucketName: 'db-nightly-backups', objectCount: '365', storageClass: 'GLACIER_IR', totalGb: '3,800 GB' },
          { bucketName: 'public-assets-cdn', objectCount: '12,400', storageClass: 'INTELLIGENT_TIERING', totalGb: '420 GB' }
        ]
      }
    },
    {
      id: 'res-cloud-gateway',
      name: 'Cloud VPN & Edge Gateway',
      category: 'cloud_infrastructure',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'restricted',
      ipAddress: '203.0.113.15',
      endpoint: 'vpn-gateway.cloud.internal:1194',
      service: 'http',
      sensitivity: 'critical',
      description: 'Hybrid cloud IPsec VPN tunnel terminating multi-cloud workloads into internal VLAN subnets.',
      permissions: {
        allowedDepartments: ['IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'IPsec VPN Tunnel Status',
        table: [
          { tunnelId: 'tun-aws-us-east-1', status: 'UP / ESTABLISHED', throughput: '840 Mbps', latency: '12ms' },
          { tunnelId: 'tun-azure-eu-west', status: 'UP / ESTABLISHED', throughput: '320 Mbps', latency: '78ms' },
          { tunnelId: 'tun-gcp-asia-east', status: 'STANDBY', throughput: '0 Mbps', latency: '145ms' }
        ]
      }
    },
    {
      id: 'res-db-redis-cache',
      name: 'Global Redis Cache Cluster',
      category: 'database_instance',
      status: 'ONLINE',
      ownerDepartment: 'Servers',
      accessLevel: 'public',
      ipAddress: '192.168.60.40',
      endpoint: 'redis-master.internal:6379',
      service: 'http',
      sensitivity: 'low',
      description: 'High-performance in-memory key-value cache layer servicing session states and rate limiting counters.',
      permissions: {
        allowedDepartments: ['Servers', 'IT', 'Finance', 'Sales', 'HR', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'Redis Node Cluster Statistics',
        table: [
          { node: 'redis-node-01', role: 'MASTER', keysCount: '842,900', memoryUsed: '1.4 GB', hitRatio: '99.4%' },
          { node: 'redis-node-02', role: 'REPLICA', keysCount: '842,900', memoryUsed: '1.4 GB', hitRatio: '99.4%' }
        ]
      }
    },
    {
      id: 'res-web',
      name: 'Company Web Portal',
      category: 'internal_web_app',
      status: 'ONLINE',
      ownerDepartment: 'Servers',
      accessLevel: 'public',
      ipAddress: '192.168.60.11',
      endpoint: 'portal.enterprisenet.local',
      service: 'http',
      sensitivity: 'low',
      description: 'Internal employee intranet portal and announcement hub.',
      permissions: {
        allowedDepartments: ['Servers', 'IT', 'HR', 'Finance', 'Sales', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
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
      category: 'network_tool',
      status: 'ONLINE',
      ownerDepartment: 'Servers',
      accessLevel: 'public',
      ipAddress: '192.168.60.10',
      endpoint: 'dns.enterprisenet.local:53',
      service: 'dns',
      sensitivity: 'low',
      description: 'Internal domain name resolution lookup service.',
      permissions: {
        allowedDepartments: ['Servers', 'IT', 'HR', 'Finance', 'Sales', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
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
