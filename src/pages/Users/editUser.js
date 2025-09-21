import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const passedUser = location.state?.user;

  useEffect(() => {
    if (passedUser) {
      setUser(passedUser);
      hydrateForm(passedUser);
      setLoading(false);
    } else {
      fetchUser();
    }
  }, [id]);

  const hydrateForm = (userData) => {
    // Use fullPermissions if available (from UserDetail), otherwise fall back to permissions
    const sourcePermissions =
      userData.fullPermissions || userData.permissions || {};

    setFormData({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      role: userData.role || "",
      isActive: userData.isActive !== false,
      permissions: {
        products: {
          create: sourcePermissions.products?.create ?? false,
          read: sourcePermissions.products?.read ?? false,
          update: sourcePermissions.products?.update ?? false,
          delete: sourcePermissions.products?.delete ?? false,
        },
        sales: {
          create: sourcePermissions.sales?.create ?? false,
          read: sourcePermissions.sales?.read ?? false,
          void: sourcePermissions.sales?.void ?? false,
        },
        orders: {
          create: sourcePermissions.orders?.create ?? false,
          read: sourcePermissions.orders?.read ?? false,
          update: sourcePermissions.orders?.update ?? false,
          delete: sourcePermissions.orders?.delete ?? false,
        },
        reports: {
          view: sourcePermissions.reports?.view ?? false,
          export: sourcePermissions.reports?.export ?? false,
        },
        users: {
          manage: sourcePermissions.users?.manage ?? false,
        },
      },
      settings: {
        notifications: {
          email: userData.settings?.notifications?.email ?? true,
          push: userData.settings?.notifications?.push ?? true,
          sales: userData.settings?.notifications?.sales ?? true,
          orders: userData.settings?.notifications?.orders ?? true,
        },
        preferences: {
          theme: userData.settings?.preferences?.theme ?? "light",
          language: userData.settings?.preferences?.language ?? "en",
        },
      },
    });
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    isActive: true,
    permissions: {
      products: { create: false, read: false, update: false, delete: false },
      sales: { create: false, read: false, void: false },
      orders: { create: false, read: false, update: false, delete: false },
      reports: { view: false, export: false },
      users: { manage: false },
    },
    settings: {
      notifications: {
        email: true,
        push: true,
        sales: true,
        orders: true,
      },
      preferences: {
        theme: "light",
        language: "en",
      },
    },
  });

  const roles = [
    { value: "owner", label: "Owner", color: "bg-purple-100 text-purple-800" },
    { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800" },
    {
      value: "operator",
      label: "Operator",
      color: "bg-green-100 text-green-800",
    },
    { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-800" },
  ];

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(id);
      const userData =
        response.data.user ||
        response.data.data?.user ||
        response.data.data ||
        response.data;

      setUser(userData);
      hydrateForm(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("Failed to load user details");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermissionChange = (resource, action, value) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: {
          ...prev.permissions[resource],
          [action]: value,
        },
      },
    }));
  };

  const handleSettingChange = (section, key, value) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [section]: {
          ...prev.settings[section],
          [key]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await usersAPI.updateUser(id, formData);
      toast.success("User updated successfully");
      navigate(`/users/${id}`);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const isOwnAccount = user && user._id === currentUser._id;

  if (!hasPermission("users", "manage")) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Access Denied
        </h3>
        <p className="text-secondary-600">
          You don't have permission to edit users.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          User not found
        </h3>
        <Link to="/users" className="btn-primary">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/users/${id}`)}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Edit User: {user.name}
              {isOwnAccount && (
                <span className="ml-2 text-lg text-primary-600">(You)</span>
              )}
            </h1>
            <p className="text-secondary-600">
              Update user information and permissions
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              <UserIcon className="h-5 w-5 inline mr-2" />
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 text-secondary-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="h-5 w-5 text-secondary-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className="input-field"
                  disabled={isOwnAccount}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {isOwnAccount && (
                  <p className="text-xs text-secondary-500 mt-1">
                    You cannot change your own role
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  disabled={isOwnAccount}
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-secondary-700"
                >
                  Account is active
                </label>
                {isOwnAccount && (
                  <span className="ml-2 text-xs text-secondary-500">
                    (Cannot deactivate own account)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              <CogIcon className="h-5 w-5 inline mr-2" />
              Settings
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-secondary-900 mb-2">
                  Notifications
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={formData.settings.notifications.email}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "email",
                          e.target.checked
                        )
                      }
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="emailNotifications"
                      className="ml-2 text-sm text-secondary-700"
                    >
                      Email notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pushNotifications"
                      checked={formData.settings.notifications.push}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "push",
                          e.target.checked
                        )
                      }
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="pushNotifications"
                      className="ml-2 text-sm text-secondary-700"
                    >
                      Push notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="salesNotifications"
                      checked={formData.settings.notifications.sales}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "sales",
                          e.target.checked
                        )
                      }
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="salesNotifications"
                      className="ml-2 text-sm text-secondary-700"
                    >
                      Sales notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ordersNotifications"
                      checked={formData.settings.notifications.orders}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "orders",
                          e.target.checked
                        )
                      }
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="ordersNotifications"
                      className="ml-2 text-sm text-secondary-700"
                    >
                      Order notifications
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-secondary-900 mb-2">
                  Preferences
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Theme
                    </label>
                    <select
                      value={formData.settings.preferences.theme}
                      onChange={(e) =>
                        handleSettingChange(
                          "preferences",
                          "theme",
                          e.target.value
                        )
                      }
                      className="input-field"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Language
                    </label>
                    <select
                      value={formData.settings.preferences.language}
                      onChange={(e) =>
                        handleSettingChange(
                          "preferences",
                          "language",
                          e.target.value
                        )
                      }
                      className="input-field"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
            Permissions
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === "development" && (
              <span className="text-xs text-gray-500 ml-2">
                (Source:{" "}
                {user.fullPermissions ? "fullPermissions" : "permissions"})
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(formData.permissions).map(([resource, actions]) => (
              <div
                key={resource}
                className="border border-secondary-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-secondary-900 capitalize mb-3">
                  {resource.replace("_", " ")}
                </h4>
                <div className="space-y-2">
                  {Object.entries(actions).map(([action, allowed]) => (
                    <div key={action} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${resource}-${action}`}
                        checked={allowed}
                        onChange={(e) =>
                          handlePermissionChange(
                            resource,
                            action,
                            e.target.checked
                          )
                        }
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label
                        htmlFor={`${resource}-${action}`}
                        className="ml-2 text-sm text-secondary-700 capitalize"
                      >
                        {action}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate(`/users/${id}`)}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
