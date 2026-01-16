import React, { useState, useEffect, useMemo } from 'react';
import {
  MdAdd, MdEdit, MdDelete, MdChevronRight, MdBusiness, 
  MdModelTraining, MdCategory, MdLabel, 
  MdSearch, MdLayers, MdOutlineInventory
} from 'react-icons/md';

import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
import { Modal } from '../../components/shared/Modal';

// ─── Interfaces ───

interface Part {
  _id: string;
  name: string;
  partNumber: string;
  description?: string;
  priceUSD: number;
  stockQuantity: number;
}

interface SubCategory {
  _id: string;
  name: string;
  description?: string;
  parts: Part[];
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  subCategories: SubCategory[];
}

interface Model {
  _id: string;
  name: string;
  description?: string;
  categories: Category[];
}

interface Brand {
  _id: string;
  name: string;
  description?: string;
  models: Model[];
}

type ItemType = 'brand' | 'model' | 'category' | 'subcategory' | 'part';

interface EditItem {
  type: ItemType;
  id: string;
  parentId?: string;
  data: any;
}

// ─── Main Component ───

export default function ProductHierarchy() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<ItemType | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    partNumber: '',
    priceUSD: 0,
    stockQuantity: 0,
  });

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/v1/admin/product-hierarchy');
      if (!res.ok) throw new Error('Failed to load hierarchy');
      const data = await res.json();
      setBrands(data.data || []);
      
      // Auto-expand the first brand to guide the user
      if (data.data?.length > 0) {
        setExpandedItems(new Set([data.data[0]._id]));
      }
    } catch (err: any) {
      showToast(err.message || 'Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = (type: ItemType, parentId?: string) => {
    setAddType(type);
    setAddParentId(parentId || null);
    setFormData({ name: '', description: '', partNumber: '', priceUSD: 0, stockQuantity: 0 });
    setIsAddModalOpen(true);
  };

  const openEditModal = (type: ItemType, item: any, parentId?: string) => {
    setEditItem({ type, id: item._id, parentId, data: item });
    setFormData({
      name: item.name || '',
      description: item.description || '',
      partNumber: (type === 'part' ? item.partNumber : '') || '',
      priceUSD: type === 'part' ? Number(item.priceUSD) || 0 : 0,
      stockQuantity: type === 'part' ? Number(item.stockQuantity) || 0 : 0,
    });
  };

  const handleSave = async () => {
    try {
      let url = '';
      let method: 'POST' | 'PUT' = 'POST';
      const isEdit = !!editItem;
      const type = editItem?.type || addType!;
      let body: any = { name: formData.name.trim(), description: formData.description?.trim() };

      if (type === 'brand') {
        url = isEdit ? `/api/v1/admin/brands/${editItem!.id}` : '/api/v1/admin/brands';
        method = isEdit ? 'PUT' : 'POST';
      } else if (type === 'model') {
        url = isEdit ? `/api/v1/admin/models/${editItem!.id}` : '/api/v1/admin/models';
        method = isEdit ? 'PUT' : 'POST';
        body.brandId = isEdit ? editItem!.parentId : addParentId;
      } else if (type === 'category') {
        url = isEdit ? `/api/v1/admin/categories/${editItem!.id}` : '/api/v1/admin/categories';
        method = isEdit ? 'PUT' : 'POST';
      } else if (type === 'subcategory') {
        url = isEdit ? `/api/v1/admin/product-hierarchy/subcategories/${editItem!.id}` : '/api/v1/admin/product-hierarchy/subcategories';
        method = isEdit ? 'PUT' : 'POST';
        body.categoryId = isEdit ? editItem!.parentId : addParentId;
      } else if (type === 'part') {
        url = isEdit ? `/api/v1/admin/product-hierarchy/parts/${editItem!.id}` : '/api/v1/admin/product-hierarchy/parts';
        method = isEdit ? 'PUT' : 'POST';
        body = {
          ...body,
          partNumber: formData.partNumber.trim(),
          priceUSD: Number(formData.priceUSD),
          stockQuantity: Number(formData.stockQuantity),
          ...(isEdit ? {} : { subCategoryId: addParentId }),
        };
      }

      const res = await authenticatedFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save operation failed');

      showToast(`Item ${isEdit ? 'updated' : 'created'}`, 'success');
      setEditItem(null);
      setIsAddModalOpen(false);
      fetchHierarchy();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (type: ItemType, id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      let url = '';
      if (type === 'brand') url = `/api/v1/admin/brands/${id}`;
      else if (type === 'model') url = `/api/v1/admin/models/${id}`;
      else if (type === 'category') url = `/api/v1/admin/categories/${id}`;
      else if (type === 'subcategory') url = `/api/v1/admin/product-hierarchy/subcategories/${id}`;
      else if (type === 'part') url = `/api/v1/admin/product-hierarchy/parts/${id}`;

      const res = await authenticatedFetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Successfully deleted', 'success');
      fetchHierarchy();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filter hierarchy based on search query
  const filterHierarchy = (brandsList: Brand[], query: string): Brand[] => {
    if (!query.trim()) return brandsList;
    
    const lowerQuery = query.toLowerCase();
    
    return brandsList
      .map((brand) => {
        const brandMatches = 
          brand.name.toLowerCase().includes(lowerQuery) ||
          brand.description?.toLowerCase().includes(lowerQuery);
        
        const filteredModels = brand.models
          ?.map((model) => {
            const modelMatches =
              model.name.toLowerCase().includes(lowerQuery) ||
              model.description?.toLowerCase().includes(lowerQuery);
            
            const filteredCategories = model.categories
              ?.map((category) => {
                const categoryMatches =
                  category.name.toLowerCase().includes(lowerQuery) ||
                  category.description?.toLowerCase().includes(lowerQuery);
                
                const filteredSubCategories = category.subCategories
                  ?.map((subCategory) => {
                    const subCategoryMatches =
                      subCategory.name.toLowerCase().includes(lowerQuery) ||
                      subCategory.description?.toLowerCase().includes(lowerQuery);
                    
                    const filteredParts = subCategory.parts?.filter(
                      (part) =>
                        part.name.toLowerCase().includes(lowerQuery) ||
                        part.partNumber.toLowerCase().includes(lowerQuery) ||
                        part.description?.toLowerCase().includes(lowerQuery)
                    );
                    
                    // Include subcategory if it matches or has matching parts
                    if (subCategoryMatches || (filteredParts && filteredParts.length > 0)) {
                      return { ...subCategory, parts: filteredParts || [] };
                    }
                    return null;
                  })
                  .filter(Boolean) as SubCategory[];
                
                // Include category if it matches or has matching subcategories
                if (categoryMatches || (filteredSubCategories && filteredSubCategories.length > 0)) {
                  return { ...category, subCategories: filteredSubCategories || [] };
                }
                return null;
              })
              .filter(Boolean) as Category[];
            
            // Include model if it matches or has matching categories
            if (modelMatches || (filteredCategories && filteredCategories.length > 0)) {
              return { ...model, categories: filteredCategories || [] };
            }
            return null;
          })
          .filter(Boolean) as Model[];
        
        // Include brand if it matches or has matching models
        if (brandMatches || (filteredModels && filteredModels.length > 0)) {
          return { ...brand, models: filteredModels || [] };
        }
        return null;
      })
      .filter(Boolean) as Brand[];
  };

  const filteredBrands = useMemo(() => {
    return filterHierarchy(brands, searchQuery);
  }, [brands, searchQuery]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Dynamic Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <MdLayers className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Catalog Architecture</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Configure nested product relationships</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Filter catalog..." 
                value={searchQuery}
                className="pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl w-64 focus:ring-2 ring-indigo-500/20 transition-all text-sm font-medium"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => openAddModal('brand')}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" /> Brand
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-10">
        {searchQuery && filteredBrands.length === 0 && (
          <div className="text-center py-16">
            <MdSearch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No results found</h3>
            <p className="text-gray-400">Try adjusting your search query</p>
          </div>
        )}
        <div className="space-y-6">
          {filteredBrands.map(brand => (
            <Node
              key={brand._id} item={brand} type="brand" icon={<MdBusiness />}
              accent="indigo" expandedItems={expandedItems} toggleExpand={toggleExpand}
              onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete}
            >
              {brand.models?.map(model => (
                <Node
                  key={model._id} item={model} type="model" icon={<MdModelTraining />}
                  accent="blue" expandedItems={expandedItems} toggleExpand={toggleExpand}
                  onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete} parentId={brand._id}
                >
                  {model.categories?.map(cat => (
                    <Node
                      key={cat._id} item={cat} type="category" icon={<MdCategory />}
                      accent="purple" expandedItems={expandedItems} toggleExpand={toggleExpand}
                      onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete} parentId={model._id}
                    >
                      {cat.subCategories?.map(sub => (
                        <Node
                          key={sub._id} item={sub} type="subcategory" icon={<MdLabel />}
                          accent="amber" expandedItems={expandedItems} toggleExpand={toggleExpand}
                          onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete} parentId={cat._id}
                        >
                          <div className="grid grid-cols-1 gap-2 mt-4">
                            {sub.parts?.map(part => (
                              <PartCard 
                                key={part._id} part={part} 
                                onEdit={() => openEditModal('part', part, sub._id)}
                                onDelete={() => handleDelete('part', part._id, part.name)}
                              />
                            ))}
                          </div>
                        </Node>
                      ))}
                    </Node>
                  ))}
                </Node>
              ))}
            </Node>
          ))}
        </div>
      </main>

      {/* ── Modal Component ── */}
      {(editItem || isAddModalOpen) && (
        <Modal
          isOpen={true}
          onClose={() => { setEditItem(null); setIsAddModalOpen(false); }}
          title={`${editItem ? 'Edit' : 'Create'} ${editItem?.type || addType}`}
          size="medium"
        >
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Primary Name</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 ring-indigo-500/10 transition-all outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {(editItem?.type === 'part' || addType === 'part') && (
                <>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Part SKU / Number</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl outline-none"
                      value={formData.partNumber}
                      onChange={e => setFormData({ ...formData, partNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Unit Price (USD)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl outline-none"
                      value={formData.priceUSD}
                      onChange={e => setFormData({ ...formData, priceUSD: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Stock Inventory</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl outline-none"
                      value={formData.stockQuantity}
                      onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Summary</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl resize-none outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button 
                onClick={() => { setEditItem(null); setIsAddModalOpen(false); }}
                className="px-6 py-3 font-bold text-gray-400 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:shadow-lg shadow-indigo-100 transition-all"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shared Node Component ──

function Node({ item, type, icon, accent, expandedItems, toggleExpand, onAdd, onEdit, onDelete, parentId, children }: any) {
  const isExpanded = expandedItems.has(item._id);
  const nextType = getNextType(type);

  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="relative group/node">
      <div className={`
        flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
        ${isExpanded ? 'bg-white shadow-xl ring-1 ring-black/5 border-transparent mb-4' : 'bg-white border-transparent hover:bg-gray-50 hover:shadow-md'}
      `}>
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => toggleExpand(item._id)}
            className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'rotate-90 bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <MdChevronRight className="w-6 h-6" />
          </button>

          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[accent]}`}>
            {React.cloneElement(icon, { className: "w-5 h-5" })}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[17px] font-bold text-gray-900">{item.name}</h4>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{type}</span>
            </div>
            {item.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-all transform translate-x-2 group-hover/node:translate-x-0">
          {nextType && (
            <button 
              onClick={() => onAdd(nextType, item._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              <MdAdd /> {nextType}
            </button>
          )}
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={() => onEdit(type, item, parentId)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><MdEdit className="w-5 h-5" /></button>
          <button onClick={() => onDelete(type, item._id, item.name)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete className="w-5 h-5" /></button>
        </div>
      </div>

      {isExpanded && children && (
        <div className="ml-14 pl-10 border-l-2 border-dashed border-gray-200 relative animate-in slide-in-from-top-2 duration-500">
          {children}
          {/* Connector Node */}
          <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
        </div>
      )}
    </div>
  );
}

// ── Part Leaf Component ──

function PartCard({ part, onEdit, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-indigo-200 transition-all group/part">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover/part:text-indigo-600 transition-colors">
          <MdOutlineInventory className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">{part.name}</span>
            <span className="text-[10px] font-mono font-black text-gray-400 bg-gray-50 border px-1.5 rounded uppercase">{part.partNumber}</span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${part.priceUSD.toFixed(2)}</span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${part.stockQuantity < 10 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
              Inventory: {part.stockQuantity}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover/part:opacity-100 transition-all">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><MdEdit className="w-5 h-5" /></button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing</span>
      </div>
    </div>
  );
}

function getNextType(current: string) {
  const flow: any = { brand: 'model', model: 'category', category: 'subcategory', subcategory: 'part' };
  return flow[current] || null;
}