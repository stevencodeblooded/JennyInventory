// src/utils/helpers.js
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Format currency using KES format
 */
export const formatCurrency = (amount, currency = "KES") => {
  if (amount === null || amount === undefined) return "KSh 0.00";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format phone number to Kenyan format
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Handle Kenyan numbers
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }

  // Format as +254 XXX XXX XXX
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(
      3,
      6
    )} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`;
  }

  return phone;
};

/**
 * Format date for display
 */
export const formatDate = (date, formatString = "MMM dd, yyyy") => {
  if (!date) return "";
  return format(new Date(date), formatString);
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  return format(new Date(date), "MMM dd, yyyy HH:mm");
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";

  const dateObj = new Date(date);

  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } else if (isYesterday(dateObj)) {
    return "Yesterday";
  } else {
    return format(dateObj, "MMM dd, yyyy");
  }
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate Kenyan phone number
 */
export const isValidKenyanPhone = (phone) => {
  const regex = /^(\+254|0)[17]\d{8}$/;
  return regex.test(phone);
};

/**
 * Sanitize input for XSS prevention
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/\$/g, ""); // Remove $ to prevent MongoDB injection
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if user has permission
 */
export const hasPermission = (user, resource, action) => {
  if (!user || !user.permissions) return false;
  if (user.role === "owner") return true;

  return user.permissions[resource]?.[action] || false;
};

/**
 * Get stock status color and text
 */
export const getStockStatus = (currentStock, minStock = 10) => {
  if (currentStock === 0) {
    return {
      status: "Out of Stock",
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  } else if (currentStock <= minStock) {
    return {
      status: "Low Stock",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    };
  } else if (currentStock > minStock * 3) {
    return {
      status: "Overstock",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    };
  } else {
    return {
      status: "In Stock",
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  }
};

/**
 * Get order status color and text
 */
export const getOrderStatus = (status) => {
  const statusMap = {
    pending: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      text: "Pending",
    },
    confirmed: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      text: "Confirmed",
    },
    processing: {
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      text: "Processing",
    },
    ready: { color: "text-green-600", bgColor: "bg-green-100", text: "Ready" },
    out_for_delivery: {
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      text: "Out for Delivery",
    },
    delivered: {
      color: "text-green-700",
      bgColor: "bg-green-200",
      text: "Delivered",
    },
    cancelled: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      text: "Cancelled",
    },
    failed: { color: "text-red-700", bgColor: "bg-red-200", text: "Failed" },
  };

  return (
    statusMap[status] || {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      text: "Unknown",
    }
  );
};

/**
 * Get payment status color and text
 */
export const getPaymentStatus = (status) => {
  const statusMap = {
    paid: { color: "text-green-600", bgColor: "bg-green-100", text: "Paid" },
    pending: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      text: "Pending",
    },
    partial: {
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      text: "Partial",
    },
    refunded: {
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      text: "Refunded",
    },
    failed: { color: "text-red-600", bgColor: "bg-red-100", text: "Failed" },
  };

  return (
    statusMap[status] || {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      text: "Unknown",
    }
  );
};

/**
 * Calculate tax amount
 */
export const calculateTax = (amount, rate = 16, inclusive = false) => {
  let taxAmount, netAmount, grossAmount;

  if (inclusive) {
    // Tax is included in the amount
    netAmount = amount / (1 + rate / 100);
    taxAmount = amount - netAmount;
    grossAmount = amount;
  } else {
    // Tax is not included
    netAmount = amount;
    taxAmount = amount * (rate / 100);
    grossAmount = amount + taxAmount;
  }

  return {
    netAmount: Number(netAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grossAmount: Number(grossAmount.toFixed(2)),
    rate,
  };
};

/**
 * Format number with commas
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat("en-KE").format(number);
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
};

/**
 * Download data as CSV
 */
export const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || "");
          return stringValue.includes(",")
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
};
