// src/pages/Reports/Reports.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reportsAPI } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ChartBarIcon,
  CubeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboardSummary({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const reportCategories = [
    {
      title: "Sales Reports",
      description: "Analyze sales performance, trends, and revenue metrics",
      icon: CurrencyDollarIcon,
      color: "bg-green-100 text-green-600",
      link: "/reports/sales",
      reports: [
        "Daily Sales Summary",
        "Sales by Product",
        "Sales by Staff Member",
        "Payment Method Analysis",
        "Revenue Trends",
      ],
    },
    {
      title: "Inventory Reports",
      description: "Monitor stock levels, movements, and inventory valuation",
      icon: CubeIcon,
      color: "bg-blue-100 text-blue-600",
      link: "/reports/inventory",
      reports: [
        "Current Stock Levels",
        "Low Stock Alerts",
        "Inventory Valuation",
        "Stock Movement History",
        "Product Performance",
      ],
    },
    {
      title: "Customer Analytics",
      description: "Understand customer behavior and purchase patterns",
      icon: UsersIcon,
      color: "bg-purple-100 text-purple-600",
      link: "/reports/customers",
      reports: [
        "Customer Segmentation",
        "Purchase History",
        "Customer Lifetime Value",
        "New vs Returning Customers",
        "Geographic Distribution",
      ],
    },
    {
      title: "Staff Performance",
      description: "Track employee productivity and sales performance",
      icon: ChartBarIcon,
      color: "bg-yellow-100 text-yellow-600",
      link: "/reports/staff",
      reports: [
        "Sales by Staff Member",
        "Transaction Counts",
        "Average Order Values",
        "Performance Rankings",
        "Activity Logs",
      ],
    },
  ];

  const COLORS = ["#e11d48", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Reports & Analytics
          </h1>
          <p className="text-secondary-600">
            Comprehensive business insights and performance metrics
          </p>
        </div>

        <button className="btn-primary" onClick={() => console.log("Exporting all reports...")}>
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export All
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-5 w-5 text-secondary-400" />
          <span className="text-sm font-medium text-secondary-700">
            Date Range:
          </span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
            className="input-field w-auto"
          />
          <span className="text-secondary-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
            className="input-field w-auto"
          />
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(dashboardData.totalRevenue || 0)}
                </p>
                {dashboardData.revenueGrowth !== undefined && (
                  <div
                    className={`flex items-center text-sm ${
                      dashboardData.revenueGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboardData.revenueGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(dashboardData.revenueGrowth)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {dashboardData.totalOrders || 0}
                </p>
                {dashboardData.ordersGrowth !== undefined && (
                  <div
                    className={`flex items-center text-sm ${
                      dashboardData.ordersGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboardData.ordersGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(dashboardData.ordersGrowth)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Active Customers
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {dashboardData.activeCustomers || 0}
                </p>
                {dashboardData.customersGrowth !== undefined && (
                  <div
                    className={`flex items-center text-sm ${
                      dashboardData.customersGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboardData.customersGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(dashboardData.customersGrowth)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">
                  Products Sold
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {dashboardData.productsSold || 0}
                </p>
                <p className="text-sm text-secondary-500">
                  Avg: {formatCurrency(dashboardData.averageOrderValue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Revenue Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
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

          {/* Top Categories */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Sales by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.topCategories || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(dashboardData.topCategories || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Orders by Status
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.ordersByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Sales Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Daily Sales Volume
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.dailySales || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => (
          <div
            key={category.title}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${category.color}`}>
                <category.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-secondary-600 mb-4">
                  {category.description}
                </p>

                <div className="space-y-2 mb-4">
                  {category.reports.map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-secondary-700"
                    >
                      <div className="w-1.5 h-1.5 bg-secondary-400 rounded-full mr-2"></div>
                      {report}
                    </div>
                  ))}
                </div>

                <Link
                  to={category.link}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Reports
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      {dashboardData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Statistics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <ClockIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-900">
                {dashboardData.avgProcessingTime || "0m"}
              </div>
              <div className="text-sm text-secondary-600">
                Avg Processing Time
              </div>
            </div>

            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-900">
                {formatCurrency(dashboardData.averageOrderValue || 0)}
              </div>
              <div className="text-sm text-secondary-600">
                Average Order Value
              </div>
            </div>

            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-900">
                {dashboardData.conversionRate || "0"}%
              </div>
              <div className="text-sm text-secondary-600">Conversion Rate</div>
            </div>

            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <UsersIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-900">
                {dashboardData.repeatCustomers || "0"}%
              </div>
              <div className="text-sm text-secondary-600">Repeat Customers</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      {dashboardData?.recentActivity && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Activity Summary
          </h3>

          <div className="space-y-3">
            {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-secondary-900">
                    {activity.description}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                {activity.amount && (
                  <span className="font-medium text-primary-600">
                    {formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;