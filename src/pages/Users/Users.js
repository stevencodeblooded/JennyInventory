// src/pages/Users/Users.js
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";
import { formatDate, getInitials } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const Users = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        role: roleFilter,
        limit: 100,
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await usersAPI.getUsers(params);
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (userId === currentUser._id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (
      !window.confirm(`Are you sure you want to delete user "${userName}"?`)
    ) {
      return;
    }

    try {
      await usersAPI.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const getUserStatus = (user) => {
    if (!user?.isActive) {
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
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
          <p className="text-secondary-600">
            Manage user accounts and permissions
          </p>
        </div>

        <Link to="/users/add" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="operator">Operator</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Last Login</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {users.map((user) => {
                  const status = getUserStatus(user);

                  return (
                    <tr key={user._id} className="hover:bg-secondary-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-medium">
                                  {getInitials(user.name)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {user.name}
                              {user._id === currentUser._id && (
                                <span className="ml-2 text-xs text-primary-600">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.lastLogin ? (
                          <div className="flex items-center text-sm text-secondary-900">
                            <ClockIcon className="h-4 w-4 text-secondary-400 mr-1" />
                            {formatDate(user.lastLogin)}
                          </div>
                        ) : (
                          <span className="text-secondary-500">Never</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/users/${user._id}`}
                            className="text-secondary-400 hover:text-secondary-600"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>

                          <Link
                            to={`/users/${user._id}/edit`}
                            className="text-blue-400 hover:text-blue-600"
                            title="Edit User"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>

                          {user._id !== currentUser._id && (
                            <button
                              onClick={() => deleteUser(user._id, user.name)}
                              className="text-red-400 hover:text-red-600"
                              title="Delete User"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No users found
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm || roleFilter
                ? "Try adjusting your search criteria"
                : "Get started by adding your first user"}
            </p>
            {!searchTerm && !roleFilter && (
              <Link
                to="/users/add"
                className="btn-primary flex items-center justify-center w-fit mx-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add User
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
