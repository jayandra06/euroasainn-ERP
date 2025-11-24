import { Role, IRole } from '../models/role.model';
import { PortalType } from '@euroasiann/shared';
import { logger } from '../config/logger';

const generateRoleKey = (name: string, portalType: PortalType) => {
  const base = `${portalType}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return base || `${portalType}_role`;
};

class RoleService {
  async listRoles(filter: { portalType?: PortalType } = {}) {
    const query: Record<string, any> = {};
    if (filter.portalType && Object.values(PortalType).includes(filter.portalType)) {
      query.portalType = filter.portalType;
    }

    return Role.find(query).sort({ isSystem: -1, name: 1 });
  }

  async getRoleById(roleId: string) {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async getRoleByKey(roleKey: string) {
    const role = await Role.findOne({ key: roleKey.toLowerCase() });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async createRole(data: {
    name: string;
    portalType: PortalType;
    permissions?: string[];
    description?: string;
  }): Promise<IRole> {
    const permissions = data.permissions?.map((permission) => permission.trim()).filter(Boolean) ?? [];
    const name = data.name.trim();

    if (!name) {
      throw new Error('Role name is required');
    }

    const normalizedPortal = (data.portalType || '').toLowerCase() as PortalType;
    if (!Object.values(PortalType).includes(normalizedPortal)) {
      throw new Error('Invalid portal type');
    }

    const existingByName = await Role.findOne({ name: name, portalType: normalizedPortal });
    if (existingByName) {
      throw new Error('Role with this name already exists');
    }

    const keyBase = generateRoleKey(name, normalizedPortal);
    let key = keyBase;
    let counter = 1;

    while (await Role.exists({ key })) {
      key = `${keyBase}_${counter}`;
      counter += 1;
    }

    const role = new Role({
      name,
      key,
      portalType: normalizedPortal,
      permissions,
      description: data.description?.trim() || undefined,
      isSystem: false,
    });

    await role.save();
    logger.info(`Created role ${role.name} (${role.key}) for portal ${role.portalType}`);
    return role;
  }

  async updateRole(roleId: string, data: Partial<Pick<IRole, 'name' | 'permissions' | 'description'>>) {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (data.name) {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new Error('Role name cannot be empty');
      }
      const existingByName = await Role.findOne({
        _id: { $ne: roleId },
        name: trimmedName,
        portalType: role.portalType,
      });
      if (existingByName) {
        throw new Error('Role with this name already exists');
      }
      role.name = trimmedName;
    }

    if (data.permissions) {
      role.permissions = data.permissions.map((permission) => permission.trim()).filter(Boolean);
    }

    if (data.description !== undefined) {
      role.description = data.description?.trim() || undefined;
    }

    await role.save();
    return role;
  }
}

export const roleService = new RoleService();

