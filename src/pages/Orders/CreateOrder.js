// src/pages/Orders/CreateOrder.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ordersAPI, customersAPI, productsAPI } from "../../services/api";
import {
  formatCurrency,
  calculateTax,
  sanitizeInput,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    items: [],
    deliveryDate: "",
    deliveryAddress: "",
    notes: "",
    isUrgent: false,
    payment: {
      method: "cash",
      amountPaid: 0,
    },
  });
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async (search = "") => {
    try {
      const response = await customersAPI.getCustomers({
        search,
        limit: 20,
        status: "active",
      });
      setCustomers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchProducts = async (search = "") => {
    try {
      const response = await productsAPI.getProducts({
        search,
        limit: 50,
        status: "active",
        inStock: "true",
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleCustomerSearch = (value) => {
    setSearchCustomer(value);
    if (value.length > 2) {
      fetchCustomers(value);
    } else if (value.length === 0) {
      fetchCustomers();
    }
  };

  const handleProductSearch = (value) => {
    setSearchProduct(value);
    if (value.length > 2) {
      fetchProducts(value);
    } else if (value.length === 0) {
      fetchProducts();
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, customer: customer._id }));
    setShowCustomerModal(false);
    setSearchCustomer("");
  };

  const addProduct = (product) => {
    const existingItem = formData.items.find(
      (item) => item.product === product._id
    );

    if (existingItem) {
      if (existingItem.quantity >= product.inventory.currentStock) {
        toast.error("Not enough stock available");
        return;
      }
      updateItemQuantity(product._id, existingItem.quantity + 1);
    } else {
      const newItem = {
        product: product._id,
        productName: product.name,
        unitPrice: product.pricing.sellingPrice,
        quantity: 1,
        maxStock: product.inventory.currentStock,
        sku: product.sku,
      };
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }
    setShowProductModal(false);
    setSearchProduct("");
  };

  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.product === productId) {
          if (newQuantity > item.maxStock) {
            toast.error("Not enough stock available");
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    }));
  };

  const updateItemPrice = (productId, newPrice) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product === productId
          ? { ...item, unitPrice: parseFloat(newPrice) || 0 }
          : item
      ),
    }));
  };

  const removeItem = (productId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product !== productId),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = "Customer is required";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    if (formData.deliveryDate && new Date(formData.deliveryDate) < new Date()) {
      newErrors.deliveryDate = "Delivery date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      const totals = calculateTotals();
      const orderData = {
        customer: formData.customer,
        items: formData.items.map((item) => ({
          product: item.product,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        deliveryDate: formData.deliveryDate || undefined,
        deliveryAddress: formData.deliveryAddress || undefined,
        notes: formData.notes || undefined,
        isUrgent: formData.isUrgent,
        payment: {
          method: formData.payment.method,
          amountPaid: parseFloat(formData.payment.amountPaid) || 0,
        },
        totals,
      };

      const response = await ordersAPI.createOrder(orderData);
      toast.success("Order created successfully!");
      navigate(`/orders/${response.data.data._id}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/orders")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Create Order
            </h1>
            <p className="text-secondary-600">Create a new customer order</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Customer Information
              </h3>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-primary-900">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-primary-700">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setFormData((prev) => ({ ...prev, customer: "" }));
                    }}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className={`w-full p-4 border-2 border-dashed rounded-lg text-center hover:bg-secondary-50 transition-colors duration-200 ${
                    errors.customer ? "border-red-300" : "border-secondary-300"
                  }`}
                >
                  <UserIcon className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-600">Click to select customer</p>
                </button>
              )}
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
              )}
            </div>

            {/* Order Items */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="btn-secondary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </button>
              </div>

              {formData.items.length > 0 ? (
                <div className="space-y-3">
                  {formData.items.map((item) => (
                    <div
                      key={item.product}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-secondary-900">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-secondary-600 mb-1">
                              Quantity
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItemQuantity(
                                    item.product,
                                    item.quantity - 1
                                  )
                                }
                                className="w-6 h-6 bg-white border border-secondary-300 rounded flex items-center justify-center hover:bg-secondary-100"
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItemQuantity(
                                    item.product,
                                    item.quantity + 1
                                  )
                                }
                                className="w-6 h-6 bg-white border border-secondary-300 rounded flex items-center justify-center hover:bg-secondary-100"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-secondary-600 mb-1">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItemPrice(item.product, e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-secondary-600 mb-1">
                              Total
                            </label>
                            <p className="font-medium text-secondary-900">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PlusIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-600">No items added yet</p>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Add your first product
                  </button>
                </div>
              )}
              {errors.items && (
                <p className="mt-1 text-sm text-red-600">{errors.items}</p>
              )}
            </div>

            {/* Additional Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Additional Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Delivery Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deliveryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryDate: e.target.value,
                      }))
                    }
                    className={`input-field ${
                      errors.deliveryDate ? "border-red-300" : ""
                    }`}
                  />
                  {errors.deliveryDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isUrgent}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isUrgent: e.target.checked,
                        }))
                      }
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700">
                      Mark as urgent
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Delivery Address (Optional)
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: e.target.value,
                    }))
                  }
                  rows={3}
                  className="input-field"
                  placeholder="Enter delivery address"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="input-field"
                  placeholder="Any special instructions or notes"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-secondary-600">Tax (16%)</span>
                  <span className="font-medium">
                    {formatCurrency(totals.tax)}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold border-t border-secondary-200 pt-3">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Payment
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment.method}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment: { ...prev.payment, method: e.target.value },
                      }))
                    }
                    className="input-field"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={formData.payment.amountPaid}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment: {
                          ...prev.payment,
                          amountPaid: e.target.value,
                        },
                      }))
                    }
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={totals.total}
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Leave as 0 for unpaid orders
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || formData.items.length === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="Creating..." />
                ) : (
                  "Create Order"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Select Customer
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search customers by name or phone..."
                  value={searchCustomer}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => selectCustomer(customer)}
                  className="flex items-center p-3 hover:bg-secondary-50 cursor-pointer rounded-lg"
                >
                  <UserIcon className="h-5 w-5 text-secondary-400 mr-3" />
                  <div>
                    <p className="font-medium text-secondary-900">
                      {customer.name}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {customer.phone}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-secondary-500">
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Add Product
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchProduct}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => addProduct(product)}
                  className="border border-secondary-200 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow duration-200"
                >
                  <div className="aspect-square bg-secondary-100 rounded-lg mb-2 flex items-center justify-center">
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

                  <h4 className="font-medium text-secondary-900 mb-1 truncate">
                    {product.name}
                  </h4>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
