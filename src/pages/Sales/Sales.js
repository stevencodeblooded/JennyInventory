// src/pages/Sales/Sales.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { salesAPI, usersAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getPaymentStatus, debounce } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PrinterIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ReceiptRefundIcon,
} from '@heroicons/react/24/outline';

const Sales = () => {
  const { hasPermission, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    seller: searchParams.get('seller') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    status: searchParams.get('status') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dailySummary, setDailySummary] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchDailySummary();
  }, []);

  useEffect(() => {
    const debouncedFetch = debounce(fetchSales, 300);
    debouncedFetch();
  }, [searchTerm, filters, pagination.page]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.seller) params.set('seller', filters.seller);
    if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
    if (filters.status) params.set('status', filters.status);
    if (filters.minAmount) params.set('minAmount', filters.minAmount);
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
    if (pagination.page > 1) params.set('page', pagination.page.toString());
    
    setSearchParams(params);
  }, [searchTerm, filters, pagination.page, setSearchParams]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await salesAPI.getDailySummary();
      setDailySummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        receiptNumber: searchTerm,
        ...filters,
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await salesAPI.getSales(params);
      setSales(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      seller: '',
      paymentMethod: '',
      status: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const printReceipt = async (saleId) => {
    try {
      await salesAPI.printReceipt(saleId);
      toast.success('Receipt printed successfully');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  const voidSale = async (saleId, receiptNumber) => {
    if (!hasPermission('sales', 'void')) {
      toast.error('You do not have permission to void sales');
      return;
    }

    const reason = window.prompt(`Enter reason for voiding sale ${receiptNumber}:`);
    if (!reason) return;

    try {
      await salesAPI.voidSale(saleId, reason);
      toast.success('Sale voided successfully');
      fetchSales();
      fetchDailySummary();
    } catch (error) {
      console.error('Failed to void sale:', error);
      toast.error(error.response?.data?.message || 'Failed to void sale');
    }
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value).length + (searchTerm ? 1 : 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Sales</h1>
          <p className="text-secondary-600">
            View and manage all sales transactions
          </p>
        </div>

        <Link to="/pos" className="btn-primary">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          New Sale
        </Link>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">
                  Today's Revenue
                </p>
                <p className="text-xl font-bold text-secondary-900">
                  {formatCurrency(dailySummary.summary.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by receipt number..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-11"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary relative flex items-center justify-center h-11 ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="input-field"
                />
              </div>

              {/* Seller Filter (only for owners/managers) */}
              {hasPermission("users", "manage") && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Seller
                  </label>
                  <select
                    value={filters.seller}
                    onChange={(e) =>
                      handleFilterChange("seller", e.target.value)
                    }
                    className="input-field"
                  >
                    <option value="">All Sellers</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    handleFilterChange("paymentMethod", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Credit</option>
                  <option value="mixed">Mixed</option>
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
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="voided">Voided</option>
                  <option value="refunded">Refunded</option>
                  <option value="partial_refund">Partial Refund</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) =>
                    handleFilterChange("minAmount", e.target.value)
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    handleFilterChange("maxAmount", e.target.value)
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {getFilterCount() > 0 && (
              <div className="flex justify-end">
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

      {/* Sales Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : sales.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="table-header">Receipt</th>
                    <th className="table-header">Date & Time</th>
                    <th className="table-header">Customer</th>
                    {hasPermission("users", "manage") && (
                      <th className="table-header">Seller</th>
                    )}
                    <th className="table-header">Items</th>
                    <th className="table-header">Payment</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sales.map((sale) => {
                    const paymentStatus = getPaymentStatus(sale.payment.status);

                    return (
                      <tr key={sale._id} className="hover:bg-secondary-50">
                        <td className="table-cell">
                          <Link
                            to={`/sales/${sale._id}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {sale.receiptNumber}
                          </Link>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm">
                            <div className="text-secondary-900">
                              {formatDateTime(sale.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          {sale.customerInfo ? (
                            <div>
                              <div className="text-sm font-medium text-secondary-900">
                                {sale.customerInfo.name}
                              </div>
                              <div className="text-sm text-secondary-500">
                                {sale.customerInfo.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-secondary-500">Walk-in</span>
                          )}
                        </td>
                        {hasPermission("users", "manage") && (
                          <td className="table-cell">
                            <span className="text-sm text-secondary-900">
                              {sale.seller?.name || "Unknown"}
                            </span>
                          </td>
                        )}
                        <td className="table-cell">
                          <span className="text-sm text-secondary-900">
                            {sale.items.length} items
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}
                            >
                              {paymentStatus.text}
                            </span>
                            <span className="ml-2 text-sm text-secondary-600 capitalize">
                              {sale.payment.method.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm font-medium text-secondary-900">
                            {formatCurrency(sale.totals.total)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sale.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : sale.status === "voided"
                                ? "bg-red-100 text-red-800"
                                : sale.status === "refunded"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {sale.status === "completed"
                              ? "Completed"
                              : sale.status === "voided"
                              ? "Voided"
                              : sale.status === "refunded"
                              ? "Refunded"
                              : sale.status === "partial_refund"
                              ? "Partial Refund"
                              : sale.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/sales/${sale._id}`}
                              className="text-secondary-400 hover:text-secondary-600"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => printReceipt(sale._id)}
                              className="text-blue-400 hover:text-blue-600"
                              title="Print Receipt"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>

                            {hasPermission("sales", "void") &&
                              sale.status === "completed" && (
                                <button
                                  onClick={() =>
                                    voidSale(sale._id, sale.receiptNumber)
                                  }
                                  className="text-red-400 hover:text-red-600"
                                  title="Void Sale"
                                >
                                  <XCircleIcon className="h-4 w-4" />
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
              <ReceiptRefundIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No sales found
            </h3>
            <p className="text-secondary-600 mb-4">
              {getFilterCount() > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by making your first sale"}
            </p>
            {getFilterCount() === 0 && (
              <Link
                to="/pos"
                className="btn-primary flex items-center justify-center w-fit mx-auto"
              >
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                New Sale
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;