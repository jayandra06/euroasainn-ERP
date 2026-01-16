import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import { invitationService } from '../services/invitation.service';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { PortalType, OrganizationType } from '@euroasiann/shared';
import { logger } from '../config/logger';

function formatInvitation(invitation: any) {
  const obj = invitation.toObject ? invitation.toObject() : invitation;
  return {
    _id: obj._id?.toString(),
    email: obj.email,
    role: obj.role,
    status: obj.status as InvitationStatus,
    resendCount: obj.resendCount || 0,
    expiresAt: obj.expiresAt,
    createdAt: obj.createdAt,
    usedAt: obj.usedAt,
    revokedAt: obj.revokedAt,
  };
}

export class OrganizationController {
  async createOrganization(req: Request, res: Response) {
    try {
      const { adminEmail, firstName, lastName, ...orgData } = req.body;

      // Log received data for debugging
      logger.info(`📝 Creating organization request received`);
      logger.info(`   Organization Name: ${orgData.name}`);
      logger.info(`   Organization Type: ${orgData.type}`);
      logger.info(`   Admin Email from form: ${adminEmail || 'NOT PROVIDED'}`);
      logger.info(`   First Name: ${firstName || 'NOT PROVIDED'}`);
      logger.info(`   Last Name: ${lastName || 'NOT PROVIDED'}`);

      // Validate required fields
      if (!orgData.name || !orgData.type || !orgData.portalType) {
        return res.status(400).json({
          success: false,
          error: 'Organization name, type, and portalType are required',
        });
      }

      // Validate adminEmail if provided (should be provided for email sending)
      if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admin email format',
        });
      }

      // Determine who is inviting (admin/tech/customer)
      const requester = (req as any).user;
      let invitedBy: 'admin' | 'tech' | 'customer' | undefined;
      
      if (requester?.portalType === PortalType.ADMIN) {
        invitedBy = 'admin';
      } else if (requester?.portalType === PortalType.TECH) {
        invitedBy = 'tech';
      } else if (requester?.portalType === PortalType.CUSTOMER && orgData.type === OrganizationType.VENDOR) {
        invitedBy = 'customer';
      }

      // If customer is inviting a vendor, check if vendor already exists (admin-invited or customer-invited)
      let existingVendor = null;
      if (invitedBy === 'customer' && orgData.type === OrganizationType.VENDOR && requester?.organizationId) {
        // Check if vendor with same name already exists (case-insensitive)
        existingVendor = await Organization.findOne({
          type: OrganizationType.VENDOR,
          name: { $regex: new RegExp(`^${orgData.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, // Case-insensitive, escape special chars
        });
      }

      // Prepare organization data with invitation tracking
      const orgDataWithInvitation: any = {
        ...orgData,
        invitedBy,
        invitedByOrganizationId: invitedBy === 'customer' ? requester?.organizationId : undefined,
        isAdminInvited: invitedBy === 'admin' || invitedBy === 'tech', // Internal vendors are invited by admin/tech
      };

      // If vendor already exists and was admin-invited, add customer to visibility list
      if (existingVendor && existingVendor.isAdminInvited) {
        await organizationService.addCustomerToVendorVisibility(
          existingVendor._id.toString(),
          requester.organizationId
        );
        
        // Update the existing vendor to also track this customer invitation
        if (!existingVendor.invitedByOrganizationId) {
          existingVendor.invitedByOrganizationId = new mongoose.Types.ObjectId(requester.organizationId);
          await existingVendor.save();
        }
        
        return res.status(200).json({
          success: true,
          message: 'Vendor already exists. You have been granted access to this vendor.',
          data: existingVendor,
          existing: true,
        });
      }

      // If vendor already exists but was customer-invited, check if this customer already has access
      if (existingVendor && !existingVendor.isAdminInvited && requester?.organizationId) {
        const customerOrgId = new mongoose.Types.ObjectId(requester.organizationId);
        const hasAccess = existingVendor.visibleToCustomerIds?.some(
          (id: any) => id.toString() === customerOrgId.toString()
        );
        
        if (hasAccess) {
          return res.status(200).json({
            success: true,
            message: 'You already have access to this vendor.',
            data: existingVendor,
            existing: true,
          });
        } else {
          // Add this customer to the visibility list
          await organizationService.addCustomerToVendorVisibility(
            existingVendor._id.toString(),
            requester.organizationId
          );
          return res.status(200).json({
            success: true,
            message: 'Vendor already exists. You have been granted access to this vendor.',
            data: existingVendor,
            existing: true,
          });
        }
      }

      // If customer is inviting a vendor, check if vendor email already exists
      let isExistingVendor = false;
      let existingVendorOrgId: string | undefined;
      
      if (invitedBy === 'customer' && orgData.type === OrganizationType.VENDOR && adminEmail) {
        const { customerVendorInvitationService } = await import('../services/customer-vendor-invitation.service');
        logger.info(`🔍 Checking if vendor email exists: ${adminEmail}`);
        const vendorCheck = await customerVendorInvitationService.checkVendorEmailExists(adminEmail);
        logger.info(`📋 Vendor check result:`, { exists: vendorCheck.exists, vendorOrgId: vendorCheck.vendorOrganizationId });
        
        if (vendorCheck.exists && vendorCheck.vendorOrganizationId) {
          isExistingVendor = true;
          existingVendorOrgId = vendorCheck.vendorOrganizationId;
          logger.info(`✅ Existing vendor detected: ${adminEmail} belongs to organization ${existingVendorOrgId}`);
        } else {
          logger.info(`ℹ️ New vendor detected: ${adminEmail} - will send onboarding form`);
        }
      }

      // Create the organization first
      const organization = await organizationService.createOrganization(orgDataWithInvitation);
      const organizationId = (organization as any)._id?.toString() || organization.id?.toString();

      logger.info(`✅ Organization created with ID: ${organizationId}`);

      // If adminEmail is provided, create invitation token and send invitation email
      let emailSent = false;
      let emailError: string | null = null;
      
      if (!adminEmail) {
        logger.warn('⚠️ No adminEmail provided - skipping email sending and admin user creation');
      } else if (!organizationId) {
        logger.error('❌ Organization ID is missing - cannot create admin user or send email');
        emailError = 'Organization ID is missing';
      } else {
        logger.info(`📧 Processing admin invitation for email: ${adminEmail}`);
        try {
          // Determine role based on organization type
          const role = (orgData.type === OrganizationType.CUSTOMER || orgData.type === 'customer')
            ? 'customer_admin' 
            : 'vendor_admin';

          // Use provided firstName/lastName, or extract from email if not provided
          let finalFirstName = firstName;
          let finalLastName = lastName;
          
          if (!finalFirstName || !finalLastName) {
            const emailParts = adminEmail.split('@')[0];
            const nameParts = emailParts.split(/[._-]/);
            finalFirstName = firstName || nameParts[0] || 'Organization';
            finalLastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin');
          }

          // Handle existing vendor invitation (accept/decline flow)
          if (isExistingVendor && existingVendorOrgId && invitedBy === 'customer') {
            logger.info(`📧 Processing existing vendor invitation flow for ${adminEmail}`);
            const { customerVendorInvitationService } = await import('../services/customer-vendor-invitation.service');
            const { emailService } = await import('../services/email.service');
            const { Organization } = await import('../models/organization.model');
            
            // Get customer organization name
            const customerOrg = await Organization.findById(requester.organizationId);
            const customerOrgName = customerOrg?.name || 'Customer Organization';
            logger.info(`📋 Customer organization: ${customerOrgName}`);
            
            // Get existing vendor user to get their name
            const existingVendorUser = await User.findOne({
              email: adminEmail.toLowerCase().trim(),
              portalType: PortalType.VENDOR,
            });
            
            if (existingVendorUser) {
              finalFirstName = existingVendorUser.firstName || finalFirstName;
              finalLastName = existingVendorUser.lastName || finalLastName;
              logger.info(`👤 Found existing vendor user: ${finalFirstName} ${finalLastName}`);
            }
            
            // Create customer-vendor invitation
            logger.info(`📝 Creating customer-vendor invitation record...`);
            const invitation = await customerVendorInvitationService.createInvitation({
              customerOrganizationId: requester.organizationId,
              vendorEmail: adminEmail.toLowerCase().trim(),
              vendorName: orgData.name,
              vendorFirstName: finalFirstName,
              vendorLastName: finalLastName,
              vendorOrganizationId: existingVendorOrgId,
            });
            logger.info(`✅ Customer-vendor invitation created: ${invitation._id}`);
            
            // Generate accept/decline links
            const baseUrl = process.env.VENDOR_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4400';
            const acceptLink = `${baseUrl}/vendor-invitation/accept?token=${invitation.invitationToken}`;
            const declineLink = `${baseUrl}/vendor-invitation/decline?token=${invitation.invitationToken}`;
            logger.info(`🔗 Generated links - Accept: ${acceptLink}, Decline: ${declineLink}`);
            
            // Send existing vendor invitation email
            try {
              logger.info(`📤 Sending existing vendor invitation email to ${adminEmail}...`);
              await emailService.sendExistingVendorInvitationEmail({
                to: adminEmail,
                firstName: finalFirstName,
                lastName: finalLastName,
                customerOrganizationName: customerOrgName,
                acceptLink,
                declineLink,
              });
              
              emailSent = true;
              logger.info(`✅ Existing vendor invitation email sent successfully to ${adminEmail}`);
            } catch (emailErr: any) {
              emailError = emailErr.message || 'Unknown error';
              logger.error(`❌ Failed to send existing vendor invitation email to ${adminEmail}:`, {
                error: emailErr.message,
                stack: emailErr.stack,
              });
            }
          } else {
            // New vendor - send onboarding form as usual
            // Generate a secure temporary password
            const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
            
            // Check if user already exists, if so, update organization assignment and send email
            try {
              // Try to create the user
              await userService.createUser({
                email: adminEmail,
                firstName: finalFirstName,
                lastName: finalLastName,
                password: tempPassword,
                portalType: orgData.portalType as PortalType,
                role,
                organizationId,
              });
              logger.info(`✅ Admin user created: ${adminEmail}`);
            } catch (userError: any) {
              if (userError.message === 'User already exists') {
                // User already exists - still send invitation email
                logger.warn(`⚠️ User ${adminEmail} already exists for portal ${orgData.portalType}. Will still send invitation email.`);
                
                // Try to get existing user to use their name
                try {
                  const existingUser = await User.findOne({ 
                    email: adminEmail, 
                    portalType: orgData.portalType as PortalType 
                  });
                  
                  if (existingUser) {
                    // Update organization assignment if needed
                    if (organizationId && existingUser.organizationId?.toString() !== organizationId) {
                      existingUser.organizationId = organizationId;
                      await existingUser.save();
                      logger.info(`✅ Updated organization assignment for existing user ${adminEmail}`);
                    }
                    
                    // Use existing user's name
                    finalFirstName = existingUser.firstName || finalFirstName;
                    finalLastName = existingUser.lastName || finalLastName;
                    logger.info(`✅ Using existing user: ${adminEmail}`);
                  }
                } catch {
                  // If we can't find the user, still proceed with email sending
                  logger.warn(`⚠️ Could not lookup existing user, proceeding with email sending`);
                }
              } else {
                // Different error - rethrow it
                throw userError;
              }
            }

            // Get customer organization name if this is a customer-invited vendor
            let customerOrgName: string | undefined;
            if (invitedBy === 'customer' && requester?.organizationId) {
              const customerOrg = await Organization.findById(requester.organizationId);
              customerOrgName = customerOrg?.name;
              
              // Create CustomerVendorInvitation record for new vendors so they appear in the vendor list
              try {
                const { customerVendorInvitationService } = await import('../services/customer-vendor-invitation.service');
                const invitation = await customerVendorInvitationService.createInvitation({
                  customerOrganizationId: requester.organizationId,
                  vendorEmail: adminEmail.toLowerCase().trim(),
                  vendorName: organization.name,
                  vendorFirstName: finalFirstName,
                  vendorLastName: finalLastName,
                  vendorOrganizationId: organizationId, // New vendor organization ID
                });
                logger.info(`✅ Created CustomerVendorInvitation record for new vendor ${adminEmail}`, {
                  invitationId: invitation._id,
                  customerOrgId: requester.organizationId,
                  vendorOrgId: organizationId,
                  status: invitation.status,
                });
              } catch (invitationError: any) {
                // Log but don't fail - the organization is already created
                logger.error(`❌ Failed to create CustomerVendorInvitation record: ${invitationError.message}`, {
                  error: invitationError,
                  customerOrgId: requester.organizationId,
                  vendorEmail: adminEmail,
                  vendorOrgId: organizationId,
                });
              }
            }

            // Create invitation token
            const { invitationLink, portalLink } = await invitationService.createInvitationToken({
              email: adminEmail,
              organizationId,
              organizationType: orgData.type as OrganizationType,
              portalType: orgData.portalType as PortalType,
              role,
              organizationName: organization.name,
            });

            // Send invitation email with link and temporary password
            logger.info(`📤 Controller: Preparing to send invitation email`);
            logger.info(`   ⭐ RECIPIENT EMAIL: ${adminEmail}`);
            logger.info(`   Organization: ${organization.name}`);
            logger.info(`   Recipient Name: ${finalFirstName} ${finalLastName}`);
            logger.info(`   Invited By Customer: ${customerOrgName || 'N/A'}`);
            logger.info(`   Invitation link: ${invitationLink}`);
            logger.info(`   Portal link: ${portalLink}`);
            
            try {
              // This sends the email to adminEmail (the email from the form)
              await invitationService.sendInvitationEmail({
                email: adminEmail,
                firstName: finalFirstName,
                lastName: finalLastName,
                organizationName: organization.name,
                organizationType: orgData.type as OrganizationType,
                invitationLink,
                portalLink,
                temporaryPassword: tempPassword,
                invitedByCustomerName: customerOrgName,
              });

              emailSent = true;
              logger.info(`✅ SUCCESS: Invitation email sent to ${adminEmail} for organization ${organization.name}`);
              logger.info(`   Email subject: Welcome to Euroasiann ERP - ${organization.name} Onboarding`);
              logger.info(`   Invitation link: ${invitationLink}`);
            } catch (emailErr: any) {
              emailError = emailErr.message || 'Unknown error';
              logger.error(`❌ FAILED: Could not send invitation email to ${adminEmail}`);
              logger.error(`   Error: ${emailErr.message}`);
              logger.error(`   Error code: ${emailErr.code || 'N/A'}`);
              logger.error(`   Full error:`, emailErr);
              // Log the temporary password as fallback
              logger.warn(`   ⚠️ Temporary password (send manually): ${tempPassword}`);
              
              // Provide helpful error message
              if (emailErr.message?.includes('EAUTH') || emailErr.code === 'EAUTH') {
                emailError = 'SMTP authentication failed. Please check EMAIL_USER and EMAIL_PASS in .env';
              } else if (emailErr.message?.includes('ECONNECTION') || emailErr.code === 'ECONNECTION') {
                emailError = 'Could not connect to email server. Please check EMAIL_HOST and EMAIL_PORT';
              } else if (emailErr.message?.includes('ETIMEDOUT')) {
                emailError = 'Email server connection timeout. Please check network connectivity';
              }
            }
          }
        } catch (userError: any) {
          emailError = userError.message || 'Unknown error';
          logger.error('❌ Error creating admin user and sending invitation:', userError);
          logger.error(`   Error details: ${userError.message}`);
          logger.error(`   Stack: ${userError.stack}`);
        }
      }

      // Include email status in response
      const response: any = {
        success: true,
        data: organization,
      };

      if (adminEmail) {
        if (emailSent) {
          response.message = `Organization created successfully. Invitation email has been sent to ${adminEmail}.`;
          response.emailSent = true;
          response.emailTo = adminEmail;
        } else {
          response.message = `Organization created successfully, but failed to send invitation email to ${adminEmail}.`;
          response.warning = emailError || 'Email sending failed';
          response.emailSent = false;
          response.emailTo = adminEmail;
          response.emailError = emailError;
        }
      } else {
        response.message = 'Organization created successfully. No admin email provided - no invitation sent.';
        response.emailSent = false;
      }

      logger.info(`📋 Organization creation response: ${JSON.stringify({ 
        success: response.success, 
        emailSent: response.emailSent, 
        emailTo: response.emailTo,
        message: response.message 
      })}`);

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Create organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create organization',
      });
    }
  }

  async getOrganizations(req: Request, res: Response) {
    try {
      const type = req.query.type as string;
      const portalType = req.query.portalType as string;
      const requester = (req as any).user;
      const filters: any = {};

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      // Add requester information for visibility filtering
      if (requester) {
        filters.requesterPortalType = requester.portalType;
        if (requester.portalType === PortalType.CUSTOMER && requester.organizationId) {
          filters.customerOrganizationId = requester.organizationId;
        }
      }

      const organizations = await organizationService.getOrganizations(
        type as any,
        portalType as any,
        filters
      );

      res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      logger.error('Get organizations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get organizations',
      });
    }
  }

  async getOrganizationInvitations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includeAll = req.query.includeAll === 'true';
      const invitations = await invitationService.getOrganizationInvitations(id, includeAll);
      const formatted = invitations.map(formatInvitation);

      res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error: any) {
      logger.error('Get organization invitations error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch invitations',
      });
    }
  }

  async resendOrganizationInvitation(req: Request, res: Response) {
    try {
      const { id, invitationId } = req.params;
      const result = await invitationService.resendInvitation(invitationId, id);

      if (!result.invitation) {
        throw new Error('Failed to create replacement invitation');
      }

      res.status(200).json({
        success: true,
        data: {
          invitation: formatInvitation(result.invitation),
          temporaryPassword: result.temporaryPassword,
        },
      });
    } catch (error: any) {
      logger.error('Resend invitation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend invitation',
      });
    }
  }

  async revokeOrganizationInvitation(req: Request, res: Response) {
    try {
      const { id, invitationId } = req.params;
      const invitation = await invitationService.revokeInvitation(invitationId, id);

      res.status(200).json({
        success: true,
        data: formatInvitation(invitation),
      });
    } catch (error: any) {
      logger.error('Revoke invitation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to revoke invitation',
      });
    }
  }

  async getOrganizationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Get organization by id error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Organization not found',
      });
    }
  }

  async updateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const organization = await organizationService.updateOrganization(id, data);

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Update organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update organization',
      });
    }
  }

  async deleteOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await organizationService.deleteOrganization(id);

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete organization',
      });
    }
  }

  async getOrganizationsWithLicenses(req: Request, res: Response) {
    try {
      const { License } = await import('../models/license.model');
      const { CustomerOnboarding } = await import('../models/customer-onboarding.model');
      const { VendorOnboarding } = await import('../models/vendor-onboarding.model');
      
      // Get all organizations
      const organizations = await organizationService.getOrganizations();
      logger.info(`📊 Found ${organizations.length} organizations`);
      
      // Get all licenses
      const licenses = await License.find({}).lean();
      logger.info(`🔑 Found ${licenses.length} licenses`);
      
      // Create a map of organizationId -> license
      const licenseMap = new Map();
      licenses.forEach((license: any) => {
        const orgId = license.organizationId?.toString();
        if (orgId) {
          licenseMap.set(orgId, license);
        }
      });
      
      // Get all customer onboardings
      const customerOnboardings = await CustomerOnboarding.find({}).lean();
      const customerOnboardingMap = new Map();
      customerOnboardings.forEach((onboarding: any) => {
        const orgId = onboarding.organizationId?.toString();
        if (orgId) {
          customerOnboardingMap.set(orgId, onboarding);
        }
      });
      
      // Get all vendor onboardings
      const vendorOnboardings = await VendorOnboarding.find({}).lean();
      const vendorOnboardingMap = new Map();
      vendorOnboardings.forEach((onboarding: any) => {
        const orgId = onboarding.organizationId?.toString();
        if (orgId) {
          vendorOnboardingMap.set(orgId, onboarding);
        }
      });
      
      // Combine organizations with licenses and onboarding status
      const orgsWithLicenses = organizations.map((org: any) => {
        const orgId = org._id.toString();
        const license = licenseMap.get(orgId);
        const customerOnboarding = customerOnboardingMap.get(orgId);
        const vendorOnboarding = vendorOnboardingMap.get(orgId);
        const onboarding = customerOnboarding || vendorOnboarding;
        
        return {
          _id: orgId,
          name: org.name,
          type: org.type,
          portalType: org.portalType,
          isActive: org.isActive,
          license: license ? {
            status: license.status,
            expiresAt: license.expiresAt,
            issuedAt: license.issuedAt || license.createdAt,
            usageLimits: license.usageLimits || {},
            currentUsage: license.currentUsage || {},
          } : undefined,
          onboardingCompleted: onboarding ? onboarding.status === 'approved' : false,
          createdAt: org.createdAt,
        };
      });
      
      logger.info(`✅ Returning ${orgsWithLicenses.length} organizations with license information`);
      
      res.status(200).json({
        success: true,
        data: orgsWithLicenses,
      });
    } catch (error: any) {
      logger.error('Get organizations with licenses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get organizations with licenses',
      });
    }
  }

  async inviteOrganizationAdmin(req: Request, res: Response) {
    try {
      const { organizationName, organizationType, adminEmail, firstName, lastName, isActive } = req.body;

      if (!organizationName || !organizationType || !adminEmail) {
        return res.status(400).json({
          success: false,
          error: 'Organization name, type, and admin email are required',
        });
      }

      // Validate organization type
      if (organizationType !== OrganizationType.CUSTOMER && organizationType !== OrganizationType.VENDOR && organizationType !== 'customer' && organizationType !== 'vendor') {
        return res.status(400).json({
          success: false,
          error: 'Organization type must be customer or vendor',
        });
      }

      // Determine portal type and role based on organization type
      const portalType = (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
        ? PortalType.CUSTOMER 
        : PortalType.VENDOR;
      const role = (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
        ? 'customer_admin' 
        : 'vendor_admin';

      // Create the organization first
      const organization = await organizationService.createOrganization({
        name: organizationName,
        type: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer') 
          ? OrganizationType.CUSTOMER 
          : OrganizationType.VENDOR,
        portalType,
        isActive: isActive !== undefined ? isActive : true,
      });

      // Extract name from email if not provided
      let finalFirstName = firstName;
      let finalLastName = lastName;

      if (!finalFirstName || !finalLastName) {
        const emailParts = adminEmail.split('@')[0];
        const nameParts = emailParts.split(/[._-]/);
        finalFirstName = firstName || nameParts[0] || 'Organization';
        finalLastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin');
      }

      // Generate a secure temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
      
      // Create admin user for this organization
      const user = await userService.createUser({
        email: adminEmail,
        firstName: finalFirstName,
        lastName: finalLastName,
        password: tempPassword,
        portalType,
        role,
        organizationId: organization._id.toString(),
      });

      // Create invitation token
      const { invitationLink, portalLink } = await invitationService.createInvitationToken({
        email: adminEmail,
        organizationId: organization._id.toString(),
        organizationType: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
          ? OrganizationType.CUSTOMER
          : OrganizationType.VENDOR,
        portalType,
        role,
        organizationName: organization.name,
      });

      // Send invitation email with link and temporary password
      await invitationService.sendInvitationEmail({
        email: adminEmail,
        firstName: finalFirstName,
        lastName: finalLastName,
        organizationName: organization.name,
        organizationType: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
          ? OrganizationType.CUSTOMER
          : OrganizationType.VENDOR,
        invitationLink,
        portalLink,
        temporaryPassword: tempPassword,
      });

      // Send invitation email with temporary password and registration link
      let emailSent = false;
      let emailError: string | null = null;
      try {
        // Create invitation token for organization registration
        const { invitationLink, portalLink } = await invitationService.createInvitationToken({
          email: adminEmail,
          organizationType: organizationType as OrganizationType,
          portalType,
          role,
          organizationName,
        });
      logger.info(`✅ Invitation sent to ${adminEmail} for organization ${organization.name}`);
      logger.info(`   Invitation link: ${invitationLink}`);
      logger.info(`   Portal link: ${portalLink}`);
      logger.info(`   Temporary password: ${tempPassword}`);

        // Send invitation email
        try {
          await invitationService.sendInvitationEmail({
            email: adminEmail,
            firstName: finalFirstName,
            lastName: finalLastName,
            organizationName,
            organizationType: organizationType as OrganizationType,
            invitationLink,
            portalLink,
            temporaryPassword: invitedUser.temporaryPassword,
          });

          emailSent = true;
          logger.info(`✅ Organization admin invitation email sent to ${adminEmail} for ${organizationName} (${organizationType})`);
          logger.info(`   Invitation link: ${invitationLink}`);
        } catch (emailErr: any) {
          emailError = emailErr.message || 'Unknown error';
          logger.error(`❌ Failed to send invitation email to ${adminEmail}:`, emailErr);
          logger.error(`   Error details: ${emailErr.message}`);
          logger.error(`   Stack: ${emailErr.stack}`);
          // Log the temporary password as fallback
          logger.info(`   Temporary password (send manually): ${invitedUser.temporaryPassword}`);
        }
      } catch (tokenError: any) {
        emailError = tokenError.message || 'Unknown error';
        logger.error(`❌ Failed to create invitation token for ${adminEmail}:`, tokenError);
        logger.error(`   Error details: ${tokenError.message}`);
        logger.error(`   Stack: ${tokenError.stack}`);
      }

      // Prepare response data
      const responseUser: any = { ...invitedUser };
      if (emailSent) {
        // Remove password from response if email was sent successfully
        delete responseUser.temporaryPassword;
      }

      const responseData: any = {
        success: true,
        data: {
          user: responseUser,
          organizationName,
          organizationType,
          message: emailSent
            ? 'Organization admin invitation sent successfully. Invitation email has been sent.'
            : 'Organization admin invitation created. Please send the temporary password manually.',
          organization,
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            temporaryPassword: tempPassword, // Include for now (should be sent via email only)
          },
          invitationLink,
          message: 'Organization created and invitation sent successfully',
        },
      };

      // Include warning if email failed
      if (!emailSent && emailError) {
        responseData.warning = emailError;
      }

      res.status(201).json(responseData);
    } catch (error: any) {
      logger.error('Invite organization admin error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to invite organization admin',
      });
    }
  }
}

export const organizationController = new OrganizationController();
