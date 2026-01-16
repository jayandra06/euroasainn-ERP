import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MdVerified, 
  MdAdd,
  MdClose,
  MdCloudUpload,
  MdImage,
  MdDelete,
  MdVisibility
} from 'react-icons/md';
import { cn } from '../../lib/utils';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Compliance Level Types
type ComplianceLevel = 
  | 'company'
  | 'vessel'
  | 'crew'
  | 'safety-operations'
  | 'environmental'
  | 'port-state'
  | 'flag-state'
  | 'classification-society'
  | 'security'
  | 'audit-inspection';

type ItemType = 'compliance' | 'certificate';

interface ComplianceItem {
  _id: string;
  complianceLevel: ComplianceLevel;
  itemType: ItemType;
  itemName: string;
  imageUrl?: string;
  uploadedAt: string;
  uploadedBy?: string;
  certificateNumber?: string;
  expiryDate?: string;
}

// Compliance Level Definitions (based on PDF structure)
const COMPLIANCE_LEVELS = {
  company: {
    title: 'Company / Organization Level',
    compliances: [
      'Quality management compliance',
      'Occupational health & safety compliance',
      'Environmental management compliance',
      'Regulatory audit compliance',
      'Business operation compliance'
    ],
    certificates: [
      'ISO 9001 – Quality Management',
      'ISO 14001 – Environmental Management',
      'ISO 45001 – Occupational Health & Safety',
      'Internal / External Audit Certificates'
    ]
  },
  vessel: {
    title: 'Vessel / Ship Level',
    compliances: [
      'Ship registration compliance',
      'Structural safety compliance',
      'Fire safety compliance',
      'Navigation safety compliance',
      'Radio & communication compliance',
      'Stability & load compliance'
    ],
    certificates: [
      'Certificate of Registry',
      'Cargo Ship Safety Certificate',
      'Safety Construction Certificate',
      'Safety Equipment Certificate',
      'Safety Radio Certificate',
      'Load Line Certificate'
    ]
  },
  crew: {
    title: 'Crew / Employee Level',
    compliances: [
      'Training compliance',
      'Qualification compliance',
      'Watchkeeping compliance',
      'Medical fitness compliance'
    ],
    certificates: [
      'STCW Certificate',
      'Certificate of Competency (CoC)',
      'Medical Fitness Certificate',
      'Role-based training certificates'
    ]
  },
  'safety-operations': {
    title: 'Safety & Operations Level',
    compliances: [
      'Safety management compliance',
      'Emergency preparedness compliance',
      'Incident reporting compliance',
      'Risk assessment compliance'
    ],
    certificates: [
      'Safety Management System (SMS) Certificate',
      'Operational Audit Certificate',
      'Safety Inspection Reports'
    ]
  },
  environmental: {
    title: 'Environmental Level',
    compliances: [
      'Marine pollution prevention compliance',
      'Oil discharge compliance',
      'Waste & garbage management compliance',
      'Emission control compliance'
    ],
    certificates: [
      'MARPOL Compliance Certificate',
      'Oil Pollution Prevention Certificate',
      'Ballast Water Management Certificate',
      'Garbage Management Compliance Documents'
    ]
  },
  'port-state': {
    title: 'Port State Level',
    compliances: [
      'Port entry compliance',
      'Safety inspection compliance',
      'Deficiency rectification compliance'
    ],
    certificates: [
      'Port State Control (PSC) Inspection Reports',
      'Port Clearance Certificates',
      'Detention / Release Certificates'
    ]
  },
  'flag-state': {
    title: 'Flag State Level',
    compliances: [
      'National maritime law compliance',
      'Flag state inspection compliance',
      'Statutory compliance'
    ],
    certificates: [
      'Flag State Safety Certificates',
      'Statutory Certificates issued by Flag Authority'
    ]
  },
  'classification-society': {
    title: 'Classification Society Level',
    compliances: [
      'Technical compliance',
      'Hull integrity compliance',
      'Machinery compliance'
    ],
    certificates: [
      'Class Certificate',
      'Hull Survey Certificate',
      'Machinery Survey Certificate',
      'Periodical Survey Reports'
    ]
  },
  security: {
    title: 'Security Level',
    compliances: [
      'Ship security compliance',
      'Access control compliance',
      'Threat prevention compliance'
    ],
    certificates: [
      'Ship Security Certificate',
      'Security Audit Certificates',
      'Security Plan Approval'
    ]
  },
  'audit-inspection': {
    title: 'Audit & Inspection Level',
    compliances: [
      'Internal audit compliance',
      'External audit compliance',
      'Regulatory inspection compliance'
    ],
    certificates: [
      'Audit Completion Certificates',
      'Inspection Compliance Reports',
      'Corrective Action Reports'
    ]
  }
};

