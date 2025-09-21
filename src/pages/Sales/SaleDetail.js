// src/pages/Sales/SaleDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { salesAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getPaymentStatus } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PrinterIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundItems, setRefundItems] = useState([]);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getSale(id);
      setSale(response.data.data);
      
      // Initialize refund items
      setRefundItems(response.data.data.items.map(item => ({
        productId: item.product._id,
        productName: item.productName,
        maxQuantity: item.quantity,
        quantity: 0,
        unitPrice: item.unitPrice,
      })));
    } catch (error) {
      console.error('Failed to fetch sale:', error);
      toast.error('Failed to load sale details');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = async () => {
    try {
      await salesAPI.printReceipt(id);
      toast.success('Receipt printed successfully');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  const voidSale = async () => {
    if (!hasPermission('sales', 'void')) {
      toast.error('You do not have permission to void sales');
      return;
    }

    const reason = window.prompt(`Enter reason for voiding sale ${sale.receiptNumber}:`);
    if (!reason) return;

    try {
      await salesAPI.voidSale(id, reason);
      toast.success('Sale voided successfully');
      fetchSale();
    } catch (error) {
      console.error('Failed to void sale:', error);
      toast.error(error.response?.data?.message || 'Failed to void sale');
    }
  };

  const handleRefund = async () => {
    if (!hasPermission('sales', 'void')) {
      toast.error('You do not have permission to process refunds');
      return;
    }

    const itemsToRefund = refundItems.filter(item => item.quantity > 0);
    
    if (itemsToRefund.length === 0) {
      toast.error('Please select items to refund');
      return;
    }

    if (!refundReason.trim()) {
      toast.error('Please provide a reason for refund');
      return;
    }

    try {
      await salesAPI.refundSale(id, {
        items: itemsToRefund.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        reason: refundReason,
      });
      
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundItems(refundItems.map(item => ({ ...item, quantity: 0 })));
      fetchSale();
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    }
  };

  const updateRefundQuantity = (productId, quantity) => {
    setRefundItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.min(Math.max(0, quantity), item.maxQuantity) }
          : item
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Sale not found</h3>
        <Link to="/sales" className="btn-primary">
          Back to Sales
        </Link>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus(sale.payment.status);
  const totalRefundAmount = refundItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/sales")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Sale #{sale.receiptNumber}
            </h1>
            <p className="text-secondary-600">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={printReceipt} className="btn-secondary">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Receipt
          </button>

          {hasPermission("sales", "void") && sale.status === "completed" && (
            <>
              <button
                onClick={() => setShowRefundModal(true)}
                className="btn-secondary"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refund
              </button>

              <button
                onClick={voidSale}
                className="btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Void Sale
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sale Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Sale Summary
          </h3>

          <div className="space-y-14">
            <div className="flex justify-between">
              <span className="text-secondary-600">Status</span>
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
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-secondary-200 pt-3">
              <span>Total</span>
              <span className="text-primary-600">
                {formatCurrency(sale.totals.subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Customer
          </h3>

          {sale.customerInfo ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="font-medium text-secondary-900">
                    {sale.customerInfo.name}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {sale.customerInfo.phone}
                  </p>
                </div>
              </div>

              {sale.customerInfo.email && (
                <div className="text-sm text-secondary-600">
                  Email: {sale.customerInfo.email}
                </div>
              )}

              {sale.customer && (
                <Link
                  to={`/customers/${sale.customer}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  View Customer Profile →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <UserIcon className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
              <p className="text-secondary-600">Walk-in Customer</p>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Payment
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Method</span>
              <div className="flex items-center">
                <CreditCardIcon className="h-4 w-4 text-secondary-400 mr-2" />
                <span className="font-medium capitalize">
                  {sale.payment.method.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-600">Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}
              >
                {paymentStatus.text}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-600">Amount Paid</span>
              <span className="font-medium">
                {formatCurrency(sale.payment.totalPaid)}
              </span>
            </div>

            {sale.payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Change Given</span>
                <span className="font-medium">
                  {formatCurrency(sale.payment.change)}
                </span>
              </div>
            )}

            {sale.payment.details && sale.payment.details.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-secondary-900 mb-2">
                  {" "}
                  Payment Details
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {sale.payment.details.map((detail, index) => (
                    <li key={index} className="text-secondary-600">
                      {typeof detail === "string"
                        ? detail
                        : detail.method && detail.amount
                        ? `${detail.method}: ${formatCurrency(detail.amount)}`
                        : JSON.stringify(detail)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Items Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Items Sold
        </h3>

        <table className="min-w-full divide-y divide-secondary-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {sale.items.map((item) => (
              <tr key={item._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {item.product.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-8 w-8 rounded"
                      />
                    )}
                    <span className="text-sm font-medium text-secondary-900">
                      {item.product.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Process Refund
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              Select items to refund and provide a reason.
            </p>
            <div className="space-y-4">
              {refundItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between"
                >
                  <span>{item.productName}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) =>
                        updateRefundQuantity(
                          item.productId,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 border border-secondary-300 rounded px-2 py-1"
                    />
                    <span className="text-secondary-600">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund"
                className="w-full border border-secondary-300 rounded px-3 py-2"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="font-medium text-secondary-900">
                  Total Refund Amount:
                </span>
                <span className="text-primary-600 font-bold">
                  {formatCurrency(totalRefundAmount)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="btn-outline text-secondary-600 hover:bg-secondary-100"
              >
                Cancel
              </button>
              <button onClick={handleRefund} className="btn-primary">
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SaleDetail;