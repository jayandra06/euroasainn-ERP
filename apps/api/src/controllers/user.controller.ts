// src/controllers/user.controller.ts
import { Response } from "express";
import { userService } from "../services/user.service";
import { emailService } from "../services/email.service";
// import { Organization } from "../models/organization.model";
import { logger } from "../config/logger";
import { PortalType } from "../../../../packages/shared/src/types/index";
import { AuthRequest } from "../middleware/auth.middleware";

import XLSX from "xlsx";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Role } from "../models/role.model";
import { User as UserModel } from "../models/user.model";
import { UserProfile } from "../models/user-profile.model";
import { getCasbinEnforcer } from "../config/casbin";
import { redisService } from "../services/redis.service";

export class UserController {
  async createUser(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      const data = {
        ...req.body,
        organizationId: authUser.organizationId,
        createdBy: authUser.userId,
      };

      const user = await userService.createUser(data);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error("Create user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create user",
      });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;
      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      let portalType = req.query.portalType as PortalType;
      if (!portalType) {
        portalType = authUser.portalType;
      }

      const filters: any = {};

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === "true";
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      // Pagination support
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      filters.page = page;
      filters.limit = limit;
      filters.skip = skip;

      const result = await userService.getUsers(portalType, authUser.organizationId, filters);