export function CompliancePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ComplianceLevel | ''>('');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | ''>('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('compliance-items');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setComplianceItems(parsed);
      } catch (e) {
        console.error('Failed to load compliance items from localStorage', e);
      }
    }
  }, []);

  // Fetch compliance items (when API is ready)
  // const { isLoading } = useQuery<ComplianceItem[]>({
  //   queryKey: ['compliance-items'],
  //   queryFn: async () => {
  //     const response = await authenticatedFetch('/api/v1/customer/compliance');
  //     if (!response.ok) throw new Error('Failed to fetch compliance items');
  //     const data = await response.json();
  //     setComplianceItems(data.data || []);
  //     return data.data || [];
  //   },
  // });

  // Get available items based on selected level and type
  const getAvailableItems = () => {
    if (!selectedLevel || !selectedItemType) return [];
    const level = COMPLIANCE_LEVELS[selectedLevel];
    return selectedItemType === 'compliance' ? level.compliances : level.certificates;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Create compliance item mutation
  const createComplianceMutation = useMutation({
    mutationFn: async (data: { complianceLevel: ComplianceLevel; itemType: ItemType; itemName: string; file: File; certificateNumber?: string; expiryDate?: string }) => {
      // Create image URL from uploaded file
      const imageUrl = URL.createObjectURL(data.file);

      // Create new compliance item
      const newItem: ComplianceItem = {
        _id: Date.now().toString(),
        complianceLevel: data.complianceLevel,
        itemType: data.itemType,
        itemName: data.itemName,
        imageUrl: imageUrl,
        uploadedAt: new Date().toISOString(),
        certificateNumber: data.certificateNumber,
        expiryDate: data.expiryDate,
      };

      // TODO: Replace with actual API endpoint when available
      // const formData = new FormData();
      // formData.append('complianceLevel', data.complianceLevel);
      // formData.append('itemType', data.itemType);
      // formData.append('itemName', data.itemName);
      // formData.append('image', data.file);
      // const response = await authenticatedFetch('/api/v1/customer/compliance', {
      //   method: 'POST',
      //   body: formData,
      // });
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.error || 'Failed to create compliance item');
      // }
      // return response.json();

      // For now, store in localStorage and return
      return { success: true, data: newItem };
    },
    onSuccess: (result) => {
      // Add to local state
      const newItems = [...complianceItems, result.data];
      setComplianceItems(newItems);
      
      // Save to localStorage
      localStorage.setItem('compliance-items', JSON.stringify(newItems));
      
      // Invalidate queries (for when API is ready)
      queryClient.invalidateQueries({ queryKey: ['compliance-items'] });
      
      showToast('Compliance item added successfully', 'success');
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to add compliance item', 'error');
    },
  });

  // Delete compliance item mutation
  const deleteComplianceMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API endpoint when available
      // const response = await authenticatedFetch(`/api/v1/customer/compliance/${id}`, {
      //   method: 'DELETE',
      // });
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.error || 'Failed to delete compliance item');
      // }
      // return response.json();

      // Return id for use in onSuccess
      return id;
    },
    onSuccess: (id) => {
      // Find item to revoke object URL before removing
      setComplianceItems((prevItems) => {
        const item = prevItems.find(i => i._id === id);
        if (item?.imageUrl && item.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.imageUrl);
        }
        
        // Remove from state
        const newItems = prevItems.filter(item => item._id !== id);
        
        // Save to localStorage
        localStorage.setItem('compliance-items', JSON.stringify(newItems));
        
        return newItems;
      });
      
      // Invalidate queries (for when API is ready)
      queryClient.invalidateQueries({ queryKey: ['compliance-items'] });
      
      showToast('Compliance item deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete compliance item', 'error');
    },
  });

  const resetForm = () => {
    setSelectedLevel('');
    setSelectedItemType('');
    setSelectedItemName('');
    setUploadedFile(null);
    setCertificateNumber('');
    setExpiryDate('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleSubmit = () => {
    if (!selectedLevel) {
      showToast('Please select a compliance level', 'error');
      return;
    }
    if (!selectedItemType) {
      showToast('Please select item type (Compliance or Certificate)', 'error');
      return;
    }
    if (!selectedItemName) {
      showToast('Please select an item', 'error');
      return;
    }
    if (!uploadedFile) {
      showToast('Please upload an image', 'error');
      return;
    }
    if (selectedItemType === 'certificate') {
      if (!certificateNumber) {
        showToast('Please enter certificate number', 'error');
        return;
      }
      if (!expiryDate) {
        showToast('Please enter expiry date', 'error');
        return;
      }
    }

    createComplianceMutation.mutate({
      complianceLevel: selectedLevel,
      itemType: selectedItemType,
      itemName: selectedItemName,
      file: uploadedFile,
      certificateNumber: selectedItemType === 'certificate' ? certificateNumber : undefined,
      expiryDate: selectedItemType === 'certificate' ? expiryDate : undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this compliance item?')) {
      deleteComplianceMutation.mutate(id);
    }
  };

  // Group items by level and type
  const groupedItems = complianceItems.reduce((acc, item) => {
    const key = `${item.complianceLevel}-${item.itemType}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ComplianceItem[]>);

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Compliance & Certification
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Manage regulatory compliance, certifications, and ensure your operations meet industry standards
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors shadow-lg"
        >
          <MdAdd className="w-5 h-5" />
          Add New Compliance
        </button>
      </div>

      {/* Compliance Items Grid */}
      {complianceItems.length === 0 ? (
        <div className="p-16 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <MdVerified className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">
            No compliance items found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Click "Add New Compliance" to get started
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([key, items]) => {
            const [level, itemType] = key.split('-');
            const levelData = COMPLIANCE_LEVELS[level as ComplianceLevel];
            return (
              <div
                key={key}
                className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
              >
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                  {levelData.title} - {itemType === 'compliance' ? 'Compliances' : 'Certificates'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="group relative p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-lg transition-shadow"
                    >
                      {item.imageUrl ? (
                        <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Handle broken image
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                if (item.imageUrl) {
                                  window.open(item.imageUrl, '_blank');
                                }
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
                              title="View full size"
                            >
                              <MdVisibility className="w-5 h-5 text-gray-900 dark:text-white" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <MdImage className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <h4 className="font-medium text-[hsl(var(--foreground))] mb-1 line-clamp-2">
                        {item.itemName}
                      </h4>
                      {item.itemType === 'certificate' && item.expiryDate && (
                        <div className="mb-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                          </p>
                          {item.certificateNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Cert #: {item.certificateNumber}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-900/50"
                        title="Delete"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Compliance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[hsl(var(--border))] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Add New Compliance</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Compliance Level Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Compliance Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value as ComplianceLevel);
                    setSelectedItemType('');
                    setSelectedItemName('');
                  }}
                  className="w-full px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="">-- Select Compliance Level --</option>
                  {Object.entries(COMPLIANCE_LEVELS).map(([key, level]) => (
                    <option key={key} value={key}>{level.title}</option>
                  ))}
                </select>
              </div>

              {/* Item Type Selection */}
              {selectedLevel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setSelectedItemType('compliance');
                        setSelectedItemName('');
                        setCertificateNumber('');
                        setExpiryDate('');
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg border-2 transition-colors',
                        selectedItemType === 'compliance'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-blue-400'
                      )}
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">◆</span> Compliances
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemType('certificate');
                        setSelectedItemName('');
                        setCertificateNumber('');
                        setExpiryDate('');
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg border-2 transition-colors',
                        selectedItemType === 'certificate'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-blue-400'
                      )}
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">◆</span> Certificates
                    </button>
                  </div>
                </div>
              )}

              {/* Item Selection */}
              {selectedLevel && selectedItemType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select {selectedItemType === 'compliance' ? 'Compliance' : 'Certificate'} <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[hsl(var(--border))] rounded-lg">
                    {getAvailableItems().map((itemName, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedItemName(itemName)}
                        className={cn(
                          'w-full px-4 py-2 text-left hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))] last:border-b-0',
                          selectedItemName === itemName
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'text-[hsl(var(--foreground))]'
                        )}
                      >
                        <span className="text-gray-400 dark:text-gray-600 mr-2">•</span>
                        {itemName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {selectedItemName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-6">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="compliance-image-upload"
                    />
                    <label
                      htmlFor="compliance-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      {previewUrl ? (
                        <div className="relative w-full">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-64 object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                              if (previewUrl) {
                                URL.revokeObjectURL(previewUrl);
                              }
                              setPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <MdClose className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <MdCloudUpload className="w-12 h-12 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload image (Max 10MB)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-[hsl(var(--muted))] dark:bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 text-[hsl(var(--foreground))] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !selectedLevel || 
                    !selectedItemType || 
                    !selectedItemName || 
                    !uploadedFile || 
                    (selectedItemType === 'certificate' && (!certificateNumber || !expiryDate)) ||
                    createComplianceMutation.isPending
                  }
                  className="px-6 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createComplianceMutation.isPending ? 'Adding...' : 'Add Compliance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
