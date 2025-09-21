// src/pages/Settings/Settings.js
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { settingsAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  BuildingStorefrontIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Settings = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    business: {
      name: "",
      logo: {},
      address: {
        city: "",
        county: "",
        country: "",
      },
      contact: {
        phone: "",
        email: "",
      },
      registration: { licenses: [] },
      operatingHours: {
        monday: {},
        tuesday: {},
        wednesday: {},
        thursday: {},
        friday: {},
        saturday: {},
        sunday: {},
      },
    },
    sales: {
      receipt: {
        showLogo: true,
        showBusinessInfo: false,
        printAutomatically: false,
        paperSize: "A4",
        printCopy: 1,
        footerMessage: "",
      },
      payment: {
        mpesa: {},
        creditTerms: { defaultDays: 30, interestRate: 0 },
        methods: [],
      },
      discounts: {
        maxPercentage: 0,
        requireApproval: false,
        approvalThreshold: 0,
      },
    },
    inventory: {
      lowStockAlert: { enabled: false, threshold: 0 },
      autoReorder: { enabled: false, leadTime: 0 },
      trackExpiry: { enabled: false, alertDays: 0 },
      barcodeFormat: "",
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      const fetchedSettings = response.data.data || {};

      setSettings((prev) => ({
        ...prev,
        ...fetchedSettings,
        business: {
          ...prev.business,
          ...fetchedSettings.business,
          address: {
            ...prev.business.address,
            ...fetchedSettings.business?.address,
          },
          contact: {
            ...prev.business.contact,
            ...fetchedSettings.business?.contact,
          },
        },
        sales: {
          ...prev.sales,
          ...fetchedSettings.sales,
          receipt: {
            ...prev.sales.receipt,
            ...fetchedSettings.sales?.receipt,
          },
        },
      }));
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedChange = (section, field, subfield, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [subfield]: value,
        },
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!hasRole("owner")) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Access Denied
        </h3>
        <p className="text-secondary-600">
          Only business owners can access system settings.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-600">
            Configure your system preferences
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? (
            <LoadingSpinner size="small" text="Saving..." />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BuildingStorefrontIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Business Information
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.business.name}
                onChange={(e) =>
                  handleChange("business", "name", e.target.value)
                }
                className="input-field"
                placeholder="Your Business Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Street
                </label>
                <input
                  type="text"
                  value={settings.business.address.city}
                  onChange={(e) =>
                    handleNestedChange(
                      "business",
                      "address",
                      "city",
                      e.target.value
                    )
                  }
                  className="input-field"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  County
                </label>
                <input
                  type="text"
                  value={settings.business.address.county}
                  onChange={(e) =>
                    handleNestedChange(
                      "business",
                      "address",
                      "county",
                      e.target.value
                    )
                  }
                  className="input-field"
                  placeholder="County"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={settings.business.address.country}
                  onChange={(e) =>
                    handleNestedChange(
                      "business",
                      "address",
                      "country",
                      e.target.value
                    )
                  }
                  className="input-field"
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.business.contact.phone}
                  onChange={(e) =>
                    handleNestedChange(
                      "business",
                      "contact",
                      "phone",
                      e.target.value
                    )
                  }
                  className="input-field"
                  placeholder="+254 712 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.business.contact.email}
                  onChange={(e) =>
                    handleNestedChange(
                      "business",
                      "contact",
                      "email",
                      e.target.value
                    )
                  }
                  className="input-field"
                  placeholder="business@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <PrinterIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Receipt Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Paper Size
              </label>
              <select
                value={settings.sales.receipt.paperSize}
                onChange={(e) =>
                  handleNestedChange(
                    "sales",
                    "receipt",
                    "paperSize",
                    e.target.value
                  )
                }
                className="input-field"
              >
                <option value="A4">A4</option>
                <option value="80mm">Thermal (80mm)</option>
                <option value="58mm">Thermal (58mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Footer Message
              </label>
              <textarea
                value={settings.sales.receipt.footerMessage}
                onChange={(e) =>
                  handleNestedChange(
                    "sales",
                    "receipt",
                    "footerMessage",
                    e.target.value
                  )
                }
                className="input-field"
                rows={2}
                placeholder="Thank you message"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.sales.receipt.showLogo}
                  onChange={(e) =>
                    handleNestedChange(
                      "sales",
                      "receipt",
                      "showLogo",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Show business logo
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.sales.receipt.showBusinessInfo}
                  onChange={(e) =>
                    handleNestedChange(
                      "sales",
                      "receipt",
                      "showBusinessInfo",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Show business information
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.sales.receipt.printAutomatically}
                  onChange={(e) =>
                    handleNestedChange(
                      "sales",
                      "receipt",
                      "printAutomatically",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Print automatically after sale
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
