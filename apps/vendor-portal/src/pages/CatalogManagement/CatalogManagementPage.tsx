import React, { useState } from 'react';
import { MdUpload, MdDownload, MdDelete, MdEdit } from 'react-icons/md';

interface Product {
  id: number;
  impa: string;
  description: string;
  partNo: string;
  positionNo: string;
  alternativeNo: string;
  brand: string;
  model: string;
  category: string;
  dimensions: string;
  remarks: string;
}

export function CatalogManagementPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      impa: 'IMPA',
      description: 'description',
      partNo: 'partno',
      positionNo: 'position n',
      alternativeNo: 'alternative n',
      brand: 'brand',
      model: 'model',
      category: 'category',
      dimensions: 'dimension',
      remarks: 'remark',
    },
  ]);

  const handleInputChange = (id: number, field: keyof Product, value: string) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, [field]: value } : product))
    );
  };

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        impa: '',
        description: '',
        partNo: '',
        positionNo: '',
        alternativeNo: '',
        brand: '',
        model: '',
        category: '',
        dimensions: '',
        remarks: '',
      },
    ]);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vendor &gt; Dashboard</p>
      </div>

      {/* Your Inventory Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Your Inventory</h2>
        <div className="mb-4">
          <button className="w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
            Upload File
          </button>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors flex items-center gap-2">
            <MdDownload className="w-4 h-4" />
            Download Template
          </button>
          <button className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors flex items-center gap-2">
            <MdUpload className="w-4 h-4" />
            Upload
          </button>
          <button className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
            View
          </button>
        </div>
      </div>

      {/* List of your Products Section */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">List of your Products</h2>
        
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--secondary))]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">IMPA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Part No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Position No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Alternative No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Dimensions (W x B x H)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Remarks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Edit</th>
                </tr>
              </thead>
              <tbody className="bg-[hsl(var(--card))] divide-y divide-gray-200 dark:divide-gray-800">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">{product.id}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.impa}
                        onChange={(e) => handleInputChange(product.id, 'impa', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.description}
                        onChange={(e) => handleInputChange(product.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.partNo}
                        onChange={(e) => handleInputChange(product.id, 'partNo', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.positionNo}
                        onChange={(e) => handleInputChange(product.id, 'positionNo', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.alternativeNo}
                        onChange={(e) => handleInputChange(product.id, 'alternativeNo', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.brand}
                        onChange={(e) => handleInputChange(product.id, 'brand', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.model}
                        onChange={(e) => handleInputChange(product.id, 'model', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.category}
                        onChange={(e) => handleInputChange(product.id, 'category', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.dimensions}
                        onChange={(e) => handleInputChange(product.id, 'dimensions', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.remarks}
                        onChange={(e) => handleInputChange(product.id, 'remarks', e.target.value)}
                        className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-[hsl(var(--foreground))] font-semibold hover:text-blue-700 dark:hover:text-blue-300">
                        <MdEdit className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            A list of your Products.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
              Save
            </button>
            <button
              onClick={handleAddProduct}
              className="px-6 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