      // If result is paginated (has users and total)
      if (result && typeof result === 'object' && 'users' in result && 'total' in result) {
        // Use filteredTotal for pagination if available, otherwise use total
        const paginationTotal = result.filteredTotal !== undefined ? result.filteredTotal : result.total;
        res.status(200).json({
          success: true,
          data: result.users,
          pagination: {
            page,
            limit,
            total: result.total, // Total all users (for stats)
            filteredTotal: result.filteredTotal !== undefined ? result.filteredTotal : result.total, // Filtered count (for pagination)
            totalPages: Math.ceil(paginationTotal / limit),
            activeCount: result.activeCount || 0,
            inactiveCount: result.inactiveCount || 0,
          },
        });
      } else {
        // Backward compatibility: if service returns array directly
        res.status(200).json({
          success: true,
          data: result,
        });
      }
    } catch (error: any) {
      logger.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get users",
      });
    }
  }

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;
      const { id } = req.params;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      const user = await userService.getUserById(id);

      // Security: Hide users from other organizations
      if (user.organizationId.toString() !== authUser.organizationId.toString()) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Fetch and populate profile with virtuals
      const profileDoc = await UserProfile.findOne({ userId: user._id })
        .populate({
          path: 'reportingTo',
          select: 'firstName lastName fullName email',
        })
        .populate({
          path: 'createdBy',
          select: 'firstName lastName fullName email',
        })
        .lean({ virtuals: true })
        .exec();

      // Safe profile with guaranteed fullName
      const profile = profileDoc ? {
        employeeId: profileDoc.employeeId,
        phone: profileDoc.phone,
        department: profileDoc.department,
        designation: profileDoc.designation,
        location: profileDoc.location,
        reportingTo: profileDoc.reportingTo ? {
          fullName: (profileDoc.reportingTo as any).fullName ||
            `${(profileDoc.reportingTo as any).firstName || ''} ${(profileDoc.reportingTo as any).lastName || ''}`.trim()
        } : null,
        createdBy: profileDoc.createdBy ? {
          fullName: (profileDoc.createdBy as any).fullName ||
            `${(profileDoc.createdBy as any).firstName || ''} ${(profileDoc.createdBy as any).lastName || ''}`.trim()
        } : null,
      } : null;

      logger.info('User profile fetched successfully', {
        userId: id,
        hasProfile: !!profileDoc,
        reportingTo: profile?.reportingTo?.fullName || 'none',
        createdBy: profile?.createdBy?.fullName || 'none',
      });

      res.status(200).json({
        success: true,
        data: {
          user: user.toObject({ virtuals: true }),
          profile,
        },
      });
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      logger.error("Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user profile",
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;
      const { id } = req.params;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      const existingUser = await userService.getUserById(id);
      if (existingUser.organizationId.toString() !== authUser.organizationId.toString()) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const data = {
        ...req.body,
        organizationId: authUser.organizationId,
      };

      const user = await userService.updateUser(id, data);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error("Update user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update user",
      });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;
      const { id } = req.params;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      const user = await userService.getUserById(id);
      if (user.organizationId.toString() !== authUser.organizationId.toString()) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      logger.error("Delete user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to delete user",
      });
    }
  }

  async inviteUser(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      const data = {
        ...req.body,
        organizationId: authUser.organizationId,
        createdBy: authUser.userId,
      };

      const result = await userService.inviteUser(data);

      const portalUrlMap: Record<string, string> = {
        [PortalType.ADMIN]: process.env.ADMIN_PORTAL_URL || "",
        [PortalType.TECH]: process.env.TECH_PORTAL_URL || "",
        [PortalType.CUSTOMER]: process.env.CUSTOMER_PORTAL_URL || "",
        [PortalType.VENDOR]: process.env.VENDOR_PORTAL_URL || "",
      };

      const portalUrl =
        portalUrlMap[data.portalType] ||
        process.env.FRONTEND_URL ||
        "http://localhost:4200";

      await emailService.sendUserInvitationEmail({
        to: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        portalType: data.portalType,
        portalLink: `${portalUrl}/login`,
        temporaryPassword: result.temporaryPassword,
      });

      delete (result as any).temporaryPassword;

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Invite user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to invite user",
      });
    }
  }

  async bulkUploadUsers(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: "Organization context missing",
        });
      }

      if (!req.file) {
        logger.warn('Bulk upload: No file uploaded');
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const filePath = req.file.path;
      logger.info('Bulk upload started', { 
        fileName: req.file.originalname, 
        fileSize: req.file.size,
        filePath,
        mimetype: req.file.mimetype
      });

      let workbook;
      try {
        workbook = XLSX.readFile(filePath);
      } catch (parseError: any) {
        logger.error('Bulk upload: Failed to parse file', { error: parseError.message });
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: `Failed to parse file: ${parseError.message}. Please ensure the file is a valid CSV or Excel file.`,
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        logger.warn('Bulk upload: No sheets found in file');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: "File contains no sheets. Please ensure the file has at least one sheet with data.",
        });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        logger.warn('Bulk upload: Sheet is empty or invalid');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: "The first sheet in the file is empty or invalid.",
        });
      }

      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
      logger.info('Bulk upload: File parsed', { rowCount: rows.length, sheetName });

      if (rows.length === 0) {
        logger.warn('Bulk upload: File is empty');
        return res.status(400).json({
          success: false,
          error: "Uploaded file is empty",
        });
      }

      const created: string[] = [];
      const updated: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      const getField = (row: any, names: string[]) => {
        for (const name of names) {
          if (row[name] !== undefined) return row[name];
          const match = Object.keys(row).find(
            k => k.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, '')
          );
          if (match !== undefined) return row[match];
        }
        return undefined;
      };

      for (const [index, row] of rows.entries()) {
        try {
          const email = getField(row, ['email', 'Email', 'Email Address', 'emailAddress', 'E-mail', 'User Email']);
          const firstName = getField(row, ['firstName', 'First Name', 'firstname', 'FirstName', 'first_name', 'Given Name']);
          const lastName = getField(row, ['lastName', 'Last Name', 'lastname', 'LastName', 'last_name', 'Surname']);
          const roleName = getField(row, ['roleName', 'Role', 'role', 'Role Name', 'role_name', 'User Role']);
          const portalTypeRaw = getField(row, ['portalType', 'Portal Type', 'portal', 'Portal', 'portal_type']) || 'customer';
          const isActiveRaw = getField(row, ['isActive', 'Active', 'is_active', 'Status', 'Enabled']);
          
          // Employee profile fields
          const employeeId = getField(row, ['employeeId', 'Employee ID', 'employee_id', 'EmployeeId', 'empId']);
          const phone = getField(row, ['phone', 'Phone', 'Phone Number', 'phoneNumber', 'mobile', 'Mobile']);
          const department = getField(row, ['department', 'Department', 'dept']);
          const designation = getField(row, ['designation', 'Designation', 'title', 'Title', 'position', 'Position']);
          const location = getField(row, ['location', 'Location', 'office', 'Office']);
          const reportingTo = getField(row, ['reportingTo', 'Reporting To', 'reporting_to', 'manager', 'Manager', 'supervisor', 'Supervisor']);

          if (!email || !firstName || !lastName || !roleName) {
            skipped.push(email || `Row ${index + 2}`);
            errors.push(`Row ${index + 2}: Missing required fields (email, firstName, lastName, roleName)`);
            continue;
          }

          const normalizedEmail = String(email).trim().toLowerCase();
          const normalizedFirstName = String(firstName).trim();
          const normalizedLastName = String(lastName).trim();
          const normalizedRoleName = String(roleName).trim();
          const normalizedPortalType = String(portalTypeRaw).trim().toLowerCase() as PortalType;

          const normalizedIsActive = isActiveRaw === undefined 
            ? true 
            : ['true', 'yes', '1', 'active', 'enabled', 'y', 't'].includes(String(isActiveRaw).toLowerCase().trim());

          const role = await Role.findOne({
            name: { $regex: new RegExp(`^${normalizedRoleName}$`, 'i') },
            portalType: normalizedPortalType as PortalType,
            organizationId: authUser.organizationId,
          });

          if (!role) {
            skipped.push(normalizedEmail);
            errors.push(`Row ${index + 2}: Role "${normalizedRoleName}" not found for portal "${normalizedPortalType}"`);
            continue;
          }

          // Check if user already exists
          const existingUser = await UserModel.findOne({
            email: normalizedEmail,
            portalType: role.portalType as PortalType,
            organizationId: authUser.organizationId,
          });

          // Resolve reporting manager if provided
          let reportingToId: mongoose.Types.ObjectId | undefined;
          if (reportingTo) {
            const reportingUser = await UserModel.findOne({
              $or: [
                { email: String(reportingTo).trim().toLowerCase() },
                { fullName: { $regex: new RegExp(`^${String(reportingTo).trim()}$`, 'i') } }
              ],
              organizationId: authUser.organizationId,
            }).select('_id').lean();
            if (reportingUser && reportingUser._id) {
              reportingToId = new mongoose.Types.ObjectId(reportingUser._id as string);
            }
          }

          // Prepare profile data
          const profileData: any = {};
          if (employeeId) profileData.employeeId = String(employeeId).trim().toUpperCase();
          if (phone) profileData.phone = String(phone).trim();
          if (department) profileData.department = String(department).trim();
          if (designation) profileData.designation = String(designation).trim();
          if (location) profileData.location = String(location).trim();
          if (reportingToId) profileData.reportingTo = reportingToId;

          if (existingUser) {
            // User exists - check if any changes needed
            const userChanges: any = {};
            const profileChanges: any = {};

            // Check user fields for changes
            if (existingUser.firstName !== normalizedFirstName) userChanges.firstName = normalizedFirstName;
            if (existingUser.lastName !== normalizedLastName) userChanges.lastName = normalizedLastName;
            const roleIdStr = (role._id as mongoose.Types.ObjectId).toString();
            if (existingUser.roleId?.toString() !== roleIdStr) {
              userChanges.roleId = role._id as mongoose.Types.ObjectId;
              userChanges.roleName = role.name as string;
              userChanges.role = role.key as string; // Use role.key, not role.name
            }
            if (existingUser.isActive !== normalizedIsActive) userChanges.isActive = normalizedIsActive;

            // Get existing profile
            const existingProfile = await UserProfile.findOne({ userId: existingUser._id });

            // Check profile fields for changes
            if (existingProfile) {
              if (employeeId !== undefined) {
                const newEmployeeId = String(employeeId).trim().toUpperCase();
                if (existingProfile.employeeId !== newEmployeeId) {
                  profileChanges.employeeId = newEmployeeId;
                }
              }
              if (phone !== undefined) {
                const newPhone = String(phone).trim();
                if (existingProfile.phone !== newPhone) {
                  profileChanges.phone = newPhone;
                }
              }
              if (department !== undefined) {
                const newDepartment = String(department).trim();
                if (existingProfile.department !== newDepartment) {
                  profileChanges.department = newDepartment;
                }
              }
              if (designation !== undefined) {
                const newDesignation = String(designation).trim();
                if (existingProfile.designation !== newDesignation) {
                  profileChanges.designation = newDesignation;
                }
              }
              if (location !== undefined) {
                const newLocation = String(location).trim();
                if (existingProfile.location !== newLocation) {
                  profileChanges.location = newLocation;
                }
              }
              if (reportingToId) {
                const existingReportingTo = existingProfile.reportingTo?.toString();
                if (existingReportingTo !== reportingToId.toString()) {
                  profileChanges.reportingTo = reportingToId;
                }
              } else if (reportingTo === null || reportingTo === '') {
                // Clear reportingTo if explicitly set to empty
                if (existingProfile.reportingTo) {
                  profileChanges.reportingTo = null;
                }
              }
            } else {
              // Profile doesn't exist, create it with all data
              profileChanges.userId = existingUser._id;
              profileChanges.createdBy = new mongoose.Types.ObjectId(authUser.userId);
              Object.assign(profileChanges, profileData);
            }

            // Update if there are changes
            if (Object.keys(userChanges).length > 0 || Object.keys(profileChanges).length > 0) {
              const roleChanged = userChanges.role !== undefined;
              const oldRoleKey = existingUser.role;

              if (Object.keys(userChanges).length > 0) {
                Object.assign(existingUser, userChanges);
                await existingUser.save();
              }

              // ============== UPDATE/CREATE CASBIN GROUPING POLICY ==============
              // Always ensure policy exists (create if missing, update if role changed)
              try {
                const enforcer = await getCasbinEnforcer();
                const userIdStr = (existingUser._id as mongoose.Types.ObjectId).toString();
                const orgIdStr = authUser.organizationId.toString();
                const roleKey = role.key as string;

                // Check if user already has a grouping policy
                const existingRoles = (await enforcer.getGroupingPolicy()).filter(
                  (r: string[]) => r[0] === userIdStr && r[2] === orgIdStr
                );

                if (roleChanged) {
                  // Role changed - remove old policies and add new one
                  if (existingRoles.length > 0) {
                    await enforcer.removeGroupingPolicies(existingRoles);
                    logger.info(`✅ Removed old Casbin grouping policies for user ${userIdStr}`);
                  }
                  await enforcer.addGroupingPolicy(userIdStr, roleKey, orgIdStr);
                  logger.info(`✅ Updated Casbin grouping policy g(${userIdStr}, ${roleKey}, ${orgIdStr})`);
                } else if (existingRoles.length === 0) {
                  // No policy exists - create one even if role didn't change
                  await enforcer.addGroupingPolicy(userIdStr, roleKey, orgIdStr);
                  logger.info(`✅ Created missing Casbin grouping policy g(${userIdStr}, ${roleKey}, ${orgIdStr})`);
                }
                // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
                // ✅ In-memory enforcer cache is automatically updated (no reset needed)
              } catch (error: any) {
                logger.error(`❌ Error updating/creating Casbin grouping policy for user ${existingUser._id}:`, error);
                // Don't fail user update if Casbin policy update fails
              }
              // ================================================

              if (Object.keys(profileChanges).length > 0) {
                await UserProfile.findOneAndUpdate(
                  { userId: existingUser._id },
                  { $set: profileChanges },
                  { upsert: true, new: true }
                );
              }

              // Clear Redis cache
              try {
                await redisService.deleteCache(`user:${existingUser._id}`);
                await redisService.deleteCache(`users:${authUser.organizationId}:all`);
                await redisService.deleteCache(`users:${authUser.organizationId}:${role.portalType}`);
              } catch (error) {
                logger.warn('Cache invalidation failed', { error });
              }

              updated.push(normalizedEmail);
              logger.info('Bulk upload: User updated', { email: normalizedEmail, userChanges, profileChanges, roleChanged });
            } else {
              // No changes - but check if Casbin policy exists, create if missing
              try {
                const enforcer = await getCasbinEnforcer();
                const userIdStr = (existingUser._id as mongoose.Types.ObjectId).toString();
                const orgIdStr = authUser.organizationId.toString();
                const roleKey = role.key as string;

                // Check if user already has a grouping policy
                const existingRoles = (await enforcer.getGroupingPolicy()).filter(
                  (r: string[]) => r[0] === userIdStr && r[2] === orgIdStr
                );

                if (existingRoles.length === 0) {
                  // No policy exists - create one
                  await enforcer.addGroupingPolicy(userIdStr, roleKey, orgIdStr);
                  logger.info(`✅ Created missing Casbin grouping policy for skipped user g(${userIdStr}, ${roleKey}, ${orgIdStr})`);
                }
              } catch (error: any) {
                logger.error(`❌ Error checking/creating Casbin grouping policy for skipped user ${existingUser._id}:`, error);
              }

              skipped.push(normalizedEmail);
              logger.info('Bulk upload: User skipped (no changes)', { email: normalizedEmail });
            }
          } else {
            // User doesn't exist - create new
            const tempPassword = crypto.randomBytes(8).toString('hex');

            const userData = {
              email: normalizedEmail,
              firstName: normalizedFirstName,
              lastName: normalizedLastName,
              portalType: role.portalType as PortalType,
              roleId: role._id,
              roleName: role.name,
              role: role.key, // Use role.key, not role.name
              isActive: normalizedIsActive,
              organizationId: authUser.organizationId,
              password: await bcrypt.hash(tempPassword, 10),
            };

            const newUser = new UserModel(userData);
            await newUser.save();

            // ============== CREATE CASBIN GROUPING POLICY (g policy) ==============
            try {
              const enforcer = await getCasbinEnforcer();
              const userIdStr = (newUser._id as mongoose.Types.ObjectId).toString();
              const orgIdStr = authUser.organizationId.toString();
              const roleKey = role.key as string;

              // Create g(userId, role.key, organizationId) policy
              await enforcer.addGroupingPolicy(userIdStr, roleKey, orgIdStr);
              // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
              // ✅ In-memory enforcer cache is automatically updated (no reset needed)

              logger.info(`✅ Created Casbin grouping policy g(${userIdStr}, ${roleKey}, ${orgIdStr})`);
            } catch (error: any) {
              logger.error(`❌ Error creating Casbin grouping policy for user ${(newUser._id as mongoose.Types.ObjectId).toString()}:`, error);
              // Don't fail user creation if Casbin policy creation fails
            }
            // ================================================

            // Create UserProfile with all fields including createdBy
            const newProfileData: any = {
              userId: newUser._id,
              createdBy: new mongoose.Types.ObjectId(authUser.userId),
            };
            
            Object.assign(newProfileData, profileData);

            await UserProfile.findOneAndUpdate(
              { userId: newUser._id },
              { $set: newProfileData },
              { upsert: true, new: true }
            );

            // Clear Redis cache
            try {
              await redisService.deleteCache(`users:${authUser.organizationId}:all`);
              await redisService.deleteCache(`users:${authUser.organizationId}:${role.portalType}`);
              await redisService.deleteCache(`user:${newUser._id}`);
            } catch (error) {
              logger.warn('Cache invalidation failed', { error });
            }

            created.push(normalizedEmail);
            logger.info('Bulk upload: User created', { email: normalizedEmail });
          }
        } catch (rowError: any) {
          const email = getField(row, ['email']) || `Row ${index + 2}`;
          skipped.push(email);
          errors.push(`Row ${index + 2}: ${rowError.message}`);
        }
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      logger.info('Bulk upload completed', {
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        errors: errors.length,
      });

      return res.status(200).json({
        success: true,
        message: "Bulk upload completed",
        data: {
          created: created.length,
          updated: updated.length,
          skipped: skipped.length,
          details: {
            created,
            updated,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
          },
        },
      });
    } catch (error: any) {
      logger.error("Bulk upload error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Bulk upload failed",
      });
    }
  }
}

export const userController = new UserController();