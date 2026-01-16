import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdArrowBack, MdCheckCircle, MdUpload, MdDelete } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useState } from 'react';
import React from 'react';

interface RFQDetails {
  _id: string;
  rfqNumber: string;
  title: string;
  description?: string;
  vesselId?: {
    _id: string;
    name: string;
    imoNumber?: string;
    hullNumber?: string;
    serialNumber?: string;
    type?: string;
  };
  supplyPort?: string;
  brand?: string;
  model?: string;
  category?: string;
  subCategory?: string;
  equipmentTags?: string;
  drawingNumber?: string;
  preferredQuality?: string;
  leadDate?: string;
  incoterms?: string;
  logisticContainer?: string;
  categories?: string[];
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  senderId?: {
    _id: string;
    name: string;
  };
  recipientVendorIds?: Array<{
    _id: string;
    name: string;
    type?: string;
    portalType?: string;
  }>;
  metadata?: Record<string, any>;
}

interface VendorQuotation {
  _id: string;
  quotationNumber: string;
  vendorOrganizationId: {
    _id: string | null;
    name: string;
  };
  isAdminOffer?: boolean;
  status: string;
  submittedAt?: string;
  items: Array<{
    description: string;
    requiredQty: number;
    quotedPrice: number;
    offeredQty: number;
    offeredQuality: string;
  }>;
  terms: {
    creditType?: string;
    paymentTerm?: string;
    insuranceTerm?: string;
    taxTerm?: string;
    transportTerm?: string;
    deliveryTerm?: string;
    packingTerm?: string;
    currency?: string;
  };
}

interface RFQItem {
  impaNo?: string;
  description: string;
  partNo?: string;
  altPartNo?: string;
  positionNo?: string;
  dimensions?: string;
  requiredQty: number | string;
  uom?: string;
  remark?: string;
}

