import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { PortalType, TechRole, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';

function generateTemporaryPassword() {
  return `${Math.random().toString(36).slice(-6)}${Math.random().toString(36).slice(-6).toUpperCase()}`;
}

export class UserService {
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
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
        organizationId = euroasiannGroup._id.toString();
        logger.info(`Auto-assigning ${data.portalType} portal user to Euroasiann Group`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = new User({
      ...data,
      password: hashedPassword,
      organizationId: organizationId ? organizationId : undefined,
    });

    await user.save();

    // Return user without password
    const userDoc = user.toObject();
    delete userDoc.password;
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

    const users = await User.find(query).select('-password');
    return users;
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
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

    Object.assign(user, data);
    await user.save();

    const userDoc = user.toObject();
    delete userDoc.password;
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
        organizationId = euroasiannGroup._id.toString();
        logger.info(`Auto-assigning ${data.portalType} portal invited user to Euroasiann Group`);
      }
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user with temporary password
    const user = new User({
      ...data,
      password: hashedPassword,
      organizationId: organizationId ? organizationId : undefined,
    });

    await user.save();

    // Return user without password, but include temporary password
    const userDoc = user.toObject();
    delete userDoc.password;
    return { ...userDoc, temporaryPassword };
  }

  async resetUserTemporaryPassword(email: string, portalType: PortalType) {
    const user = await User.findOne({ email, portalType });
    if (!user) {
      throw new Error('User not found for invitation');
    }

    const temporaryPassword = generateTemporaryPassword();
    user.password = await bcrypt.hash(temporaryPassword, 10);
    await user.save();

    const userDoc = user.toObject();
    delete userDoc.password;
    return { user: userDoc, temporaryPassword };
  }
}

export const userService = new UserService();
