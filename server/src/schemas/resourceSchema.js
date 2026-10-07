import { z } from 'zod';

export const ResourcePermissionsSchema = z.object({
  allowedDepartments: z.array(z.string()).default(['*']),
  readRoles: z.array(z.string()).default(['ADMIN', 'MEMBER']),
  writeRoles: z.array(z.string()).default(['ADMIN']),
  policyMatrixRequired: z.boolean().default(true)
});

export const CreateResourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Resource name must be at least 2 characters'),
  category: z.enum(['cloud_infrastructure', 'database_instance', 'internal_web_app', 'network_tool']),
  status: z.enum(['ONLINE', 'MAINTENANCE', 'DEGRADED', 'STANDBY']).default('ONLINE'),
  ownerDepartment: z.string().min(1, 'Owner department is required'),
  accessLevel: z.enum(['public', 'restricted', 'confidential', 'top_secret']).default('restricted'),
  ipAddress: z.string().optional(),
  endpoint: z.string().optional(),
  service: z.enum(['http', 'dns', 'icmp']).default('http'),
  sensitivity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  description: z.string().default(''),
  permissions: ResourcePermissionsSchema.optional(),
  content: z.object({
    title: z.string().optional(),
    table: z.array(z.record(z.any())).default([])
  }).default({})
});

export const UpdateResourceSchema = CreateResourceSchema.partial();
