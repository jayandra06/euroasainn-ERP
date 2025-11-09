import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { PortalType, OrganizationType } from '@euroasiann/shared';
import { logger } from '../config/logger';
import { Role } from '../models/role.model';

export class UserService {
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
    roleId?: string;
    organizationId?: string;
  }) {
    // Check if user exists
    const existing = await User.findOne({ email: data.email, portalType: data.portalType });
    if (existing) {
      throw new Error('User already exists');
    }

    // If no organizationId provided, assign tech/admin portal users to Euroasiann Group
    let organizationId = data.organizationId;
    if (!organizationId && (data.portalType === PortalType.TECH || data.portalType === PortalType.ADMIN)) {
      const euroasiannGroup = await Organization.findOne({ 
        name: 'Euroasiann Group',
        type: OrganizationType.ADMIN 
      });
      if (euroasiannGroup) {
        organizationId = euroasiannGroup.id;
        logger.info(`Auto-assigning ${data.portalType} portal user to Euroasiann Group`);
      }
    }

    let resolvedRoleKey = data.role?.trim();
    let resolvedRoleId = data.roleId;

    if (resolvedRoleId) {
      const role = await Role.findById(resolvedRoleId);
      if (!role) {
        throw new Error('Role not found');
      }
      resolvedRoleKey = role.key;
      resolvedRoleId = role.id;
    } else if (resolvedRoleKey) {
      const role = await Role.findOne({ key: resolvedRoleKey.toLowerCase() });
      if (role) {
        resolvedRoleKey = role.key;
        resolvedRoleId = role.id;
      }
    }

    if (!resolvedRoleKey) {
      throw new Error('Role is required');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = new User({
      ...data,
      password: hashedPassword,
      organizationId: organizationId ? organizationId : undefined,
      role: resolvedRoleKey,
      roleId: resolvedRoleId ? new Types.ObjectId(resolvedRoleId) : undefined,
    });

    await user.save();
    await user.populate('roleId');

    // Return user without password
    const userDoc = user.toObject() as any;
    delete userDoc.password;
    if (userDoc.roleId && typeof userDoc.roleId === 'object' && 'name' in userDoc.roleId) {
      userDoc.roleName = userDoc.roleId.name;
    }
    return userDoc;
  }

  async getUsers(portalType?: PortalType, organizationId?: string, filters?: any) {
    const query: any = {};

    if (portalType) {
      query.portalType = portalType;
    }

    if (organizationId) {
      query.organizationId = organizationId;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('roleId')
      .lean<
        Array<
          IUser & {
            roleId?: {
              _id?: Types.ObjectId;
              name?: string;
              key?: string;
            } | null;
          }
        >
      >();

    return users.map((userDoc) => {
      const roleName =
        userDoc.roleId && typeof userDoc.roleId === 'object' && 'name' in userDoc.roleId
          ? (userDoc.roleId as any).name
          : undefined;
      return {
        ...userDoc,
        roleName,
      };
    });
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password').populate('roleId');
    if (!user) {
      throw new Error('User not found');
    }
    const userDoc = user.toObject() as any;
    if (userDoc.roleId && typeof userDoc.roleId === 'object' && 'name' in userDoc.roleId) {
      userDoc.roleName = userDoc.roleId.name;
    }
    return userDoc;
  }

  async updateUser(userId: string, data: Partial<IUser>) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow password update through this method
    if (data.password) {
      delete data.password;
    }

    const updates: Partial<IUser> & { role?: string; roleId?: string } = {
      ...(data as Partial<IUser> & { role?: string; roleId?: string }),
    };

    let resolvedRoleKey: string | undefined;
    let resolvedRoleId: string | undefined;

    const hasRoleId = updates.roleId !== undefined && updates.roleId !== null && updates.roleId !== '';
    const hasRoleKey = typeof updates.role === 'string' && updates.role.trim().length > 0;

    if (hasRoleId) {
      const role = await Role.findById(updates.roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      resolvedRoleKey = role.key;
      resolvedRoleId = role.id;
    } else if (hasRoleKey) {
      const requestedRole = updates.role!.trim().toLowerCase();
      const role = await Role.findOne({ key: requestedRole });
      if (role) {
        resolvedRoleKey = role.key;
        resolvedRoleId = role.id;
      } else {
        resolvedRoleKey = requestedRole;
        resolvedRoleId = undefined;
      }
    }

    if (resolvedRoleKey) {
      user.role = resolvedRoleKey;
      user.roleId = resolvedRoleId ? new Types.ObjectId(resolvedRoleId) : undefined;
    }

    if ('role' in updates) {
      delete updates.role;
    }
    if ('roleId' in updates) {
      delete updates.roleId;
    }

    Object.assign(user, updates);
    await user.save();
    await user.populate('roleId');

    const userDoc = user.toObject() as any;
    delete userDoc.password;
    if (userDoc.roleId && typeof userDoc.roleId === 'object' && 'name' in userDoc.roleId) {
      userDoc.roleName = userDoc.roleId.name;
    }
    return userDoc;
  }

  async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { success: true };
  }

  async inviteUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
    roleId?: string;
    organizationId?: string;
  }) {
    // Check if user exists
    const existing = await User.findOne({ email: data.email, portalType: data.portalType });
    if (existing) {
      throw new Error('User already exists');
    }

    // If no organizationId provided, assign tech/admin portal users to Euroasiann Group
    let organizationId = data.organizationId;
    if (!organizationId && (data.portalType === PortalType.TECH || data.portalType === PortalType.ADMIN)) {
      const euroasiannGroup = await Organization.findOne({ 
        name: 'Euroasiann Group',
        type: OrganizationType.ADMIN 
      });
      if (euroasiannGroup) {
        organizationId = euroasiannGroup.id;
        logger.info(`Auto-assigning ${data.portalType} portal invited user to Euroasiann Group`);
      }
    }

    let resolvedRoleKey = data.role?.trim();
    let resolvedRoleId = data.roleId;

    if (resolvedRoleId) {
      const role = await Role.findById(resolvedRoleId);
      if (!role) {
        throw new Error('Role not found');
      }
      resolvedRoleKey = role.key;
      resolvedRoleId = role.id;
    } else if (resolvedRoleKey) {
      const role = await Role.findOne({ key: resolvedRoleKey.toLowerCase() });
      if (role) {
        resolvedRoleKey = role.key;
        resolvedRoleId = role.id;
      }
    }

    if (!resolvedRoleKey) {
      throw new Error('Role is required');
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user with temporary password
    const user = new User({
      ...data,
      password: hashedPassword,
      organizationId: organizationId ? organizationId : undefined,
      role: resolvedRoleKey,
      roleId: resolvedRoleId ? new Types.ObjectId(resolvedRoleId) : undefined,
    });

    await user.save();
    await user.populate('roleId');

    // Return user without password, but include temporary password
    const userDoc = user.toObject() as any;
    delete userDoc.password;
    if (userDoc.roleId && typeof userDoc.roleId === 'object' && 'name' in userDoc.roleId) {
      userDoc.roleName = userDoc.roleId.name;
    }
    return { ...userDoc, temporaryPassword };
  }
}

export const userService = new UserService();
