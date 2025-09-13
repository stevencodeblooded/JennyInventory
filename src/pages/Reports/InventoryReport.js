// src/pages/Reports/InventoryReport.js
import React, { useState, useEffect } from "react";
import { reportsAPI, categoriesAPI } from "../../services/api";
import {
  formatCurrency,
  formatDate,
  getStockStatus,
  downloadCSV,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    stockStatus: "",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchInventoryReport();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getInventoryReport(filters);
      setReportData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch inventory report:", error);
      toast.error("Failed to load inventory report");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const exportReport = async () => {
    try {
      const response = await reportsAPI.exportToExcel({
        type: "inventory",
        filters,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Failed to export report:", error);
      toast.error("Failed to export report");
    }
  };

  const exportCSV = () => {
    if (!reportData?.products) return;

    const csvData = reportData.products.map((product) => ({
      "Product Name": product.name,
      SKU: product.sku,
      Category: product.category?.name || "Uncategorized",
      "Current Stock": product.inventory.currentStock,
      "Min Stock": product.inventory.minStock,
      "Max Stock": product.inventory.maxStock || "N/A",
      "Unit Cost": product.pricing.cost,
      "Selling Price": product.pricing.sellingPrice,
      "Stock Value": product.stockValue,
      "Stock Status": getStockStatus(
        product.inventory.currentStock,
        product.inventory.minStock
      ).status,
      "Last Updated": formatDate(product.updatedAt),
    }));

    downloadCSV(
      csvData,
      `inventory-report-${new Date().toISOString().split("T")[0]}`
    );
  };

  const COLORS = ["#e11d48", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

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
            onClick={() => window.history.back()}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Inventory Report
            </h1>
            <p className="text-secondary-600">
              Comprehensive inventory analysis and stock management
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button onClick={exportCSV} className="btn-secondary">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
          <button onClick={exportReport} className="btn-primary">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
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
              <option value="">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="input-field"
            >
              <option value="name">Product Name</option>
              <option value="stock">Stock Level</option>
              <option value="value">Stock Value</option>
              <option value="lastUpdated">Last Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="input-field"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reportData.summary.totalProducts || 0}
                </p>
                <p className="text-sm text-secondary-500">
                  {reportData.summary.activeProducts || 0} active
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Total Stock Value
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(reportData.summary.totalStockValue || 0)}
                </p>
                <p className="text-sm text-secondary-500">At cost price</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reportData.summary.lowStockCount || 0}
                </p>
                <p className="text-sm text-secondary-500">Need attention</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reportData.summary.outOfStockCount || 0}
                </p>
                <p className="text-sm text-secondary-500">
                  Immediate action needed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock by Category */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Stock Value by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.stockByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(reportData.stockByCategory || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Stock Value",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Status Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Stock Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.stockStatusDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products by Value */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Top Products by Stock Value
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.topProductsByValue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Stock Value",
                    ]}
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Movement Trend */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Stock Movement Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.stockMovementTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="stockIn"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Stock In"
                  />
                  <Line
                    type="monotone"
                    dataKey="stockOut"
                    stroke="#e11d48"
                    strokeWidth={2}
                    name="Stock Out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Table */}
      {reportData?.products && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Product Details
            </h3>
            <p className="text-sm text-secondary-600">
              Showing {reportData.products.length} products
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Current Stock</th>
                  <th className="table-header">Min Stock</th>
                  <th className="table-header">Stock Value</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {reportData.products.slice(0, 50).map((product) => {
                  const stockStatus = getStockStatus(
                    product.inventory.currentStock,
                    product.inventory.minStock
                  );

                  return (
                    <tr key={product._id} className="hover:bg-secondary-50">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-secondary-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-secondary-500">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {product.category?.name || "Uncategorized"}
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">
                          {product.inventory.currentStock}
                        </span>
                      </td>
                      <td className="table-cell">
                        {product.inventory.minStock}
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">
                          {formatCurrency(product.stockValue || 0)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}
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
                      </td>
                      <td className="table-cell">
                        {formatDate(product.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {reportData.products.length > 50 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-secondary-600">
                Showing first 50 products. Export for complete data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Low Stock Alerts */}
      {reportData?.lowStockProducts &&
        reportData.lowStockProducts.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 inline mr-2" />
              Low Stock Alerts
            </h3>

            <div className="space-y-3">
              {reportData.lowStockProducts.slice(0, 10).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-secondary-900">
                      {product.name}
                    </p>
                    <p className="text-sm text-secondary-500">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-700">
                      {product.inventory.currentStock} left
                    </p>
                    <p className="text-sm text-yellow-600">
                      Min: {product.inventory.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Stock Movement Summary */}
      {reportData?.stockMovements && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Stock Movements
          </h3>

          <div className="space-y-3">
            {reportData.stockMovements.slice(0, 10).map((movement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      movement.type === "in"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {movement.type === "in" ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      {movement.productName}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {movement.reason}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      movement.type === "in" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {movement.type === "in" ? "+" : "-"}
                    {movement.quantity}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {formatDate(movement.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
