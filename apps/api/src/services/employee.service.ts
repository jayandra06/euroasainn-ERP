import { Employee, IEmployee, IPayrollDetails } from '../models/employee.model';
import { EmployeeOnboarding } from '../models/employee-onboarding.model';
import { licenseService } from './license.service';
import { userService } from './user.service';
import { emailService } from './email.service';
import { invitationService } from './invitation.service';
import { Organization } from '../models/organization.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';
import mongoose from 'mongoose';
import { getCasbinEnforcer } from '../config/casbin';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';

// Helper function to calculate payroll totals
function calculatePayrollTotals(payroll: Partial<IPayrollDetails>): { grossSalary: number; netSalary: number } {
  // Calculate Gross Salary (sum of all credits)
  const grossSalary = 
    (payroll.base || 0) +
    (payroll.hra || 0) +
    (payroll.ta || 0) +
    (payroll.da || 0) +
    (payroll.sa || 0) +
    (payroll.incentives || 0) +
    (payroll.miscAddons || 0);

  // Calculate Total Deductions (sum of all debits)
  const totalDeductions = 
    (payroll.pf || 0) +
    (payroll.tds || 0) +
    (payroll.insurance || 0) +
    (payroll.salaryAdvance || 0);

  // Calculate Net Salary
  const netSalary = grossSalary - totalDeductions;

    return { grossSalary, netSalary };
}


export class EmployeeService {
  async createEmployee(organizationId: string, data: Partial<IEmployee>) {
    // License validation removed - create employee without license checks
    const employee = new Employee({
      ...data,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType,
    });

    await employee.save();
    
    // Try to increment usage if license exists, but don't fail if it doesn't
    try {
      await licenseService.incrementUsage(organizationId, 'employees');
    } catch (usageError: any) {
      // Log but don't fail employee creation if usage increment fails
      console.warn('Failed to increment employee usage (license may not exist):', usageError.message);
    }
    
    return employee;
  }

  async getEmployees(organizationId: string, portalType: PortalType, filters?: any) {
    // Strictly filter by organizationId AND portalType to prevent cross-organization/portal access
    const query: any = { 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType: portalType,
    };
    if (filters?.businessUnitId) {
      query.businessUnitId = filters.businessUnitId;
    }
    return await Employee.find(query);
  }

