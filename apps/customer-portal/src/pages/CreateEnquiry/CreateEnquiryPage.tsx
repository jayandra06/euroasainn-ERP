import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
import { MdDelete } from 'react-icons/md';

interface Vendor {
  _id: string;
  name: string;
  isAdminInvited?: boolean;
}

interface Vessel {
  _id: string;
  name: string;
  imoNumber?: string;
  exVesselName?: string;
}

interface Item {
  id: string;
  impaNo: string;
  itemDescription: string;
  partNo: string;
  altPartNo: string;
  positionNo: string;
  dimensions: string;
  requiredQuantity: string;
  uom: string;
  generalRemark: string;
}

interface Brand {
  _id: string;
  name: string;
  status: string;
}

interface Category {
  _id: string;
  name: string;
  status: string;
}

interface Model {
  _id: string;
  name: string;
  brandId?: string;
  status: string;
}

export function CreateEnquiryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vesselName: '',
    vesselExName: '',
    imoNo: '',
    supplyPort: '',
    equipmentTags: '',
    category: '',
    subCategory: '',
    brand: '',
    model: '',
    hullNo: '',
    serialNumber: '',
    drawingNumber: '',
    remarks: '',
    preferredQuality: '',
    typeOfIncoterms: '',
    typeOfLogisticContainer: '',
    createdDate: new Date().toISOString().split('T')[0],
    leadDate: '',
    vendor1: '',
    vendor2: '',
    vendor3: '',
  });

  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      impaNo: '',
      itemDescription: '',
      partNo: '',
      altPartNo: '',
      positionNo: '',
      dimensions: '',
      requiredQuantity: '',
      uom: '',
      generalRemark: '',
    },
  ]);

  // Fetch vendors
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['rfq-vendors'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/rfq/vendors');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch vessels
  const { data: vessels } = useQuery<Vessel[]>({
    queryKey: ['customer-vessels'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/vessels');
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });

  // Fetch brands (only active)
  const { data: brands, refetch: refetchBrands } = useQuery<Brand[]>({
    queryKey: ['customer-brands'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/brands');
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 300000, // Consider data fresh for 5 minutes
    refetchInterval: false, // Disable automatic refetching - rely on manual refresh or query invalidation
    refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
  });

  // Fetch categories (only active)
  const { data: categories, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['customer-categories'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/categories');
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 300000, // Consider data fresh for 5 minutes
    refetchInterval: false, // Disable automatic refetching - rely on manual refresh or query invalidation
    refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
  });

  // Fetch models (only active, filtered by brand)
  const { data: models, refetch: refetchModels } = useQuery<Model[]>({
    queryKey: ['customer-models', formData.brand],
    queryFn: async () => {
      if (!formData.brand) return [];
      // Find brand ID from brand name
      const selectedBrand = brands?.find(b => b.name === formData.brand);
      if (!selectedBrand) return [];
      const response = await authenticatedFetch(`/api/v1/customer/models?brandId=${selectedBrand._id}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!formData.brand && !!brands && brands.length > 0,
    staleTime: 300000, // Consider data fresh for 5 minutes
    refetchInterval: false, // Disable automatic refetching - rely on manual refresh or query invalidation
    refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
  });

  // State for modals
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newModelName, setNewModelName] = useState('');

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await authenticatedFetch('/api/v1/customer/brands', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create brand');
      }
      return response.json();
    },
    onSuccess: () => {
      // Don't refetch immediately - item is pending, won't show until approved
      setShowBrandModal(false);
      setNewBrandName('');
      showToast('Brand created successfully! It will appear in the dropdown after admin approval.', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create brand', 'error');
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await authenticatedFetch('/api/v1/customer/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }
      return response.json();
    },
    onSuccess: () => {
      // Don't refetch immediately - item is pending, won't show until approved
      setShowCategoryModal(false);
      setNewCategoryName('');
      showToast('Category created successfully! It will appear in the dropdown after admin approval.', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create category', 'error');
    },
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: async (name: string) => {
      // Find brand ID from brand name
      const selectedBrand = brands?.find(b => b.name === formData.brand);
      if (!selectedBrand) {
        throw new Error('Please select a brand first');
      }
      const response = await authenticatedFetch('/api/v1/customer/models', {
        method: 'POST',
        body: JSON.stringify({ name, brandId: selectedBrand._id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create model');
      }
      return response.json();
    },
    onSuccess: () => {
      // Don't refetch immediately - item is pending, won't show until approved
      setShowModelModal(false);
      setNewModelName('');
      showToast('Model created successfully! It will appear in the dropdown after admin approval.', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create model', 'error');
    },
  });

  // Create RFQ mutation
  const createRFQMutation = useMutation({
    mutationFn: async (rfqData: any) => {
      const response = await authenticatedFetch('/api/v1/customer/rfq', {
        method: 'POST',
        body: JSON.stringify(rfqData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create RFQ');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      showToast('RFQ created successfully!', 'success');
      navigate('/rfqs');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create RFQ', 'error');
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Reset model when brand changes
    if (field === 'brand') {
      setFormData((prev) => ({ ...prev, model: '' }));
    }
    // Handle "Add New" option
    if (value === '__add_new_brand__') {
      setShowBrandModal(true);
      setFormData((prev) => ({ ...prev, [field]: '' }));
    } else if (value === '__add_new_category__') {
      setShowCategoryModal(true);
      setFormData((prev) => ({ ...prev, [field]: '' }));
    } else if (value === '__add_new_model__') {
      setShowModelModal(true);
      setFormData((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (id: string, field: keyof Item, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        impaNo: '',
        itemDescription: '',
        partNo: '',
        altPartNo: '',
        positionNo: '',
        dimensions: '',
        requiredQuantity: '',
        uom: '',
        generalRemark: '',
      },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.vesselName || !formData.imoNo || !formData.supplyPort) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.category || !formData.subCategory || !formData.brand || !formData.model) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.preferredQuality || !formData.typeOfIncoterms || !formData.typeOfLogisticContainer) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.leadDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const selectedVendors = [formData.vendor1, formData.vendor2, formData.vendor3].filter(
      (v) => v && v.trim() !== ''
    );

    if (selectedVendors.length === 0) {
      showToast('Please select at least one vendor', 'error');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.itemDescription || !item.requiredQuantity || !item.uom || !item.generalRemark) {
        showToast('Please fill in all required item fields', 'error');
        return;
      }
    }

    const selectedVessel = vessels?.find((v) => v._id === formData.vesselName);
    const vesselData = selectedVessel
      ? {
          vesselId: selectedVessel._id,
          vesselName: selectedVessel.name,
          vesselExName: formData.vesselExName || selectedVessel.exVesselName || '',
          imoNumber: formData.imoNo || selectedVessel.imoNumber || '',
        }
      : {
          vesselName: formData.vesselName,
          vesselExName: formData.vesselExName,
          imoNumber: formData.imoNo,
        };

    // Generate title from vessel name and category/brand
    const vesselName = selectedVessel?.name || formData.vesselName || 'Vessel';
    const categoryInfo = formData.category ? ` - ${formData.category}` : '';
    const brandInfo = formData.brand ? ` (${formData.brand})` : '';
    const title = `RFQ for ${vesselName}${categoryInfo}${brandInfo}`;

    createRFQMutation.mutate({
      ...vesselData,
      title, // Required field
      description: formData.remarks || `RFQ for ${vesselName}`,
      supplyPort: formData.supplyPort,
      equipmentTags: formData.equipmentTags,
      category: formData.category,
      subCategory: formData.subCategory,
      brand: formData.brand,
      model: formData.model,
      hullNo: formData.hullNo,
      serialNumber: formData.serialNumber,
      drawingNumber: formData.drawingNumber,
      remarks: formData.remarks,
      preferredQuality: formData.preferredQuality,
      typeOfIncoterms: formData.typeOfIncoterms,
      typeOfLogisticContainer: formData.typeOfLogisticContainer,
      createdDate: formData.createdDate,
      leadDate: formData.leadDate,
      dueDate: formData.leadDate ? new Date(formData.leadDate) : undefined,
      recipientVendorIds: selectedVendors,
      items: items.map((item) => ({
        impaNo: item.impaNo,
        itemDescription: item.itemDescription,
        partNo: item.partNo,
        altPartNo: item.altPartNo,
        positionNo: item.positionNo,
        dimensions: item.dimensions,
        requiredQuantity: item.requiredQuantity,
        uom: item.uom,
        generalRemark: item.generalRemark,
      })),
      status: 'draft',
    });
  };

  return (
    <div className="w-full min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Customer &gt; Dashboard</p>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create RFQ</h1>
      </div>

      {/* RFQ and Vessel Information Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          RFQ and Vessel Information
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Details for RFQ, Vessel, and Equipment
        </p>

        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vessel Name <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vesselName}
              onChange={(e) => handleInputChange('vesselName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vessel</option>
              {vessels?.map((vessel) => (
                <option key={vessel._id} value={vessel._id}>
                  {vessel.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vessel Ex Name
            </label>
            <input
              type="text"
              value={formData.vesselExName}
              onChange={(e) => handleInputChange('vesselExName', e.target.value)}
              placeholder="Vessel Ex Name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IMO No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.imoNo}
              onChange={(e) => handleInputChange('imoNo', e.target.value)}
              placeholder="IMO No."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supply Port <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplyPort}
              onChange={(e) => handleInputChange('supplyPort', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Supply Port</option>
              <option value="Bussan">Bussan</option>
              <option value="Goa">Goa</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Kerala">Kerala</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Equipment Tags
            </label>
            <input
              type="text"
              value={formData.equipmentTags}
              onChange={(e) => handleInputChange('equipmentTags', e.target.value)}
              placeholder="Equipment Tag"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="__add_new_category__" className="text-blue-600 font-semibold">
                + Add New Category
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subCategory}
              onChange={(e) => handleInputChange('subCategory', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sub Category</option>
              <option value="Genuine">Genuine</option>
              <option value="OEM">OEM</option>
              <option value="Copy">Copy</option>
              <option value="Parts">Parts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Brand</option>
              {brands?.map((brand) => (
                <option key={brand._id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
              <option value="__add_new_brand__" className="text-blue-600 font-semibold">
                + Add New Brand
              </option>
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              disabled={!formData.brand}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{formData.brand ? 'Select Model' : 'Select Brand First'}</option>
              {models?.map((model) => (
                <option key={model._id} value={model.name}>
                  {model.name}
                </option>
              ))}
              {formData.brand && (
                <option value="__add_new_model__" className="text-blue-600 font-semibold">
                  + Add New Model
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              HULL No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.hullNo}
              onChange={(e) => handleInputChange('hullNo', e.target.value)}
              placeholder="HULL No."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              placeholder="Serial Number"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drawing Number
            </label>
            <input
              type="text"
              value={formData.drawingNumber}
              onChange={(e) => handleInputChange('drawingNumber', e.target.value)}
              placeholder="Drawing Number"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remarks
            </label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Remarks"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Quality <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.preferredQuality}
              onChange={(e) => handleInputChange('preferredQuality', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Quality</option>
              <option value="Genuine">Genuine</option>
              <option value="OEM">OEM</option>
              <option value="Copy">Copy</option>
              <option value="Parts">Parts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type of Incoterms <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.typeOfIncoterms}
              onChange={(e) => handleInputChange('typeOfIncoterms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Incoterm</option>
              <option value="EXW (Ex Works)">EXW (Ex Works)</option>
              <option value="FCA (Free Carrier)">FCA (Free Carrier)</option>
              <option value="CPT (Carriage Paid To)">CPT (Carriage Paid To)</option>
              <option value="CIP (Carriage and Insurance Paid To)">CIP (Carriage and Insurance Paid To)</option>
              <option value="DAP (Delivered at Place)">DAP (Delivered at Place)</option>
              <option value="DPU (Delivered at Place Unloaded)">DPU (Delivered at Place Unloaded)</option>
              <option value="DDP (Delivered Duty Paid)">DDP (Delivered Duty Paid)</option>
              <option value="FAS (Free Alongside Ship)">FAS (Free Alongside Ship)</option>
              <option value="FOB (Free On Board)">FOB (Free On Board)</option>
              <option value="CFR (Cost and Freight)">CFR (Cost and Freight)</option>
              <option value="CIF (Cost, Insurance and Freight)">CIF (Cost, Insurance and Freight)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type of Logistic Container <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.typeOfLogisticContainer}
              onChange={(e) => handleInputChange('typeOfLogisticContainer', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Container Type</option>
              <option value="Nest 50 (50L Crate)">Nest 50 (50L Crate)</option>
              <option value="Nest 60 (60L Crate)">Nest 60 (60L Crate)</option>
              <option value="Euro Crate (Standard Euro Crate)">Euro Crate (Standard Euro Crate)</option>
              <option value="Foldable Crate (Collapsible Crate)">Foldable Crate (Collapsible Crate)</option>
              <option value="Pallet Box (Heavy-Duty Pallet Box)">Pallet Box (Heavy-Duty Pallet Box)</option>
              <option value="IBC Tank (Intermediate Bulk Container)">IBC Tank (Intermediate Bulk Container)</option>
              <option value="Plastic Drum (220L Sealed Drum)">Plastic Drum (220L Sealed Drum)</option>
              <option value="Wooden Crate (Custom Size Wooden Crate)">Wooden Crate (Custom Size Wooden Crate)</option>
            </select>
          </div>
        </div>

        {/* Row 5 - Dates */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Created Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.createdDate}
                onChange={(e) => handleInputChange('createdDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.leadDate}
                onChange={(e) => handleInputChange('leadDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Attachments Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Attachments</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload Files</p>
        <div className="flex items-center gap-3 mb-4">
          <label className="cursor-pointer">
            <input type="file" multiple className="hidden" />
            <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-block text-sm font-medium">
              Choose Files
            </span>
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">No file chosen</span>
        </div>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 min-h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50"></div>
      </div>

      {/* Choose vendors Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Choose vendors</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor 1 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor1}
              onChange={(e) => handleInputChange('vendor1', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vendor</option>
              {vendors?.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor 2 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor2}
              onChange={(e) => handleInputChange('vendor2', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vendor</option>
              {vendors?.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor 3 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor3}
              onChange={(e) => handleInputChange('vendor3', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vendor</option>
              {vendors?.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="w-12 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  No.
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </th>
                <th className="w-40 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Required Quantity <span className="text-red-500">*</span>
                </th>
                <th className="w-32 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  UOM <span className="text-red-500">*</span>
                </th>
                <th className="w-40 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  General Remark <span className="text-red-500">*</span>
                </th>
                <th className="w-20 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action <span className="text-red-500">*</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white align-top text-center">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-2">
                      {/* First Row: Impa No, Part No, Position No */}
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={item.impaNo}
                          onChange={(e) => handleItemChange(item.id, 'impaNo', e.target.value)}
                          placeholder="Impa No"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={item.partNo}
                          onChange={(e) => handleItemChange(item.id, 'partNo', e.target.value)}
                          placeholder="Part No."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={item.positionNo}
                          onChange={(e) => handleItemChange(item.id, 'positionNo', e.target.value)}
                          placeholder="Position No"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      {/* Second Row: Item Description, alt. Part No, W x B x H */}
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={item.itemDescription}
                          onChange={(e) => handleItemChange(item.id, 'itemDescription', e.target.value)}
                          placeholder="Item Description.."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={item.altPartNo}
                          onChange={(e) => handleItemChange(item.id, 'altPartNo', e.target.value)}
                          placeholder="alt. Part No."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={item.dimensions}
                          onChange={(e) => handleItemChange(item.id, 'dimensions', e.target.value)}
                          placeholder="W x B x H"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      value={item.requiredQuantity}
                      onChange={(e) => handleItemChange(item.id, 'requiredQuantity', e.target.value)}
                      placeholder="required quanitity"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={item.uom}
                      onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select UON</option>
                      <option value="pcs">PCS</option>
                      <option value="kg">KG</option>
                      <option value="m">M</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      value={item.generalRemark}
                      onChange={(e) => handleItemChange(item.id, 'generalRemark', e.target.value)}
                      placeholder="General Remarks"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 inline-flex items-center justify-center"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">List Of Items.</p>
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Get Quote Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={createRFQMutation.isPending}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {createRFQMutation.isPending ? 'Creating...' : 'Get Quote'}
        </button>
      </div>

      {/* Add Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Brand</h3>
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBrandModal(false);
                  setNewBrandName('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newBrandName.trim()) {
                    createBrandMutation.mutate(newBrandName.trim());
                  }
                }}
                disabled={!newBrandName.trim() || createBrandMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createBrandMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    createCategoryMutation.mutate(newCategoryName.trim());
                  }
                }}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Model</h3>
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Enter model name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModelModal(false);
                  setNewModelName('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newModelName.trim()) {
                    createModelMutation.mutate(newModelName.trim());
                  }
                }}
                disabled={!newModelName.trim() || createModelMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createModelMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
