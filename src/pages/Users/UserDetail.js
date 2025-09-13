// Fixed UserDetail.js - Complete Component
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";
import { formatDate, formatDateTime, getInitials } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  KeyIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUser();
    fetchPerformance();
    fetchActivity();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(id);

      // FIX: Extract the user from the nested structure
      const userData =
        response.data.user ||
        response.data.data?.user ||
        response.data.data ||
        response.data;
      setUser(userData);

      // If statistics are included, you might want to use them for performance
      if (response.data.statistics) {
        setPerformance(response.data.statistics);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("Failed to load user details");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await usersAPI.getUserPerformance(id, {
        period: "month",
      });
      setPerformance(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch performance:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await usersAPI.getUserActivity(id, {
        limit: 10,
      });
      setActivity(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await usersAPI.resetPassword(id, newPassword);
      toast.success("Password reset successfully");
      setShowResetModal(false);
      setNewPassword("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    }
  };

  const deleteUser = async () => {
    if (id === currentUser._id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${user.name}"?`)) {
      return;
    }

    try {
      await usersAPI.deleteUser(id);
      toast.success("User deleted successfully");
      navigate("/users");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const getUserStatus = () => {
    // FIX: Check isActive directly on user object
    if (!user || user.isActive === false) {
      return { color: "text-red-600", bgColor: "bg-red-100", text: "Inactive" };
    }

    const lastActive = user.lastLogin ? new Date(user.lastLogin) : null;
    const daysSinceActive = lastActive
      ? Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24))
      : null;

    if (!lastActive) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        text: "Never Logged In",
      };
    } else if (daysSinceActive <= 7) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        text: "Active",
      };
    } else if (daysSinceActive <= 30) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        text: "Inactive",
      };
    } else {
      return { color: "text-red-600", bgColor: "bg-red-100", text: "Dormant" };
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "operator":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          You don't have permission to view user details.
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

  const status = getUserStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/users")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="h-12 w-12 flex-shrink-0">
              {user.avatar ? (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-lg">
                    {getInitials(user.name)}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-secondary-900">
                {user.name}
                {user._id === currentUser._id && (
                  <span className="ml-2 text-lg text-primary-600">(You)</span>
                )}
              </h1>
              <p className="text-secondary-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="btn-secondary"
          >
            <KeyIcon className="h-5 w-5 mr-2" />
            Reset Password
          </button>

          <Link to={`/users/${id}/edit`} className="btn-secondary">
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>

          {user._id !== currentUser._id && (
            <button
              onClick={deleteUser}
              className="btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            User Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Role</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                  user.role
                )}`}
              >
                {user.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
              >
                {status.text}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Created</span>
              <span className="text-secondary-900">
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Last Login</span>
              <span className="text-secondary-900">
                {user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}
              </span>
            </div>

            {user.phone && (
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Phone</span>
                <span className="text-secondary-900">{user.phone}</span>
              </div>
            )}

            {user.hasPin && (
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">PIN Login</span>
                <span className="text-green-600">Enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Performance (This Month)
          </h3>

          {performance ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {performance.totalSales || 0}
                </div>
                <div className="text-sm text-green-700">Total Sales</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600 mb-1">
                    {performance.totalRevenue
                      ? `${(performance.totalRevenue / 1000).toFixed(1)}K`
                      : "0"}
                  </div>
                  <div className="text-blue-700">Revenue</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600 mb-1">
                    {performance.averageOrderValue
                      ? `${performance.averageOrderValue.toFixed(0)}`
                      : "0"}
                  </div>
                  <div className="text-purple-700">Avg Order</div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-secondary-600">
                  Rank: #{performance.rank || "N/A"} out of{" "}
                  {performance.totalUsers || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
              <p className="text-secondary-600">
                No performance data available
              </p>
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Permissions
          </h3>

          <div className="space-y-3">
            {user.fullPermissions ? (
              Object.entries(user.fullPermissions).map(
                ([resource, actions]) => (
                  <div
                    key={resource}
                    className="border-b border-secondary-200 pb-2 last:border-b-0"
                  >
                    <p className="font-medium text-secondary-900 capitalize mb-1">
                      {resource.replace("_", " ")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(actions).map(([action, allowed]) => (
                        <span
                          key={action}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            allowed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-secondary-600">
                No permissions data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Recent Activity
        </h3>

        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-white rounded-lg mr-3">
                    {item.type === "login" ? (
                      <UserIcon className="h-4 w-4 text-secondary-600" />
                    ) : item.type === "sale" ? (
                      <ChartBarIcon className="h-4 w-4 text-secondary-600" />
                    ) : (
                      <ClockIcon className="h-4 w-4 text-secondary-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      {item.description}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {item.device && (
                        <span className="inline-flex items-center mr-2">
                          {item.device.includes("Mobile") ? (
                            <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ComputerDesktopIcon className="h-3 w-3 mr-1" />
                          )}
                          {item.device}
                        </span>
                      )}
                      {item.ip && `IP: ${item.ip}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary-900">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
            <p className="text-secondary-600">No recent activity</p>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Reset Password for {user.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter new password"
                  minLength={6}
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResetModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={resetPassword} className="btn-primary">
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
