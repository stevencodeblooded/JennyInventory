// src/pages/Settings/Settings.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { settingsAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  CogIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  BellIcon,
  ShieldCheckIcon,
  CloudIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

const Settings = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    business: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
      taxNumber: "",
      currency: "KES",
      timezone: "Africa/Nairobi",
    },
    pos: {
      defaultTaxRate: 16,
      enableTax: true,
      enableDiscount: true,
      autoGenerateReceipt: true,
      defaultPaymentMethod: "cash",
      enableQuickSale: true,
      lowStockThreshold: 10,
    },
    receipt: {
      showLogo: true,
      showBusinessInfo: true,
      showTax: true,
      footerMessage: "Thank you for your business!",
      paperSize: "A4",
      printAutomatically: false,
    },
    notifications: {
      lowStockAlert: true,
      dailySalesReport: true,
      newOrderAlert: true,
      paymentReminder: true,
      emailNotifications: true,
      smsNotifications: false,
    },
    security: {
      sessionTimeout: 480,
      requirePinForVoid: true,
      requirePinForDiscount: false,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
      passwordExpiryDays: 90,
    },
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      retentionPeriod: 30,
      includeImages: true,
      cloudBackup: false,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();

      // Merge with default settings to ensure all properties exist
      const fetchedSettings = response.data.data || {};
      setSettings((prevSettings) => ({
        business: { ...prevSettings.business, ...fetchedSettings.business },
        pos: { ...prevSettings.pos, ...fetchedSettings.pos },
        receipt: { ...prevSettings.receipt, ...fetchedSettings.receipt },
        notifications: {
          ...prevSettings.notifications,
          ...fetchedSettings.notifications,
        },
        security: { ...prevSettings.security, ...fetchedSettings.security },
        backup: { ...prevSettings.backup, ...fetchedSettings.backup },
      }));
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
      // Keep default settings if fetch fails
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

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Address
              </label>
              <textarea
                value={settings.business.address}
                onChange={(e) =>
                  handleChange("business", "address", e.target.value)
                }
                className="input-field"
                rows={3}
                placeholder="Business address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.business.phone}
                  onChange={(e) =>
                    handleChange("business", "phone", e.target.value)
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
                  value={settings.business.email}
                  onChange={(e) =>
                    handleChange("business", "email", e.target.value)
                  }
                  className="input-field"
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tax Number
              </label>
              <input
                type="text"
                value={settings.business.taxNumber}
                onChange={(e) =>
                  handleChange("business", "taxNumber", e.target.value)
                }
                className="input-field"
                placeholder="KRA PIN or VAT Number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Currency
                </label>
                <select
                  value={settings.business.currency}
                  onChange={(e) =>
                    handleChange("business", "currency", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.business.timezone}
                  onChange={(e) =>
                    handleChange("business", "timezone", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* POS Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <CurrencyDollarIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              POS Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.pos.defaultTaxRate}
                onChange={(e) =>
                  handleChange(
                    "pos",
                    "defaultTaxRate",
                    parseFloat(e.target.value)
                  )
                }
                className="input-field"
                step="0.01"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={settings.pos.lowStockThreshold}
                onChange={(e) =>
                  handleChange(
                    "pos",
                    "lowStockThreshold",
                    parseInt(e.target.value)
                  )
                }
                className="input-field"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Payment Method
              </label>
              <select
                value={settings.pos.defaultPaymentMethod}
                onChange={(e) =>
                  handleChange("pos", "defaultPaymentMethod", e.target.value)
                }
                className="input-field"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.pos?.enableTax ?? true}
                  onChange={(e) =>
                    handleChange("pos", "enableTax", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable tax calculations
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.pos.enableDiscount}
                  onChange={(e) =>
                    handleChange("pos", "enableDiscount", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable discounts
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.pos.autoGenerateReceipt}
                  onChange={(e) =>
                    handleChange("pos", "autoGenerateReceipt", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Auto-generate receipts
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.pos.enableQuickSale}
                  onChange={(e) =>
                    handleChange("pos", "enableQuickSale", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable quick sale
                </span>
              </label>
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
                value={settings.receipt.paperSize}
                onChange={(e) =>
                  handleChange("receipt", "paperSize", e.target.value)
                }
                className="input-field"
              >
                <option value="A4">A4</option>
                <option value="thermal">Thermal (80mm)</option>
                <option value="thermal_small">Thermal (58mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Footer Message
              </label>
              <textarea
                value={settings.receipt.footerMessage}
                onChange={(e) =>
                  handleChange("receipt", "footerMessage", e.target.value)
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
                  checked={settings.receipt.showLogo}
                  onChange={(e) =>
                    handleChange("receipt", "showLogo", e.target.checked)
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
                  checked={settings.receipt.showBusinessInfo}
                  onChange={(e) =>
                    handleChange(
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
                  checked={settings.receipt.showTax}
                  onChange={(e) =>
                    handleChange("receipt", "showTax", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Show tax breakdown
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.receipt.printAutomatically}
                  onChange={(e) =>
                    handleChange(
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

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BellIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Notifications
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.lowStockAlert}
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "lowStockAlert",
                    e.target.checked
                  )
                }
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Low stock alerts
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.dailySalesReport}
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "dailySalesReport",
                    e.target.checked
                  )
                }
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Daily sales reports
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.newOrderAlert}
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "newOrderAlert",
                    e.target.checked
                  )
                }
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                New order alerts
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.paymentReminder}
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "paymentReminder",
                    e.target.checked
                  )
                }
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Payment reminders
              </span>
            </label>

            <div className="border-t border-secondary-200 pt-3 mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) =>
                    handleChange(
                      "notifications",
                      "emailNotifications",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Email notifications
                </span>
              </label>

              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) =>
                    handleChange(
                      "notifications",
                      "smsNotifications",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  SMS notifications
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Security
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  handleChange(
                    "security",
                    "sessionTimeout",
                    parseInt(e.target.value)
                  )
                }
                className="input-field"
                min="5"
                max="1440"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) =>
                  handleChange(
                    "security",
                    "maxLoginAttempts",
                    parseInt(e.target.value)
                  )
                }
                className="input-field"
                min="3"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Password Expiry (days)
              </label>
              <input
                type="number"
                value={settings.security.passwordExpiryDays}
                onChange={(e) =>
                  handleChange(
                    "security",
                    "passwordExpiryDays",
                    parseInt(e.target.value)
                  )
                }
                className="input-field"
                min="30"
                max="365"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.security.requirePinForVoid}
                  onChange={(e) =>
                    handleChange(
                      "security",
                      "requirePinForVoid",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Require PIN to void transactions
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.security.requirePinForDiscount}
                  onChange={(e) =>
                    handleChange(
                      "security",
                      "requirePinForDiscount",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Require PIN for discounts
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.security.enableTwoFactor}
                  onChange={(e) =>
                    handleChange(
                      "security",
                      "enableTwoFactor",
                      e.target.checked
                    )
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable two-factor authentication
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <CloudIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Backup & Recovery
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={settings.backup.backupFrequency}
                onChange={(e) =>
                  handleChange("backup", "backupFrequency", e.target.value)
                }
                className="input-field"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Retention Period (days)
              </label>
              <input
                type="number"
                value={settings.backup.retentionPeriod}
                onChange={(e) =>
                  handleChange(
                    "backup",
                    "retentionPeriod",
                    parseInt(e.target.value)
                  )
                }
                className="input-field"
                min="7"
                max="365"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backup.autoBackup}
                  onChange={(e) =>
                    handleChange("backup", "autoBackup", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable automatic backups
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backup.includeImages}
                  onChange={(e) =>
                    handleChange("backup", "includeImages", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Include product images
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backup.cloudBackup}
                  onChange={(e) =>
                    handleChange("backup", "cloudBackup", e.target.checked)
                  }
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Enable cloud backup
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