// src/services/api.js
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://shop-inventory-five.vercel.app/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data.data;
          localStorage.setItem("accessToken", token);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  pinLogin: (credentials) => api.post("/auth/pin-login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  logoutAll: () => api.post("/auth/logout-all"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  setPin: (data) => api.put("/auth/set-pin", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/reset-password/${token}`, { password }),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get("/products", { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post("/products", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  getLowStock: () => api.get("/products/low-stock"),
  getOutOfStock: () => api.get("/products/out-of-stock"),
  getInventoryValue: () => api.get("/products/inventory-value"),
  bulkUpdate: (data) => api.put("/products/bulk-update", data),
  importProducts: (data) => api.post("/products/import", data),
  getPerformance: (id) => api.get(`/products/${id}/performance`),
};

// Sales API
export const salesAPI = {
  createSale: (data) => api.post("/sales", data),
  getSales: (params) => api.get("/sales", { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  voidSale: (id, reason) => api.post(`/sales/${id}/void`, { reason }),
  refundSale: (id, data) => api.post(`/sales/${id}/refund`, data),
  getDailySummary: (date) =>
    api.get("/sales/daily-summary", { params: { date } }),
  getReport: (params) => api.get("/sales/report", { params }),
  printReceipt: (id) => api.get(`/sales/${id}/receipt`),
  quickSale: (data) => api.post("/sales/quick-sale", data),
  getSalesByProduct: (productId, params) =>
    api.get(`/sales/by-product/${productId}`, { params }),
  getPendingPayments: () => api.get("/sales/pending-payments"),
  recordPayment: (id, data) => api.post(`/sales/${id}/payment`, data),
  initiateMpesaPayment: (data) => api.post("/sales/mpesa/initiate", data),
  checkMpesaPaymentStatus: (checkoutRequestId) =>
    api.get(`/sales/mpesa/status/${checkoutRequestId}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (data) => api.post("/orders", data),
  getOrders: (params) => api.get("/orders", { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  assignOrder: (id, userId) => api.put(`/orders/${id}/assign`, { userId }),
  getPending: () => api.get("/orders/pending"),
  getDeliveryQueue: (date) =>
    api.get("/orders/delivery-queue", { params: { date } }),
  getMetrics: (params) => api.get("/orders/metrics", { params }),
  recordPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};

// Customers API
export const customersAPI = {
  getCustomers: (params) => api.get("/customers", { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post("/customers", data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  addNote: (id, data) => api.post(`/customers/${id}/notes`, data),
  updateCredit: (id, data) => api.put(`/customers/${id}/credit`, data),
  addCreditTransaction: (id, data) =>
    api.post(`/customers/${id}/credit-transaction`, data),
  getPurchaseHistory: (id, params) =>
    api.get(`/customers/${id}/purchases`, { params }),
  getSegments: () => api.get("/customers/segments"),
  getNearby: (params) => api.get("/customers/nearby", { params }),
  getBirthdays: (params) => api.get("/customers/birthdays", { params }),
  exportCustomers: (params) => api.get("/customers/export", { params }),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get("/users", { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updatePermissions: (id, permissions) =>
    api.put(`/users/${id}/permissions`, { permissions }),
  resetPassword: (id, newPassword) =>
    api.post(`/users/${id}/reset-password`, { newPassword }),
  getUserActivity: (id, params) => api.get(`/users/${id}/activity`, { params }),
  getUserPerformance: (id, params) =>
    api.get(`/users/${id}/performance`, { params }),
  bulkUpdate: (data) => api.put("/users/bulk-update", data),
  getLoginHistory: (id) => api.get(`/users/${id}/login-history`),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: (params) => api.get("/dashboard/overview", { params }),
  getRealtimeStats: () => api.get("/dashboard/realtime"),
  getSalesChart: (params) => api.get("/dashboard/sales-chart", { params }),
  getTopProducts: (params) => api.get("/dashboard/top-products", { params }),
  getLowStock: (params) => api.get("/dashboard/low-stock", { params }),
  getPerformance: () => api.get("/dashboard/performance"),
  getNotifications: () => api.get("/dashboard/notifications"),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (params) => api.get("/reports/sales", { params }),
  getInventoryReport: (params) => api.get("/reports/inventory", { params }),
  getStaffPerformance: (params) =>
    api.get("/reports/staff-performance", { params }),
  getCustomerAnalytics: (params) =>
    api.get("/reports/customer-analytics", { params }),
  getFinancialSummary: (params) =>
    api.get("/reports/financial-summary", { params }),
  exportToExcel: (data) => api.post("/reports/export/excel", data),
  getDashboardSummary: () => api.get("/reports/dashboard"),
};

// Categories API
export const categoriesAPI = {
  getCategories: () => api.get("/categories"),
  getCategoryTree: () => api.get("/categories/tree"),
  createCategory: (data) => api.post("/categories", data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get("/settings"),
  updateSettings: (data) => api.put("/settings", data),
};

// Activities API
export const activitiesAPI = {
  getActivities: (params) => api.get("/activities", { params }),
  getActivitySummary: (params) => api.get("/activities/summary", { params }),
  getUserActivitySummary: (userId, params) =>
    api.get(`/activities/user/${userId}`, { params }),
  getSecurityEvents: (params) => api.get("/activities/security", { params }),
  exportActivities: (data) => api.post("/activities/export", data),
  getActivityStats: () => api.get("/activities/stats"),
};

export default api;
