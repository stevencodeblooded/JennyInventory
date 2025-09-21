// src/contexts/AuthContext.js
import { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  permissions: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        permissions: action.payload.user.fullPermissions,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        permissions: null,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");

      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);

          // Verify token is still valid
          const response = await authAPI.getMe();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: response.data.data },
          });
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.login(credentials);
      const { user, token, refreshToken } = response.data.data;

      // Store tokens and user data
      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const pinLogin = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.pinLogin(credentials);
      const { user, token, refreshToken } = response.data.data;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      return {
        success: false,
        error: error.response?.data?.message || "PIN login failed",
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage and state regardless of API call success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT" });
      toast.success("Logged out successfully");
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data;

      // Update local storage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      dispatch({
        type: "UPDATE_USER",
        payload: updatedUser,
      });

      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Update failed",
      };
    }
  };

  const changePassword = async (data) => {
    try {
      const response = await authAPI.changePassword(data);
      const { token, refreshToken } = response.data.data;

      // Update tokens
      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refreshToken);

      toast.success("Password changed successfully");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Password change failed",
      };
    }
  };

  const setPin = async (data) => {
    try {
      await authAPI.setPin(data);
      toast.success("PIN set successfully");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "PIN setup failed",
      };
    }
  };

  // Permission checking helpers
  const hasPermission = (resource, action) => {
    if (!state.permissions) return false;
    if (state.user?.role === "owner") return true;

    return state.permissions[resource]?.[action] || false;
  };

  const hasRole = (roles) => {
    if (!state.user) return false;
    const userRole = state.user.role;

    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }

    return userRole === roles;
  };

  const value = {
    ...state,
    login,
    pinLogin,
    logout,
    updateProfile,
    changePassword,
    setPin,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
