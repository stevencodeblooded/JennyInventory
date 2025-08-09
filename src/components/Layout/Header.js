// src/components/Layout/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardAPI } from "../../services/api";
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await dashboardAPI.getNotifications();
        setNotifications(response.data.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-secondary-200">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 border-r border-secondary-200 text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between">
        {/* Search bar - can be added later */}
        <div className="flex-1 flex items-center">
          <div className="text-secondary-600">
            <span className="text-lg font-medium">
              Welcome back, {user?.name}
            </span>
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {unreadNotifications.length > 9
                      ? "9+"
                      : unreadNotifications.length}
                  </span>
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-secondary-200">
                    <h3 className="text-sm font-medium text-secondary-900">
                      Notifications
                    </h3>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification, index) => (
                        <div
                          key={index}
                          className={`px-4 py-3 hover:bg-secondary-50 border-b border-secondary-100 last:border-b-0 ${
                            notification.type === "error"
                              ? "border-l-4 border-l-red-500"
                              : notification.type === "warning"
                              ? "border-l-4 border-l-yellow-500"
                              : "border-l-4 border-l-blue-500"
                          }`}
                        >
                          <p className="text-sm text-secondary-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {notification.category}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-secondary-500">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-secondary-400" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-secondary-500 capitalize">
                    {user?.role}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-secondary-400" />
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircleIcon className="mr-3 h-4 w-4" />
                    Profile
                  </Link>
                  {user?.role === "owner" && (
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CogIcon className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                  )}
                  <div className="border-t border-secondary-100"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};

export default Header;
