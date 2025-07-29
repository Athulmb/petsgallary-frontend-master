"use client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = "error") => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      showToast("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://backend.petsgallerydubai.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (!response.ok) {
        if (data.message?.toLowerCase().includes("not found") || 
            data.message?.toLowerCase().includes("invalid")) {
          showToast("Invalid email or password.");
        } else {
          showToast(data.message || data.error || "Login failed.");
        }
        return;
      }

      if (!data.token) {
        showToast("Login failed. No token received.");
        return;
      }

      showToast("Login successful!", "success");

      // Clear previous data
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userData");
      localStorage.removeItem("isAuthenticated");

      // Store new data
      const userId = data.user?.id || data.userId;
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", data.user?.email || data.userEmail || email);
      localStorage.setItem("isAuthenticated", "true");

      const userData = {
        id: userId,
        name: data.user?.name || data.userName,
        email: data.user?.email || data.userEmail || email,
        token: data.token,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem("userData", JSON.stringify(userData));

      window.dispatchEvent(new CustomEvent('userLogin', {
        detail: userData
      }));

      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      showToast("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-0">
      <ToastContainer />
      <div className="flex w-full h-auto min-h-screen md:h-screen flex-col md:flex-row overflow-hidden bg-white p-4">
        {/* Left Image Section */}
        <div className="hidden md:block md:w-3/5">
          <img
            src="/login.png"
            alt="Girl with puppies"
            className="h-full w-full object-cover rounded-lg"
          />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-2/5 p-4 md:p-14 flex flex-col justify-center">
          <div className="flex justify-center">
            <div className="h-30 w-30 flex items-center justify-center">
              <img src="/logo png 1.png" alt="Login Icon" className="h-25 w-25" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Please enter your credentials to access your account
          </p>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin(e)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.477 10.477A3 3 0 0112 9c.795 0 1.53.312 2.07.816M6.343 6.343C4.958 7.83 4 9.79 4 12c0 4.418 3.582 8 8 8 2.21 0 4.17-.958 5.657-2.343M18.364 18.364A7.952 7.952 0 0020 12c0-2.21-.958-4.17-2.343-5.657" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!email || !password || loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/user/register" className="text-orange-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
