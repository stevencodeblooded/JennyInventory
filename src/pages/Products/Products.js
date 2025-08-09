// src/pages/Products/Products.js
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { productsAPI, categoriesAPI } from "../../services/api";
import { formatCurrency, getStockStatus, debounce } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const Products = () => {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    status: searchParams.get("status") || "active",
    stockStatus: searchParams.get("stockStatus") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page")) || 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const debouncedFetch = debounce(fetchProducts, 300);
    debouncedFetch();
  }, [searchTerm, filters, pagination.page]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (filters.category) params.set("category", filters.category);
    if (filters.status !== "active") params.set("status", filters.status);
    if (filters.stockStatus) params.set("stockStatus", filters.stockStatus);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (pagination.page > 1) params.set("page", pagination.page.toString());

    setSearchParams(params);
  }, [searchTerm, filters, pagination.page, setSearchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
        inStock:
          filters.stockStatus === "in_stock"
            ? "true"
            : filters.stockStatus === "out_of_stock"
            ? "false"
            : undefined,
        lowStock: filters.stockStatus === "low_stock" ? "true" : undefined,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productsAPI.getProducts(params);
      setProducts(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      status: "active",
      stockStatus: "",
      minPrice: "",
      maxPrice: "",
    });
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const deleteProduct = async (productId, productName) => {
    if (!hasPermission("products", "delete")) {
      toast.error("You do not have permission to delete products");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await productsAPI.deleteProduct(productId);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const getFilterCount = () => {
    return (
      Object.values(filters).filter((value) => value && value !== "active")
        .length + (searchTerm ? 1 : 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
          <p className="text-secondary-600">
            Manage your inventory and product catalog
          </p>
        </div>

        {hasPermission("products", "create") && (
          <Link to="/products/add" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary relative ${
              showFilters ? "bg-secondary-200" : ""
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {getFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) =>
                    handleFilterChange("stockStatus", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {getFilterCount() > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Price</th>
                    <th className="table-header">Stock</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(
                      product.inventory.currentStock,
                      product.inventory.minStock
                    );

                    return (
                      <tr key={product._id} className="hover:bg-secondary-50">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.images?.[0]?.url ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={product.images[0].url}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-secondary-200 flex items-center justify-center">
                                  <span className="text-secondary-500 text-xs">
                                    📦
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-secondary-500">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm text-secondary-900">
                            {product.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-secondary-900">
                            {formatCurrency(product.pricing.sellingPrice)}
                          </div>
                          {product.pricing.discount > 0 && (
                            <div className="text-xs text-green-600">
                              {product.pricing.discount}% off
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-secondary-900">
                              {product.inventory.currentStock}
                            </span>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}
                            >
                              {product.inventory.currentStock === 0 ? (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              ) : product.inventory.currentStock <=
                                product.inventory.minStock ? (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                              )}
                              {stockStatus.status}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.status.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/products/${product._id}`}
                              className="text-secondary-400 hover:text-secondary-600"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>

                            {hasPermission("products", "update") && (
                              <Link
                                to={`/products/${product._id}/edit`}
                                className="text-blue-400 hover:text-blue-600"
                                title="Edit Product"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                            )}

                            {hasPermission("products", "delete") && (
                              <button
                                onClick={() =>
                                  deleteProduct(product._id, product.name)
                                }
                                className="text-red-400 hover:text-red-600"
                                title="Delete Product"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-secondary-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-secondary-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            pagination.page * pagination.limit,
                            pagination.total
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">{pagination.total}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        {[...Array(pagination.pages)].map((_, index) => {
                          const page = index + 1;
                          const isCurrentPage = page === pagination.page;

                          // Show only a few pages around current page
                          if (
                            page === 1 ||
                            page === pagination.pages ||
                            (page >= pagination.page - 2 &&
                              page <= pagination.page + 2)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  isCurrentPage
                                    ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                                    : "bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === pagination.page - 3 ||
                            page === pagination.page + 3
                          ) {
                            return (
                              <span
                                key={page}
                                className="relative inline-flex items-center px-4 py-2 border border-secondary-300 bg-white text-sm font-medium text-secondary-700"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-secondary-400 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No products found
            </h3>
            <p className="text-secondary-600 mb-4">
              {getFilterCount() > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by adding your first product"}
            </p>
            {hasPermission("products", "create") && getFilterCount() === 0 && (
              <Link to="/products/add" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Product
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
