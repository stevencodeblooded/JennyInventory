// src/pages/Products/ProductDetail.js
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { productsAPI, salesAPI } from "../../services/api";
import {
  formatCurrency,
  formatDate,
  getStockStatus,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({
    quantity: "",
    type: "adjustment",
    reason: "",
  });
  const [performance, setPerformance] = useState(null);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchPerformance();
    fetchRecentSales();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product details");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await productsAPI.getPerformance(id);
      setPerformance(response.data.data);
    } catch (error) {
      console.error("Failed to fetch performance:", error);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await salesAPI.getSalesByProduct(id, {
        limit: 10,
      });
      setRecentSales(response.data.data.sales);
    } catch (error) {
      console.error("Failed to fetch recent sales:", error);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockUpdate.quantity || !stockUpdate.type) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await productsAPI.updateStock(id, {
        quantity: parseInt(stockUpdate.quantity),
        type: stockUpdate.type,
        reason: stockUpdate.reason,
      });

      toast.success("Stock updated successfully");
      setShowStockModal(false);
      setStockUpdate({ quantity: "", type: "adjustment", reason: "" });
      fetchProduct();
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error(error.response?.data?.message || "Failed to update stock");
    }
  };

  const deleteProduct = async () => {
    if (!hasPermission("products", "delete")) {
      toast.error("You do not have permission to delete products");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await productsAPI.deleteProduct(id);
      toast.success("Product deleted successfully");
      navigate("/products");
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Product not found
        </h3>
        <Link to="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  const stockStatus = getStockStatus(
    product.inventory.currentStock,
    product.inventory.minStock
  );
  const profitMargin =
    product.pricing.cost > 0
      ? (
          ((product.pricing.sellingPrice - product.pricing.cost) /
            product.pricing.cost) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/products")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {product.name}
            </h1>
            <p className="text-secondary-600">SKU: {product.sku}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasPermission("products", "update") && (
            <>
              <button
                onClick={() => setShowStockModal(true)}
                className="btn-secondary"
              >
                Update Stock
              </button>
              <Link to={`/products/${id}/edit`} className="btn-secondary">
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Link>
            </>
          )}

          {hasPermission("products", "delete") && (
            <button
              onClick={deleteProduct}
              className="btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image & Basic Info */}
        <div className="card">
          <div className="aspect-square bg-secondary-100 rounded-lg mb-4 flex items-center justify-center">
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-secondary-400 text-center">
                <div className="text-6xl mb-2">📦</div>
                <div className="text-sm">No Image</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-secondary-600">
                Category
              </label>
              <p className="text-secondary-900">
                {product.category?.name || "Uncategorized"}
              </p>
            </div>

            {product.brand && (
              <div>
                <label className="text-sm font-medium text-secondary-600">
                  Brand
                </label>
                <p className="text-secondary-900">{product.brand}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-secondary-600">
                Unit
              </label>
              <p className="text-secondary-900 capitalize">{product.unit}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-600">
                Status
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.status.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Pricing
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Cost Price</span>
              <span className="font-medium text-secondary-900">
                {formatCurrency(product.pricing.cost)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Selling Price</span>
              <span className="font-medium text-primary-600 text-lg">
                {formatCurrency(product.pricing.sellingPrice)}
              </span>
            </div>

            {product.pricing.wholesalePrice && (
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Wholesale Price</span>
                <span className="font-medium text-secondary-900">
                  {formatCurrency(product.pricing.wholesalePrice)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Profit Margin</span>
              <span
                className={`font-medium ${
                  profitMargin > 30
                    ? "text-green-600"
                    : profitMargin > 15
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {profitMargin}%
              </span>
            </div>

            {product.pricing.discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Discount</span>
                <span className="font-medium text-green-600">
                  {product.pricing.discount}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Inventory
          </h3>

          <div className="space-y-4">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-3xl font-bold text-secondary-900 mb-1">
                {product.inventory.currentStock}
              </div>
              <div className="text-sm text-secondary-600">Current Stock</div>
              <div
                className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Min Stock</span>
                <p className="font-medium text-secondary-900">
                  {product.inventory.minStock}
                </p>
              </div>

              {product.inventory.maxStock && (
                <div>
                  <span className="text-secondary-600">Max Stock</span>
                  <p className="font-medium text-secondary-900">
                    {product.inventory.maxStock}
                  </p>
                </div>
              )}

              {product.inventory.reorderPoint && (
                <div>
                  <span className="text-secondary-600">Reorder Point</span>
                  <p className="font-medium text-secondary-900">
                    {product.inventory.reorderPoint}
                  </p>
                </div>
              )}

              {product.inventory.reorderQuantity && (
                <div>
                  <span className="text-secondary-600">Reorder Qty</span>
                  <p className="font-medium text-secondary-900">
                    {product.inventory.reorderQuantity}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.inventory.trackInventory}
                  disabled
                  className="rounded border-secondary-300 text-primary-600"
                />
                <span className="ml-2 text-secondary-600">Track Inventory</span>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.inventory.allowBackorder}
                  disabled
                  className="rounded border-secondary-300 text-primary-600"
                />
                <span className="ml-2 text-secondary-600">Allow Backorder</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Performance Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {performance.basic.totalSold}
              </div>
              <div className="text-sm text-blue-700">Total Sold</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(performance.basic.totalRevenue)}
              </div>
              <div className="text-sm text-green-700">Total Revenue</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {performance.basic.averageDailySales.toFixed(1)}
              </div>
              <div className="text-sm text-purple-700">Avg Daily Sales</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {performance.inventory.daysOfStock === Infinity
                  ? "∞"
                  : Math.round(performance.inventory.daysOfStock)}
              </div>
              <div className="text-sm text-yellow-700">Days of Stock</div>
            </div>
          </div>
        </div>
      )}

      {/* Description & Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description */}
        {product.description && (
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Description
            </h3>
            <p className="text-secondary-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Attributes */}
        {product.attributes && product.attributes.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Product Attributes
            </h3>
            <div className="space-y-2">
              {product.attributes.map((attribute, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-secondary-50 rounded"
                >
                  <span className="font-medium text-secondary-900">
                    {attribute.name}
                  </span>
                  <span className="text-secondary-700">{attribute.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Supplier Information */}
      {product.supplier?.name && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Supplier Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-600">
                Supplier Name
              </label>
              <p className="text-secondary-900">{product.supplier.name}</p>
            </div>

            {product.supplier.contact && (
              <div>
                <label className="text-sm font-medium text-secondary-600">
                  Contact
                </label>
                <p className="text-secondary-900">{product.supplier.contact}</p>
              </div>
            )}

            {product.supplier.lastPurchaseDate && (
              <div>
                <label className="text-sm font-medium text-secondary-600">
                  Last Purchase
                </label>
                <p className="text-secondary-900">
                  {formatDate(product.supplier.lastPurchaseDate)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Sales
          </h3>
          <Link
            to={`/sales?product=${id}`}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View All Sales
          </Link>
        </div>

        {recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="table-header">Receipt</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {recentSales.map((sale) => (
                  <tr key={sale.saleId}>
                    <td className="table-cell">
                      <Link
                        to={`/sales/${sale.saleId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {sale.receiptNumber}
                      </Link>
                    </td>
                    <td className="table-cell">{formatDate(sale.date)}</td>
                    <td className="table-cell">{sale.quantity}</td>
                    <td className="table-cell">
                      {formatCurrency(sale.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
            <p className="text-secondary-600">No sales recorded yet</p>
          </div>
        )}
      </div>

      {/* Stock Movement History */}
      {product.stockMovements && product.stockMovements.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Stock Movements
          </h3>

          <div className="space-y-3">
            {product.stockMovements
              .slice(-10)
              .reverse()
              .map((movement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        movement.type === "sale"
                          ? "bg-red-100 text-red-600"
                          : movement.type === "purchase"
                          ? "bg-green-100 text-green-600"
                          : movement.type === "return"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {movement.type === "sale" ? (
                        <MinusIcon className="h-4 w-4" />
                      ) : movement.type === "purchase" ? (
                        <PlusIcon className="h-4 w-4" />
                      ) : movement.type === "return" ? (
                        <TruckIcon className="h-4 w-4" />
                      ) : (
                        <ClockIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900 capitalize">
                        {movement.type}
                      </p>
                      {movement.reason && (
                        <p className="text-sm text-secondary-600">
                          {movement.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        ["sale", "damage"].includes(movement.type)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {["sale", "damage"].includes(movement.type) ? "-" : "+"}
                      {movement.quantity}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Stock: {movement.newStock}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Update Stock
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) =>
                    setStockUpdate((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="input-field"
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Type
                </label>
                <select
                  value={stockUpdate.type}
                  onChange={(e) =>
                    setStockUpdate((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="purchase">Purchase</option>
                  <option value="return">Return</option>
                  <option value="damage">Damage/Loss</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={stockUpdate.reason}
                  onChange={(e) =>
                    setStockUpdate((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Enter reason for stock update"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStockModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleStockUpdate} className="btn-primary">
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
