// src/pages/auth/PinLogin.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ShoppingCartIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const PinLogin = () => {
  const { pinLogin, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    pin: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For PIN, only allow digits and limit to 6 characters
    if (name === "pin") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 6) {
        setFormData((prev) => ({
          ...prev,
          [name]: numericValue,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.pin) {
      newErrors.pin = "PIN is required";
    } else if (formData.pin.length < 4) {
      newErrors.pin = "PIN must be at least 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await pinLogin(formData);

    if (!result.success) {
      setErrors({ submit: result.error });
    }
  };

  const handlePinDigitClick = (digit) => {
    if (formData.pin.length < 6) {
      setFormData((prev) => ({
        ...prev,
        pin: prev.pin + digit,
      }));
    }
  };

  const handlePinBackspace = () => {
    setFormData((prev) => ({
      ...prev,
      pin: prev.pin.slice(0, -1),
    }));
  };

  const handlePinClear = () => {
    setFormData((prev) => ({
      ...prev,
      pin: "",
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-3 rounded-xl">
              <ShoppingCartIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Quick PIN Login
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Enter your email and PIN for quick access
          </p>
        </div>

        {/* PIN Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? "border-red-300" : "border-secondary-300"
                  } placeholder-secondary-400 text-secondary-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* PIN Display */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-secondary-700"
              >
                PIN
              </label>
              <div className="mt-1">
                <div className="flex justify-center space-x-3 mb-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-lg font-bold ${
                        formData.pin.length > index
                          ? "border-primary-500 bg-primary-50 text-primary-600"
                          : "border-secondary-300 bg-white text-secondary-400"
                      }`}
                    >
                      {formData.pin.length > index ? "●" : ""}
                    </div>
                  ))}
                </div>
                {errors.pin && (
                  <p className="text-sm text-red-600 text-center mb-4">
                    {errors.pin}
                  </p>
                )}
              </div>
            </div>

            {/* PIN Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigitClick(digit.toString())}
                  className="h-12 bg-secondary-100 hover:bg-secondary-200 text-secondary-900 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinClear}
                className="h-12 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinDigitClick("0")}
                className="h-12 bg-secondary-100 hover:bg-secondary-200 text-secondary-900 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-12 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                ⌫
              </button>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || formData.pin.length < 4}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <LoadingSpinner size="small" text="Signing in..." />
                ) : (
                  "Sign in with PIN"
                )}
              </button>
            </div>

            {/* Back to Regular Login */}
            <div>
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-2 px-4 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Password Login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            PIN login provides quick access for registered users
          </p>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
