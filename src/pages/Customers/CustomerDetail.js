// src/pages/Customers/CustomerDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { customersAPI, ordersAPI } from "../../services/api";
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  CreditCardIcon,
  PlusIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [creditUpdate, setCreditUpdate] = useState({
    amount: "",
    type: "add",
    description: "",
  });

  useEffect(() => {
    fetchCustomer();
    fetchCustomerOrders();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getCustomer(id);
      setCustomer(response.data.data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      toast.error("Failed to load customer details");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await customersAPI.getPurchaseHistory(id, { limit: 10 });
      setOrders(response.data.data);
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      await customersAPI.addNote(id, { content: newNote });
      toast.success("Note added successfully");
      setNewNote("");
      setShowNoteModal(false);
      fetchCustomer();
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error(error.response?.data?.message || "Failed to add note");
    }
  };

  const updateCredit = async () => {
    if (!creditUpdate.amount || parseFloat(creditUpdate.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await customersAPI.addCreditTransaction(id, {
        amount: parseFloat(creditUpdate.amount),
        type: creditUpdate.type,
        description: creditUpdate.description,
      });

      toast.success("Credit updated successfully");
      setCreditUpdate({ amount: "", type: "add", description: "" });
      setShowCreditModal(false);
      fetchCustomer();
    } catch (error) {
      console.error("Failed to update credit:", error);
      toast.error(error.response?.data?.message || "Failed to update credit");
    }
  };

  const deleteCustomer = async () => {
    if (!hasPermission("orders", "delete")) {
      toast.error("You do not have permission to delete customers");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await customersAPI.deleteCustomer(id);
      toast.success("Customer deleted successfully");
      navigate("/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const getCustomerSegment = () => {
    if (!customer) return "";

    if (customer.isVIP) return "VIP";
    if (customer.totalSpent >= 50000) return "High Value";
    if (customer.totalSpent >= 10000) return "Regular";
    if (customer.orderCount === 0) return "New";
    return "Standard";
  };

  const getCustomerStatus = () => {
    if (!customer.status?.isActive) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Customer not found
        </h3>
        <Link to="/customers" className="btn-primary">
          Back to Customers
        </Link>
      </div>
    );
  }

  const status = getCustomerStatus();
  const segment = getCustomerSegment();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/customers")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="h-12 w-12 flex-shrink-0">
              {customer.avatar ? (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={customer.avatar}
                  alt={customer.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-lg">
                    {customer.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
                {customer.name}
                {customer.isVIP && (
                  <StarIcon className="h-6 w-6 text-yellow-500 ml-2" />
                )}
              </h1>
              <p className="text-secondary-600">
                Customer ID: {customer.customerId || customer._id?.slice(-6)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNoteModal(true)}
            className="btn-secondary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Note
          </button>

          {hasPermission("orders", "create") && (
            <Link
              to="/orders/create"
              state={{ customerId: customer._id }}
              className="btn-secondary"
            >
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              New Order
            </Link>
          )}

          {hasPermission("orders", "update") && (
            <Link to={`/customers/${id}/edit`} className="btn-secondary">
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit
            </Link>
          )}

          {hasPermission("orders", "delete") && (
            <button
              onClick={deleteCustomer}
              className="btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Customer Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">
                  {formatPhoneNumber(customer.phone)}
                </p>
                <p className="text-sm text-secondary-500">Primary Phone</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="font-medium text-secondary-900">
                    {customer.email}
                  </p>
                  <p className="text-sm text-secondary-500">Email Address</p>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-secondary-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-secondary-900">
                    {[
                      customer.address.street,
                      customer.address.area,
                      customer.address.city,
                      customer.address.county,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-sm text-secondary-500">Address</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">
                  {formatDate(customer.createdAt)}
                </p>
                <p className="text-sm text-secondary-500">Customer Since</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
              <span className="text-secondary-600">Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
              >
                {status.text}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Segment</span>
              <span className="font-medium text-secondary-900">{segment}</span>
            </div>
          </div>
        </div>

        {/* Purchase Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Purchase Statistics
          </h3>

          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(customer.totalSpent || 0)}
              </div>
              <div className="text-sm text-green-700">Total Spent</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600 mb-1">
                  {customer.orderCount || 0}
                </div>
                <div className="text-sm text-blue-700">Total Orders</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600 mb-1">
                  {formatCurrency(customer.averageOrderValue || 0)}
                </div>
                <div className="text-sm text-purple-700">Avg Order</div>
              </div>
            </div>

            {customer.lastOrder && (
              <div>
                <p className="text-sm font-medium text-secondary-700 mb-1">
                  Last Order
                </p>
                <p className="text-secondary-900">
                  {formatDate(customer.lastOrder.date)}
                </p>
                <p className="text-sm text-secondary-500">
                  {formatCurrency(customer.lastOrder.amount)}
                </p>
              </div>
            )}

            {customer.preferredPaymentMethod && (
              <div>
                <p className="text-sm font-medium text-secondary-700 mb-1">
                  Preferred Payment
                </p>
                <p className="text-secondary-900 capitalize">
                  {customer.preferredPaymentMethod.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Information */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Credit Account
            </h3>
            <button
              onClick={() => setShowCreditModal(true)}
              className="btn-secondary"
            >
              <CreditCardIcon className="h-4 w-4 mr-1" />
              Update
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary-900 mb-1">
                {formatCurrency(customer.credit?.balance || 0)}
              </div>
              <div className="text-sm text-secondary-600">Current Balance</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Credit Limit</span>
                <p className="font-medium text-secondary-900">
                  {formatCurrency(customer.credit?.limit || 0)}
                </p>
              </div>

              <div>
                <span className="text-secondary-600">Available</span>
                <p className="font-medium text-secondary-900">
                  {formatCurrency(
                    (customer.credit?.limit || 0) -
                      (customer.credit?.balance || 0)
                  )}
                </p>
              </div>
            </div>

            {customer.credit?.lastTransaction && (
              <div className="pt-4 border-t border-secondary-200">
                <p className="text-sm font-medium text-secondary-700 mb-1">
                  Last Transaction
                </p>
                <p className="text-secondary-900">
                  {formatDate(customer.credit.lastTransaction.date)}
                </p>
                <p className="text-sm text-secondary-500">
                  {customer.credit.lastTransaction.type}:{" "}
                  {formatCurrency(customer.credit.lastTransaction.amount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Orders
          </h3>
          <Link
            to={`/orders?customer=${id}`}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View All Orders
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="table-header">Order #</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="table-cell">
                      <Link
                        to={`/orders/${order._id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="table-cell">{order.items.length} items</td>
                    <td className="table-cell">
                      {formatCurrency(order.totals.total)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBagIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
            <p className="text-secondary-600">No orders yet</p>
            {hasPermission("orders", "create") && (
              <Link
                to="/orders/create"
                state={{ customerId: customer._id }}
                className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                Create first order
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Customer Notes */}
      {customer.notes && customer.notes.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Customer Notes
          </h3>

          <div className="space-y-3">
            {customer.notes.slice(0, 5).map((note, index) => (
              <div key={index} className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-secondary-900 mb-2">{note.content}</p>
                <div className="flex justify-between items-center text-sm text-secondary-500">
                  <span>By {note.author?.name || "System"}</span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Add Customer Note
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Note Content
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Enter note about this customer..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={addNote} className="btn-primary">
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Update Credit Account
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={creditUpdate.type}
                  onChange={(e) =>
                    setCreditUpdate((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  <option value="add">Add Credit</option>
                  <option value="deduct">Deduct Credit</option>
                  <option value="payment">Payment Received</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={creditUpdate.amount}
                  onChange={(e) =>
                    setCreditUpdate((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={creditUpdate.description}
                  onChange={(e) =>
                    setCreditUpdate((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Reason for credit adjustment..."
                />
              </div>

              <div className="bg-secondary-50 p-3 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Current Balance:{" "}
                  {formatCurrency(customer.credit?.balance || 0)}
                </p>
                {creditUpdate.amount && (
                  <p className="text-sm font-medium text-secondary-900">
                    New Balance:{" "}
                    {formatCurrency(
                      (customer.credit?.balance || 0) +
                        (creditUpdate.type === "add"
                          ? parseFloat(creditUpdate.amount)
                          : -parseFloat(creditUpdate.amount))
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreditModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={updateCredit} className="btn-primary">
                Update Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
