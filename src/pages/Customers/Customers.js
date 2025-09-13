// src/pages/Customers/Customers.js
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { customersAPI } from "../../services/api";
import {
  formatCurrency,
  formatPhoneNumber,
  formatDate,
  debounce,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const Customers = () => {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "active",
    segment: searchParams.get("segment") || "",
    location: searchParams.get("location") || "",
    registrationStart: searchParams.get("registrationStart") || "",
    registrationEnd: searchParams.get("registrationEnd") || "",
    minSpent: searchParams.get("minSpent") || "",
    maxSpent: searchParams.get("maxSpent") || "",
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page")) || 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const debouncedFetch = debounce(fetchCustomers, 300);
    debouncedFetch();
  }, [searchTerm, filters, pagination.page]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (filters.status !== "active") params.set("status", filters.status);
    if (filters.segment) params.set("segment", filters.segment);
    if (filters.location) params.set("location", filters.location);
    if (filters.registrationStart)
      params.set("registrationStart", filters.registrationStart);
    if (filters.registrationEnd)
      params.set("registrationEnd", filters.registrationEnd);
    if (filters.minSpent) params.set("minSpent", filters.minSpent);
    if (filters.maxSpent) params.set("maxSpent", filters.maxSpent);
    if (pagination.page > 1) params.set("page", pagination.page.toString());

    setSearchParams(params);
  }, [searchTerm, filters, pagination.page, setSearchParams]);

  const fetchStats = async () => {
    try {
      const response = await customersAPI.getSegments();
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch customer stats:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (params[key] === "") {
          delete params[key];
        }
      });

      const response = await customersAPI.getCustomers(params);
      setCustomers(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers");
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
      status: "active",
      segment: "",
      location: "",
      registrationStart: "",
      registrationEnd: "",
      minSpent: "",
      maxSpent: "",
    });
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const deleteCustomer = async (customerId, customerName) => {
    if (!hasPermission("orders", "delete")) {
      toast.error("You do not have permission to delete customers");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await customersAPI.deleteCustomer(customerId);
      toast.success("Customer deleted successfully");
      fetchCustomers();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const getCustomerStatus = (customer) => {
    if (!customer.status.isActive) {
      return { color: "text-red-600", bgColor: "bg-red-100", text: "Inactive" };
    }

    const lastOrderDate = customer.lastOrder?.date;
    if (!lastOrderDate) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        text: "New",
      };
    }

    const daysSinceLastOrder = Math.floor(
      (new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastOrder <= 30) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        text: "Active",
      };
    } else if (daysSinceLastOrder <= 90) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        text: "At Risk",
      };
    } else {
      return { color: "text-red-600", bgColor: "bg-red-100", text: "Dormant" };
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
          <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
          <p className="text-secondary-600">
            Manage your customer database and relationships
          </p>
        </div>

        {hasPermission("orders", "create") && (
          <Link to="/customers/add" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Customer
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">
                  Total Customers
                </p>
                <p className="text-xl font-bold text-secondary-900">
                  {stats.totalCustomers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <StarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">
                  VIP Customers
                </p>
                <p className="text-xl font-bold text-secondary-900">
                  {stats.vipCustomers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">
                  New This Month
                </p>
                <p className="text-xl font-bold text-secondary-900">
                  {stats.newThisMonth || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">
                  Average Spend
                </p>
                <p className="text-xl font-bold text-secondary-900">
                  {formatCurrency(stats.averageSpend || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <option value="all">All</option>
                </select>
              </div>

              {/* Segment Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Segment
                </label>
                <select
                  value={filters.segment}
                  onChange={(e) =>
                    handleFilterChange("segment", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">All Segments</option>
                  <option value="vip">VIP</option>
                  <option value="regular">Regular</option>
                  <option value="new">New</option>
                  <option value="at_risk">At Risk</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City or area"
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="input-field"
                />
              </div>

              {/* Registration Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Registration Start
                </label>
                <input
                  type="date"
                  value={filters.registrationStart}
                  onChange={(e) =>
                    handleFilterChange("registrationStart", e.target.value)
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Registration End
                </label>
                <input
                  type="date"
                  value={filters.registrationEnd}
                  onChange={(e) =>
                    handleFilterChange("registrationEnd", e.target.value)
                  }
                  className="input-field"
                />
              </div>

              {/* Spend Range */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Min Total Spent
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minSpent}
                  onChange={(e) =>
                    handleFilterChange("minSpent", e.target.value)
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Max Total Spent
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxSpent}
                  onChange={(e) =>
                    handleFilterChange("maxSpent", e.target.value)
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

      {/* Customers Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : customers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Contact</th>
                    <th className="table-header">Location</th>
                    <th className="table-header">Orders</th>
                    <th className="table-header">Total Spent</th>
                    <th className="table-header">Last Order</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {customers.map((customer) => {
                    const status = getCustomerStatus(customer);

                    return (
                      <tr key={customer._id} className="hover:bg-secondary-50">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {customer.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={customer.avatar}
                                  alt={customer.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-primary-600 font-medium">
                                    {customer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900">
                                {customer.name}
                                {customer.isVIP && (
                                  <StarIcon className="h-4 w-4 text-yellow-500 inline ml-1" />
                                )}
                              </div>
                              <div className="text-sm text-secondary-500">
                                ID:{" "}
                                {customer.customerId || customer._id.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="flex items-center text-sm text-secondary-900">
                              <PhoneIcon className="h-4 w-4 text-secondary-400 mr-1" />
                              {formatPhoneNumber(customer.phone)}
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-secondary-500">
                                <EnvelopeIcon className="h-4 w-4 text-secondary-400 mr-1" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          {customer.address ? (
                            <div className="flex items-center text-sm text-secondary-900">
                              <MapPinIcon className="h-4 w-4 text-secondary-400 mr-1" />
                              <span className="truncate max-w-32">
                                {customer.address.city ||
                                  customer.address.area ||
                                  "N/A"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-secondary-500">
                              No address
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="text-sm font-medium text-secondary-900">
                            {customer.orderCount || 0}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm font-medium text-secondary-900">
                            {formatCurrency(customer.totalSpent || 0)}
                          </span>
                        </td>
                        <td className="table-cell">
                          {customer.lastOrder?.date ? (
                            <span className="text-sm text-secondary-900">
                              {formatDate(customer.lastOrder.date)}
                            </span>
                          ) : (
                            <span className="text-secondary-500">
                              No orders
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/customers/${customer._id}`}
                              className="text-secondary-400 hover:text-secondary-600"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>

                            {hasPermission("orders", "update") && (
                              <Link
                                to={`/customers/${customer._id}/edit`}
                                className="text-blue-400 hover:text-blue-600"
                                title="Edit Customer"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                            )}

                            {hasPermission("orders", "delete") && (
                              <button
                                onClick={() =>
                                  deleteCustomer(customer._id, customer.name)
                                }
                                className="text-red-400 hover:text-red-600"
                                title="Delete Customer"
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
              <UserIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No customers found
            </h3>
            <p className="text-secondary-600 mb-4">
              {getFilterCount() > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by adding your first customer"}
            </p>
            {hasPermission("orders", "create") && getFilterCount() === 0 && (
              <Link
                to="/customers/add"
                className="btn-primary flex items-center justify-center w-fit mx-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Customer
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
