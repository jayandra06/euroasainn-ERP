import { Employee, IEmployee, IPayrollDetails } from '../models/employee.model';
import { EmployeeOnboarding, IEmployeeOnboarding } from '../models/employee-onboarding.model';
import { licenseService } from './license.service';
import { userService } from './user.service';
import { emailService } from './email.service';
import { invitationService } from './invitation.service';
import { Organization } from '../models/organization.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

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

// Helper function to build employee onboarding link
function buildEmployeeOnboardingLink(token: string) {
  const customerPortalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
  return `${customerPortalUrl}/onboarding/employee?token=${token}`;
}

export class EmployeeService {
  async createEmployee(organizationId: string, data: Partial<IEmployee>) {
    // Check license limit
    const canCreate = await licenseService.checkUsageLimit(organizationId, 'employees');
    if (!canCreate) {
      throw new Error('Employee limit exceeded');
    }

    const employee = new Employee({
      ...data,
      organizationId,
    });

    await employee.save();
    await licenseService.incrementUsage(organizationId, 'employees');
    return employee;
  }

  async getEmployees(organizationId: string, filters?: any) {
    const query: any = { organizationId };
    if (filters?.businessUnitId) {
      query.businessUnitId = filters.businessUnitId;
    }
    return await Employee.find(query);
  }

  async getEmployeesWithOnboardingStatus(organizationId: string, filters?: { status?: string }) {
    const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    
    // Get all employees
    const employees = await Employee.find(query).sort({ createdAt: -1 });

    // Get all onboardings for this organization
    const onboardingQuery: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (filters?.status) {
      onboardingQuery.status = filters.status;
    }
    const onboardings = await EmployeeOnboarding.find(onboardingQuery)
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Create a map of email -> onboarding for quick lookup
    const onboardingMap = new Map();
    onboardings.forEach((onboarding) => {
      onboardingMap.set(onboarding.email.toLowerCase(), onboarding);
    });

    // Combine employees with their onboarding status
    const employeesWithStatus = employees.map((employee) => {
      const onboarding = onboardingMap.get(employee.email.toLowerCase());
      return {
        ...employee.toObject(),
        onboardingStatus: onboarding?.status || null,
        onboarding: onboarding || null,
      };
    });

    // If status filter is provided, filter employees
    if (filters?.status) {
      return employeesWithStatus.filter((emp) => emp.onboardingStatus === filters.status);
    }

    return employeesWithStatus;
  }

  async getEmployeeById(employeeId: string, organizationId: string) {
    const employee = await Employee.findOne({ _id: employeeId, organizationId });
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  async updateEmployee(employeeId: string, organizationId: string, data: Partial<IEmployee>) {
    const employee = await Employee.findOne({ _id: employeeId, organizationId });
    if (!employee) {
      throw new Error('Employee not found');
    }

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
    return employee;
  }

  async deleteEmployee(employeeId: string, organizationId: string) {
    const employee = await Employee.findOneAndDelete({ _id: employeeId, organizationId });
    if (!employee) {
      throw new Error('Employee not found');
    }
    await licenseService.decrementUsage(organizationId, 'employees');
    return { success: true };
  }

  async inviteEmployee(organizationId: string, data: {
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
    // Check license limit
    const canCreate = await licenseService.checkUsageLimit(organizationId, 'employees');
    if (!canCreate) {
      throw new Error('Employee limit exceeded');
    }

    // Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if employee with this email already exists
    const existingEmployee = await Employee.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      email: normalizedEmail,
    });

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
    await licenseService.incrementUsage(organizationId, 'employees');

    // Create invitation token for employee onboarding
    let invitationLink: string | undefined;
    let emailSent = false;

    try {
      // Determine role for invitation (use provided role or default)
      const roleForInvitation = data.role || 'customer_user';

      // Create invitation token
      const invitationResult = await invitationService.createInvitationToken({
        email: normalizedEmail,
        organizationId: organizationId,
        organizationType: OrganizationType.CUSTOMER,
        portalType: PortalType.CUSTOMER,
        role: roleForInvitation,
        organizationName: organization.name,
      });

      invitationLink = invitationResult.invitationLink;

      // Build employee onboarding link (different from customer/vendor onboarding)
      const customerPortalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
      const onboardingLink = `${customerPortalUrl}/onboarding/employee?token=${invitationResult.token}`;

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

  async completeEmployeeOnboarding(token: string, password: string) {
    // Import InvitationToken model
    const { InvitationToken } = await import('../models/invitation-token.model');
    
    // Verify invitation token
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
      portalType: PortalType.CUSTOMER,
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      email: invitation.email,
      organizationId: invitation.organizationId,
    });

    if (!existingEmployee) {
      throw new Error('Employee not found for this invitation');
    }

    // Check if user already exists
    const { User } = await import('../models/user.model');
    const existingUser = await User.findOne({
      email: invitation.email,
      portalType: PortalType.CUSTOMER,
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
        portalType: PortalType.CUSTOMER,
        role: invitation.role || 'customer_user',
        organizationId: invitation.organizationId?.toString(),
      });
      user = userResult;
      temporaryPassword = password;
    }

    // Mark invitation as used
    invitation.used = true;
    invitation.status = 'used';
    await invitation.save();

    // Get organization name for email
    const organization = await Organization.findById(invitation.organizationId);
    const organizationName = organization?.name || 'Your Organization';

    // Send welcome email with credentials
    try {
      const portalLink = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
      await emailService.sendWelcomeEmail({
        to: invitation.email,
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
        portalLink: `${portalLink}/login`,
        temporaryPassword,
        organizationType: 'customer',
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
    
    // Verify invitation token
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
      portalType: PortalType.CUSTOMER,
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if onboarding already exists for this token
    const existingOnboarding = await EmployeeOnboarding.findOne({ invitationToken: token });
    if (existingOnboarding) {
      throw new Error('Onboarding already submitted for this invitation');
    }

    // Check if employee exists
    const existingEmployee = await Employee.findOne({
      email: invitation.email,
      organizationId: invitation.organizationId,
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
    
    // Verify invitation token
    const invitation = await InvitationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      portalType: PortalType.CUSTOMER,
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Find employee by email and organizationId to get fullName and phone
    let employee = null;
    if (invitation.organizationId) {
      employee = await Employee.findOne({
        email: invitation.email,
        organizationId: invitation.organizationId,
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

  async approveEmployeeOnboarding(onboardingId: string, organizationId: string, approvedBy: string, remarks?: string) {
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

    // Get organization name for email
    const organization = await Organization.findById(organizationId);
    const organizationName = organization?.name || 'Your Organization';

    // Send welcome email with credentials
    if (!temporaryPassword) {
      logger.error(`No temporary password generated for ${onboarding.email}`);
      throw new Error('Failed to generate temporary password');
    }

    try {
      const portalLink = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
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
        portalLink: `${portalLink}/login`,
        temporaryPassword,
        organizationType: 'customer',
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
