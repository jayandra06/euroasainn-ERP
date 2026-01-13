import mongoose, { Document } from 'mongoose';
export interface ICustomerVendorInvitation extends Document {
    customerOrganizationId: mongoose.Types.ObjectId;
    vendorEmail: string;
    vendorName: string;
    vendorFirstName?: string;
    vendorLastName?: string;
    vendorOrganizationId?: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    invitationToken: string;
    acceptedAt?: Date;
    declinedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CustomerVendorInvitation: mongoose.Model<ICustomerVendorInvitation, {}, {}, {}, mongoose.Document<unknown, {}, ICustomerVendorInvitation, {}, {}> & ICustomerVendorInvitation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=customer-vendor-invitation.model.d.ts.map