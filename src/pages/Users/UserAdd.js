// src/pages/Users/AddUser.js
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const AddUser = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    pin: "",
    role: "operator",
    isActive: true,
    permissions: {
      products: {
        create: false,
        read: true,
        update: false,
        delete: false,
      },
      sales: {
        create: true,
        read: true,
        void: false,
      },
      orders: {
        create: true,
        read: true,
        update: true,
        delete: false,
      },
      reports: {
        view: false,
        export: false,
      },
      users: {
        manage: false,
      },
    },
    settings: {
      notifications: {
        email: true,
        sms: true,
        lowStock: true,
        dailyReport: false,
      },
      theme: "light",
      language: "en",
    },
  });

  const [errors, setErrors] = useState({});

  // Role-based default permissions
  const rolePermissions = {
    owner: {
      products: { create: true, read: true, update: true, delete: true },
      sales: { create: true, read: true, void: true },
      orders: { create: true, read: true, update: true, delete: true },
      reports: { view: true, export: true },
      users: { manage: true },
    },
    manager: {
      products: { create: true, read: true, update: true, delete: false },
      sales: { create: true, read: true, void: true },
      orders: { create: true, read: true, update: true, delete: false },
      reports: { view: true, export: true },
      users: { manage: false },
    },
    operator: {
      products: { create: false, read: true, update: false, delete: false },
      sales: { create: true, read: true, void: false },
      orders: { create: true, read: true, update: true, delete: false },
      reports: { view: false, export: false },
      users: { manage: false },
    },
    viewer: {
      products: { create: false, read: true, update: false, delete: false },
      sales: { create: false, read: true, void: false },
      orders: { create: false, read: true, update: false, delete: false },
      reports: { view: false, export: false },
      users: { manage: false },
    },
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please provide a valid email";
    }

    // Phone validation (Kenyan format)
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Please provide a valid Kenyan phone number";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // PIN validation (optional)
    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6)) {
      newErrors.pin = "PIN must be between 4 and 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "role") {
      // Update role and apply default permissions
      setFormData({
        ...formData,
        role: value,
        permissions: rolePermissions[value],
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handlePermissionChange = (category, permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [category]: {
          ...formData.permissions[category],
          [permission]: !formData.permissions[category][permission],
        },
      },
    });
  };

  const handleSettingChange = (category, setting) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [category]: {
          ...formData.settings[category],
          [setting]: !formData.settings[category][setting],
        },
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      await usersAPI.createUser(formData);
      toast.success("User created successfully");
      navigate("/users");
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission("users", "manage")) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Access Denied
        </h3>
        <p className="text-secondary-600">
          You don't have permission to add users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/users"
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Add New User
          </h1>
          <p className="text-secondary-600">Create a new user account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input-field ${errors.name ? "border-red-500" : ""}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-field pl-10 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`input-field pl-10 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="+254712345678 or 0712345678"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <p className="text-xs text-secondary-500 mt-1">
                Role determines default permissions
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <LockClosedIcon className="h-5 w-5 mr-2 text-primary-600" />
            Security
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-field pl-10 pr-10 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* PIN (Optional) */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                PIN (Optional)
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type={showPin ? "text" : "password"}
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  className={`input-field pl-10 pr-10 ${
                    errors.pin ? "border-red-500" : ""
                  }`}
                  placeholder="4-6 digit PIN"
                  maxLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPin ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.pin && (
                <p className="text-red-500 text-sm mt-1">{errors.pin}</p>
              )}
              <p className="text-xs text-secondary-500 mt-1">
                For quick login on POS terminal
              </p>
            </div>
          </div>

          {/* Active Status */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Account is active
              </span>
            </label>
          </div>
        </div>

        {/* Permissions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600" />
            Permissions
          </h2>

          <div className="space-y-6">
            {/* Products */}
            <div>
              <h3 className="text-sm font-medium text-secondary-900 mb-2">
                Products
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.permissions.products).map((perm) => (
                  <label key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.products[perm]}
                      onChange={() => handlePermissionChange("products", perm)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700 capitalize">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sales */}
            <div>
              <h3 className="text-sm font-medium text-secondary-900 mb-2">
                Sales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.permissions.sales).map((perm) => (
                  <label key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.sales[perm]}
                      onChange={() => handlePermissionChange("sales", perm)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700 capitalize">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Orders */}
            <div>
              <h3 className="text-sm font-medium text-secondary-900 mb-2">
                Orders
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.permissions.orders).map((perm) => (
                  <label key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.orders[perm]}
                      onChange={() => handlePermissionChange("orders", perm)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700 capitalize">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reports */}
            <div>
              <h3 className="text-sm font-medium text-secondary-900 mb-2">
                Reports
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.permissions.reports).map((perm) => (
                  <label key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.reports[perm]}
                      onChange={() => handlePermissionChange("reports", perm)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700 capitalize">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Users */}
            <div>
              <h3 className="text-sm font-medium text-secondary-900 mb-2">
                Users
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.permissions.users).map((perm) => (
                  <label key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.users[perm]}
                      onChange={() => handlePermissionChange("users", perm)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700 capitalize">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link to="/users" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-w-[120px]"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;