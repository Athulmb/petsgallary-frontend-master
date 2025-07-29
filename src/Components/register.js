"use client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (e) => {
    setFormData({ ...formData, countryCode: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("https://backend.petsgallerydubai.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Optional: add Accept header
          "Accept": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.name, // <- changed
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          password_confirmation: formData.password, // Laravel uses this for confirmation
        }),
        
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        console.log("Registration failed:", data.errors || data.message);
      } else {
        console.log("User registered successfully:", data);
        // Optionally store token and redirect
        // localStorage.setItem('token', data.token);
        navigate("/user");
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-0">
      <div className="flex w-full h-auto min-h-screen md:h-screen flex-col md:flex-row overflow-auto bg-white p-4">
        <div className="hidden md:block md:w-3/5">
          <img src="/login.png" alt="Girl with puppies" className="h-full w-full object-cover" />
        </div>

        <div className="w-full md:w-2/5 p-4 md:p-14 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <img src="/logo png 1.png" alt="Logo" className="h-20 w-20" />
          </div>

          <h2 className="text-center text-xl font-bold text-gray-900">Create an Account</h2>
          <p className="mt-1 text-center text-xs text-gray-500">Please fill in the details to create your account</p>

          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700">Full Name</label>
              <input id="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter your full name"
                className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700">Email Address</label>
              <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email"
                className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">Phone Number</label>
              <div className="flex mt-1">

                <input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone number"
                  className="flex-1 rounded-r-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange}
                  placeholder="Enter your password"
                  className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700">Confirm Password</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full rounded-full bg-orange-500 py-1.5 text-white font-medium hover:bg-orange-600">
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
  );
}
