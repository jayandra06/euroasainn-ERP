import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdArrowBack, MdCheckCircle } from 'react-icons/md';
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
        queryKey: ['admin-rfq-details', id],
        queryFn: async () => {
            if (!id)
                throw new Error('RFQ ID is required');
            const response = await authenticatedFetch(`/api/v1/admin/rfq/${id}`);
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
    // Check if admin quotation already exists for this RFQ
    const { data: existingQuotation } = useQuery({
        queryKey: ['admin-quotation', id],
        queryFn: async () => {
            if (!id)
                return null;
            try {
                const response = await authenticatedFetch(`/api/v1/admin/quotation/rfq/${id}`);
                if (!response.ok) {
                    return null;
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
    // Fetch payment proof for this quotation
    const { data: paymentProof, isLoading: isLoadingPaymentProof } = useQuery({
        queryKey: ['admin-payment-proof', existingQuotation?._id],
        queryFn: async () => {
            if (!existingQuotation?._id)
                return null;
            try {
                const response = await authenticatedFetch(`/api/v1/admin/payment-proof/quotation/${existingQuotation._id}`);
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                return data.data || null;
            }
            catch (error) {
                console.error('Error fetching payment proof:', error);
                return null;
            }
        },
        enabled: !!existingQuotation?._id,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
    const submitQuotationMutation = useMutation({
        mutationFn: async (quotationData) => {
            const response = await authenticatedFetch('/api/v1/admin/quotation', {
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
            queryClient.invalidateQueries({ queryKey: ['admin-rfq-details', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-quotation', id] });
            setShowQuotationForm(false);
            alert('Special offer submitted successfully!');
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
            title: title || `Special Offer for ${rfqDetails.rfqNumber}`,
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
        return (<div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading RFQ details</p>
          <button onClick={() => navigate('/dashboard/admin/rfqs')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to RFQs
          </button>
        </div>
      </div>);
    }
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/admin/rfqs')} className="flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] mb-4">
          <MdArrowBack className="w-5 h-5"/>
          Back to RFQs
        </button>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">RFQ Details</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">RFQ Number: {rfqDetails.rfqNumber}</p>
      </div>

      <div className="space-y-6">
        {/* RFQ Information */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
          <h2 className="text-xl font-semibold mb-4">RFQ Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Title</label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Status</label>
              <p className="text-[hsl(var(--foreground))]">{rfqDetails.status}</p>
            </div>
            {rfqDetails.supplyPort && (<div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Supply Port</label>
                <p className="text-[hsl(var(--foreground))]">{rfqDetails.supplyPort}</p>
              </div>)}
            {rfqDetails.brand && (<div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Brand</label>
                <p className="text-[hsl(var(--foreground))]">{rfqDetails.brand}</p>
              </div>)}
          </div>
        </div>

        {/* Vessel Information */}
        {rfqDetails.vesselId && (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
            <h2 className="text-xl font-semibold mb-4">Vessel Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Vessel Name</label>
                <p className="text-[hsl(var(--foreground))]">{rfqDetails.vesselId.name}</p>
              </div>
              {rfqDetails.vesselId.imoNumber && (<div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">IMO Number</label>
                  <p className="text-[hsl(var(--foreground))]">{rfqDetails.vesselId.imoNumber}</p>
                </div>)}
            </div>
          </div>)}

        {/* RFQ Items */}
        {rfqItems.length > 0 && (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
            <h2 className="text-xl font-semibold mb-4">RFQ Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left p-3 text-sm font-semibold">Description</th>
                    <th className="text-left p-3 text-sm font-semibold">Required Qty</th>
                    <th className="text-left p-3 text-sm font-semibold">UOM</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqItems.map((item, idx) => (<tr key={idx} className="border-b border-[hsl(var(--border))]">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{item.requiredQty}</td>
                      <td className="p-3">{item.uom || '-'}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>)}

        {/* Submit Special Offer Section or Submitted Quotation Details */}
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-8">
          {existingQuotation ? (
        // Show submitted quotation details
        <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Special Offer Submitted
                </h2>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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

              {/* Payment Details Section - Show when payment is uploaded (before approval) */}
              {existingQuotation.status === 'finalized' && paymentProof && paymentProof.status !== 'approved' && (<div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[hsl(var(--border))]">
                    <h2 className="text-xl font-semibold">
                      Payment Details
                    </h2>
                    <button onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-payment-proof', existingQuotation._id] });
                }} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Refresh payment details">
                      🔄 Refresh
                    </button>
                  </div>
                  {isLoadingPaymentProof ? (<div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-[hsl(var(--border))] rounded-lg">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading payment details...</p>
                    </div>) : paymentProof ? (<div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">💰</span>
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                          Payment Proof Received
                        </h3>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        Customer has submitted payment proof. Please review the payment details below and approve to proceed.
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
                      {paymentProof.proofDocuments && paymentProof.proofDocuments.length > 0 && (<div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                            Payment Proof Documents
                          </label>
                          <div className="space-y-2">
                            {paymentProof.proofDocuments.map((doc, docIndex) => (<div key={docIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700">
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
                      {/* Payment Approval Button */}
                      <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <button onClick={async () => {
                        if (window.confirm('Are you sure you want to approve this payment and start packing? This will notify the customer to update shipping details.')) {
                            try {
                                const response = await authenticatedFetch(`/api/v1/admin/payment-proof/${existingQuotation._id}/approve`, { method: 'POST' });
                                if (response.ok) {
                                    alert('Payment approved! Customer has been notified to update shipping details.');
                                    queryClient.invalidateQueries({ queryKey: ['admin-payment-proof', existingQuotation._id] });
                                }
                                else {
                                    const error = await response.json();
                                    alert(error.error || 'Failed to approve payment');
                                }
                            }
                            catch (error) {
                                alert('Failed to approve payment');
                            }
                        }
                    }} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                          <MdCheckCircle className="w-5 h-5"/>
                          Approve Payment and Start Packing
                        </button>
                      </div>
                    </div>) : (<div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-[hsl(var(--border))] rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Awaiting Payment Proof
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Payment details will appear here once the customer submits payment proof. You will also receive an email notification when payment is received.
                      </p>
                    </div>)}
                </div>)}

              {/* Payment Details Section - Show only after payment is approved */}
              {existingQuotation.status === 'finalized' && paymentProof && paymentProof.status === 'approved' && (<div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[hsl(var(--border))]">
                    <h2 className="text-xl font-semibold">
                      Payment Details
                    </h2>
                    <button onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-payment-proof', existingQuotation._id] });
                }} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Refresh payment details">
                      🔄 Refresh
                    </button>
                  </div>
                  {isLoadingPaymentProof ? (<div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-[hsl(var(--border))] rounded-lg">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading payment details...</p>
                    </div>) : paymentProof ? (<div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <MdCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400"/>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                          💰 Payment Received
                        </h3>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                        Customer has submitted payment proof for this special offer. Please review the payment details below.
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
                                {paymentProof.shippingOption === 'vendor-managed' && (<div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                      😊 We will take care of the rest, chillax!
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                      Please proceed with arranging shipping and logistics.
                                    </p>
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
                    </div>) : (<div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-[hsl(var(--border))] rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Awaiting Payment Proof
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Payment details will appear here once the customer submits payment proof. You will also receive an email notification when payment is received.
                      </p>
                    </div>)}
                </div>)}
            </div>) : (
        // Show submit special offer form
        <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Submit Special Offer
                </h2>
                <button onClick={() => setShowQuotationForm(!showQuotationForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {showQuotationForm ? 'Cancel' : 'Submit Special Offer'}
                </button>
              </div>

              {showQuotationForm && (<div className="space-y-6 mt-6">
                  {/* Quotation Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Quotation Title</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Special Offer for ${rfqDetails.rfqNumber}`} className="w-full p-2 border rounded-lg"/>
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
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Special offer description..." rows={3} className="w-full p-2 border rounded-lg"/>
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
                              <td className="p-2">{item.description}</td>
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
                      {submitQuotationMutation.isPending ? 'Submitting...' : 'Submit Special Offer'}
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
//# sourceMappingURL=RFQDetailsPage.js.map