import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCartFromAPI } from '../utils/cartSlice'; // Update this path
import { api } from '../utils/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const cartItems = useSelector(store => store.cart.items);
  const cartLoading = useSelector(store => store.cart.loading);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  // Fetch wishlist count
  const fetchWishlistCount = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setWishlistCount(0);
        return;
      }

      setWishlistLoading(true);
      const response = await api.get('/wishlist/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setWishlistCount(response.data.count || 0);
      } else {
        setWishlistCount(0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
      setWishlistCount(0);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      const authStatus = localStorage.getItem("isAuthenticated");
      const newAuthStatus = token && authStatus === "true";
      setIsAuthenticated(newAuthStatus);
      
      // Fetch cart data when user is authenticated
      if (newAuthStatus) {
        dispatch(fetchCartFromAPI());
        fetchWishlistCount(); // Fetch wishlist count
      } else {
        setWishlistCount(0); // Reset wishlist count when not authenticated
      }
    };

    // Initial check on component mount
    checkAuthStatus();

    const handleUserLogin = () => {
      checkAuthStatus();
    };
    
    const handleUserLogout = () => {
      setIsAuthenticated(false);
      setWishlistCount(0); // Reset wishlist count on logout
      // Cart will be cleared automatically by the API call in cartSlice
    };

    // Custom event listener for wishlist updates
    const handleWishlistUpdate = () => {
      if (isAuthenticated) {
        fetchWishlistCount();
      }
    };

    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('userLogout', handleUserLogout);
    window.addEventListener('storage', checkAuthStatus);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [dispatch, isAuthenticated]);

  // Refresh wishlist count when user comes back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchWishlistCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const getUserIconLink = () => {
    return isAuthenticated ? "/profile" : "/user";
  };

  const handleCartClick = () => {
    if (isAuthenticated) {
      navigate("/cart");
    } else {
      navigate("/user");
    }
  };
  
  const handleHeartClick = () => {
    if (isAuthenticated) {
      navigate("/wishlist");
    } else {
      navigate("/user");
    }
  };

  // Calculate total cart items
  const totalCartItems = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  return (
    <header className="bg-white shadow-md w-full">
      <div className="h-24 px-4 lg:px-20 mx-auto max-w-7xl flex items-center">
        {/* Mobile Layout */}
        <div className="w-full flex justify-between items-center lg:hidden">
          <button 
            className="flex items-center p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={28} className="text-black" />
            ) : (
              <Menu size={28} className="text-black" />
            )}
          </button>

          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/logopng1.png" alt="Logo" className="h-20 w-auto" />
          </Link>

          <div className="flex items-center gap-5">
            <button onClick={handleHeartClick} className="relative flex hover:text-gray-600 transition-colors">
              <Heart size={26} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
              {wishlistLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></span>
              )}
            </button>

            <button onClick={handleCartClick} className="relative text-black hover:text-gray-600 transition-colors">
              <ShoppingCart size={26} />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
              {cartLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </button>

            <Link to={getUserIconLink()} className="flex hover:text-gray-600 transition-colors">
              <User size={26} />
            </Link>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logopng1.png" alt="Logo" className="h-30 w-30" />
          </Link>

          <nav className="flex items-center gap-8 ml-8">
            <Link to="/" className="text-black font-medium hover:text-gray-600 transition-colors">Home</Link>
            <Link to="/store" className="text-black font-medium hover:text-gray-600 transition-colors">Store</Link>
            <Link to="/grooming" className="text-black font-medium hover:text-gray-600 transition-colors">Grooming</Link>
            <Link to="/contact" className="text-black font-medium hover:text-gray-600 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-6">
            <button onClick={handleHeartClick} className="relative flex hover:text-gray-600 transition-colors">
              <Heart size={26} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
              {wishlistLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></span>
              )}
            </button>

            <button onClick={handleCartClick} className="relative text-black hover:text-gray-600 transition-colors">
              <ShoppingCart size={26} />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
              {cartLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </button>

            <Link to={getUserIconLink()} className="flex hover:text-gray-600 transition-colors">
              <User size={26} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div 
        className={`lg:hidden fixed top-24 left-0 w-64 h-[calc(100vh-6rem)] bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col py-4">
          {["/", "/store", "/grooming", "/contact"].map((path, idx) => (
            <Link 
              key={path}
              to={path}
              className="px-6 py-4 text-lg font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {["Home", "Store", "Grooming", "Contact"][idx]}
            </Link>
          ))}

          <div className="border-t border-gray-200 mt-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className="px-6 py-4 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  Profile
                </Link>
                <Link 
                  to="/wishlist" 
                  className="px-6 py-4 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart size={20} />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <Link 
                to="/user" 
                className="px-6 py-4 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={20} />
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Navbar;