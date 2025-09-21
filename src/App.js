// src/App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import components
import Layout from "./components/Layout/Layout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/Products/ProductDetail";
import AddProduct from "./pages/Products/AddProduct";
import EditProduct from "./pages/Products/EditProduct";
import Sales from "./pages/Sales/Sales";
import SaleDetail from "./pages/Sales/SaleDetail";
import POS from "./pages/POS/POS";
import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";
import CreateOrder from "./pages/Orders/CreateOrder";
import Customers from "./pages/Customers/Customers";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import AddCustomer from "./pages/Customers/AddCustomer";
import Users from "./pages/Users/Users";
import UserDetail from "./pages/Users/UserDetail";
import UserEdit from "./pages/Users/editUser";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Protected Route Component
const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { isAuthenticated, hasPermission, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission requirement
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split(".");
    if (!hasPermission(resource, action)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* POS */}
        <Route
          path="pos"
          element={
            <ProtectedRoute requiredPermission="sales.create">
              <POS />
            </ProtectedRoute>
          }
        />

        {/* Products */}
        <Route
          path="products"
          element={
            <ProtectedRoute requiredPermission="products.read">
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/add"
          element={
            <ProtectedRoute requiredPermission="products.create">
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id"
          element={
            <ProtectedRoute requiredPermission="products.read">
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id/edit"
          element={
            <ProtectedRoute requiredPermission="products.update">
              <EditProduct />
            </ProtectedRoute>
          }
        />

        {/* Sales */}
        <Route
          path="sales"
          element={
            <ProtectedRoute requiredPermission="sales.read">
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/:id"
          element={
            <ProtectedRoute requiredPermission="sales.read">
              <SaleDetail />
            </ProtectedRoute>
          }
        />

        {/* Orders */}
        <Route
          path="orders"
          element={
            <ProtectedRoute requiredPermission="orders.read">
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/create"
          element={
            <ProtectedRoute requiredPermission="orders.create">
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute requiredPermission="orders.read">
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        {/* Customers */}
        <Route
          path="customers"
          element={
            <ProtectedRoute requiredPermission="orders.read">
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers/add"
          element={
            <ProtectedRoute requiredPermission="orders.create">
              <AddCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <ProtectedRoute requiredPermission="orders.read">
              <CustomerDetail />
            </ProtectedRoute>
          }
        />

        {/* Users */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission="users.manage">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute requiredPermission="users.manage">
              <UserDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute requiredPermission="users.update">
              <UserEdit />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="owner">
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route path="profile" element={<Profile />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#374151",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
