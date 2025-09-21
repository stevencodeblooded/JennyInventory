// src/pages/Orders/Orders.js
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ordersAPI, usersAPI } from "../../services/api";
import {
  formatCurrency,
  formatDateTime,
  getOrderStatus,
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
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const Orders = () => {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    assignedTo: searchParams.get("assignedTo") || "",
    paymentStatus: searchParams.get("paymentStatus") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    minAmount: searchParams.get("minAmount") || "",
    maxAmount: searchParams.get("maxAmount") || "",
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page")) || 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const debouncedFetch = debounce(fetchOrders, 300);
    debouncedFetch();
  }, [searchTerm, filters, pagination.page]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (filters.status) params.set("status", filters.status);
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.paymentStatus)
      params.set("paymentStatus", filters.paymentStatus);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.minAmount) params.set("minAmount", filters.minAmount);
    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
    if (pagination.page > 1) params.set("page", pagination.page.toString());

    setSearchParams(params);
  }, [searchTerm, filters, pagination.page, setSearchParams]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchOrders = async () => {
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

      const response = await ordersAPI.getOrders(params);
      setOrders(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
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
      status: "",
      assignedTo: "",
      paymentStatus: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!hasPermission("orders", "update")) {
      toast.error("You do not have permission to update orders");
      return;
    }

    try {
      await ordersAPI.updateStatus(orderId, { status: newStatus });
      toast.success("Order status updated successfully");
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  const cancelOrder = async (orderId, orderNumber) => {
    if (!hasPermission("orders", "update")) {
      toast.error("You do not have permission to cancel orders");
      return;
    }

    const reason = window.prompt(
      `Enter reason for cancelling order ${orderNumber}:`
    );
    if (!reason) return;

    try {
      await ordersAPI.cancelOrder(orderId, reason);
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const getFilterCount = () => {
    return (
      Object.values(filters).filter((value) => value).length +
      (searchTerm ? 1 : 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Orders</h1>
          <p className="text-secondary-600">
            Manage customer orders and deliveries
          </p>
        </div>

        {hasPermission("orders", "create") && (
          <Link to="/orders/create" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Order
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
              placeholder="Search orders by number, customer, or phone..."
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
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Assigned To Filter */}
              {hasPermission("users", "manage") && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) =>
                      handleFilterChange("assignedTo", e.target.value)
                    }
                    className="input-field"
                  >
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) =>
                    handleFilterChange("paymentStatus", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

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

      {/* Orders Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="table-header">Order</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Items</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Payment</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {orders.map((order) => {
                    const orderStatus = getOrderStatus(order.status);

                    return (
                      <tr key={order._id} className="hover:bg-secondary-50">
                        <td className="table-cell">
                          <Link
                            to={`/orders/${order._id}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            #{order.orderNumber}
                          </Link>
                          {order.isUrgent && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Urgent
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              {order.customer.name}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {order.customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm">
                            <div className="text-secondary-900">
                              {formatDateTime(order.createdAt)}
                            </div>
                            {order.deliveryDate && (
                              <div className="text-secondary-500">
                                Delivery: {formatDateTime(order.deliveryDate)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm text-secondary-900">
                            {order.items.length} items
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm font-medium text-secondary-900">
                            {formatCurrency(order.totals.total)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.payment.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : order.payment.status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.payment.status === "pending"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.payment.status === "paid"
                              ? "Paid"
                              : order.payment.status === "partial"
                              ? "Partial"
                              : order.payment.status === "pending"
                              ? "Pending"
                              : "Unpaid"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatus.bgColor} ${orderStatus.color}`}
                          >
                            {orderStatus.text}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/orders/${order._id}`}
                              className="text-secondary-400 hover:text-secondary-600"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>

                            {hasPermission("orders", "update") &&
                              order.status !== "delivered" &&
                              order.status !== "cancelled" && (
                                <>
                                  {order.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        updateOrderStatus(
                                          order._id,
                                          "confirmed"
                                        )
                                      }
                                      className="text-green-400 hover:text-green-600"
                                      title="Confirm Order"
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </button>
                                  )}

                                  {(order.status === "confirmed" ||
                                    order.status === "processing") && (
                                    <button
                                      onClick={() =>
                                        updateOrderStatus(order._id, "ready")
                                      }
                                      className="text-blue-400 hover:text-blue-600"
                                      title="Mark as Ready"
                                    >
                                      <ClockIcon className="h-4 w-4" />
                                    </button>
                                  )}

                                  {order.status === "ready" && (
                                    <button
                                      onClick={() =>
                                        updateOrderStatus(
                                          order._id,
                                          "out_for_delivery"
                                        )
                                      }
                                      className="text-purple-400 hover:text-purple-600"
                                      title="Out for Delivery"
                                    >
                                      <TruckIcon className="h-4 w-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      cancelOrder(order._id, order.orderNumber)
                                    }
                                    className="text-red-400 hover:text-red-600"
                                    title="Cancel Order"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                </>
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
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No orders found
            </h3>
            <p className="text-secondary-600 mb-4">
              {getFilterCount() > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by creating your first order"}
            </p>
            {hasPermission("orders", "create") && getFilterCount() === 0 && (
              <Link
                to="/orders/create" className="btn-primary flex items-center justify-center w-fit mx-auto">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Order
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;