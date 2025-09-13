// src/pages/Customers/AddCustomer.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersAPI } from "../../services/api";
import {
  sanitizeInput,
  isValidEmail,
  isValidKenyanPhone,
} from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: {
      street: "",
      area: "",
      city: "",
      county: "",
      postalCode: "",
    },
    preferences: {
      paymentMethod: "cash",
      communicationChannel: "phone",
      marketingOptIn: true,
    },
    credit: {
      limit: 0,
      allowCredit: false,
    },
    notes: "",
    isVIP: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split(".");

    if (keys.length === 1) {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : sanitizeInput(value),
      }));
    } else if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? parseFloat(value) || 0
              : sanitizeInput(value),
        },
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidKenyanPhone(formData.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number";
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 0 || age > 120) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    if (formData.credit.limit < 0) {
      newErrors["credit.limit"] = "Credit limit cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      // Clean up data
      const cleanData = {
        ...formData,
        email: formData.email || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: Object.values(formData.address).some((value) => value)
          ? formData.address
          : undefined,
        notes: formData.notes || undefined,
        credit: formData.credit.allowCredit ? formData.credit : undefined,
      };

      // Remove empty address fields
      if (cleanData.address) {
        Object.keys(cleanData.address).forEach((key) => {
          if (!cleanData.address[key]) {
            delete cleanData.address[key];
          }
        });

        if (Object.keys(cleanData.address).length === 0) {
          cleanData.address = undefined;
        }
      }

      const response = await customersAPI.createCustomer(cleanData);
      toast.success("Customer created successfully!");
      navigate(`/customers/${response.data.data._id}`);
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast.error(error.response?.data?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/customers")}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Add Customer
            </h1>
            <p className="text-secondary-600">Create a new customer profile</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="flex items-center mb-4">
            <UserIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? "border-red-300" : ""}`}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${
                  errors.phone ? "border-red-300" : ""
                }`}
                placeholder="+254 712 345 678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${
                  errors.email ? "border-red-300" : ""
                }`}
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`input-field ${
                  errors.dateOfBirth ? "border-red-300" : ""
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isVIP"
                  checked={formData.isVIP}
                  onChange={handleChange}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Mark as VIP Customer
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card">
          <div className="flex items-center mb-4">
            <MapPinIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Address Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="input-field"
                placeholder="House number and street name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Area/Estate
              </label>
              <input
                type="text"
                name="address.area"
                value={formData.address.area}
                onChange={handleChange}
                className="input-field"
                placeholder="Area or estate name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                City/Town
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="input-field"
                placeholder="City or town"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                County
              </label>
              <select
                name="address.county"
                value={formData.address.county}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select County</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kiambu">Kiambu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Machakos">Machakos</option>
                <option value="Kajiado">Kajiado</option>
                <option value="Uasin Gishu">Uasin Gishu</option>
                <option value="Meru">Meru</option>
                <option value="Nyeri">Nyeri</option>
                <option value="Murang'a">Murang'a</option>
                {/* Add more counties as needed */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                className="input-field"
                placeholder="00100"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Customer Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Preferred Payment Method
              </label>
              <select
                name="preferences.paymentMethod"
                value={formData.preferences.paymentMethod}
                onChange={handleChange}
                className="input-field"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Communication Channel
              </label>
              <select
                name="preferences.communicationChannel"
                value={formData.preferences.communicationChannel}
                onChange={handleChange}
                className="input-field"
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="preferences.marketingOptIn"
                  checked={formData.preferences.marketingOptIn}
                  onChange={handleChange}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  Allow marketing communications (promotions, offers, etc.)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Credit Account */}
        <div className="card">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">
              Credit Account
            </h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="credit.allowCredit"
                checked={formData.credit.allowCredit}
                onChange={handleChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700">
                Allow credit purchases for this customer
              </span>
            </label>

            {formData.credit.allowCredit && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Credit Limit (KSh)
                </label>
                <input
                  type="number"
                  name="credit.limit"
                  value={formData.credit.limit}
                  onChange={handleChange}
                  className={`input-field ${
                    errors["credit.limit"] ? "border-red-300" : ""
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors["credit.limit"] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors["credit.limit"]}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Additional Notes
          </h3>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Customer Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Any special notes about this customer (preferences, allergies, special instructions, etc.)"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="small" text="Creating..." />
            ) : (
              "Create Customer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;
