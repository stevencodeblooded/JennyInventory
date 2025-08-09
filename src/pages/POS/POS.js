// src/pages/POS/POS.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { productsAPI, salesAPI, customersAPI } from "../../services/api";
import { formatCurrency, calculateTax } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  PrinterIcon,
  UserIcon,
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        searchProducts();
      } else {
        fetchProducts();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({
        limit: 50,
        status: "active",
        inStock: "true",
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({
        search: searchTerm,
        limit: 50,
        status: "active",
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Failed to search products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product === product._id);

    if (existingItem) {
      if (existingItem.quantity >= product.inventory.currentStock) {
        toast.error("Not enough stock available");
        return;
      }
      updateQuantity(product._id, existingItem.quantity + 1);
    } else {
      const newItem = {
        product: product._id,
        productName: product.name,
        unitPrice: product.pricing.sellingPrice,
        quantity: 1,
        maxStock: product.inventory.currentStock,
        sku: product.sku,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.product === productId) {
          if (newQuantity > item.maxStock) {
            toast.error("Not enough stock available");
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const tax = calculateTax(subtotal, 16, false);

    return {
      subtotal,
      tax: tax.taxAmount,
      total: tax.grossAmount,
    };
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const totals = calculateTotals();
    const paidAmount = parseFloat(amountPaid) || 0;

    if (paymentMethod === "cash" && paidAmount < totals.total) {
      toast.error("Amount paid is less than total");
      return;
    }

    try {
      setProcessing(true);

      const saleData = {
        items: cart.map((item) => ({
          product: item.product,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        customer: selectedCustomer?._id,
        customerInfo: selectedCustomer
          ? {
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              email: selectedCustomer.email,
            }
          : undefined,
        payment: {
          method: paymentMethod,
          status: "paid",
          totalPaid: paidAmount,
          change: paymentMethod === "cash" ? paidAmount - totals.total : 0,
          details: [
            {
              method: paymentMethod,
              amount: paidAmount,
            },
          ],
        },
      };

      const response = await salesAPI.createSale(saleData);
      const sale = response.data.data;

      toast.success("Sale completed successfully!");

      // Clear cart and reset form
      clearCart();
      setAmountPaid("");
      setPaymentMethod("cash");
      setShowPaymentModal(false);

      // Optionally print receipt
      if (window.confirm("Would you like to print the receipt?")) {
        await printReceipt(sale._id);
      }
    } catch (error) {
      console.error("Failed to process sale:", error);
      toast.error(error.response?.data?.message || "Failed to process sale");
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = async (saleId) => {
    try {
      await salesAPI.printReceipt(saleId);
      toast.success("Receipt printed successfully");
    } catch (error) {
      console.error("Failed to print receipt:", error);
      toast.error("Failed to print receipt");
    }
  };

  const totals = calculateTotals();
  const change =
    paymentMethod === "cash" ? (parseFloat(amountPaid) || 0) - totals.total : 0;

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-secondary-900">
              Point of Sale
            </h1>
            <div className="text-sm text-secondary-600">
              Cashier: {user?.name}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className="bg-white border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <div className="aspect-square bg-secondary-100 rounded-lg mb-3 flex items-center justify-center">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-secondary-400 text-center">
                        <div className="text-2xl mb-1">📦</div>
                        <div className="text-xs">No Image</div>
                      </div>
                    )}
                  </div>

                  <h3 className="font-medium text-secondary-900 mb-1 truncate">
                    {product.name}
                  </h3>

                  <p className="text-sm text-secondary-600 mb-2">
                    SKU: {product.sku}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(product.pricing.sellingPrice)}
                    </span>
                    <span className="text-xs text-secondary-500">
                      Stock: {product.inventory.currentStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-secondary-400 mb-4">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-secondary-600">
                {searchTerm ? "No products found" : "No products available"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-secondary-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Cart</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full mt-3 p-2 border border-secondary-300 rounded-lg text-left hover:bg-secondary-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-secondary-400 mr-2" />
              <span className="text-sm text-secondary-600">
                {selectedCustomer
                  ? selectedCustomer.name
                  : "Select Customer (Optional)"}
              </span>
            </div>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-secondary-400 mb-4">
                <div className="text-4xl">🛒</div>
              </div>
              <p className="text-secondary-600">Cart is empty</p>
              <p className="text-sm text-secondary-500">
                Add products to start a sale
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product}
                  className="bg-secondary-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 text-sm">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-secondary-500">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product, item.quantity - 1)
                        }
                        className="w-6 h-6 bg-white border border-secondary-300 rounded flex items-center justify-center hover:bg-secondary-100"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>

                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.product, item.quantity + 1)
                        }
                        className="w-6 h-6 bg-white border border-secondary-300 rounded flex items-center justify-center hover:bg-secondary-100"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-medium text-secondary-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {formatCurrency(item.unitPrice)} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-secondary-200 p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Subtotal</span>
                <span className="text-secondary-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Tax (16%)</span>
                <span className="text-secondary-900">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-secondary-200 pt-2">
                <span className="text-secondary-900">Total</span>
                <span className="text-primary-600">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full btn-primary"
            >
              Checkout ({cart.length} items)
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Summary */}
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-secondary-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                      paymentMethod === "cash"
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-secondary-300 text-secondary-700"
                    }`}
                  >
                    <BanknotesIcon className="h-5 w-5" />
                    <span>Cash</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                      paymentMethod === "mpesa"
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-secondary-300 text-secondary-700"
                    }`}
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    <span>M-Pesa</span>
                  </button>
                </div>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={formatCurrency(totals.total)}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Change */}
              {paymentMethod === "cash" && amountPaid && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Change</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(Math.max(0, change))}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={
                    processing ||
                    (paymentMethod === "cash" &&
                      parseFloat(amountPaid) < totals.total)
                  }
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {processing ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    "Complete Sale"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
