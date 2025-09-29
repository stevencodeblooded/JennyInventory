// src/pages/Profile/Profile.js
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate, getInitials, isValidEmail } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  UserIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, updateProfile, changePassword, setPin } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // PIN form state
  const [pinData, setPinData] = useState({
    currentPassword: "",
    pin: "",
    confirmPin: "",
  });
  const [pinErrors, setPinErrors] = useState({});

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateProfile = () => {
    const errors = {};

    if (!profileData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!profileData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(profileData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const result = await updateProfile(profileData);

      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password changed successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const validatePin = () => {
    const errors = {};

    if (!pinData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!pinData.pin) {
      errors.pin = "PIN is required";
    } else if (pinData.pin.length < 4 || pinData.pin.length > 6) {
      errors.pin = "PIN must be 4-6 digits";
    } else if (!/^\d+$/.test(pinData.pin)) {
      errors.pin = "PIN must contain only numbers";
    }

    if (!pinData.confirmPin) {
      errors.confirmPin = "Please confirm your PIN";
    } else if (pinData.pin !== pinData.confirmPin) {
      errors.confirmPin = "PINs do not match";
    }

    setPinErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (!validatePin()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const result = await setPin({
        currentPassword: pinData.currentPassword,
        pin: pinData.pin,
      });

      if (result.success) {
        setPinData({ currentPassword: "", pin: "", confirmPin: "" });
        toast.success("PIN set successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to set PIN");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile Information", icon: UserIcon },
    { id: "password", label: "Change Password", icon: KeyIcon },
    { id: "pin", label: "PIN Setup", icon: DevicePhoneMobileIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          Profile Settings
        </h1>
        <p className="text-secondary-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              {user?.avatar ? (
                <img
                  className="h-24 w-24 rounded-full object-cover mx-auto"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                  <span className="text-primary-600 font-bold text-2xl">
                    {getInitials(user?.name || "")}
                  </span>
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-secondary-200 hover:bg-secondary-50">
                <CameraIcon className="h-4 w-4 text-secondary-600" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-secondary-900">
              {user?.name}
            </h3>
            <p className="text-secondary-600">{user?.email}</p>
            <p className="text-sm text-secondary-500 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </p>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <p className="text-sm text-secondary-600">
                Member since {formatDate(user?.createdAt)}
              </p>
              {user?.lastLogin && (
                <p className="text-sm text-secondary-600">
                  Last login: {formatDate(user.lastLogin)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="card p-0">
            <div className="border-b border-secondary-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Profile Information Tab */}
              {activeTab === "profile" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-4">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            handleProfileChange("name", e.target.value)
                          }
                          className={`input-field ${
                            profileErrors.name ? "border-red-300" : ""
                          }`}
                          placeholder="Enter your full name"
                        />
                        {profileErrors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {profileErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            handleProfileChange("email", e.target.value)
                          }
                          className={`input-field ${
                            profileErrors.email ? "border-red-300" : ""
                          }`}
                          placeholder="Enter your email"
                        />
                        {profileErrors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {profileErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            handleProfileChange("phone", e.target.value)
                          }
                          className="input-field"
                          placeholder="+254 712 345 678"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? (
                        <LoadingSpinner size="small" text="Updating..." />
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Change Password Tab */}
              {activeTab === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-4">
                      Change Password
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Current Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }))
                            }
                            className={`input-field pr-10 ${
                              passwordErrors.currentPassword
                                ? "border-red-300"
                                : ""
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                current: !prev.current,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.current ? (
                              <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-secondary-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            className={`input-field pr-10 ${
                              passwordErrors.newPassword ? "border-red-300" : ""
                            }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                new: !prev.new,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-secondary-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordErrors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className={`input-field pr-10 ${
                              passwordErrors.confirmPassword
                                ? "border-red-300"
                                : ""
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-secondary-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? (
                        <LoadingSpinner size="small" text="Changing..." />
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* PIN Setup Tab */}
              {/* {activeTab === "pin" && (
                <form onSubmit={handlePinSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-4">
                      PIN Setup
                    </h3>
                    <p className="text-sm text-secondary-600 mb-6">
                      Set up a PIN for quick login. Your PIN should be 4-6
                      digits long.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Current Password *
                        </label>
                        <input
                          type="password"
                          value={pinData.currentPassword}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className={`input-field ${
                            pinErrors.currentPassword ? "border-red-300" : ""
                          }`}
                          placeholder="Enter your current password"
                        />
                        {pinErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {pinErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          New PIN *
                        </label>
                        <input
                          type="password"
                          value={pinData.pin}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              pin: e.target.value,
                            }))
                          }
                          className={`input-field ${
                            pinErrors.pin ? "border-red-300" : ""
                          }`}
                          placeholder="Enter 4-6 digit PIN"
                          maxLength={6}
                        />
                        {pinErrors.pin && (
                          <p className="mt-1 text-sm text-red-600">
                            {pinErrors.pin}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Confirm PIN *
                        </label>
                        <input
                          type="password"
                          value={pinData.confirmPin}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              confirmPin: e.target.value,
                            }))
                          }
                          className={`input-field ${
                            pinErrors.confirmPin ? "border-red-300" : ""
                          }`}
                          placeholder="Confirm your PIN"
                          maxLength={6}
                        />
                        {pinErrors.confirmPin && (
                          <p className="mt-1 text-sm text-red-600">
                            {pinErrors.confirmPin}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          Quick PIN Login
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Once set, you can use your PIN for quick login instead
                          of typing your full password. This is especially
                          useful for frequent access to the POS system.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? (
                        <LoadingSpinner size="small" text="Setting..." />
                      ) : user?.hasPin ? (
                        "Update PIN"
                      ) : (
                        "Set PIN"
                      )}
                    </button>
                  </div>
                </form>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;