"use client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";


// Toast Component
const Toast = ({ message, type, onClose }) => {
  const baseClasses =
    "fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 min-w-80 max-w-96";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} animate-slide-in`}>
      <div className="flex-1 flex items-center gap-2">
  {type === "success" && <CheckCircle className="w-5 h-5" />}
  {type === "error" && <XCircle className="w-5 h-5" />}
  {type === "warning" && <AlertTriangle className="w-5 h-5" />}
  <span className="text-sm font-medium">{message}</span>
</div>

      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Toast helper functions
  const showToast = (message, type = "error", duration = 5000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Client-side validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast("Please enter your full name");
      return false;
    }

    if (!formData.email.trim()) {
      showToast("Please enter your email address");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Please enter a valid email address");
      return false;
    }

    if (!formData.phone.trim()) {
      showToast("Please enter your phone number");
      return false;
    }

    // ✅ Phone number regex (10–15 digits, allows +)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      showToast("Please enter a valid phone number (10–15 digits, numbers only)");
      return false;
    }

    if (!formData.password) {
      showToast("Please enter a password");
      return false;
    }

    if (formData.password.length < 6) {
      showToast("Password must be at least 6 characters long");
      return false;
    }

    if (!formData.confirmPassword) {
      showToast("Please confirm your password");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    // Show loading toast
    showToast("Creating your account...", "warning", 10000);

    try {
      const response = await fetch(
        "https://backend.petsgallerydubai.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            first_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            password_confirmation: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Laravel validation errors
          if (data.errors.email) {
            showToast("Email already exists. Please use another email.");
          } else if (data.errors.phone) {
            showToast("Phone number already exists. Please use another phone.");
          } else {
            const errorMessages = Object.values(data.errors).flat();
            showToast(errorMessages[0] || "Validation failed");
          }
        } else if (data.message) {
          // ✅ Catch SQL duplicate entry error from backend
          if (
            data.message.includes("Duplicate entry") &&
            data.message.includes("users_phone_unique")
          ) {
            showToast("Phone number already exists. Please use another one.");
          } else if (
            data.message.includes("Duplicate entry") &&
            data.message.includes("users_email_unique")
          ) {
            showToast("Email already exists. Please use another one.");
          } else {
            showToast(data.message);
          }
        } else if (response.status === 422) {
          showToast("Please check your input and try again");
        } else if (response.status === 500) {
          showToast("Server error. Please try again later");
        } else {
          showToast(`Registration failed (${response.status})`);
        }

        console.log("Registration failed:", data.errors || data.message);
      } else {
        // Success
        showToast(
          "Account created successfully! Redirecting...",
          "success",
          3000
        );
        console.log("User registered successfully:", data);

        // Redirect after success toast
        setTimeout(() => {
          navigate("/user");
        }, 2000);
      }
    } catch (error) {
      console.error("Error during registration:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        showToast("Network error. Please check your connection and try again");
      } else {
        showToast("An unexpected error occurred. Please try again");
      }
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-0">
        <div className="flex w-full h-auto min-h-screen md:h-screen flex-col md:flex-row overflow-auto bg-white p-4">
          <div className="hidden md:block md:w-3/5">
            <img
              src="/login.png"
              alt="Girl with puppies"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="w-full md:w-2/5 p-4 md:p-14 flex flex-col justify-center">
            <div className="flex justify-center mb-4">
              <img src="/logopng2.png" alt="Logo" className="h-20 w-20" />
            </div>

            <h2 className="text-center text-xl font-bold text-gray-900">
              Create an Account
            </h2>
            <p className="mt-1 text-center text-xs text-gray-500">
              Please fill in the details to create your account
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Phone Number
                </label>
                <div className="flex mt-1">
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-orange-500 py-1.5 text-white font-medium hover:bg-orange-600"
              >
                Register
              </button>
            </form>

            <p className="mt-2 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/user" className="text-orange-500 hover:underline">
                Login Here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
