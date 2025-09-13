// src/pages/Orders/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI, usersAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getOrderStatus, getPaymentStatus } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [order, setOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrder();
    fetchUsers();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (!hasPermission('orders', 'update')) {
      toast.error('You do not have permission to update orders');
      return;
    }

    try {
      await ordersAPI.updateStatus(id, { status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrder();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const assignOrder = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to assign');
      return;
    }

    try {
      await ordersAPI.assignOrder(id, selectedUser);
      toast.success('Order assigned successfully');
      setShowAssignModal(false);
      setSelectedUser('');
      fetchOrder();
    } catch (error) {
      console.error('Failed to assign order:', error);
      toast.error(error.response?.data?.message || 'Failed to assign order');
    }
  };

  const recordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await ordersAPI.recordPayment(id, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
      });
      
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', method: 'cash', reference: '', notes: '' });
      fetchOrder();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const cancelOrder = async () => {
    if (!hasPermission('orders', 'update')) {
      toast.error('You do not have permission to cancel orders');
      return;
    }

    const reason = window.prompt(`Enter reason for cancelling order ${order.orderNumber}:`);
    if (!reason) return;

    try {
      await ordersAPI.cancelOrder(id, reason);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  };

    // If order not found, show a message
  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Order not found</h3>
        <Link to="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  const orderStatus = getOrderStatus(order.status);
  const paymentStatus = getPaymentStatus(order.payment.status);
  const remainingAmount = order.totals.total - order.payment.amountPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-secondary-600">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasPermission('orders', 'update') && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <>
              <button
                onClick={() => setShowAssignModal(true)}
                className="btn-secondary"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Assign
              </button>
              
              {order.payment.status !== 'paid' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-secondary"
                >
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Record Payment
                </button>
              )}
            </>
          )}

          <button className="btn-secondary">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print
          </button>

          {hasPermission('orders', 'update') && (
            <Link to={`/orders/${id}/edit`} className="btn-secondary">
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Order Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Order Status</h3>
          
          <div className="space-y-4">
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderStatus.bgColor} ${orderStatus.color}`}>
                {orderStatus.text}
              </span>
              {order.isUrgent && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Urgent
                </span>
              )}
            </div>

            {hasPermission('orders', 'update') && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus('confirmed')}
                    className="w-full btn-primary"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Confirm Order
                  </button>
                )}
                
                {(order.status === 'confirmed' || order.status === 'processing') && (
                  <button
                    onClick={() => updateOrderStatus('ready')}
                    className="w-full btn-primary"
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Mark as Ready
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus('out_for_delivery')}
                    className="w-full btn-primary"
                  >
                    <TruckIcon className="h-4 w-4 mr-2" />
                    Out for Delivery
                  </button>
                )}
                
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus('delivered')}
                    className="w-full btn-primary"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </button>
                )}
                
                <button
                  onClick={cancelOrder}
                  className="w-full btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancel Order
                </button>
              </div>
            )}

            {order.assignedTo && (
              <div className="pt-4 border-t border-secondary-200">
                <p className="text-sm font-medium text-secondary-700">Assigned To</p>
                <p className="text-secondary-900">{order.assignedTo.name}</p>
              </div>
            )}

            {order.deliveryDate && (
              <div className="pt-4 border-t border-secondary-200">
                <p className="text-sm font-medium text-secondary-700">Delivery Date</p>
                <p className="text-secondary-900">{formatDateTime(order.deliveryDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Customer Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">{order.customer.name}</p>
                <p className="text-sm text-secondary-500">Customer ID: {order.customer._id}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-secondary-400 mr-3" />
              <p className="text-secondary-900">{order.customer.phone}</p>
            </div>
            
            {order.customer.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-secondary-400 mr-3" />
                <p className="text-secondary-900">{order.customer.email}</p>
              </div>
            )}
            
            {order.deliveryAddress && (
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-secondary-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-700">Delivery Address</p>
                  <p className="text-secondary-900">{order.deliveryAddress}</p>
                </div>
              </div>
            )}

            <Link
              to={`/customers/${order.customer._id}`}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View Customer Profile →
            </Link>
          </div>
        </div>

        {/* Payment Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Payment Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.totals.subtotal)}</span>
            </div>

            {order.totals.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Discount</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(order.totals.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-secondary-600">Tax</span>
              <span className="font-medium">{formatCurrency(order.totals.tax)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-secondary-200 pt-3">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(order.totals.total)}</span>
            </div>

            <div className="border-t border-secondary-200 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-secondary-600">Payment Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}>
                  {paymentStatus.text}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-secondary-600">Amount Paid</span>
                <span className="font-medium">{formatCurrency(order.payment.amountPaid)}</span>
              </div>

              {remainingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-secondary-600">Remaining</span>
                  <span className="font-medium text-red-600">{formatCurrency(remainingAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Order Items</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header text-right">Quantity</th>
                <th className="table-header text-right">Unit Price</th>
                <th className="table-header text-right">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {order.items.map((item) => (
                <tr key={item._id}>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {item.product.images?.[0]?.url ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={item.product.images[0].url}
                            alt={item.productName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-secondary-200 flex items-center justify-center">
                            <span className="text-secondary-500 text-xs">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {item.productName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          SKU: {item.product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-sm text-secondary-900">{item.quantity}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-sm text-secondary-900">
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-sm font-medium text-secondary-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Order Notes</h3>
          <p className="text-secondary-700">{order.notes}</p>
        </div>
      )}

      {/* Payment History */}
      {order.payment.history && order.payment.history.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Payment History</h3>
          
          <div className="space-y-3">
            {order.payment.history.map((payment, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-sm text-secondary-600">
                    {payment.method} - {formatDateTime(payment.date)}
                  </p>
                  {payment.reference && (
                    <p className="text-xs text-secondary-500">
                      Ref: {payment.reference}
                    </p>
                  )}
                </div>
                <span className="text-green-600 font-medium">Paid</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Order Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Assign Order
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={assignOrder}
                disabled={!selectedUser}
                className="btn-primary disabled:opacity-50"
              >
                Assign Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Record Payment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Amount (Max: {formatCurrency(remainingAmount)})
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  placeholder="0.00"
                  max={remainingAmount}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                  className="input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                  className="input-field"
                  placeholder="Transaction reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Payment notes"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={recordPayment}
                className="btn-primary"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default OrderDetail;