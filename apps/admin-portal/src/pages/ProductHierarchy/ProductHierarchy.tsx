import React, { useState } from "react";

interface Part {
  id: number;
  name: string;
  partNumber: string;
  description: string;
  priceUSD: number;
  stockQuantity: number;
}

interface SubCategory {
  id: number;
  name: string;
  subCategories?: never; // To avoid confusion, but not needed
  parts: Part[];
}

interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

interface Model {
  id: number;
  name: string;
  categories: Category[];
}

interface Brand {
  id: number;
  name: string;
  models: Model[];
}

export default function ProductHierarchy() {
  const [brands, setBrands] = useState<Brand[]>([
    {
      id: 1,
      name: "MAN Energy Solutions",
      models: [
        {
          id: 11,
          name: "MAN B&W 6S50ME-C",
          categories: [
            {
              id: 111,
              name: "Fuel System",
              subCategories: [
                {
                  id: 1111,
                  name: "Fuel Pump",
                  parts: [
                    {
                      id: 11111,
                      name: "Fuel Pump Assembly",
                      partNumber: "90910-45-012",
                      description: "Complete fuel pump for precise fuel delivery in MAN B&W engines. High-quality OEM replacement.",
                      priceUSD: 3450,
                      stockQuantity: 5,
                    },
                    {
                      id: 11112,
                      name: "Plunger and Barrel",
                      partNumber: "90910-45-098",
                      description: "Pump barrel ensuring correct fuel delivery; replace if index >10%.",
                      priceUSD: 850,
                      stockQuantity: 12,
                    },
                  ],
                },
                {
                  id: 1112,
                  name: "Fuel Injector",
                  parts: [
                    {
                      id: 11121,
                      name: "Fuel Injector Nozzle",
                      partNumber: "221-015",
                      description: "High-precision nozzle for fuel injection; withstands extreme temperatures.",
                      priceUSD: 450,
                      stockQuantity: 20,
                    },
                  ],
                },
                { id: 1113, name: "High Pressure Fuel Pipe", parts: [] },
                { id: 1114, name: "Fuel Valve", parts: [] },
              ],
            },
            {
              id: 112,
              name: "Cylinder & Piston",
              subCategories: [
                { id: 1121, name: "Cylinder Liner", parts: [] },
                { id: 1122, name: "Piston Crown", parts: [] },
                { id: 1123, name: "Piston Rings", parts: [] },
                { id: 1124, name: "Piston Skirt", parts: [] },
                { id: 1125, name: "Connecting Rod", parts: [] },
              ],
            },
            {
              id: 113,
              name: "Turbocharger",
              subCategories: [
                { id: 1131, name: "Turbine Rotor", parts: [] },
                { id: 1132, name: "Compressor Wheel", parts: [] },
                { id: 1133, name: "Nozzle Ring", parts: [] },
                { id: 1134, name: "Bearing Assembly", parts: [] },
              ],
            },
          ],
        },
        {
          id: 12,
          name: "MAN L35/44DF",
          categories: [
            {
              id: 121,
              name: "Cooling System",
              subCategories: [
                { id: 1211, name: "Fresh Water Pump", parts: [] },
                { id: 1212, name: "Sea Water Pump", parts: [] },
                { id: 1213, name: "Heat Exchanger", parts: [] },
                { id: 1214, name: "Thermostat", parts: [] },
              ],
            },
            {
              id: 122,
              name: "Lubrication System",
              subCategories: [
                { id: 1221, name: "Lube Oil Pump", parts: [] },
                { id: 1222, name: "Lube Oil Filter", parts: [] },
                { id: 1223, name: "Lube Oil Cooler", parts: [] },
                { id: 1224, name: "Crankcase Breather", parts: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Wärtsilä",
      models: [
        {
          id: 21,
          name: "Wärtsilä 31",
          categories: [
            {
              id: 211,
              name: "Exhaust System",
              subCategories: [
                {
                  id: 2111,
                  name: "Exhaust Valve",
                  parts: [
                    {
                      id: 21111,
                      name: "Exhaust Valve Spindle",
                      partNumber: "121-015",
                      description: "High-stress exhaust valve for Wärtsilä engines; features vane wheel for heat distribution.",
                      priceUSD: 67,
                      stockQuantity: 15,
                    },
                  ],
                },
                { id: 2112, name: "Valve Seat", parts: [] },
                { id: 2113, name: "Exhaust Manifold", parts: [] },
                { id: 2114, name: "Turbocharger Silencer", parts: [] },
              ],
            },
            {
              id: 212,
              name: "Starting System",
              subCategories: [
                { id: 2121, name: "Starting Air Valve", parts: [] },
                { id: 2122, name: "Air Distributor", parts: [] },
                { id: 2123, name: "Starting Motor", parts: [] },
              ],
            },
          ],
        },
        {
          id: 22,
          name: "Wärtsilä 20",
          categories: [
            {
              id: 221,
              name: "Governor & Control",
              subCategories: [
                { id: 2211, name: "Electronic Governor", parts: [] },
                { id: 2212, name: "Actuator", parts: [] },
                { id: 2213, name: "Speed Sensor", parts: [] },
                { id: 2214, name: "Overspeed Trip", parts: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: "Caterpillar Marine (MaK)",
      models: [
        {
          id: 31,
          name: "MaK M32C",
          categories: [
            {
              id: 311,
              name: "Crankshaft & Bearings",
              subCategories: [
                { id: 3111, name: "Main Bearing", parts: [] },
                { id: 3112, name: "Crankshaft", parts: [] },
                { id: 3113, name: "Thrust Bearing", parts: [] },
                { id: 3114, name: "Vibration Damper", parts: [] },
              ],
            },
            {
              id: 312,
              name: "Camshaft & Valve Train",
              subCategories: [
                { id: 3121, name: "Camshaft", parts: [] },
                { id: 3122, name: "Rocker Arm", parts: [] },
                { id: 3123, name: "Push Rod", parts: [] },
                { id: 3124, name: "Inlet Valve", parts: [] },
              ],
            },
          ],
        },
        {
          id: 32,
          name: "CAT C280-16",
          categories: [
            {
              id: 321,
              name: "Auxiliary Systems",
              subCategories: [
                {
                  id: 3211,
                  name: "Jacket Water Pump",
                  parts: [
                    {
                      id: 32111,
                      name: "Jacket Water Pump Assembly",
                      partNumber: "6057481",
                      description: "Water pump for CAT C280-16 marine engine cooling system.",
                      priceUSD: 1200,
                      stockQuantity: 3,
                    },
                  ],
                },
                { id: 3212, name: "Pre-lube Pump", parts: [] },
                { id: 3213, name: "Fuel Transfer Pump", parts: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: "YANMAR",
      models: [
        {
          id: 41,
          name: "6EY26",
          categories: [
            {
              id: 411,
              name: "Fuel Injection Equipment",
              subCategories: [
                {
                  id: 4111,
                  name: "Injection Pump",
                  parts: [
                    {
                      id: 41111,
                      name: "Fuel Injection Pump",
                      partNumber: "729670-51450",
                      description: "Remanufactured injection pump for YANMAR marine engines; tested to standards.",
                      priceUSD: 2000,
                      stockQuantity: 4,
                    },
                  ],
                },
                { id: 4112, name: "Delivery Valve", parts: [] },
                { id: 4113, name: "Nozzle Holder", parts: [] },
                { id: 4114, name: "Plunger & Barrel", parts: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 5,
      name: "Alfa Laval",
      models: [
        {
          id: 51,
          name: "PureSOx Scrubber",
          categories: [
            {
              id: 511,
              name: "Scrubber Components",
              subCategories: [
                {
                  id: 5111,
                  name: "Packing Material",
                  parts: [],
                },
                {
                  id: 5112,
                  name: "Spray Nozzles",
                  parts: [
                    {
                      id: 51121,
                      name: "Tapered Spray Nozzle",
                      partNumber: "418",
                      description: "High-quality tapered nozzle for PureSOx scrubber system; ensures efficient spraying.",
                      priceUSD: 333,
                      stockQuantity: 50,
                    },
                  ],
                },
                { id: 5113, name: "Demister", parts: [] },
                { id: 5114, name: "Water Pump", parts: [] },
              ],
            },
          ],
        },
        {
          id: 52,
          name: "MAB Separator",
          categories: [
            {
              id: 521,
              name: "Separator Bowl",
              subCategories: [
                { id: 5211, name: "Bowl Spindle", parts: [] },
                { id: 5212, name: "Disc Stack", parts: [] },
                { id: 5213, name: "Gravity Disc", parts: [] },
                { id: 5214, name: "Seal Rings", parts: [] },
              ],
            },
          ],
        },
      ],
    },
  ]);

  // Inputs for adding new items
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState({ brandId: null as number | null, value: "" });
  const [newCategory, setNewCategory] = useState({ modelId: null as number | null, value: "" });
  const [newSubcategory, setNewSubcategory] = useState({ categoryId: null as number | null, value: "" });
  const [newPart, setNewPart] = useState({
    subcategoryId: null as number | null,
    name: "",
    partNumber: "",
    description: "",
    priceUSD: 0,
    stockQuantity: 0,
  });

  // Add Brand
  const handleAddBrand = () => {
    if (!newBrand.trim()) return;
    setBrands((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newBrand.trim(),
        models: [],
      },
    ]);
    setNewBrand("");
  };

  // Add Model
  const handleAddModel = (brandId: number) => {
    if (!newModel.value.trim()) return;
    setBrands((prev) =>
      prev.map((brand) =>
        brand.id === brandId
          ? {
              ...brand,
              models: [
                ...brand.models,
                {
                  id: Date.now(),
                  name: newModel.value.trim(),
                  categories: [],
                },
              ],
            }
          : brand
      )
    );
    setNewModel({ brandId: null, value: "" });
  };

  // Add Category
  const handleAddCategory = (modelId: number) => {
    if (!newCategory.value.trim()) return;
    setBrands((prev) =>
      prev.map((brand) => ({
        ...brand,
        models: brand.models.map((model) =>
          model.id === modelId
            ? {
                ...model,
                categories: [
                  ...model.categories,
                  {
                    id: Date.now(),
                    name: newCategory.value.trim(),
                    subCategories: [],
                  },
                ],
              }
            : model
        ),
      }))
    );
    setNewCategory({ modelId: null, value: "" });
  };

  // Add Subcategory
  const handleAddSubcategory = (categoryId: number) => {
    if (!newSubcategory.value.trim()) return;
    setBrands((prev) =>
      prev.map((brand) => ({
        ...brand,
        models: brand.models.map((model) => ({
          ...model,
          categories: model.categories.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  subCategories: [
                    ...cat.subCategories,
                    { id: Date.now(), name: newSubcategory.value.trim(), parts: [] },
                  ],
                }
              : cat
          ),
        })),
      }))
    );
    setNewSubcategory({ categoryId: null, value: "" });
  };

  // Add Part
  const handleAddPart = (subcategoryId: number) => {
    if (!newPart.name.trim() || !newPart.partNumber.trim() || newPart.priceUSD <= 0) return;
    setBrands((prev) =>
      prev.map((brand) => ({
        ...brand,
        models: brand.models.map((model) => ({
          ...model,
          categories: model.categories.map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.map((sub) =>
              sub.id === subcategoryId
                ? {
                    ...sub,
                    parts: [
                      ...sub.parts,
                      {
                        id: Date.now(),
                        name: newPart.name.trim(),
                        partNumber: newPart.partNumber.trim(),
                        description: newPart.description.trim(),
                        priceUSD: newPart.priceUSD,
                        stockQuantity: newPart.stockQuantity,
                      },
                    ],
                  }
                : sub
            ),
          })),
        })),
      }))
    );
    setNewPart({
      subcategoryId: null,
      name: "",
      partNumber: "",
      description: "",
      priceUSD: 0,
      stockQuantity: 0,
    });
  };

  return (
    <div style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          padding: "15px 20px",
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ margin: 0 }}>🚢 Shipping Parts Hierarchy</h2>
        <p style={{ margin: "6px 0 0", color: "#555" }}>
          Manage Brand → Model → Category → Sub-Category → Parts
        </p>
      </div>

      {/* Add Brand Section */}
      <div
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <h3 style={{ margin: "0 0 12px" }}>Add Brand</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
            placeholder="Enter Brand Name"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
          <button
            onClick={handleAddBrand}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Add Brand
          </button>
        </div>
      </div>

      {/* Brands List */}
      {brands.map((brand) => (
        <div
          key={brand.id}
          style={{
            marginBottom: 24,
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "white",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 18 }}>Brand: {brand.name}</strong>

            {/* Add Model */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {newModel.brandId === brand.id ? (
                <>
                  <input
                    autoFocus
                    value={newModel.value}
                    onChange={(e) => setNewModel({ ...newModel, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddModel(brand.id);
                      if (e.key === "Escape") setNewModel({ brandId: null, value: "" });
                    }}
                    placeholder="Model name"
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #9ca3af" }}
                  />
                  <button
                    onClick={() => handleAddModel(brand.id)}
                    style={{ padding: "6px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: 6 }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setNewModel({ brandId: null, value: "" })}
                    style={{ padding: "6px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6 }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setNewModel({ brandId: brand.id, value: "" })}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  + Add Model
                </button>
              )}
            </div>
          </div>

          {/* Models */}
          {brand.models.map((model) => (
            <div
              key={model.id}
              style={{
                marginLeft: 24,
                marginTop: 16,
                padding: 14,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 16 }}>Model: {model.name}</strong>

                {/* Add Category */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {newCategory.modelId === model.id ? (
                    <>
                      <input
                        autoFocus
                        value={newCategory.value}
                        onChange={(e) => setNewCategory({ ...newCategory, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCategory(model.id);
                          if (e.key === "Escape") setNewCategory({ modelId: null, value: "" });
                        }}
                        placeholder="Category name"
                        style={{ padding: 8, borderRadius: 6, border: "1px solid #9ca3af" }}
                      />
                      <button onClick={() => handleAddCategory(model.id)} style={{ padding: "6px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: 6 }}>
                        ✓
                      </button>
                      <button onClick={() => setNewCategory({ modelId: null, value: "" })} style={{ padding: "6px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6 }}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setNewCategory({ modelId: model.id, value: "" })}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      + Add Category
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              {model.categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    marginLeft: 32,
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "white",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Category: {cat.name}</strong>

                    {/* Add Subcategory */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {newSubcategory.categoryId === cat.id ? (
                        <>
                          <input
                            autoFocus
                            value={newSubcategory.value}
                            onChange={(e) => setNewSubcategory({ ...newSubcategory, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubcategory(cat.id);
                              if (e.key === "Escape") setNewSubcategory({ categoryId: null, value: "" });
                            }}
                            placeholder="Subcategory name"
                            style={{ padding: 8, borderRadius: 6, border: "1px solid #9ca3af" }}
                          />
                          <button onClick={() => handleAddSubcategory(cat.id)} style={{ padding: "6px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: 6 }}>
                            ✓
                          </button>
                          <button onClick={() => setNewSubcategory({ categoryId: null, value: "" })} style={{ padding: "6px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6 }}>
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setNewSubcategory({ categoryId: cat.id, value: "" })}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          + Add Subcategory
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {cat.subCategories.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        marginLeft: 32,
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 15 }}>Subcategory: {sub.name}</strong>

                        {/* Add Part */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {newPart.subcategoryId === sub.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <input
                                autoFocus
                                value={newPart.name}
                                onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                                placeholder="Part name"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #9ca3af" }}
                              />
                              <input
                                value={newPart.partNumber}
                                onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                                placeholder="Part number"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #9ca3af" }}
                              />
                              <input
                                value={newPart.description}
                                onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                                placeholder="Description"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #9ca3af" }}
                              />
                              <input
                                type="number"
                                value={newPart.priceUSD}
                                onChange={(e) => setNewPart({ ...newPart, priceUSD: parseFloat(e.target.value) || 0 })}
                                placeholder="Price USD"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #9ca3af" }}
                              />
                              <input
                                type="number"
                                value={newPart.stockQuantity}
                                onChange={(e) => setNewPart({ ...newPart, stockQuantity: parseInt(e.target.value) || 0 })}
                                placeholder="Stock quantity"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #9ca3af" }}
                              />
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => handleAddPart(sub.id)} style={{ padding: "4px 8px", background: "#16a34a", color: "white", border: "none", borderRadius: 4 }}>
                                  ✓
                                </button>
                                <button onClick={() => setNewPart({ subcategoryId: null, name: "", partNumber: "", description: "", priceUSD: 0, stockQuantity: 0 })} style={{ padding: "4px 8px", background: "#dc2626", color: "white", border: "none", borderRadius: 4 }}>
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setNewPart({ ...newPart, subcategoryId: sub.id })}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #d1d5db",
                                background: "white",
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              + Add Part
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Parts */}
                      {sub.parts.map((part) => (
                        <div
                          key={part.id}
                          style={{
                            marginLeft: 32,
                            marginTop: 8,
                            padding: 8,
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            background: "#fafafa",
                            fontSize: 13,
                          }}
                        >
                          <strong>Part: {part.name}</strong> ({part.partNumber})<br />
                          Description: {part.description}<br />
                          Price: ${part.priceUSD} USD | Stock: {part.stockQuantity}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}