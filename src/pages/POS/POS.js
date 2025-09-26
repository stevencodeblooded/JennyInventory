// Improved POS.js with fixed M-Pesa payment flow
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { productsAPI, salesAPI } from "../../services/api";
import { formatCurrency } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaPaymentStatus, setMpesaPaymentStatus] = useState(null);
  const [mpesaTransactionId, setMpesaTransactionId] = useState("");

  // Add debugging state
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [lastStatusCheck, setLastStatusCheck] = useState(null);

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

  const updateLocalProductStock = (cartItems) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const soldItem = cartItems.find((item) => item.product === product._id);
        if (soldItem) {
          return {
            ...product,
            inventory: {
              ...product.inventory,
              currentStock: Math.max(
                0,
                product.inventory.currentStock - soldItem.quantity
              ),
            },
          };
        }
        return product;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid("");
    setMpesaPhone("");
    setMpesaPaymentStatus(null);
    setMpesaTransactionId("");
    setStatusCheckCount(0);
    setLastStatusCheck(null);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    return {
      subtotal,
      total: subtotal,
    };
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const totals = calculateTotals();

    // Validate payment method specific requirements
    if (paymentMethod === "cash") {
      const paidAmount = parseFloat(amountPaid) || 0;
      if (paidAmount < totals.subtotal) {
        toast.error("Amount paid is less than total");
        return;
      }
    } else if (paymentMethod === "mpesa") {
      if (!mpesaPhone || mpesaPhone.length < 10) {
        toast.error("Please enter a valid M-Pesa phone number");
        return;
      }
    }

    try {
      setProcessing(true);

      let paymentData;

      if (paymentMethod === "mpesa") {
        const loadingToast = toast.loading("Initiating M-Pesa payment...");

        try {
          const mpesaResult = await initiateMpesaPayment(totals);
          toast.dismiss(loadingToast);

          if (!mpesaResult.success) {
            toast.error("M-Pesa payment failed to initiate");
            return;
          }

          toast.success("M-Pesa payment completed!");

          paymentData = {
            method: paymentMethod,
            status: "paid",
            totalPaid: totals.total,
            change: 0,
            details: [
              {
                method: paymentMethod,
                amount: totals.total,
                transactionId: mpesaResult.transactionId,
              },
            ],
          };
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("M-Pesa payment error:", error);
          toast.error(error.message || "M-Pesa payment failed");
          return;
        }
      } else {
        // Cash payment
        const paidAmount = parseFloat(amountPaid) || 0;
        paymentData = {
          method: paymentMethod,
          status: "paid",
          totalPaid: paidAmount,
          change: paidAmount - totals.total,
          details: [
            {
              method: paymentMethod,
              amount: paidAmount,
            },
          ],
        };
      }

      // Create sale data
      const saleData = {
        items: cart.map((item) => {
          const itemSubtotal = item.unitPrice * item.quantity;
          return {
            product: item.product,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: {
              amount: 0,
              percentage: 0,
            },
            subtotal: itemSubtotal,
          };
        }),
        totals: {
          subtotal: 0,
          discount: 0,
          total: 0,
        },
        customer: selectedCustomer?._id,
        customerInfo: selectedCustomer
          ? {
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              email: selectedCustomer.email,
            }
          : undefined,
        payment: paymentData,
      };

      console.log("Creating sale with data:", saleData);

      const response = await salesAPI.createSale(saleData);
      const sale = response.data.data;

      toast.success("Sale completed successfully!");

      // Update local stock counts
      updateLocalProductStock(cart);

      // Clear cart and reset form
      clearCart();
      setPaymentMethod("cash");
      setShowPaymentModal(false);

      // Optionally print receipt
      if (window.confirm("Would you like to print the receipt?")) {
        await printReceipt(sale._id);
      }
    } catch (error) {
      console.error("Failed to process sale:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process sale";
      toast.error(errorMessage);
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

  const initiateMpesaPayment = async (totals) => {
    try {
      setMpesaPaymentStatus("pending");
      setStatusCheckCount(0);

      console.log("Initiating M-Pesa payment with:", {
        phone: mpesaPhone,
        amount: totals.total,
      });

      const response = await salesAPI.initiateMpesaPayment({
        phone: mpesaPhone,
        amount: totals.total,
      });

      console.log("M-Pesa initiation response:", response.data);

      const checkoutRequestId = response.data?.data?.checkoutRequestId;

      if (!checkoutRequestId) {
        console.error("No checkoutRequestId in response");
        setMpesaPaymentStatus("failed");
        throw new Error("Invalid response from M-Pesa service");
      }

      // Return a promise that resolves when payment is complete
      return new Promise((resolve) => {
        let pollCount = 0;
        const maxPolls = 20; // Poll for up to 60 seconds (20 polls * 3 seconds)

        const pollPaymentStatus = async () => {
          try {
            pollCount++;
            setStatusCheckCount(pollCount);
            setLastStatusCheck(new Date().toLocaleTimeString());

            console.log(`Polling status (attempt ${pollCount})...`);

            const statusResponse = await salesAPI.checkMpesaPaymentStatus(
              checkoutRequestId
            );
            console.log("Status response:", statusResponse.data);

            const { status, transactionId, resultDesc } =
              statusResponse.data.data;

            if (status === "success") {
              setMpesaPaymentStatus("success");
              setMpesaTransactionId(transactionId);
              resolve({ success: true, transactionId });
            } else if (status === "failed" || status === "cancelled") {
              setMpesaPaymentStatus("failed");
              resolve({
                success: false,
                error: resultDesc || "Payment failed or was cancelled",
              });
            } else if (pollCount >= maxPolls) {
              // Timeout after maxPolls attempts
              setMpesaPaymentStatus("failed");
              resolve({
                success: false,
                error:
                  "Payment verification timeout. Please check your M-Pesa messages.",
              });
            } else {
              // Still pending, poll again
              setTimeout(pollPaymentStatus, 3000);
            }
          } catch (error) {
            console.error("Status polling error:", error);

            if (pollCount >= maxPolls) {
              setMpesaPaymentStatus("failed");
              resolve({ success: false, error: "Payment verification failed" });
            } else {
              // Retry on error
              setTimeout(pollPaymentStatus, 3000);
            }
          }
        };

        // Start polling after 2 seconds
        setTimeout(pollPaymentStatus, 2000);
      });
    } catch (error) {
      console.error("M-Pesa initiation error:", error);
      setMpesaPaymentStatus("failed");
      throw new Error(
        error.response?.data?.message || "Failed to initiate M-Pesa payment"
      );
    }
  };

  const totals = calculateTotals();
  const change =
    paymentMethod === "cash"
      ? (parseFloat(amountPaid) || 0) - totals.subtotal
      : 0;

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-secondary-900">
              Point of Sale
            </h1>
            <div className="text-sm text-secondary-600">
              Cashier:{" "}
              <span className="text-red-600 font-semibold">{user?.name}</span>
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className="bg-white border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
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

                  <div className="flex flex-col flex-1">
                    <h3 className="font-medium text-secondary-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-secondary-600 mb-2 truncate">
                      SKU: {product.sku}
                    </p>
                    <div className="mt-auto space-y-1">
                      <div className="text-lg font-bold text-primary-600">
                        {formatCurrency(product.pricing.sellingPrice)}
                      </div>
                      <div className="text-xs text-right text-green-800 font-semibold">
                        Stock: {product.inventory.currentStock}
                      </div>
                    </div>
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
      <div
        className="w-96 bg-white border-l border-secondary-200 flex flex-col"
        style={{ height: "60vh" }}
      >
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Cart</h2>
            {cart.length > 0 && (
              <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                {cart.length}
              </span>
            )}
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          <button className="w-full mt-3 p-2 border border-secondary-300 rounded-lg text-left hover:bg-secondary-50 transition-colors duration-200">
            <div className="flex justify-center items-center">
              <ShoppingCartIcon className="h-5 w-5 text-secondary-400 mr-2" />
              <span className="text-sm text-secondary-600">
                <p>Shop worry-free</p>
              </span>
            </div>
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-10">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-secondary-400 mb-4">
                  <div className="text-4xl">🛒</div>
                </div>
                <p className="text-secondary-600">Cart is empty</p>
                <p className="text-sm text-secondary-500">
                  Add products to start a sale
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 pb-0">
                <div className="space-y-3 pb-4">
                  {cart.map((item) => (
                    <div
                      key={item.product}
                      className="bg-secondary-50 rounded-lg p-3 border-l-4 border-primary-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-secondary-900 text-sm truncate">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-secondary-500 truncate">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
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

                        <div className="text-right flex-shrink-0">
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
              </div>

              <div className="flex-shrink-0 border-t border-secondary-200 p-4 bg-white">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span className="text-secondary-900">Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(totals.subtotal)}
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
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <div className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
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

              {/* Payment Method Specific Fields */}
              {paymentMethod === "cash" ? (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={formatCurrency(totals.subtotal)}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g., 0712345678"
                    className="input-field"
                    pattern="07[0-9]{9}"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Enter phone number in format: 0712345678
                  </p>
                </div>
              )}

              {/* Payment Status for M-Pesa */}
              {paymentMethod === "mpesa" && mpesaPaymentStatus && (
                <div
                  className={`rounded-lg p-3 ${
                    mpesaPaymentStatus === "pending"
                      ? "bg-yellow-50 border border-yellow-200"
                      : mpesaPaymentStatus === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="space-y-2">
                    {mpesaPaymentStatus === "pending" && (
                      <>
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                          <span className="text-yellow-700">
                            Payment request sent. Please check your phone and
                            enter M-Pesa PIN.
                          </span>
                        </div>
                        {statusCheckCount > 0 && (
                          <div className="text-xs text-yellow-600">
                            Status checks: {statusCheckCount} | Last check:{" "}
                            {lastStatusCheck}
                          </div>
                        )}
                      </>
                    )}
                    {mpesaPaymentStatus === "success" && (
                      <span className="text-green-700">
                        ✅ Payment successful! Transaction ID:{" "}
                        {mpesaTransactionId}
                      </span>
                    )}
                    {mpesaPaymentStatus === "failed" && (
                      <span className="text-red-700">
                        ❌ Payment failed. Please try again or use a different
                        payment method.
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                      parseFloat(amountPaid) < totals.total) ||
                    (paymentMethod === "mpesa" &&
                      (!mpesaPhone || mpesaPhone.length < 10))
                  }
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" />
                      <span className="ml-2">
                        {paymentMethod === "mpesa"
                          ? "Processing..."
                          : "Processing Sale..."}
                      </span>
                    </div>
                  ) : paymentMethod === "mpesa" ? (
                    mpesaPaymentStatus === "pending" ? (
                      "Waiting for Payment..."
                    ) : (
                      "Send M-Pesa Request"
                    )
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