export function RFQDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVendorTab, setSelectedVendorTab] = useState<number>(0);
  const [selectedVendorForFinalize, setSelectedVendorForFinalize] = useState<string | null>(null);

  const { data: rfqDetails, isLoading, error } = useQuery<RFQDetails>({
    queryKey: ['rfq-details', id],
    queryFn: async () => {
      if (!id) throw new Error('RFQ ID is required');
      const response = await authenticatedFetch(`/api/v1/customer/rfq/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch RFQ details');
      }
      const data = await response.json();
      console.log('RFQ Details Response:', data.data);
      return data.data;
    },
    enabled: !!id,
  });

  // Fetch vendor quotations for this RFQ
  const { data: vendorQuotations } = useQuery<VendorQuotation[]>({
    queryKey: ['rfq-vendor-quotations', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const response = await authenticatedFetch(`/api/v1/customer/rfq/${id}/quotations`);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        // Return all quotations including admin offers (they'll be filtered in the UI)
        return data.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch banking details for this RFQ
  const { data: bankingDetails } = useQuery<any[]>({
    queryKey: ['rfq-banking-details', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const response = await authenticatedFetch(`/api/v1/customer/rfq/${id}/banking-details`);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return data.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch payment proof for this RFQ
  const { data: paymentProofs } = useQuery<any[]>({
    queryKey: ['rfq-payment-proof', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const response = await authenticatedFetch(`/api/v1/customer/rfq/${id}/payment-proof`);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return data.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Check if any offer (vendor or special) is already finalized
  const hasAnyFinalizedOffer = React.useMemo(() => {
    if (!vendorQuotations || vendorQuotations.length === 0) return false;
    return vendorQuotations.some((q: any) => q.status === 'finalized');
  }, [vendorQuotations]);

  // Get the finalized offer details for display
  const finalizedOffer = React.useMemo(() => {
    if (!hasAnyFinalizedOffer) return null;
    return vendorQuotations?.find((q: any) => q.status === 'finalized');
  }, [vendorQuotations, hasAnyFinalizedOffer]);

  // Finalize offer mutation
  const finalizeOfferMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await authenticatedFetch(`/api/v1/customer/quotations/${quotationId}/finalize`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to finalize offer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq-vendor-quotations', id] });
      queryClient.invalidateQueries({ queryKey: ['rfq-details', id] });
      setSelectedVendorForFinalize(null);
    },
  });

  // Extract RFQ items directly from rfqDetails (no separate query needed)
  const rfqItems: RFQItem[] = React.useMemo(() => {
    if (!rfqDetails) return [];
    
    try {
      // RFQ items are stored in metadata.items with form field names
      const items = rfqDetails.metadata?.items || [];
      console.log('RFQ Details Metadata:', rfqDetails.metadata);
      console.log('RFQ Items found:', items);
      
      // Transform items from form format to display format
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item: any) => ({
          impaNo: item.impaNo || '-',
          description: item.itemDescription || item.description || '-',
          partNo: item.partNo || '-',
          altPartNo: item.altPartNo || '-',
          positionNo: item.positionNo || '-',
          dimensions: item.dimensions || '-',
          requiredQty: item.requiredQuantity || item.requiredQty || 0,
          uom: item.uom || '-',
          remark: item.generalRemark || item.remark || '-',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error extracting RFQ items:', error);
      return [];
    }
  }, [rfqDetails]);

  if (isLoading) {
    return (
      <div className="w-full p-8 min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (error || !rfqDetails) {
    return (
      <div className="w-full p-8 min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4 font-medium">
            {error instanceof Error ? error.message : 'Failed to load RFQ details'}
          </p>
          <button
            onClick={() => navigate('/rfqs')}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))]/90"
          >
            Back to RFQs
          </button>
        </div>
      </div>
    );
  }

  // Extract vessel info - check metadata first (where form data is stored), then vesselId object
  const vesselInfo: any = rfqDetails.vesselId || {};
  const hullNumber = rfqDetails.metadata?.hullNo || rfqDetails.metadata?.hullNumber || vesselInfo?.hullNumber || vesselInfo?.hullNo || '-';
  const serialNumber = rfqDetails.metadata?.serialNumber || vesselInfo?.serialNumber || '-';
  
  // Extract equipment info - check metadata first (where form data is stored)
  const subCategory = rfqDetails.metadata?.subCategory || rfqDetails.subCategory || '-';
  const equipmentTags = rfqDetails.metadata?.equipmentTags || rfqDetails.equipmentTags || '-';
  const drawingNumber = rfqDetails.metadata?.drawingNumber || rfqDetails.drawingNumber || '-';
  
  // Extract supply info - check metadata first (where form data is stored)
  const preferredQuality = rfqDetails.metadata?.preferredQuality || rfqDetails.preferredQuality || '-';
  const leadDate = rfqDetails.metadata?.leadDate || rfqDetails.leadDate || '-';
  const incoterms = rfqDetails.metadata?.typeOfIncoterms || rfqDetails.metadata?.incoterms || rfqDetails.incoterms || '-';
  const logisticContainer = rfqDetails.metadata?.typeOfLogisticContainer || rfqDetails.metadata?.logisticContainer || rfqDetails.logisticContainer || '-';
  const createdDate = rfqDetails.metadata?.createdDate || rfqDetails.createdAt || '-';

  // Get customer name (sender organization)
  const customerName = rfqDetails.senderId?.name || 'Customer';

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return '-';
    }
  };


  return (
    <div className="w-full min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rfqs')}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <MdArrowBack className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">RFQ Details</h1>
              <p className="text-gray-400 mt-1">{rfqDetails.rfqNumber}</p>
            </div>
          </div>
        </div>

        {/* RFQ Information Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">RFQ Information</h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">RFQ ID</label>
              <p className="text-white font-semibold">{rfqDetails.rfqNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Customer</label>
              <p className="text-white">{customerName}</p>
            </div>
            {rfqDetails.metadata?.remarks && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-400 block mb-1">Remarks</label>
                <p className="text-white">{rfqDetails.metadata.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vessel Information Card */}
        {(vesselInfo?.name || vesselInfo?._id || rfqDetails.vesselId) && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Vessel Information</h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Vessel Name</label>
                <p className="text-white">{vesselInfo?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">IMO No</label>
                <p className="text-white">{vesselInfo?.imoNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">HULL No</label>
                <p className="text-white">{hullNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Serial Number</label>
                <p className="text-white">{serialNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Information Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Equipment Information</h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Brand</label>
              <p className="text-white">{rfqDetails.brand || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Model</label>
              <p className="text-white">{rfqDetails.model || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Category</label>
              <p className="text-white">{rfqDetails.category || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Sub Category</label>
              <p className="text-white">{subCategory}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Equipment Tags</label>
              <p className="text-white">{equipmentTags}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Drawing Number</label>
              <p className="text-white">{drawingNumber}</p>
            </div>
          </div>
        </div>

        {/* Supply Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Supply Information</h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Supply Port</label>
              <p className="text-white">{rfqDetails.supplyPort || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Preferred Quality</label>
              <p className="text-white">{preferredQuality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Lead Date</label>
              <p className="text-white">{formatDate(leadDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Type of Incoterms</label>
              <p className="text-white">{incoterms}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Type of Logistic Container</label>
              <p className="text-white">{logisticContainer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">Created Date</label>
              <p className="text-white">{createdDate !== '-' ? formatDate(createdDate) : formatDate(rfqDetails.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Vendor Quotations Section (includes Special Offer as first tab) */}
        {((rfqDetails.recipientVendorIds && rfqDetails.recipientVendorIds.length > 0) || vendorQuotations?.some((q: any) => q.isAdminOffer)) && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-700">Quotations</h2>
            
            {/* Global message when an offer is finalized */}
            {hasAnyFinalizedOffer && finalizedOffer && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <MdCheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-400 mb-1">
                      An offer has been finalized
                    </p>
                    <p className="text-sm text-green-300">
                      {finalizedOffer.isAdminOffer 
                        ? 'Special Offer' 
                        : `Vendor: ${finalizedOffer.vendorOrganizationId?.name || 'Unknown'}`} - Quotation #{finalizedOffer.quotationNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tabs - Special Offer first, then Vendors */}
            <div className="flex gap-4 mb-6 border-b border-gray-700">
              {/* Special Offer Tab (always first if exists) */}
              {(() => {
                const adminQuotation = vendorQuotations?.find((q: any) => q.isAdminOffer === true);
                if (!adminQuotation) return null;
                const isFinalized = adminQuotation.status === 'finalized';
                
                return (
                  <button
                    onClick={() => setSelectedVendorTab(0)}
                    className={`px-4 py-2 font-medium transition-colors relative ${
                      selectedVendorTab === 0
                        ? 'text-purple-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    ⭐ Special Offer
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isFinalized
                        ? 'bg-green-500/20 text-green-400'
                        : adminQuotation.status === 'submitted'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {isFinalized ? 'Finalized' : adminQuotation.status === 'submitted' ? 'Submitted' : 'Received'}
                    </span>
                    {selectedVendorTab === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                    )}
                  </button>
                );
              })()}
              
              {/* Vendor Tabs */}
              {rfqDetails.recipientVendorIds?.map((vendor: any, index: number) => {
                const quotation = vendorQuotations?.find(
                  (q: any) => !q.isAdminOffer && (q.vendorOrganizationId?._id === vendor._id || q.vendorOrganizationId?._id?.toString() === vendor._id?.toString())
                );
                const hasQuotation = !!quotation;
                const isFinalized = quotation?.status === 'finalized';
                const tabIndex = (vendorQuotations?.some((q: any) => q.isAdminOffer) ? 1 : 0) + index;
                
                return (
                  <button
                    key={vendor._id?.toString() || index}
                    onClick={() => setSelectedVendorTab(tabIndex)}
                    className={`px-4 py-2 font-medium transition-colors relative ${
                      selectedVendorTab === tabIndex
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {vendor.name || `Vendor ${index + 1}`}
                    {hasQuotation && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isFinalized
                          ? 'bg-green-500/20 text-green-400'
                          : quotation.status === 'submitted'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {isFinalized ? 'Finalized' : quotation.status === 'submitted' ? 'Submitted' : 'Received'}
                      </span>
                    )}
                    {!hasQuotation && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-600/50 text-gray-400 rounded-full text-xs font-semibold">
                        Waiting
                      </span>
                    )}
                    {selectedVendorTab === tabIndex && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Tab Content */}
            {(() => {
              const adminQuotation = vendorQuotations?.find((q: any) => q.isAdminOffer === true);
              const hasAdminOffer = !!adminQuotation;
              
              // If tab 0 and admin offer exists, show special offer
              if (selectedVendorTab === 0 && hasAdminOffer) {
                const isFinalized = adminQuotation.status === 'finalized';
                
                return (
                  <div className="space-y-6">
                    {/* Special Offer Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-300">Special Offer</p>
                        <p className="text-white font-semibold text-lg flex items-center gap-2">
                          ⭐ Admin Special Offer
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                            Admin Offer
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isFinalized
                            ? 'bg-green-500/20 text-green-400'
                            : adminQuotation.status === 'submitted'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {isFinalized ? 'Finalized' : adminQuotation.status === 'submitted' ? 'Submitted' : adminQuotation.status}
                        </span>
                        {adminQuotation.submittedAt && (
                          <p className="text-sm text-purple-300 mt-1">
                            Submitted: {formatDate(adminQuotation.submittedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Special Offer Items */}
                    {adminQuotation.items && adminQuotation.items.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-purple-300">Quotation Summary</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-purple-500/30">
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">#</th>
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">Description</th>
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">Required Qty</th>
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">Quoted Price</th>
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">Offered Qty</th>
                                <th className="text-left p-3 text-sm font-semibold text-purple-300">Offered Quality</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminQuotation.items.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-purple-500/20 hover:bg-purple-900/20">
                                  <td className="p-3 text-white">{idx + 1}</td>
                                  <td className="p-3 text-white">{item.description || '-'}</td>
                                  <td className="p-3 text-white">{item.requiredQty || '-'}</td>
                                  <td className="p-3 text-white">${item.quotedPrice?.toFixed(2) || '0.00'}</td>
                                  <td className="p-3 text-white">{item.offeredQty || '-'}</td>
                                  <td className="p-3 text-white">{item.offeredQuality || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-purple-300">No items in quotation</p>
                      </div>
                    )}

                    {/* Special Offer Terms */}
                    {adminQuotation.terms && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-purple-300">Terms & Conditions</h3>
                        <div className="grid grid-cols-2 gap-6">
                          {adminQuotation.terms.creditType && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Credit Type</label>
                              <p className="text-white">{adminQuotation.terms.creditType}</p>
                            </div>
                          )}
                          {adminQuotation.terms.paymentTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Payment Term</label>
                              <p className="text-white">{adminQuotation.terms.paymentTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.insuranceTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Insurance Term</label>
                              <p className="text-white">{adminQuotation.terms.insuranceTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.taxTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Tax Term</label>
                              <p className="text-white">{adminQuotation.terms.taxTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.transportTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Transport Term</label>
                              <p className="text-white">{adminQuotation.terms.transportTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.deliveryTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Delivery Term</label>
                              <p className="text-white">{adminQuotation.terms.deliveryTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.packingTerm && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Packing Term</label>
                              <p className="text-white">{adminQuotation.terms.packingTerm}</p>
                            </div>
                          )}
                          {adminQuotation.terms.currency && (
                            <div>
                              <label className="text-sm font-medium text-purple-300 block mb-1">Currency</label>
                              <p className="text-white">{adminQuotation.terms.currency}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Finalize Special Offer Button */}
                    {!isFinalized && (
                      <div className="mt-6 pt-6 border-t border-purple-500/30">
                        {hasAnyFinalizedOffer && (
                          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-sm text-yellow-400">
                              ⚠️ Another offer has already been finalized. You cannot finalize additional offers.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to finalize this special offer?')) {
                              finalizeOfferMutation.mutate(adminQuotation._id);
                            }
                          }}
                          disabled={finalizeOfferMutation.isPending || hasAnyFinalizedOffer}
                          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {finalizeOfferMutation.isPending ? 'Finalizing...' : hasAnyFinalizedOffer ? 'Offer Already Finalized' : 'Finalize Special Offer'}
                        </button>
                      </div>
                    )}

                    {isFinalized && (
                      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MdCheckCircle className="w-5 h-5 text-green-400" />
                          <p className="text-sm text-green-400 font-semibold">
                            This special offer has been finalized.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Otherwise show vendor quotation
              const vendorIndex = hasAdminOffer ? selectedVendorTab - 1 : selectedVendorTab;
              const selectedVendor: any = rfqDetails.recipientVendorIds?.[vendorIndex];
              if (!selectedVendor) return null;
              
              const quotation = vendorQuotations?.find(
                (q: any) => !q.isAdminOffer && (q.vendorOrganizationId?._id === selectedVendor._id || q.vendorOrganizationId?._id?.toString() === selectedVendor._id?.toString())
              );
              const hasQuotation = !!quotation;
              const isFinalized = quotation?.status === 'finalized';
              const isSelected = selectedVendorForFinalize === quotation?._id;
              
              return (
                <div className="space-y-6">
                  {/* Vendor Info Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Vendor</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVendor.name || `Vendor ${vendorIndex + 1}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {hasQuotation ? (
                        <>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isFinalized
                              ? 'bg-green-500/20 text-green-400'
                              : quotation.status === 'submitted'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {isFinalized ? 'Finalized' : quotation.status === 'submitted' ? 'Submitted' : quotation.status || 'Received'}
                          </span>
                          {quotation.submittedAt && (
                            <p className="text-sm text-gray-400 mt-1">
                              Submitted: {formatDate(quotation.submittedAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-gray-600/50 text-gray-400 rounded-full text-sm font-semibold">
                          Waiting for Quote
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quotation Summary Table */}
                  {hasQuotation && quotation.items && quotation.items.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Quotation Summary</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">#</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">Description</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">Required Qty</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">Quoted Price</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">Offered Qty</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-400">Offered Quality</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quotation.items.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                <td className="p-3 text-white">{idx + 1}</td>
                                <td className="p-3 text-white">{item.description || '-'}</td>
                                <td className="p-3 text-white">{item.requiredQty || '-'}</td>
                                <td className="p-3 text-white">${item.quotedPrice?.toFixed(2) || '0.00'}</td>
                                <td className="p-3 text-white">{item.offeredQty || '-'}</td>
                                <td className="p-3 text-white">{item.offeredQuality || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : hasQuotation ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No items in quotation</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg">Waiting for Quote</p>
                      <p className="text-gray-500 text-sm mt-2">This vendor has not submitted their quotation yet.</p>
                    </div>
                  )}

                  {/* Vendor Terms & Conditions */}
                  {hasQuotation && quotation.terms && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Vendor Terms & Conditions</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {quotation.terms.creditType && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Credit Type</label>
                            <p className="text-white">{quotation.terms.creditType}</p>
                          </div>
                        )}
                        {quotation.terms.paymentTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Payment Term</label>
                            <p className="text-white">{quotation.terms.paymentTerm}</p>
                          </div>
                        )}
                        {quotation.terms.insuranceTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Insurance Term</label>
                            <p className="text-white">{quotation.terms.insuranceTerm}</p>
                          </div>
                        )}
                        {quotation.terms.taxTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Tax Term</label>
                            <p className="text-white">{quotation.terms.taxTerm}</p>
                          </div>
                        )}
                        {quotation.terms.transportTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Transport Term</label>
                            <p className="text-white">{quotation.terms.transportTerm}</p>
                          </div>
                        )}
                        {quotation.terms.deliveryTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Delivery Term</label>
                            <p className="text-white">{quotation.terms.deliveryTerm}</p>
                          </div>
                        )}
                        {quotation.terms.packingTerm && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Packing Term</label>
                            <p className="text-white">{quotation.terms.packingTerm}</p>
                          </div>
                        )}
                        {quotation.terms.currency && (
                          <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Currency</label>
                            <p className="text-white">{quotation.terms.currency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Finalize Offer Section */}
                  {hasQuotation && !isFinalized && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      {hasAnyFinalizedOffer && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            ⚠️ Another offer has already been finalized. You cannot finalize additional offers.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Selected Vendor</p>
                          <p className="text-white font-semibold">{selectedVendor.name || `Vendor ${vendorIndex + 1}`}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to finalize the offer from ${selectedVendor.name}?`)) {
                              setSelectedVendorForFinalize(quotation._id);
                              finalizeOfferMutation.mutate(quotation._id);
                            }
                          }}
                          disabled={finalizeOfferMutation.isPending || isSelected || hasAnyFinalizedOffer}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {finalizeOfferMutation.isPending ? 'Finalizing...' : hasAnyFinalizedOffer ? 'Offer Already Finalized' : 'Finalize Offer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isFinalized && (
                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MdCheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-green-400 font-semibold">
                          This offer has been finalized and sent to the customer.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error/Success Messages */}
                  {finalizeOfferMutation.isError && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        Error: {finalizeOfferMutation.error instanceof Error ? finalizeOfferMutation.error.message : 'Failed to finalize offer'}
                      </p>
                    </div>
                  )}
                  
                  {finalizeOfferMutation.isSuccess && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">
                        Offer finalized successfully! The selected vendor has been notified.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Banking Details Section */}
        {bankingDetails && bankingDetails.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-6">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-700">Banking Details</h2>
            <div className="space-y-6">
              {bankingDetails.map((banking: any, index: number) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {banking.organizationId?.name || 'Vendor'} - Quotation #{banking.quotationId?.quotationNumber || 'N/A'}
                    </h3>
                    {banking.submittedAt && (
                      <span className="text-sm text-gray-400">
                        Submitted: {new Date(banking.submittedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Bank Name</label>
                      <p className="text-white font-semibold">{banking.bankName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Account Holder Name</label>
                      <p className="text-white font-semibold">{banking.accountHolderName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Account Number</label>
                      <p className="text-white font-semibold">{banking.accountNumber}</p>
                    </div>
                    {banking.accountType && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Account Type</label>
                        <p className="text-white">{banking.accountType}</p>
                      </div>
                    )}
                    {banking.bankSwiftCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">SWIFT Code</label>
                        <p className="text-white">{banking.bankSwiftCode}</p>
                      </div>
                    )}
                    {banking.bankIBAN && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">IBAN</label>
                        <p className="text-white">{banking.bankIBAN}</p>
                      </div>
                    )}
                    {banking.routingNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Routing Number</label>
                        <p className="text-white">{banking.routingNumber}</p>
                      </div>
                    )}
                    {banking.bankAddress && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-400 block mb-1">Bank Address</label>
                        <p className="text-white">{banking.bankAddress}</p>
                      </div>
                    )}
                    {banking.bankCity && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Bank City</label>
                        <p className="text-white">{banking.bankCity}</p>
                      </div>
                    )}
                    {banking.bankCountry && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Bank Country</label>
                        <p className="text-white">{banking.bankCountry}</p>
                      </div>
                    )}
                    {banking.branchName && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Branch Name</label>
                        <p className="text-white">{banking.branchName}</p>
                      </div>
                    )}
                    {banking.branchCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Branch Code</label>
                        <p className="text-white">{banking.branchCode}</p>
                      </div>
                    )}
                    {banking.currency && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Currency</label>
                        <p className="text-white">{banking.currency}</p>
                      </div>
                    )}
                    {banking.notes && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-400 block mb-1">Notes</label>
                        <p className="text-white">{banking.notes}</p>
                      </div>
                    )}
                  </div>
                  {banking.documents && banking.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <label className="text-sm font-medium text-gray-400 block mb-2">Uploaded Documents</label>
                      <div className="space-y-2">
                        {banking.documents.map((doc: any, docIndex: number) => (
                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-gray-600/50 rounded">
                            <span className="text-sm text-white">{doc.fileName}</span>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Payment Submission Forms - One for each banking detail */}
              {bankingDetails.map((banking: any, index: number) => {
                const quotationId = banking.quotationId?._id || banking.quotationId;
                const existingPaymentProof = paymentProofs?.find(
                  (proof: any) => proof.quotationId?._id?.toString() === quotationId?.toString() || 
                                 proof.quotationId?.toString() === quotationId?.toString()
                );
                
                return (
                  <div key={`payment-${index}`}>
                    <PaymentSubmissionForm
                      quotationId={quotationId}
                      bankingDetails={banking}
                      existingPaymentProof={existingPaymentProof}
                    />
                    {/* Shipping Selection - Show after payment is approved */}
                    {existingPaymentProof?.status === 'approved' && (
                      <ShippingSelectionForm
                        quotationId={quotationId}
                        paymentProof={existingPaymentProof}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RFQ Items (Original Requirements) */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">RFQ Items (Original Requirements)</h2>
          {rfqItems && rfqItems.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">#</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">IMPA No</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Description</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Part No</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Alt Part No</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Position No</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">W x B x H</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Required Qty</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">UOM</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="p-3 text-white">{idx + 1}</td>
                      <td className="p-3 text-white">{item.impaNo === '-' ? '-' : item.impaNo}</td>
                      <td className="p-3 text-white">{item.description === '-' ? '-' : item.description}</td>
                      <td className="p-3 text-white">{item.partNo === '-' ? '-' : item.partNo}</td>
                      <td className="p-3 text-white">{item.altPartNo === '-' ? '-' : item.altPartNo}</td>
                      <td className="p-3 text-white">{item.positionNo === '-' ? '-' : item.positionNo}</td>
                      <td className="p-3 text-white">{item.dimensions === '-' ? '-' : item.dimensions}</td>
                      <td className="p-3 text-white">
                        {(typeof item.requiredQty === 'number' && item.requiredQty === 0) || 
                         (typeof item.requiredQty === 'string' && (item.requiredQty === '-' || item.requiredQty === ''))
                          ? '-' 
                          : String(item.requiredQty)}
                      </td>
                      <td className="p-3 text-white">{item.uom === '-' ? '-' : item.uom}</td>
                      <td className="p-3 text-white">{item.remark === '-' ? '-' : item.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-400 text-sm">No RFQ items found.</p>
              {process.env.NODE_ENV === 'development' && rfqDetails?.metadata && (
                <details className="mt-4">
                  <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">Debug: View Metadata</summary>
                  <pre className="mt-2 p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-auto max-h-96">
                    {JSON.stringify(rfqDetails.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Payment Submission Form Component
function PaymentSubmissionForm({ 
  quotationId, 
  bankingDetails, 
  existingPaymentProof 
}: { 
  quotationId: string; 
  bankingDetails: any;
  existingPaymentProof?: any;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentAmount: '',
    currency: bankingDetails.currency || 'USD',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    transactionReference: '',
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const submitPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('quotationId', quotationId);
      formData.append('paymentAmount', data.paymentAmount);
      formData.append('currency', data.currency);
      formData.append('paymentDate', data.paymentDate);
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('transactionReference', data.transactionReference || '');
      formData.append('notes', data.notes || '');
      
      // Add uploaded files
      uploadedFiles.forEach((file) => {
        formData.append('proofDocuments', file);
      });

      const response = await authenticatedFetch('/api/v1/customer/payment-proof', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit payment proof');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq-payment-proof'] });
      setShowForm(false);
      setUploadedFiles([]);
      alert('Payment proof submitted successfully! The vendor will be notified via email.');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.paymentAmount || parseFloat(paymentData.paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one payment proof document/image');
      return;
    }
    submitPaymentMutation.mutate(paymentData);
  };

  if (existingPaymentProof) {
    return (
      <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <MdCheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-green-400">
            Payment Done
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Payment Amount</label>
            <p className="text-white font-semibold text-lg">
              {existingPaymentProof.currency || 'USD'} {existingPaymentProof.paymentAmount?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">Payment Date</label>
            <p className="text-white">
              {existingPaymentProof.paymentDate ? new Date(existingPaymentProof.paymentDate).toLocaleDateString() : '-'}
            </p>
          </div>
          {existingPaymentProof.paymentMethod && (
            <div>
              <label className="text-sm font-medium text-gray-400">Payment Method</label>
              <p className="text-white">{existingPaymentProof.paymentMethod}</p>
            </div>
          )}
          {existingPaymentProof.transactionReference && (
            <div>
              <label className="text-sm font-medium text-gray-400">Transaction Reference</label>
              <p className="text-white">{existingPaymentProof.transactionReference}</p>
            </div>
          )}
        </div>
        {existingPaymentProof.proofDocuments && existingPaymentProof.proofDocuments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <label className="text-sm font-medium text-gray-400 block mb-2">Payment Proof Documents</label>
            <div className="space-y-2">
              {existingPaymentProof.proofDocuments.map((doc: any, docIndex: number) => (
                <div key={docIndex} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                  <span className="text-sm text-white">{doc.fileName}</span>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {existingPaymentProof.submittedAt && (
          <p className="text-sm text-gray-400 mt-4">
            Submitted: {new Date(existingPaymentProof.submittedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">
          Submit Payment Proof
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Submit Payment'}
        </button>
      </div>
      <p className="text-sm text-blue-300 mb-4">
        Upload payment proof documents/images after making payment to the vendor's banking details above.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={paymentData.paymentAmount}
                onChange={(e) => setPaymentData({ ...paymentData, paymentAmount: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={paymentData.currency}
                onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="SWIFT">SWIFT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Transaction Reference</label>
              <input
                type="text"
                value={paymentData.transactionReference}
                onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Transaction ID or Reference Number"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={3}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Any additional notes about the payment..."
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Payment Proof (Images/Documents) <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-500 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="payment-proof-upload"
              />
              <label
                htmlFor="payment-proof-upload"
                className="cursor-pointer flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <MdUpload className="w-5 h-5" />
                <span>Click to upload payment proof files</span>
              </label>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-sm text-white">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitPaymentMutation.isPending}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitPaymentMutation.isPending ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </form>
      )}
    </div>
  );
}

// Shipping Selection Form Component
function ShippingSelectionForm({ 
  quotationId, 
  paymentProof 
}: { 
  quotationId: string; 
  paymentProof: any;
}) {
  const queryClient = useQueryClient();
  const [selectedShipping, setSelectedShipping] = useState<'self' | 'vendor-managed' | null>(
    paymentProof.shippingOption || null
  );
  const [showSelfShippingForm, setShowSelfShippingForm] = useState(false);
  const [selfShippingData, setSelfShippingData] = useState({
    awbTrackingNumber: '',
    shippingContactName: '',
    shippingContactEmail: '',
    shippingContactPhone: '',
  });

  const selectShippingMutation = useMutation({
    mutationFn: async (data: { shippingOption: 'self' | 'vendor-managed'; shippingDetails?: any }) => {
      const response = await authenticatedFetch(`/api/v1/customer/payment-proof/${quotationId}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingOption: data.shippingOption,
          ...(data.shippingDetails || {}),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select shipping option');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq-payment-proof'] });
      alert('Shipping option selected successfully! Vendor has been notified.');
      setShowSelfShippingForm(false);
    },
  });

  const handleShippingSelect = (option: 'self' | 'vendor-managed') => {
    if (option === 'self') {
      setSelectedShipping('self');
      setShowSelfShippingForm(true);
    } else {
      if (window.confirm('Are you sure you want to select Vendor Managed Shipping? We will take care of the rest!')) {
        setSelectedShipping('vendor-managed');
        selectShippingMutation.mutate({ shippingOption: 'vendor-managed' });
      }
    }
  };

  const handleSelfShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfShippingData.awbTrackingNumber || !selfShippingData.shippingContactName || !selfShippingData.shippingContactEmail || !selfShippingData.shippingContactPhone) {
      alert('Please fill in all fields: AWB Tracking Number, Contact Name, Email, and Phone Number');
      return;
    }
    selectShippingMutation.mutate({
      shippingOption: 'self',
      shippingDetails: selfShippingData,
    });
  };

  if (paymentProof.shippingOption) {
    return (
      <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <MdCheckCircle className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-400">
            Shipping Option Selected
          </h3>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <p className="text-white font-semibold mb-2">
            {paymentProof.shippingOption === 'self' ? '📦 Self Managed Shipping' : '🚢 Vendor Managed Shipping'}
          </p>
          {paymentProof.shippingOption === 'self' ? (
            <div className="space-y-2 mt-3">
              <p className="text-sm text-gray-300">
                You will arrange your own shipping and logistics.
              </p>
              {paymentProof.awbTrackingNumber && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">AWB Tracking Number:</p>
                  <p className="text-white font-semibold">{paymentProof.awbTrackingNumber}</p>
                  <p className="text-sm text-gray-400 mb-1 mt-2">Contact Name:</p>
                  <p className="text-white">{paymentProof.shippingContactName}</p>
                  <p className="text-sm text-gray-400 mb-1 mt-2">Contact Email:</p>
                  <p className="text-white">{paymentProof.shippingContactEmail}</p>
                  <p className="text-sm text-gray-400 mb-1 mt-2">Contact Phone:</p>
                  <p className="text-white">{paymentProof.shippingContactPhone}</p>
                </div>
              )}
            </div>
          ) : paymentProof.vendorAWBTrackingNumber ? (
            // Show vendor-submitted shipping details
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-blue-400 font-bold mb-3 pb-2 border-b border-blue-500/30">
                📦 Shipping Details from Vendor
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">AWB Tracking Number:</span>
                  <p className="text-white font-semibold">{paymentProof.vendorAWBTrackingNumber}</p>
                </div>
                <div>
                  <span className="text-gray-400">Contact Name:</span>
                  <p className="text-white font-semibold">{paymentProof.vendorShippingContactName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Contact Email:</span>
                  <p className="text-white font-semibold">{paymentProof.vendorShippingContactEmail}</p>
                </div>
                <div>
                  <span className="text-gray-400">Contact Phone:</span>
                  <p className="text-white font-semibold">{paymentProof.vendorShippingContactPhone}</p>
                </div>
                {paymentProof.vendorShippingSubmittedAt && (
                  <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-blue-500/30">
                    Submitted: {new Date(paymentProof.vendorShippingSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">
              😊 We will take care of the rest, chillax! Waiting for vendor to submit shipping details...
            </p>
          )}
          {paymentProof.shippingSelectedAt && (
            <p className="text-xs text-gray-400 mt-3">
              Selected: {new Date(paymentProof.shippingSelectedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-yellow-400">
          🚚 Select Shipping Option
        </h3>
      </div>
      <p className="text-sm text-yellow-300 mb-4">
        Payment has been approved and vendor has started packing. Please select your preferred shipping method:
      </p>

      {!showSelfShippingForm ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleShippingSelect('self')}
            disabled={selectShippingMutation.isPending}
            className="p-6 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-blue-500 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📦</span>
              <h4 className="text-lg font-semibold text-white">Self Managed Shipping</h4>
            </div>
            <p className="text-sm text-gray-300">
              You will arrange your own shipping and logistics
            </p>
          </button>
          <button
            onClick={() => handleShippingSelect('vendor-managed')}
            disabled={selectShippingMutation.isPending}
            className="p-6 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-blue-500 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚢</span>
              <h4 className="text-lg font-semibold text-white">Vendor Managed Shipping</h4>
            </div>
            <p className="text-sm text-gray-300">
              Vendor will handle shipping and logistics for you
            </p>
          </button>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">📦 Self Managed Shipping Details</h4>
            <button
              onClick={() => {
                setShowSelfShippingForm(false);
                setSelectedShipping(null);
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSelfShippingSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                AWB Tracking Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={selfShippingData.awbTrackingNumber}
                onChange={(e) => setSelfShippingData({ ...selfShippingData, awbTrackingNumber: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Enter AWB tracking number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={selfShippingData.shippingContactName}
                onChange={(e) => setSelfShippingData({ ...selfShippingData, shippingContactName: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={selfShippingData.shippingContactEmail}
                onChange={(e) => setSelfShippingData({ ...selfShippingData, shippingContactEmail: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={selfShippingData.shippingContactPhone}
                onChange={(e) => setSelfShippingData({ ...selfShippingData, shippingContactPhone: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-700 text-white"
                placeholder="Enter phone number"
              />
            </div>
            <button
              type="submit"
              disabled={selectShippingMutation.isPending}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectShippingMutation.isPending ? 'Submitting...' : 'Submit Shipping Details'}
            </button>
          </form>
        </div>
      )}

      {selectedShipping === 'vendor-managed' && !showSelfShippingForm && paymentProof?.vendorAWBTrackingNumber && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-400 font-bold mb-3 pb-2 border-b border-blue-500/30">
            📦 Shipping Details from Vendor
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">AWB Tracking Number:</span>
              <p className="text-white font-semibold">{paymentProof.vendorAWBTrackingNumber}</p>
            </div>
            <div>
              <span className="text-gray-400">Contact Name:</span>
              <p className="text-white font-semibold">{paymentProof.vendorShippingContactName}</p>
            </div>
            <div>
              <span className="text-gray-400">Contact Email:</span>
              <p className="text-white font-semibold">{paymentProof.vendorShippingContactEmail}</p>
            </div>
            <div>
              <span className="text-gray-400">Contact Phone:</span>
              <p className="text-white font-semibold">{paymentProof.vendorShippingContactPhone}</p>
            </div>
            {paymentProof.vendorShippingSubmittedAt && (
              <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-blue-500/30">
                Submitted: {new Date(paymentProof.vendorShippingSubmittedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
      {selectedShipping === 'vendor-managed' && !showSelfShippingForm && !paymentProof?.vendorAWBTrackingNumber && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 font-semibold text-center">
            😊 We will take care of the rest, chillax! Waiting for vendor to submit shipping details...
          </p>
        </div>
      )}

      {selectShippingMutation.isPending && (
        <p className="text-sm text-yellow-300 mt-4 text-center">Processing...</p>
      )}
    </div>
  );
}