  async getEmployeesWithOnboardingStatus(organizationId: string, filters?: { status?: string }) {
    try {
      const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
      
      // Get all employees
      const employees = await Employee.find(query).sort({ createdAt: -1 });

      // Get all onboardings for this organization
      const onboardingQuery: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
      
      // Build onboarding query - if status filter is provided, include it
      if (filters?.status && filters.status !== 'all') {
        onboardingQuery.status = filters.status;
      }

      // Fetch onboardings with populate (Mongoose handles null references gracefully)
      const onboardings = await EmployeeOnboarding.find(onboardingQuery)
        .populate('approvedBy', 'firstName lastName email')
        .populate('rejectedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      // Create a map of email -> onboarding for quick lookup
      // Normalize emails to lowercase for matching
      const onboardingMap = new Map();
      onboardings.forEach((onboarding: any) => {
        if (onboarding?.email) {
          const normalizedEmail = onboarding.email.toLowerCase().trim();
          onboardingMap.set(normalizedEmail, onboarding);
        }
      });

      // Combine employees with their onboarding status
      const employeesWithStatus = employees.map((employee) => {
        // Safely get and normalize email
        const employeeEmail = employee.email;
        const normalizedEmployeeEmail = employeeEmail ? employeeEmail.toLowerCase().trim() : '';
        const onboarding = normalizedEmployeeEmail ? onboardingMap.get(normalizedEmployeeEmail) : null;
        
        return {
          ...employee.toObject(),
          onboardingStatus: onboarding?.status || null,
          onboarding: onboarding || null,
        };
      });

      // If status filter is provided, filter employees by their onboarding status
      if (filters?.status && filters.status !== 'all') {
        const filtered = employeesWithStatus.filter((emp) => emp.onboardingStatus === filters.status);
        logger.info(`Filtered employees by status "${filters.status}": ${filtered.length} found out of ${employeesWithStatus.length} total`);
        return filtered;
      }

      logger.info(`Returning ${employeesWithStatus.length} employees with onboarding status`);
      return employeesWithStatus;
    } catch (error: any) {
      logger.error('Error in getEmployeesWithOnboardingStatus:', error);
      throw error;
    }
  }

  async getEmployeeById(employeeId: string, organizationId: string, portalType: PortalType) {
    // Strictly filter by organizationId AND portalType to prevent cross-organization/portal access
    const employee = await Employee.findOne({ 
      _id: employeeId, 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType: portalType,
    });
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  async updateEmployee(employeeId: string, organizationId: string, portalType: PortalType, data: Partial<IEmployee>) {
    // Strictly filter by organizationId AND portalType to prevent cross-organization/portal access
    const employee = await Employee.findOne({ 
      _id: employeeId, 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType: portalType,
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Track if role is being updated for Casbin policy management
    const roleChanged = data.role && data.role !== employee.role;
    const oldRole = employee.role;

    // Handle metadata merging
    if (data.metadata && typeof data.metadata === 'object') {
      employee.metadata = { ...employee.metadata, ...data.metadata };
      delete (data as any).metadata;
    }

    // Handle payroll details
    if (data.payrollDetails && typeof data.payrollDetails === 'object') {
      const { grossSalary, netSalary } = calculatePayrollTotals(data.payrollDetails);
      employee.payrollDetails = {
        ...(employee.payrollDetails || {}),
        ...data.payrollDetails,
        grossSalary,
        netSalary,
      };
      delete (data as any).payrollDetails;
    }

    // Handle businessUnitId - convert to ObjectId or set to undefined
    if (data.businessUnitId !== undefined) {
      if (data.businessUnitId && data.businessUnitId !== 'unassigned') {
        employee.businessUnitId = new mongoose.Types.ObjectId(data.businessUnitId as any);
      } else {
        employee.businessUnitId = undefined;
      }
      delete (data as any).businessUnitId;
    }

    // Normalize email if provided
    if (data.email) {
      data.email = (data.email as string).toLowerCase().trim();
    }

    Object.assign(employee, data);
    await employee.save();

    // Update Casbin policies if role changed and user exists
    if (roleChanged && data.role) {
      try {
        const user = await User.findOne({
          email: employee.email,
          organizationId: new mongoose.Types.ObjectId(organizationId),
        });

        if (user) {
          const enforcer = await getCasbinEnforcer();
          const userIdStr = user._id.toString();
          const orgIdStr = organizationId;

          // Remove old role grouping policy
          if (oldRole) {
            const oldPolicies = (await enforcer.getGroupingPolicy()).filter(
              (p: string[]) => p[0] === userIdStr && p[1] === oldRole && p[2] === orgIdStr
            );
            if (oldPolicies.length > 0) {
              await enforcer.removeGroupingPolicies(oldPolicies);
            }
          }

          // Add new role grouping policy - data.role is the role key (string)
          const newRole = await Role.findOne({
            key: data.role,
            organizationId: new mongoose.Types.ObjectId(organizationId),
          }).lean();

          if (newRole) {
            await enforcer.addGroupingPolicy(userIdStr, newRole.key, orgIdStr);
            // Update user's role fields
            user.role = newRole.key;
            user.roleName = newRole.name;
            user.roleId = newRole._id;
            await user.save();
            logger.info(`✅ Updated Casbin grouping policy for employee ${employeeId}: ${oldRole} → ${newRole.key}`);
          } else {
            logger.warn(`⚠️ Role not found for key: ${data.role}, organization: ${organizationId}. Casbin policy not updated.`);
          }
        }
      } catch (error: any) {
        logger.error(`❌ Error updating Casbin policies for employee ${employeeId}:`, error);
        // Don't fail employee update if Casbin update fails
      }
    }

    return employee;
  }

  async deleteEmployee(employeeId: string, organizationId: string, portalType: PortalType) {
    // Strictly filter by organizationId AND portalType to prevent cross-organization/portal access
    const employee = await Employee.findOne({ 
      _id: employeeId, 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType: portalType,
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Find and delete associated user and Casbin policies
    try {
      const user = await User.findOne({
        email: employee.email,
        organizationId: new mongoose.Types.ObjectId(organizationId),
      });

      if (user) {
        const enforcer = await getCasbinEnforcer();
        const userIdStr = user._id.toString();
        const orgIdStr = organizationId;

        // Remove all grouping policies for this user in this organization
        const userPolicies = (await enforcer.getGroupingPolicy()).filter(
          (p: string[]) => p[0] === userIdStr && p[2] === orgIdStr
        );
        if (userPolicies.length > 0) {
          await enforcer.removeGroupingPolicies(userPolicies);
          logger.info(`✅ Removed ${userPolicies.length} Casbin grouping policies for user ${userIdStr}`);
        }

        // Delete the user account
        await User.findByIdAndDelete(user._id);
        logger.info(`✅ Deleted user account for employee ${employeeId}`);
      }
    } catch (error: any) {
      logger.error(`❌ Error deleting user/Casbin policies for employee ${employeeId}:`, error);
      // Continue with employee deletion even if user deletion fails
    }

    // Delete the employee
    await Employee.findByIdAndDelete(employeeId);
    // await licenseService.decrementUsage(organizationId, 'employees'); // SKIPPED FOR NOW

    return { success: true };
  }

  async inviteEmployee(organizationId: string, portalType: PortalType, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: string;
    employeeType?: string;
    accessLevel?: string;
    businessUnitId?: string;
    payrollDetails?: Partial<IPayrollDetails>;
  }) {
    // License validation removed - invite employee without license checks
    // Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if employee with this email already exists in this organization
    const existingEmployee = await Employee.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      email: normalizedEmail,
    }).lean();

    if (existingEmployee) {
      throw new Error('Employee with this email already exists');
    }

    // Get organization name for email
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Prepare employee data
    const employeeData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: normalizedEmail,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      portalType: portalType,
    };

    if (data.phone) {
      employeeData.phone = data.phone;
    }

    if (data.businessUnitId && data.businessUnitId !== 'unassigned') {
      employeeData.businessUnitId = new mongoose.Types.ObjectId(data.businessUnitId);
    }

    // Add role if provided
    if (data.role) {
      employeeData.role = data.role;
    }

    // Add metadata for employeeType and accessLevel
    if (data.employeeType || data.accessLevel) {
      employeeData.metadata = {};
      if (data.employeeType) {
        employeeData.metadata.employeeType = data.employeeType;
      }
      if (data.accessLevel) {
        employeeData.metadata.accessLevel = data.accessLevel;
      }
    }

    // Handle payroll details
    if (data.payrollDetails) {
      const { grossSalary, netSalary } = calculatePayrollTotals(data.payrollDetails);
      employeeData.payrollDetails = {
        ...data.payrollDetails,
        grossSalary,
        netSalary,
      };
    }

    // Create employee record (without user account yet)
    const employee = new Employee(employeeData);
    await employee.save();
    // await licenseService.incrementUsage(organizationId, 'employees'); // SKIPPED FOR NOW

    // Create invitation token for employee onboarding
    let invitationLink: string | undefined;
    let emailSent = false;

    try {
      // Determine organization type and default role based on portal type
      const organizationType = portalType === PortalType.VENDOR 
        ? OrganizationType.VENDOR 
        : OrganizationType.CUSTOMER;
      
      // Determine role for invitation (use provided role or default based on portal)
      const defaultRole = portalType === PortalType.VENDOR ? 'vendor_user' : 'customer_user';
      const roleForInvitation = data.role || defaultRole;

      // Create invitation token
      const invitationResult = await invitationService.createInvitationToken({
        email: normalizedEmail,
        organizationId: organizationId,
        organizationType: organizationType,
        portalType: portalType,
        role: roleForInvitation,
        organizationName: organization.name,
      });

      invitationLink = invitationResult.invitationLink;

      // Build employee onboarding link based on portal type
      let portalUrl: string;
      if (portalType === PortalType.VENDOR) {
        portalUrl = process.env.VENDOR_PORTAL_URL || 'http://localhost:4400';
      } else {
        portalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
      }
      const onboardingLink = `${portalUrl}/onboarding/employee?token=${invitationResult.token}`;

      // Send invitation email with onboarding link (NO credentials)
      await emailService.sendEmployeeInvitationEmail({
        to: normalizedEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: organization.name,
        onboardingLink: onboardingLink,
      });

      emailSent = true;
      logger.info(`✅ Employee invitation email sent to ${normalizedEmail} with onboarding link`);
    } catch (emailError: any) {
      logger.error(`Failed to send employee invitation email: ${emailError.message}`);
      // Don't fail the invitation if email fails - employee is still created
    }

    return {
      employee,
      emailSent,
      invitationLink,
    };
  }

  async completeEmployeeOnboarding(token: string, password: string, portalType?: PortalType) {
    // Import InvitationToken model
    const { InvitationToken } = await import('../models/invitation-token.model');
    
    // Verify invitation token - if portalType is provided, filter by it
    const invitationQuery: any = {
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    };
    if (portalType) {
      invitationQuery.portalType = portalType;
    } else {
      // Default to CUSTOMER for backward compatibility
      invitationQuery.portalType = PortalType.CUSTOMER;
    }
    
    const invitation = await InvitationToken.findOne(invitationQuery);

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if employee already exists
    const employeePortalType = invitation.portalType || PortalType.CUSTOMER;
    const existingEmployee = await Employee.findOne({
      email: invitation.email,
      organizationId: new mongoose.Types.ObjectId(invitation.organizationId!),
      portalType: employeePortalType,
    });

    if (!existingEmployee) {
      throw new Error('Employee not found for this invitation');
    }

    // Check if user already exists
    const { User } = await import('../models/user.model');
    const userPortalType = portalType || invitation.portalType || PortalType.CUSTOMER;
    const existingUser = await User.findOne({
      email: invitation.email,
      portalType: userPortalType,
      organizationId: invitation.organizationId,
    });

    let user: any;
    let temporaryPassword: string;

    if (existingUser) {
      // User exists, update password
      const bcrypt = await import('bcryptjs');
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
      user = existingUser;
      temporaryPassword = password;
    } else {
      // Create new user account with the password provided by user during onboarding
      const userResult = await userService.createUser({
        email: invitation.email,
        password: password, // Use password provided by user during onboarding
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
        portalType: userPortalType,
        role: invitation.role || (userPortalType === PortalType.VENDOR ? 'vendor_user' : 'customer_user'),
        organizationId: invitation.organizationId?.toString(),
      });
      user = userResult;
      temporaryPassword = password;
    }

    // Mark invitation as used
    invitation.used = true;
    invitation.status = 'used';
    await invitation.save();

    // Send welcome email with credentials
    try {
      const portalUrl = userPortalType === PortalType.VENDOR 
        ? (process.env.VENDOR_PORTAL_URL || 'http://localhost:4400')
        : (process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300');
      const orgType = userPortalType === PortalType.VENDOR ? 'vendor' : 'customer';
      await emailService.sendWelcomeEmail({
        to: invitation.email,
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
        portalLink: `${portalUrl}/login`,
        temporaryPassword,
        organizationType: orgType,
      });
      logger.info(`✅ Welcome email with credentials sent to ${invitation.email} after onboarding`);
    } catch (emailError: any) {
      logger.error(`Failed to send welcome email: ${emailError.message}`);
      // Don't fail onboarding if email fails
    }

    return {
      success: true,
      user,
      employee: existingEmployee,
      message: 'Employee onboarding completed successfully. Login credentials have been sent to your email.',
    };
  }

  async submitEmployeeOnboardingForm(token: string, data: {
    fullName: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;
    addressLine1?: string;
    addressLine2?: string;
    accountNumber: string;
    ifscOrSwift: string;
    bankName: string;
    passport?: string;
    nationalId?: string;
    drivingLicense?: string;
    pan?: string;
    ssn?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    nomineePhone?: string;
  }) {
    // Import InvitationToken model
    const { InvitationToken } = await import('../models/invitation-token.model');
    
    // Verify invitation token - accept both customer and vendor portals
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
      $or: [
        { portalType: PortalType.CUSTOMER },
        { portalType: PortalType.VENDOR }
      ],
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if onboarding already exists for this token
    const existingOnboarding = await EmployeeOnboarding.findOne({ invitationToken: token });
    if (existingOnboarding) {
      throw new Error('Onboarding already submitted for this invitation');
    }

    // Check if employee exists - strictly filter by organizationId and portalType
    const employeePortalType = invitation.portalType || PortalType.CUSTOMER;
    const existingEmployee = await Employee.findOne({
      email: invitation.email,
      organizationId: new mongoose.Types.ObjectId(invitation.organizationId!),
      portalType: employeePortalType,
    });

    // Create employee onboarding record with SUBMITTED status
    const employeeOnboarding = new EmployeeOnboarding({
      employeeId: existingEmployee?._id,
      invitationToken: token,
      organizationId: invitation.organizationId!,
      email: invitation.email,
      fullName: data.fullName,
      phone: data.phone,
      country: data.country,
      state: data.state,
      city: data.city,
      zipCode: data.zipCode,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      accountNumber: data.accountNumber,
      ifscOrSwift: data.ifscOrSwift,
      bankName: data.bankName,
      passport: data.passport,
      nationalId: data.nationalId,
      drivingLicense: data.drivingLicense,
      pan: data.pan,
      ssn: data.ssn,
      nomineeName: data.nomineeName,
      nomineeRelation: data.nomineeRelation,
      nomineePhone: data.nomineePhone,
      status: 'submitted', // Default status is SUBMITTED
      submittedAt: new Date(),
    });

    await employeeOnboarding.save();

    logger.info(`✅ Employee onboarding form submitted with SUBMITTED status for ${invitation.email}`);

    return {
      success: true,
      onboarding: employeeOnboarding,
      message: 'Employee onboarding form submitted successfully. Your information is under review.',
    };
  }

  async getEmployeeOnboardingByToken(token: string) {
    // Import InvitationToken model
    const { InvitationToken } = await import('../models/invitation-token.model');
    
    // Verify invitation token - accept both customer and vendor portals
    const invitation = await InvitationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      $or: [
        { portalType: PortalType.CUSTOMER },
        { portalType: PortalType.VENDOR }
      ],
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Find employee by email, organizationId, and portalType to get fullName and phone
    // Strictly filter by organizationId AND portalType to prevent cross-organization/portal access
    let employee = null;
    if (invitation.organizationId) {
      const employeePortalType = invitation.portalType || PortalType.CUSTOMER;
      employee = await Employee.findOne({
        email: invitation.email,
        organizationId: new mongoose.Types.ObjectId(invitation.organizationId),
        portalType: employeePortalType,
      });
    }

    // Check if onboarding exists
    const onboarding = await EmployeeOnboarding.findOne({ invitationToken: token });

    // Build fullName from employee firstName and lastName
    let fullName = '';
    if (employee) {
      fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    }

    return {
      invitation: {
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        fullName: fullName || null,
        phone: employee?.phone || null,
      },
      onboarding: onboarding || null,
    };
  }

  async getEmployeeOnboardings(organizationId: string, filters?: { status?: string }) {
    const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const onboardings = await EmployeeOnboarding.find(query)
      .populate('employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return onboardings;
  }

  async getEmployeeOnboardingById(onboardingId: string, organizationId: string) {
    const onboarding = await EmployeeOnboarding.findOne({
      _id: onboardingId,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .populate('employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email');

    if (!onboarding) {
      throw new Error('Employee onboarding not found');
    }

    return onboarding;
  }

  async approveEmployeeOnboarding(onboardingId: string, organizationId: string, approvedBy: string, _remarks?: string) {
    // Validate onboardingId format
    if (!mongoose.Types.ObjectId.isValid(onboardingId)) {
      throw new Error(`Invalid onboarding ID format: ${onboardingId}`);
    }

    // Validate organizationId format
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new Error(`Invalid organization ID format: ${organizationId}`);
    }

    // Validate approvedBy format
    if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
      throw new Error(`Invalid approvedBy ID format: ${approvedBy}`);
    }

    logger.info(`Attempting to approve onboarding: ${onboardingId} for org: ${organizationId} by user: ${approvedBy}`);

    const onboarding = await EmployeeOnboarding.findOne({
      _id: new mongoose.Types.ObjectId(onboardingId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!onboarding) {
      logger.error(`Onboarding not found: ${onboardingId} for org: ${organizationId}`);
      throw new Error('Employee onboarding not found');
    }

    if (onboarding.status === 'approved') {
      throw new Error('Onboarding is already approved');
    }

    if (onboarding.status === 'rejected') {
      throw new Error('Cannot approve a rejected onboarding');
    }

    // Get employee details
    const employee = onboarding.employeeId 
      ? await Employee.findById(onboarding.employeeId)
      : await Employee.findOne({
          email: onboarding.email,
          organizationId: new mongoose.Types.ObjectId(organizationId),
        });

    // Check if user already exists
    const { User } = await import('../models/user.model');
    const existingUser = await User.findOne({
      email: onboarding.email,
      portalType: PortalType.CUSTOMER,
    });

    let user: any;
    let temporaryPassword: string;

    if (existingUser) {
      // User exists, generate new temporary password
      const result = await userService.resetUserTemporaryPassword(onboarding.email, PortalType.CUSTOMER);
      user = result.user;
      temporaryPassword = result.temporaryPassword;
    } else {
      // Create new user account with temporary password
      // Split fullName into firstName and lastName
      const nameParts = onboarding.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || onboarding.fullName || 'Employee';
      const lastName = nameParts.slice(1).join(' ') || 'User'; // Default to 'User' if no last name
      
      const userResult = await userService.inviteUser({
        email: onboarding.email,
        firstName: firstName,
        lastName: lastName,
        portalType: PortalType.CUSTOMER,
        role: 'customer_user', // Default role for employees
        organizationId: organizationId,
      });
      user = userResult;
      temporaryPassword = userResult.temporaryPassword || '';
    }

    // Update onboarding status to approved
    onboarding.status = 'approved';
    onboarding.approvedAt = new Date();
    onboarding.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    // Note: Approval remarks can be logged separately if needed
    await onboarding.save();

    // Send welcome email with credentials
    if (!temporaryPassword) {
      logger.error(`No temporary password generated for ${onboarding.email}`);
      throw new Error('Failed to generate temporary password');
    }

    try {
      const portalUrl = portalType === PortalType.VENDOR 
        ? (process.env.VENDOR_PORTAL_URL || 'http://localhost:4400')
        : (process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300');
      const orgType = portalType === PortalType.VENDOR ? 'vendor' : 'customer';
      // Use the same name splitting logic as user creation
      const nameParts = onboarding.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || onboarding.fullName || 'Employee';
      const lastName = nameParts.slice(1).join(' ') || 'User';
      
      logger.info(`Sending welcome email with credentials to ${onboarding.email}`);
      logger.info(`Temporary password generated: ${temporaryPassword.substring(0, 2)}***`);
      
      await emailService.sendWelcomeEmail({
        to: onboarding.email,
        firstName: firstName,
        lastName: lastName,
        portalLink: `${portalUrl}/login`,
        temporaryPassword,
        organizationType: orgType,
      });
      
      logger.info(`✅ Welcome email with login credentials sent successfully to ${onboarding.email}`);
      logger.info(`   Portal link: ${portalLink}/login`);
    } catch (emailError: any) {
      logger.error(`❌ Failed to send welcome email to ${onboarding.email}:`, emailError.message);
      // Don't fail approval if email fails, but log the error
      // The user account is already created, so they can request password reset if needed
    }

    return {
      success: true,
      onboarding,
      user,
      employee,
      message: 'Employee onboarding approved successfully. Login credentials have been sent to the employee.',
    };
  }

  async rejectEmployeeOnboarding(onboardingId: string, organizationId: string, rejectedBy: string, rejectionReason?: string) {
    const onboarding = await EmployeeOnboarding.findOne({
      _id: onboardingId,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!onboarding) {
      throw new Error('Employee onboarding not found');
    }

    if (onboarding.status === 'rejected') {
      throw new Error('Onboarding is already rejected');
    }

    if (onboarding.status === 'approved') {
      throw new Error('Cannot reject an approved onboarding');
    }

    // Update onboarding status to rejected
    onboarding.status = 'rejected';
    onboarding.rejectedAt = new Date();
    onboarding.rejectedBy = new mongoose.Types.ObjectId(rejectedBy);
    if (rejectionReason) {
      onboarding.rejectionReason = rejectionReason;
    }
    await onboarding.save();

    logger.info(`✅ Employee onboarding ${onboardingId} rejected`);

    return {
      success: true,
      onboarding,
      message: 'Employee onboarding rejected successfully.',
    };
  }

  async deleteEmployeeOnboarding(onboardingId: string, organizationId: string) {
    // Validate onboardingId format
    if (!mongoose.Types.ObjectId.isValid(onboardingId)) {
      throw new Error(`Invalid onboarding ID format: ${onboardingId}`);
    }

    // Validate organizationId format
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new Error(`Invalid organization ID format: ${organizationId}`);
    }

    logger.info(`Attempting to delete onboarding: ${onboardingId} for org: ${organizationId}`);

    const onboarding = await EmployeeOnboarding.findOne({
      _id: new mongoose.Types.ObjectId(onboardingId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!onboarding) {
      logger.error(`Onboarding not found: ${onboardingId} for org: ${organizationId}`);
      throw new Error('Employee onboarding not found');
    }

    // Delete the onboarding record
    await EmployeeOnboarding.findByIdAndDelete(onboardingId);

    logger.info(`✅ Employee onboarding ${onboardingId} deleted successfully`);

    return {
      success: true,
      message: 'Employee onboarding deleted successfully.',
    };
  }
}

export const employeeService = new EmployeeService();
