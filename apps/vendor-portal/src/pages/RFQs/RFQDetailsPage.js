import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdArrowBack, MdUpload, MdDelete, MdCheckCircle } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useState } from 'react';
import React from 'react';
export function RFQDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showQuotationForm, setShowQuotationForm] = useState(false);
    const [quotationItems, setQuotationItems] = useState([]);
    const [quotationTerms, setQuotationTerms] = useState({
        currency: 'USD',
    });
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const { data: rfqDetails, isLoading, error } = useQuery({
        queryKey: ['vendor-rfq-details', id],
        queryFn: async () => {
            if (!id)
                throw new Error('RFQ ID is required');
            const response = await authenticatedFetch(`/api/v1/vendor/rfq/${id}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch RFQ details' }));
                throw new Error(errorData.error || 'Failed to fetch RFQ details');
            }
            const data = await response.json();
            return data.data;
        },
        enabled: !!id,
        retry: 1,
    });
    // Check if quotation already exists for this RFQ
    const { data: existingQuotation } = useQuery({
        queryKey: ['vendor-quotation', id],
        queryFn: async () => {
            if (!id)
                return null;
            try {
                const response = await authenticatedFetch(`/api/v1/vendor/quotation/rfq/${id}`);
                if (!response.ok) {
                    return null; // No quotation exists
                }
                const data = await response.json();
                return data.data || null;
            }
            catch {
                return null;
            }
        },
        enabled: !!id,
    });
    // Fetch banking details for this quotation
    const { data: bankingDetails } = useQuery({
        queryKey: ['banking-details', existingQuotation?._id],
        queryFn: async () => {
            if (!existingQuotation?._id)
                return null;
            try {
                const response = await authenticatedFetch(`/api/v1/vendor/banking-details/quotation/${existingQuotation._id}`);
                if (!response.ok)
                    return null;
                const data = await response.json();
                return data.data;
            }
            catch {
                return null;
            }
        },
        enabled: !!existingQuotation?._id && existingQuotation?.status === 'finalized',
    });
    // Fetch payment proof for this quotation
    // Only fetch if quotation is finalized (payment can only be uploaded after finalization)
    const { data: paymentProof, isLoading: isLoadingPaymentProof, error: paymentProofError, refetch: refetchPaymentProof } = useQuery({
        queryKey: ['vendor-payment-proof', existingQuotation?._id, existingQuotation?.status],
        queryFn: async () => {
            if (!existingQuotation?._id) {
                console.log('⚠️ No quotation ID, skipping payment proof fetch');
                return null;
            }
            try {
                // Add timestamp to prevent caching
                const timestamp = Date.now();
                const url = `/api/v1/vendor/payment-proof/quotation/${existingQuotation._id}?t=${timestamp}`;
                console.log('🔍 Fetching payment proof from:', url);
                const response = await authenticatedFetch(url);
                if (!response.ok) {
                    // If 404, it means no payment proof yet - return null (not an error)
                    if (response.status === 404) {
                        console.log('⚠️ No payment proof found (404) for quotation:', existingQuotation._id);
                        return null;
                    }
                    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch payment proof' }));
                    console.error('❌ Payment proof fetch error:', errorData, 'Status:', response.status);
                    // Don't throw for other errors - just return null
                    return null;
                }
                const data = await response.json();
                console.log('✅ Payment proof fetched successfully:', {
                    hasData: !!data.data,
                    status: data.data?.status,
                    quotationId: existingQuotation._id,
                    paymentAmount: data.data?.paymentAmount,
                    vendorOrgId: data.data?.vendorOrganizationId,
                    timestamp: new Date().toISOString(),
                    fullData: data.data // Log full data for debugging
                });
                // Ensure we return the data correctly
                if (data.data) {
                    return data.data;
                }
                return null;
            }
            catch (error) {
                console.error('❌ Error fetching payment proof:', error);
                // Return null but log the error for debugging
                return null;
            }
        },
        enabled: !!existingQuotation?._id && existingQuotation?.status === 'finalized', // Only fetch when quotation is finalized
        refetchInterval: (queryResult) => {
            // If payment is approved but shipping not selected yet, refetch to check for shipping decision
            if (queryResult?.data?.status === 'approved' && !queryResult?.data?.shippingOption) {
                return 10000; // Refetch every 10 seconds to check for shipping decision
            }
            // If awaiting payment (no payment proof yet), refetch every 10 seconds
            if (!queryResult?.data) {
                return 10000;
            }
            // Otherwise, don't auto-refetch
            return false;
        },
        refetchIntervalInBackground: false, // Don't refetch when tab is in background
        refetchOnWindowFocus: true, // Refetch when window gains focus
        refetchOnMount: 'always', // Always refetch on mount, even if data exists in cache
        refetchOnReconnect: true, // Refetch when network reconnects
        staleTime: 0, // Always consider data stale, so it refetches
        gcTime: 0, // Don't cache (gcTime in React Query v5, replaces cacheTime)
        retry: 1, // Retry failed requests once
    });
    // Force refetch payment proof when quotation ID changes or component mounts
    React.useEffect(() => {
        if (existingQuotation?._id && existingQuotation?.status === 'finalized') {
            console.log('🔄 Component mounted/updated, refetching payment proof for quotation:', existingQuotation._id);
            // Small delay to ensure query is enabled
            const timer = setTimeout(() => {
                refetchPaymentProof().then((result) => {
                    console.log('🔄 Initial refetch completed:', {
                        hasData: !!result.data,
                        status: result.data?.status,
                        quotationId: existingQuotation._id
                    });
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [existingQuotation?._id, existingQuotation?.status, refetchPaymentProof]);
    // Refetch payment proof when page becomes visible (user switches back to tab)
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && existingQuotation?._id && existingQuotation?.status === 'finalized') {
                console.log('👁️ Tab became visible, refetching payment proof');
                // Refetch when tab becomes visible
                refetchPaymentProof().then((result) => {
                    console.log('👁️ Visibility refetch completed:', {
                        hasData: !!result.data,
                        status: result.data?.status
                    });
                });
                queryClient.invalidateQueries({ queryKey: ['vendor-payment-proof', existingQuotation._id] });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [existingQuotation?._id, existingQuotation?.status, refetchPaymentProof, queryClient]);
    // Debug: Log payment proof state changes
    React.useEffect(() => {
        if (existingQuotation?._id && existingQuotation?.status === 'finalized') {
            console.log('📊 Payment proof state:', {
                hasPaymentProof: !!paymentProof,
                paymentProofStatus: paymentProof?.status,
                isLoading: isLoadingPaymentProof,
                quotationId: existingQuotation._id,
                timestamp: new Date().toISOString()
            });
        }
    }, [paymentProof, isLoadingPaymentProof, existingQuotation?._id, existingQuotation?.status]);
    // Extract RFQ items from metadata
    const rfqItems = React.useMemo(() => {
        if (!rfqDetails)
            return [];
        const items = rfqDetails.metadata?.items || [];
        if (Array.isArray(items) && items.length > 0) {
            return items.map((item) => {
                // Parse requiredQuantity - handle both string and number, and empty values
                let requiredQty = '-';
                const requiredQuantity = item.requiredQuantity || item.requiredQty;
                if (requiredQuantity !== undefined && requiredQuantity !== null && requiredQuantity !== '') {
                    const parsed = typeof requiredQuantity === 'string'
                        ? parseFloat(requiredQuantity)
                        : Number(requiredQuantity);
                    if (!isNaN(parsed) && parsed >= 0) {
                        requiredQty = parsed;
                    }
                }
                return {
                    impaNo: item.impaNo || '-',
                    description: item.itemDescription || item.description || '-',
                    partNo: item.partNo || '-',
                    altPartNo: item.altPartNo || '-',
                    positionNo: item.positionNo || '-',
                    dimensions: item.dimensions || '-',
                    requiredQty: requiredQty,
                    uom: item.uom || '-',
                    remark: item.generalRemark || item.remark || '-',
                };
            });
        }
        return [];
    }, [rfqDetails]);
    // Initialize quotation items from RFQ items
    React.useEffect(() => {
        if (rfqItems.length > 0 && quotationItems.length === 0) {
            setQuotationItems(rfqItems.map((item) => {
                // Parse requiredQty - convert string numbers to numbers, handle '-' and empty values
                let requiredQtyNum = 0;
                if (typeof item.requiredQty === 'number') {
                    requiredQtyNum = item.requiredQty;
                }
                else if (typeof item.requiredQty === 'string' && item.requiredQty !== '-' && item.requiredQty !== '') {
                    const parsed = parseFloat(item.requiredQty);
                    if (!isNaN(parsed) && parsed >= 0) {
                        requiredQtyNum = parsed;
                    }
                }
                return {
                    description: item.description,
                    requiredQty: requiredQtyNum,
                    quotedPrice: '', // Start blank
                    offeredQty: requiredQtyNum > 0 ? requiredQtyNum : '', // Pre-fill only if there's a required quantity
                    offeredQuality: 'Standard',
                };
            }));
        }
    }, [rfqItems]);
    const submitQuotationMutation = useMutation({
        mutationFn: async (quotationData) => {
            const response = await authenticatedFetch('/api/v1/vendor/quotation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quotationData),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit quotation');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-rfq-details', id] });
            queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
            setShowQuotationForm(false);
            alert('Quotation submitted successfully! The customer will be notified.');
        },
    });
    const handleSubmitQuotation = () => {
        if (!rfqDetails || !id)
            return;
        if (quotationItems.length === 0) {
            alert('Please add at least one quotation item');
            return;
        }
        const totalAmount = quotationItems.reduce((sum, item) => {
            const price = typeof item.quotedPrice === 'number' ? item.quotedPrice : (parseFloat(String(item.quotedPrice)) || 0);
            const qty = typeof item.offeredQty === 'number' ? item.offeredQty : (parseInt(String(item.offeredQty)) || 0);
            return sum + price * qty;
        }, 0);
        // Transform items for backend - convert empty strings to 0
        const transformedItems = quotationItems.map((item) => ({
            ...item,
            quotedPrice: typeof item.quotedPrice === 'string' && item.quotedPrice === ''
                ? 0
                : (typeof item.quotedPrice === 'number' ? item.quotedPrice : parseFloat(String(item.quotedPrice)) || 0),
            offeredQty: typeof item.offeredQty === 'string' && item.offeredQty === ''
                ? 0
                : (typeof item.offeredQty === 'number' ? item.offeredQty : parseInt(String(item.offeredQty)) || 0),
        }));
        submitQuotationMutation.mutate({
            rfqId: id,
            title: title || `Quotation for ${rfqDetails.rfqNumber}`,
            description: description || '',
            status: 'submitted',
            totalAmount,
            currency: quotationTerms.currency || 'USD',
            items: transformedItems,
            metadata: {
                terms: quotationTerms,
                items: quotationItems, // Keep original format in metadata
            },
        });
    };
    const updateQuotationItem = (index, field, value) => {
        setQuotationItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };
    if (isLoading) {
        return (<div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (error || !rfqDetails) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load RFQ details';
        return (<div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6">
          <p className="text-[hsl(var(--destructive))] mb-2 text-lg font-semibold">Failed to Load RFQ</p>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">{errorMessage}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/rfqs')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to RFQs
            </button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>);
    }
    // Extract vessel info
    const vesselInfo = rfqDetails.vesselId || {};
    const hullNumber = rfqDetails.metadata?.hullNo || rfqDetails.metadata?.hullNumber || vesselInfo?.hullNumber || vesselInfo?.hullNo || '-';
    const serialNumber = rfqDetails.metadata?.serialNumber || vesselInfo?.serialNumber || '-';
    // Extract equipment info
    const subCategory = rfqDetails.metadata?.subCategory || rfqDetails.subCategory || '-';
    const equipmentTags = rfqDetails.metadata?.equipmentTags || rfqDetails.equipmentTags || '-';
    const drawingNumber = rfqDetails.metadata?.drawingNumber || rfqDetails.drawingNumber || '-';
    // Extract supply info
    const preferredQuality = rfqDetails.metadata?.preferredQuality || rfqDetails.preferredQuality || '-';
    const leadDate = rfqDetails.metadata?.leadDate || rfqDetails.leadDate || '-';
    const incoterms = rfqDetails.metadata?.typeOfIncoterms || rfqDetails.metadata?.incoterms || rfqDetails.incoterms || '-';
    const logisticContainer = rfqDetails.metadata?.typeOfLogisticContainer || rfqDetails.metadata?.logisticContainer || rfqDetails.logisticContainer || '-';
    const createdDate = rfqDetails.metadata?.createdDate || rfqDetails.createdAt || '-';
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
        catch {
            return '-';
        }
    };
    return (<div className="w-full min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/rfqs')} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
            <MdArrowBack className="w-6 h-6"/>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              RFQ Details
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] mt-1">
              {rfqDetails.rfqNumber || rfqDetails.title}
            </p>
          </div>
        </div>

        {/* RFQ Information */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
            RFQ Information
          </h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                RFQ Number
              </label>
              <p className="text-[hsl(var(--foreground))] font-semibold">{rfqDetails.rfqNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Customer
              </label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.senderId?.name || 'N/A'}</p>
            </div>
            {rfqDetails.metadata?.remarks && (<div className="col-span-2">
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                  Remarks
                </label>
                <p className="text-[hsl(var(--foreground))]">{rfqDetails.metadata.remarks}</p>
              </div>)}
          </div>
        </div>

        {/* Vessel Information */}
        {(vesselInfo?.name || vesselInfo?._id || rfqDetails.vesselId) && (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
              Vessel Information
            </h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                  Vessel Name
                </label>
                <p className="text-[hsl(var(--foreground))]">{vesselInfo?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                  IMO No
                </label>
                <p className="text-[hsl(var(--foreground))]">{vesselInfo?.imoNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                  HULL No
                </label>
                <p className="text-[hsl(var(--foreground))]">{hullNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                  Serial Number
                </label>
                <p className="text-[hsl(var(--foreground))]">{serialNumber}</p>
              </div>
            </div>
          </div>)}

        {/* Equipment Information */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
            Equipment Information
          </h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Brand
              </label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.brand || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Model
              </label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.model || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Category
              </label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.category || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Sub Category
              </label>
              <p className="text-[hsl(var(--foreground))]">{subCategory}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Equipment Tags
              </label>
              <p className="text-[hsl(var(--foreground))]">{equipmentTags}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Drawing Number
              </label>
              <p className="text-[hsl(var(--foreground))]">{drawingNumber}</p>
            </div>
          </div>
        </div>

        {/* Supply Information */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
            Supply Information
          </h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Supply Port
              </label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.supplyPort || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Preferred Quality
              </label>
              <p className="text-[hsl(var(--foreground))]">{preferredQuality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Lead Date
              </label>
              <p className="text-[hsl(var(--foreground))]">{formatDate(leadDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Type of Incoterms
              </label>
              <p className="text-[hsl(var(--foreground))]">{incoterms}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Type of Logistic Container
              </label>
              <p className="text-[hsl(var(--foreground))]">{logisticContainer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                Created Date
              </label>
              <p className="text-[hsl(var(--foreground))]">{createdDate !== '-' ? formatDate(createdDate) : formatDate(rfqDetails.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* RFQ Items (Original Requirements) */}
        {rfqItems && rfqItems.length > 0 && (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
              RFQ Items (Original Requirements)
            </h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left p-3 text-sm font-semibold">#</th>
                    <th className="text-left p-3 text-sm font-semibold">IMPA No</th>
                    <th className="text-left p-3 text-sm font-semibold">Description</th>
                    <th className="text-left p-3 text-sm font-semibold">Part No</th>
                    <th className="text-left p-3 text-sm font-semibold">Alt Part No</th>
                    <th className="text-left p-3 text-sm font-semibold">Position No</th>
                    <th className="text-left p-3 text-sm font-semibold">W x B x H</th>
                    <th className="text-left p-3 text-sm font-semibold">Required Qty</th>
                    <th className="text-left p-3 text-sm font-semibold">UOM</th>
                    <th className="text-left p-3 text-sm font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqItems.map((item, idx) => (<tr key={idx} className="border-b border-[hsl(var(--border))]">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3">{item.impaNo === '-' ? '-' : item.impaNo}</td>
                      <td className="p-3">{item.description === '-' ? '-' : item.description}</td>
                      <td className="p-3">{item.partNo === '-' ? '-' : item.partNo}</td>
                      <td className="p-3">{item.altPartNo === '-' ? '-' : item.altPartNo}</td>
                      <td className="p-3">{item.positionNo === '-' ? '-' : item.positionNo}</td>
                      <td className="p-3">{item.dimensions === '-' ? '-' : item.dimensions}</td>
                      <td className="p-3">
                        {(typeof item.requiredQty === 'number' && item.requiredQty === 0) ||
                    (typeof item.requiredQty === 'string' && (item.requiredQty === '-' || item.requiredQty === ''))
                    ? '-'
                    : String(item.requiredQty)}
                      </td>
                      <td className="p-3">{item.uom === '-' ? '-' : item.uom}</td>
                      <td className="p-3">{item.remark === '-' ? '-' : item.remark}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>)}

        {/* Submit Quotation Section or Submitted Quotation Details */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
          {existingQuotation ? (
        // Show submitted quotation details
        <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Submitted Quotation
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${existingQuotation.status === 'finalized'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : existingQuotation.status === 'submitted'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                  {existingQuotation.status === 'finalized' ? 'Finalized' : existingQuotation.status === 'submitted' ? 'Submitted' : existingQuotation.status}
                </span>
              </div>

              {/* Quotation Information */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                    Quotation Number
                  </label>
                  <p className="text-[hsl(var(--foreground))] font-semibold">{existingQuotation.quotationNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                    Title
                  </label>
                  <p className="text-[hsl(var(--foreground))]">{existingQuotation.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                    Total Amount
                  </label>
                  <p className="text-[hsl(var(--foreground))] font-semibold text-lg">
                    {existingQuotation.currency} {existingQuotation.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                    Submitted At
                  </label>
                  <p className="text-[hsl(var(--foreground))]">
                    {existingQuotation.submittedAt ? new Date(existingQuotation.submittedAt).toLocaleString() : '-'}
                  </p>
                </div>
                {existingQuotation.description && (<div className="col-span-2">
                    <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">
                      Description
                    </label>
                    <p className="text-[hsl(var(--foreground))]">{existingQuotation.description}</p>
                  </div>)}
              </div>

              {/* Quotation Items Table */}
              {existingQuotation.items && existingQuotation.items.length > 0 && (<div>
                  <h3 className="text-lg font-semibold mb-4">Quotation Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold">Description</th>
                          <th className="text-left p-3 text-sm font-semibold">Required Qty</th>
                          <th className="text-left p-3 text-sm font-semibold">Quoted Price</th>
                          <th className="text-left p-3 text-sm font-semibold">Offered Qty</th>
                          <th className="text-left p-3 text-sm font-semibold">Offered Quality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingQuotation.items.map((item, idx) => (<tr key={idx} className="border-b border-[hsl(var(--border))]">
                            <td className="p-3">{item.description || '-'}</td>
                            <td className="p-3">{item.requiredQty || '-'}</td>
                            <td className="p-3">{existingQuotation.currency} {item.quotedPrice?.toFixed(2) || '0.00'}</td>
                            <td className="p-3">{item.offeredQty || '-'}</td>
                            <td className="p-3">{item.offeredQuality || '-'}</td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>)}

              {/* Terms & Conditions */}
              {existingQuotation.terms && (<div>
                  <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {existingQuotation.terms.creditType && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Credit Type</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.creditType}</p>
                      </div>)}
                    {existingQuotation.terms.paymentTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Payment Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.paymentTerm}</p>
                      </div>)}
                    {existingQuotation.terms.insuranceTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Insurance Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.insuranceTerm}</p>
                      </div>)}
                    {existingQuotation.terms.taxTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Tax Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.taxTerm}</p>
                      </div>)}
                    {existingQuotation.terms.transportTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Transport Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.transportTerm}</p>
                      </div>)}
                    {existingQuotation.terms.deliveryTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Delivery Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.deliveryTerm}</p>
                      </div>)}
                    {existingQuotation.terms.packingTerm && (<div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-1">Packing Term</label>
                        <p className="text-[hsl(var(--foreground))]">{existingQuotation.terms.packingTerm}</p>
                      </div>)}
                  </div>
                </div>)}

              {/* Banking Details Form - Show only if quotation is finalized */}
              {existingQuotation.status === 'finalized' ? (<div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-[hsl(var(--border))]">
                    Banking Details Required
                  </h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    Please provide your banking details to receive payment for this quotation. The customer will be notified via email.
                  </p>
                  <BankingDetailsForm quotationId={existingQuotation._id}/>
                  
                  {/* Show "Awaiting Payment" or "Payment Received" message after banking details are submitted */}
                  {bankingDetails && !paymentProof && !isLoadingPaymentProof && (<div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                          ⏳ Awaiting Payment
                        </h3>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Banking details have been submitted. Waiting for customer to upload payment proof. You will receive an email notification when payment is received.
                      </p>
                    </div>)}
                  
                  {/* Show "Payment Received" when payment proof exists but not yet approved */}
                  {bankingDetails && paymentProof && paymentProof.status !== 'approved' && !isLoadingPaymentProof && (<div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400"/>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          ✅ Payment Received
                        </h3>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Payment proof has been received from the customer. Please review the payment details and proceed with shipping.
                      </p>
                      {paymentProof.paymentAmount && (<div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {paymentProof.currency || 'USD'} {paymentProof.paymentAmount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Date:</span>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {paymentProof.paymentDate ? new Date(paymentProof.paymentDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>)}
                    </div>)}
                </div>) : existingQuotation.status === 'rejected' ? (<div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg">
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                      ❌ Offer Rejected
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This offer has been rejected by the customer.
                    </p>
                  </div>
                </div>) : null}

              {/* Payment Confirmed Section - Show when payment is uploaded (before approval) */}
              {/* This section is OUTSIDE the Banking Details block to ensure it shows when payment proof exists */}
              {existingQuotation.status === 'finalized' && paymentProof && paymentProof.status !== 'approved' && (<div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MdCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400"/>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                        ✅ Payment Confirmed
                      </h3>
                    </div>
                    <button onClick={async () => {
                    console.log('🔄 Manual refresh triggered from Payment Confirmed');
                    const result = await refetchPaymentProof();
                    console.log('🔄 Refresh result:', result);
                    queryClient.invalidateQueries({ queryKey: ['vendor-payment-proof', existingQuotation._id] });
                }} className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30" title="Refresh payment status">
                      🔄 Refresh
                    </button>
                  </div>
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (<div className="mb-2 text-xs text-gray-500">
                      Debug: paymentProof exists, status={paymentProof.status}, quotationId={existingQuotation._id}
                    </div>)}
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Customer has submitted payment proof. You can now start shipping the order.
                  </p>
                  
                  {/* Payment Details Summary */}
                  <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Payment Amount</label>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                          {paymentProof.currency || 'USD'} {paymentProof.paymentAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Payment Date</label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {paymentProof.paymentDate ? new Date(paymentProof.paymentDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    {paymentProof.proofDocuments && paymentProof.proofDocuments.length > 0 && (<div className="mt-3 pt-3 border-t border-green-200 dark:border-gray-700">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                          Payment Proof Documents ({paymentProof.proofDocuments.length})
                        </label>
                        <div className="space-y-1">
                          {paymentProof.proofDocuments.slice(0, 2).map((doc, docIndex) => (<div key={docIndex} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300 truncate">{doc.fileName}</span>
                              {doc.fileUrl && (<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2">
                                  View
                                </a>)}
                            </div>))}
                          {paymentProof.proofDocuments.length > 2 && (<p className="text-xs text-gray-500 dark:text-gray-400">
                              +{paymentProof.proofDocuments.length - 2} more document(s)
                            </p>)}
                        </div>
                      </div>)}
                  </div>

                  {/* Start Shipping Button */}
                  <button onClick={async () => {
                    if (window.confirm('Are you sure you want to start shipping? This will notify the customer to select their shipping preference.')) {
                        try {
                            const response = await authenticatedFetch(`/api/v1/vendor/payment-proof/${existingQuotation._id}/approve`, { method: 'POST' });
                            if (response.ok) {
                                alert('Shipping started! Customer has been notified to select shipping preference.');
                                // Refetch payment proof to show updated status
                                await refetchPaymentProof();
                                queryClient.invalidateQueries({ queryKey: ['vendor-payment-proof', existingQuotation._id] });
                            }
                            else {
                                const error = await response.json();
                                alert(error.error || 'Failed to start shipping');
                            }
                        }
                        catch (error) {
                            alert('Failed to start shipping');
                        }
                    }
                }} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <MdCheckCircle className="w-5 h-5"/>
                    Start Shipping
                  </button>
                  
                  {paymentProof.submittedAt && (<p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                      Payment received: {new Date(paymentProof.submittedAt).toLocaleString()}
                    </p>)}
                </div>)}

              {/* Payment Details Section - Show only after payment is approved */}
              {existingQuotation.status === 'finalized' && paymentProof && paymentProof.status === 'approved' && (<div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[hsl(var(--border))]">
                    <h2 className="text-xl font-semibold">
                      Payment Details
                    </h2>
                    <button onClick={async () => {
                    await refetchPaymentProof();
                    queryClient.invalidateQueries({ queryKey: ['vendor-payment-proof', existingQuotation._id] });
                }} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Refresh payment details">
                      🔄 Refresh
                    </button>
                  </div>
                  {isLoadingPaymentProof ? (<div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading payment details...</p>
                    </div>) : paymentProof ? (<div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <MdCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400"/>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                          💰 Payment Received
                        </h3>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                        Customer has submitted payment proof for this quotation. Please review the payment details below.
                      </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Payment Amount</label>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                        {paymentProof.currency || 'USD'} {paymentProof.paymentAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Payment Date</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {paymentProof.paymentDate ? new Date(paymentProof.paymentDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    {paymentProof.paymentMethod && (<div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Payment Method</label>
                        <p className="text-gray-900 dark:text-gray-100">{paymentProof.paymentMethod}</p>
                      </div>)}
                    {paymentProof.transactionReference && (<div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Transaction Reference</label>
                        <p className="text-gray-900 dark:text-gray-100">{paymentProof.transactionReference}</p>
                      </div>)}
                    {paymentProof.notes && (<div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Notes</label>
                        <p className="text-gray-900 dark:text-gray-100">{paymentProof.notes}</p>
                      </div>)}
                  </div>
                  {paymentProof.proofDocuments && paymentProof.proofDocuments.length > 0 && (<div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                        Payment Proof Documents
                      </label>
                      <div className="space-y-2">
                        {paymentProof.proofDocuments.map((doc, docIndex) => (<div key={docIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-gray-700">
                            <span className="text-sm text-gray-900 dark:text-gray-100">{doc.fileName}</span>
                            {doc.fileUrl && (<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                                View
                              </a>)}
                          </div>))}
                      </div>
                    </div>)}
                      {paymentProof.submittedAt && (<p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                          Payment proof received: {new Date(paymentProof.submittedAt).toLocaleString()}
                        </p>)}
                      {paymentProof.approvedAt && (<div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                              ✅ Payment Approved
                            </p>
                            {paymentProof.shippingOption ? (<div className="mt-3">
                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                  Shipping Decision: {paymentProof.shippingOption === 'self' ? '📦 Self Managed Shipping' : '🚢 Vendor Managed Shipping'}
                                </p>
                                {paymentProof.shippingOption === 'self' && (<div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">AWB Tracking Number:</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                      {paymentProof.awbTrackingNumber || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contact Name:</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                                      {paymentProof.shippingContactName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contact Email:</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                                      {paymentProof.shippingContactEmail || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contact Phone:</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                      {paymentProof.shippingContactPhone || 'N/A'}
                                    </p>
                                  </div>)}
                                {paymentProof.shippingOption === 'vendor-managed' && (<div className="mt-3">
                                    {paymentProof.vendorAWBTrackingNumber ? (
                                // Show submitted shipping details
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-md">
                                        <h4 className="text-sm font-bold text-green-900 dark:text-green-100 mb-3 pb-2 border-b border-green-200 dark:border-green-700">
                                          ✅ Shipping Details Submitted
                                        </h4>
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AWB Tracking Number:</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {paymentProof.vendorAWBTrackingNumber}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Name:</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {paymentProof.vendorShippingContactName}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Email:</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {paymentProof.vendorShippingContactEmail}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Phone:</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {paymentProof.vendorShippingContactPhone}
                                            </p>
                                          </div>
                                        </div>
                                        {paymentProof.vendorShippingSubmittedAt && (<p className="text-xs text-green-600 dark:text-green-400 mt-3 pt-2 border-t border-green-200 dark:border-green-700">
                                            Submitted: {new Date(paymentProof.vendorShippingSubmittedAt).toLocaleString()}
                                          </p>)}
                                      </div>) : (
                                // Show form to submit shipping details
                                <VendorShippingDetailsForm quotationId={existingQuotation._id} paymentProof={paymentProof}/>)}
                                  </div>)}
                                {paymentProof.shippingSelectedAt && (<p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                                    Selected: {new Date(paymentProof.shippingSelectedAt).toLocaleString()}
                                  </p>)}
                              </div>) : (<p className="text-sm text-blue-700 dark:text-blue-300">
                                Waiting for customer to select shipping option...
                              </p>)}
                            {paymentProof.approvedAt && (<p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Approved: {new Date(paymentProof.approvedAt).toLocaleString()}
                              </p>)}
                          </div>
                        </div>)}
                    </div>) : null}
                </div>)}
            </div>) : (
        // Show submit quotation form
        <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Submit Quotation
                </h2>
                <button onClick={() => setShowQuotationForm(!showQuotationForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {showQuotationForm ? 'Cancel' : 'Submit Quotation'}
                </button>
              </div>

              {showQuotationForm && (<div className="space-y-6 mt-6">
              {/* Quotation Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quotation Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Quotation for ${rfqDetails.rfqNumber}`} className="w-full p-2 border rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select value={quotationTerms.currency || 'USD'} onChange={(e) => setQuotationTerms({ ...quotationTerms, currency: e.target.value })} className="w-full p-2 border rounded-lg">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quotation description..." rows={3} className="w-full p-2 border rounded-lg"/>
              </div>

              {/* Quotation Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quotation Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-sm font-semibold">Description</th>
                        <th className="text-left p-2 text-sm font-semibold">Required Qty</th>
                        <th className="text-left p-2 text-sm font-semibold">Quoted Price</th>
                        <th className="text-left p-2 text-sm font-semibold">Offered Qty</th>
                        <th className="text-left p-2 text-sm font-semibold">Offered Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationItems.map((item, idx) => (<tr key={idx} className="border-b">
                          <td className="p-2">
                            <input type="text" value={item.description} onChange={(e) => updateQuotationItem(idx, 'description', e.target.value)} className="w-full p-1 border rounded"/>
                          </td>
                          <td className="p-2">{item.requiredQty}</td>
                          <td className="p-2">
                            <input type="number" step="0.01" value={item.quotedPrice === '' || item.quotedPrice === 0 ? '' : item.quotedPrice} onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, otherwise parse as number
                        updateQuotationItem(idx, 'quotedPrice', value === '' ? '' : (parseFloat(value) || ''));
                    }} placeholder="0.00" className="w-full p-1 border rounded"/>
                          </td>
                          <td className="p-2">
                            <input type="number" value={item.offeredQty === '' || item.offeredQty === 0 ? '' : item.offeredQty} onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, otherwise parse as number
                        updateQuotationItem(idx, 'offeredQty', value === '' ? '' : (parseInt(value) || ''));
                    }} placeholder="0" className="w-full p-1 border rounded"/>
                          </td>
                          <td className="p-2">
                            <input type="text" value={item.offeredQuality} onChange={(e) => updateQuotationItem(idx, 'offeredQuality', e.target.value)} className="w-full p-1 border rounded"/>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Credit Type</label>
                    <input type="text" value={quotationTerms.creditType || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, creditType: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Term</label>
                    <input type="text" value={quotationTerms.paymentTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, paymentTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Insurance Term</label>
                    <input type="text" value={quotationTerms.insuranceTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, insuranceTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax Term</label>
                    <input type="text" value={quotationTerms.taxTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, taxTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Transport Term</label>
                    <input type="text" value={quotationTerms.transportTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, transportTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Term</label>
                    <input type="text" value={quotationTerms.deliveryTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, deliveryTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Packing Term</label>
                    <input type="text" value={quotationTerms.packingTerm || ''} onChange={(e) => setQuotationTerms({ ...quotationTerms, packingTerm: e.target.value })} className="w-full p-2 border rounded-lg"/>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button onClick={() => setShowQuotationForm(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmitQuotation} disabled={submitQuotationMutation.isPending} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitQuotationMutation.isPending ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>

              {submitQuotationMutation.isError && (<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Error: {submitQuotationMutation.error instanceof Error ? submitQuotationMutation.error.message : 'Failed to submit quotation'}
                  </p>
                </div>)}
            </div>)}
            </>)}
        </div>
      </div>
    </div>);
}
// Vendor Shipping Details Form Component
function VendorShippingDetailsForm({ quotationId, paymentProof }) {
    const queryClient = useQueryClient();
    const [shippingData, setShippingData] = useState({
        awbTrackingNumber: '',
        shippingContactName: '',
        shippingContactEmail: '',
        shippingContactPhone: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitShippingDetailsMutation = useMutation({
        mutationFn: async (data) => {
            const response = await authenticatedFetch(`/api/v1/vendor/payment-proof/${quotationId}/vendor-shipping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit shipping details');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-payment-proof', quotationId] });
            alert('Shipping details submitted successfully! Customer has been notified.');
            setShippingData({
                awbTrackingNumber: '',
                shippingContactName: '',
                shippingContactEmail: '',
                shippingContactPhone: '',
            });
        },
        onError: (error) => {
            alert(error.message || 'Failed to submit shipping details');
        },
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shippingData.awbTrackingNumber || !shippingData.shippingContactName || !shippingData.shippingContactEmail || !shippingData.shippingContactPhone) {
            alert('Please fill in all fields');
            return;
        }
        setIsSubmitting(true);
        try {
            await submitShippingDetailsMutation.mutateAsync(shippingData);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-md">
      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 pb-2 border-b border-blue-200 dark:border-blue-700">
        📦 Submit Shipping Details
      </h4>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        Please provide the AWB tracking number and shipping contact details. The customer will be notified via email.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AWB Tracking Number <span className="text-red-500">*</span>
          </label>
          <input type="text" value={shippingData.awbTrackingNumber} onChange={(e) => setShippingData({ ...shippingData, awbTrackingNumber: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={shippingData.shippingContactName} onChange={(e) => setShippingData({ ...shippingData, shippingContactName: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={shippingData.shippingContactEmail} onChange={(e) => setShippingData({ ...shippingData, shippingContactEmail: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Phone <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={shippingData.shippingContactPhone} onChange={(e) => setShippingData({ ...shippingData, shippingContactPhone: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required/>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? 'Submitting...' : 'Submit Shipping Details'}
        </button>
      </form>
    </div>);
}
// Banking Details Form Component
function BankingDetailsForm({ quotationId }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [bankingData, setBankingData] = useState({
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        accountType: 'Current',
        bankAddress: '',
        bankCity: '',
        bankCountry: '',
        bankSwiftCode: '',
        bankIBAN: '',
        routingNumber: '',
        branchName: '',
        branchCode: '',
        currency: 'USD',
        notes: '',
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    // Check if banking details already exist
    const { data: existingBankingDetails } = useQuery({
        queryKey: ['banking-details', quotationId],
        queryFn: async () => {
            try {
                const response = await authenticatedFetch(`/api/v1/vendor/banking-details/quotation/${quotationId}`);
                if (!response.ok)
                    return null;
                const data = await response.json();
                return data.data;
            }
            catch {
                return null;
            }
        },
        enabled: !!quotationId,
    });
    const submitBankingDetailsMutation = useMutation({
        mutationFn: async (data) => {
            const formData = new FormData();
            Object.keys(data).forEach((key) => {
                if (key !== 'documents' && data[key] !== undefined && data[key] !== '') {
                    formData.append(key, data[key]);
                }
            });
            formData.append('quotationId', quotationId);
            // Add uploaded files
            uploadedFiles.forEach((file) => {
                formData.append('documents', file);
            });
            const response = await authenticatedFetch('/api/v1/vendor/banking-details', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit banking details');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banking-details', quotationId] });
            setShowForm(false);
            alert('Banking details submitted successfully! The customer will be notified via email.');
        },
    });
    const handleFileUpload = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles((prev) => [...prev, ...files]);
        }
    };
    const removeFile = (index) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!bankingData.bankName || !bankingData.accountHolderName || !bankingData.accountNumber) {
            alert('Please fill in all required fields (Bank Name, Account Holder Name, Account Number)');
            return;
        }
        submitBankingDetailsMutation.mutate(bankingData);
    };
    if (existingBankingDetails) {
        return (<div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">
          ✓ Banking Details Submitted
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
            <p className="text-gray-900 dark:text-gray-100">{existingBankingDetails.bankName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Holder</label>
            <p className="text-gray-900 dark:text-gray-100">{existingBankingDetails.accountHolderName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</label>
            <p className="text-gray-900 dark:text-gray-100">{existingBankingDetails.accountNumber}</p>
          </div>
          {existingBankingDetails.bankSwiftCode && (<div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">SWIFT Code</label>
              <p className="text-gray-900 dark:text-gray-100">{existingBankingDetails.bankSwiftCode}</p>
            </div>)}
        </div>
        {existingBankingDetails.submittedAt && (<p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Submitted: {new Date(existingBankingDetails.submittedAt).toLocaleString()}
          </p>)}
      </div>);
    }
    return (<div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
          Banking Details Required
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {showForm ? 'Cancel' : 'Submit Banking Details'}
        </button>
      </div>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        Please provide your banking details to receive payment for this quotation. The customer will be notified via email.
      </p>

      {showForm && (<form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={bankingData.bankName} onChange={(e) => setBankingData({ ...bankingData, bankName: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={bankingData.accountHolderName} onChange={(e) => setBankingData({ ...bankingData, accountHolderName: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={bankingData.accountNumber} onChange={(e) => setBankingData({ ...bankingData, accountNumber: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Type</label>
              <select value={bankingData.accountType} onChange={(e) => setBankingData({ ...bankingData, accountType: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="Current">Current</option>
                <option value="Savings">Savings</option>
                <option value="Checking">Checking</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SWIFT Code</label>
              <input type="text" value={bankingData.bankSwiftCode} onChange={(e) => setBankingData({ ...bankingData, bankSwiftCode: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IBAN</label>
              <input type="text" value={bankingData.bankIBAN} onChange={(e) => setBankingData({ ...bankingData, bankIBAN: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Routing Number</label>
              <input type="text" value={bankingData.routingNumber} onChange={(e) => setBankingData({ ...bankingData, routingNumber: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select value={bankingData.currency} onChange={(e) => setBankingData({ ...bankingData, currency: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Bank Address</label>
              <input type="text" value={bankingData.bankAddress} onChange={(e) => setBankingData({ ...bankingData, bankAddress: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bank City</label>
              <input type="text" value={bankingData.bankCity} onChange={(e) => setBankingData({ ...bankingData, bankCity: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bank Country</label>
              <input type="text" value={bankingData.bankCountry} onChange={(e) => setBankingData({ ...bankingData, bankCountry: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branch Name</label>
              <input type="text" value={bankingData.branchName} onChange={(e) => setBankingData({ ...bankingData, branchName: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branch Code</label>
              <input type="text" value={bankingData.branchCode} onChange={(e) => setBankingData({ ...bankingData, branchCode: e.target.value })} className="w-full p-2 border rounded-lg"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea value={bankingData.notes} onChange={(e) => setBankingData({ ...bankingData, notes: e.target.value })} rows={3} className="w-full p-2 border rounded-lg" placeholder="Any additional notes or instructions..."/>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Documents/Images</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" id="banking-docs-upload"/>
              <label htmlFor="banking-docs-upload" className="cursor-pointer flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                <MdUpload className="w-5 h-5"/>
                <span>Click to upload files</span>
              </label>
              {uploadedFiles.length > 0 && (<div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (<div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-600 hover:text-red-700">
                        <MdDelete className="w-5 h-5"/>
                      </button>
                    </div>))}
                </div>)}
            </div>
          </div>

          <button type="submit" disabled={submitBankingDetailsMutation.isPending} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitBankingDetailsMutation.isPending ? 'Submitting...' : 'Send Banking Details'}
          </button>
        </form>)}
    </div>);
}
//# sourceMappingURL=RFQDetailsPage.js.map