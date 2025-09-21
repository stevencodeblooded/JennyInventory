// src/pages/Products/EditProduct.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productsAPI, categoriesAPI } from "../../services/api";
import { sanitizeInput } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    sku: "",
    category: "",
    subcategory: "",
    description: "",
    brand: "",
    unit: "piece",
    pricing: {
      cost: "",
      sellingPrice: "",
      wholesalePrice: "",
      discount: 0,
    },
    inventory: {
      minStock: 10,
      maxStock: "",
      reorderPoint: "",
      reorderQuantity: "",
      trackInventory: true,
      allowBackorder: false,
    },
    supplier: {
      name: "",
      contact: "",
    },
    attributes: [],
    status: {
      isActive: true,
    },
  });
  const [errors, setErrors] = useState({});
  const [newAttribute, setNewAttribute] = useState({ name: "", value: "" });

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      const product = response.data.data;

      setFormData({
        name: product.name || "",
        barcode: product.barcode || "",
        sku: product.sku || "",
        category: product.category?._id || "",
        subcategory: product.subcategory || "",
        description: product.description || "",
        brand: product.brand || "",
        unit: product.unit || "piece",
        pricing: {
          cost: product.pricing.cost || "",
          sellingPrice: product.pricing.sellingPrice || "",
          wholesalePrice: product.pricing.wholesalePrice || "",
          discount: product.pricing.discount || 0,
        },
        inventory: {
          minStock: product.inventory.minStock || 10,
          maxStock: product.inventory.maxStock || "",
          reorderPoint: product.inventory.reorderPoint || "",
          reorderQuantity: product.inventory.reorderQuantity || "",
          trackInventory: product.inventory.trackInventory !== false,
          allowBackorder: product.inventory.allowBackorder || false,
        },
        supplier: {
          name: product.supplier?.name || "",
          contact: product.supplier?.contact || "",
        },
        attributes: product.attributes || [],
        status: {
          isActive: product.status.isActive !== false,
        },
      });
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product details");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split(".");

    if (keys.length === 1) {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : sanitizeInput(value),
      }));
    } else if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? parseFloat(value) || 0
              : sanitizeInput(value),
        },
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.pricing.cost) {
      newErrors["pricing.cost"] = "Cost price is required";
    } else if (formData.pricing.cost < 0) {
      newErrors["pricing.cost"] = "Cost price cannot be negative";
    }

    if (!formData.pricing.sellingPrice) {
      newErrors["pricing.sellingPrice"] = "Selling price is required";
    } else if (formData.pricing.sellingPrice < 0) {
      newErrors["pricing.sellingPrice"] = "Selling price cannot be negative";
    }

    if (formData.inventory.minStock < 0) {
      newErrors["inventory.minStock"] = "Minimum stock cannot be negative";
    }

    if (formData.pricing.discount < 0 || formData.pricing.discount > 100) {
      newErrors["pricing.discount"] = "Discount must be between 0 and 100";
    }

    // Validate selling price is higher than cost
    if (formData.pricing.cost && formData.pricing.sellingPrice) {
      if (
        parseFloat(formData.pricing.sellingPrice) <
        parseFloat(formData.pricing.cost)
      ) {
        newErrors["pricing.sellingPrice"] =
          "Selling price should be higher than cost price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addAttribute = () => {
    if (newAttribute.name && newAttribute.value) {
      setFormData((prev) => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }],
      }));
      setNewAttribute({ name: "", value: "" });
    }
  };

  const removeAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setSaving(true);

      // Clean up data
      const cleanData = {
        ...formData,
        pricing: {
          ...formData.pricing,
          cost: parseFloat(formData.pricing.cost),
          sellingPrice: parseFloat(formData.pricing.sellingPrice),
          wholesalePrice: formData.pricing.wholesalePrice
            ? parseFloat(formData.pricing.wholesalePrice)
            : undefined,
          discount: parseFloat(formData.pricing.discount) || 0,
        },
        inventory: {
          ...formData.inventory,
          minStock: parseInt(formData.inventory.minStock) || 10,
          maxStock: formData.inventory.maxStock
            ? parseInt(formData.inventory.maxStock)
            : undefined,
          reorderPoint: formData.inventory.reorderPoint
            ? parseInt(formData.inventory.reorderPoint)
            : undefined,
          reorderQuantity: formData.inventory.reorderQuantity
            ? parseInt(formData.inventory.reorderQuantity)
            : undefined,
        },
      };

      // Remove empty fields
      if (!cleanData.barcode) delete cleanData.barcode;
      if (!cleanData.subcategory) delete cleanData.subcategory;
      if (!cleanData.description) delete cleanData.description;
      if (!cleanData.brand) delete cleanData.brand;
      if (!cleanData.supplier.name) cleanData.supplier = undefined;

      await productsAPI.updateProduct(id, cleanData);
      toast.success("Product updated successfully!");
      navigate(`/products/${id}`);
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.pricing.cost) || 0;
    const selling = parseFloat(formData.pricing.sellingPrice) || 0;

    if (cost === 0) return 0;
    return (((selling - cost) / cost) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/products/${id}`)}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Edit Product
            </h1>
            <p className="text-secondary-600">Update product information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? "border-red-300" : ""}`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input-field"
                placeholder="Product SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input-field ${
                  errors.category ? "border-red-300" : ""
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Unit of Measurement *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input-field"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (l)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="dozen">Dozen</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Product description"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Pricing
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Selling Price (KSh) *
              </label>
              <input
                type="number"
                name="pricing.sellingPrice"
                value={formData.pricing.sellingPrice}
                onChange={handleChange}
                className={`input-field ${
                  errors["pricing.sellingPrice"] ? "border-red-300" : ""
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors["pricing.sellingPrice"] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors["pricing.sellingPrice"]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Profit Margin Display */}
            {formData.pricing.cost && formData.pricing.sellingPrice && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Profit Margin
                </label>
                <div className="input-field bg-secondary-50 text-secondary-700">
                  {calculateProfitMargin()}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Inventory Settings
          </h3>
          <p className="text-sm text-secondary-600 mb-4">
            Note: Current stock cannot be edited here. Use the stock update
            feature on the product detail page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                name="inventory.minStock"
                value={formData.inventory.minStock}
                onChange={handleChange}
                className="input-field"
                placeholder="10"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Maximum Stock Level
              </label>
              <input
                type="number"
                name="inventory.maxStock"
                value={formData.inventory.maxStock}
                onChange={handleChange}
                className="input-field"
                placeholder="1000"
                min="0"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                name="inventory.reorderPoint"
                value={formData.inventory.reorderPoint}
                onChange={handleChange}
                className="input-field"
                placeholder="20"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Reorder Quantity
              </label>
              <input
                type="number"
                name="inventory.reorderQuantity"
                value={formData.inventory.reorderQuantity}
                onChange={handleChange}
                className="input-field"
                placeholder="100"
                min="0"
              />
            </div> */}
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="inventory.trackInventory"
                checked={formData.inventory.trackInventory}
                onChange={handleChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Track inventory
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="inventory.allowBackorder"
                checked={formData.inventory.allowBackorder}
                onChange={handleChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Allow backorders
              </span>
            </label>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Supplier Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                name="supplier.name"
                value={formData.supplier.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Supplier Contact
              </label>
              <input
                type="text"
                name="supplier.contact"
                value={formData.supplier.contact}
                onChange={handleChange}
                className="input-field"
                placeholder="Phone or email"
              />
            </div>
          </div>
        </div>

        {/* Product Attributes */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Product Attributes
          </h3>

          <div className="space-y-3">
            {formData.attributes.map((attribute, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium text-secondary-900">
                    {attribute.name}:
                  </span>
                  <span className="ml-2 text-secondary-700">
                    {attribute.value}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}

            <div className="flex space-x-3">
              <input
                type="text"
                value={newAttribute.name}
                onChange={(e) =>
                  setNewAttribute((prev) => ({ ...prev, name: e.target.value }))
                }
                className="flex-1 input-field"
                placeholder="Attribute name (e.g., Color, Size)"
              />
              <input
                type="text"
                value={newAttribute.value}
                onChange={(e) =>
                  setNewAttribute((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                className="flex-1 input-field"
                placeholder="Attribute value (e.g., Red, Large)"
              />
              <button
                type="button"
                onClick={addAttribute}
                disabled={!newAttribute.name || !newAttribute.value}
                className="btn-secondary disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Status
          </h3>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="status.isActive"
              checked={formData.status.isActive}
              onChange={handleChange}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-secondary-700">
              Product is active
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/products/${id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <LoadingSpinner size="small" text="Updating..." />
            ) : (
              "Update Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
