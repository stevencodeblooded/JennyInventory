// src/pages/Dashboard/Dashboard.js
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency } from "../../utils/helpers";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [overview, setOverview] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [realtimeStats, setRealtimeStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  useEffect(() => {
    // Fetch realtime stats every 30 seconds
    const interval = setInterval(fetchRealtimeStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, chartRes, productsRes, stockRes] = await Promise.all([
        dashboardAPI.getOverview({ period }),
        dashboardAPI.getSalesChart({ period: "7days", groupBy: "day" }),
        dashboardAPI.getTopProducts({ days: 7, limit: 5 }),
        dashboardAPI.getLowStock({ limit: 5 }),
      ]);

      setOverview(overviewRes.data.data);
      setSalesChart(chartRes.data.data.chart);
      setTopProducts(productsRes.data.data);
      setLowStock(stockRes.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeStats = async () => {
    try {
      const response = await dashboardAPI.getRealtimeStats();
      setRealtimeStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch realtime stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const metrics = overview?.metrics || {};
  const stats = [
    {
      name: "Revenue",
      value: formatCurrency(metrics.revenue?.current || 0),
      change: metrics.revenue?.growth || 0,
      icon: CurrencyDollarIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Orders",
      value: metrics.orders?.current || 0,
      change: metrics.orders?.growth || 0,
      icon: ShoppingBagIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Customers",
      value: metrics.totalCustomers || 0,
      change: 0,
      icon: UsersIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Products",
      value: metrics.activeProducts || 0,
      change: 0,
      icon: ExclamationTriangleIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Welcome back, {user?.name}</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field w-auto"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <Link to="/pos" className="btn-primary">
            New Sale
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-secondary-600">
                  {stat.name}
                </p>
                <div className="flex items-center flex-wrap gap-1">
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                  {stat.change !== 0 && (
                    <div
                      className={`flex items-center text-sm ${
                        stat.change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change > 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Sales Trend
            </h3>
            <Link
              to="/reports"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View Report
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ fill: "#e11d48" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Top Products
            </h3>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product._id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-900">
                      {product.productName}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {product.quantitySold} sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-secondary-500">No sales data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Stock Alerts
            </h3>
            <Link
              to="/products?stockStatus=low_stock"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {lowStock.products?.slice(0, 5).map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    SKU: {product.sku}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-700">
                    {product.inventory.currentStock}
                  </p>
                  <p className="text-xs text-yellow-600">left</p>
                </div>
              </div>
            ))}

            {(!lowStock.products || lowStock.products.length === 0) && (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-secondary-500">
                  All products are well stocked
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Activity
            </h3>
            <ClockIcon className="h-5 w-5 text-secondary-400" />
          </div>

          <div className="space-y-3">
            {realtimeStats?.recentSales?.slice(0, 5).map((sale) => (
              <div key={sale._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="ml-3">
                    <p className="text-sm text-secondary-900">
                      Sale #{sale.receiptNumber}
                    </p>
                    <p className="text-xs text-secondary-500">
                      by {sale.seller?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">
                    {formatCurrency(sale.totals.total)}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {(!realtimeStats?.recentSales ||
              realtimeStats.recentSales.length === 0) && (
              <div className="text-center py-8">
                <p className="text-secondary-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/pos"
            className="flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
          >
            <ShoppingBagIcon className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-primary-700">
              New Sale
            </span>
          </Link>

          <Link
            to="/products/add"
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">
              Add Product
            </span>
          </Link>

          <Link
            to="/sales"
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
          >
            <ClockIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">
              Manage Sales
            </span>
          </Link>

          <Link
            to="/users"
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
          >
            <UserGroupIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">
              Manage User Accounts
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
