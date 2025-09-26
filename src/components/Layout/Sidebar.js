// src/components/Layout/Sidebar.js
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CogIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ open, setOpen }) => {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      show: true,
    },
    {
      name: "POS",
      href: "/pos",
      icon: ShoppingCartIcon,
      show: hasPermission("sales", "create"),
    },
    {
      name: "Products",
      href: "/products",
      icon: CubeIcon,
      show: hasPermission("products", "read"),
    },
    {
      name: "Sales",
      href: "/sales",
      icon: ClipboardDocumentListIcon,
      show: hasPermission("sales", "read"),
    },
    // {
    //   name: "Orders",
    //   href: "/orders",
    //   icon: ClipboardDocumentListIcon,
    //   show: hasPermission("orders", "read"),
    // },
    // {
    //   name: "Customers",
    //   href: "/customers",
    //   icon: UserGroupIcon,
    //   show: hasPermission("orders", "read"),
    // },
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      show: hasPermission("users", "manage"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: CogIcon,
      show: hasRole("owner"),
    },
  ];

  const filteredNavigation = navigation.filter((item) => item.show);

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`fixed inset-0 bg-secondary-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform ease-in-out duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <SidebarContent
            navigation={filteredNavigation}
            setOpen={setOpen}
          />
        </div>

        <div className="flex-shrink-0 w-14" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-secondary-200">
            <SidebarContent navigation={filteredNavigation} />
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarContent = ({ navigation, setOpen }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600">
        <div className="flex items-center">
          <div className="bg-white p-2 rounded-lg">
            <ShoppingCartIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-white">JennySaleFlow</h1>
            <p className="text-primary-100 text-xs">Inventory & Sales</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen && setOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? "bg-primary-100 text-primary-900 border-r-2 border-primary-600"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                    isActive
                      ? "text-primary-600"
                      : "text-secondary-400 group-hover:text-secondary-500"
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
