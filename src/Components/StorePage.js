import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Sliders, Heart, Star } from "lucide-react";
import { useDispatch } from "react-redux";
import { addItem } from "../utils/cartSlice";
import FilterSidebar from "./FilterSidebar";
import { api } from '../utils/api';
import qs from "qs";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistSuccess, setWishlistSuccess] = useState(false);

   // Calculate discount percentage
   const calculateDiscountPercentage = () => {
    if (product.offer_price && product.price && product.offer_price < product.price) {
      const discount = ((product.price - product.offer_price) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercentage = calculateDiscountPercentage();

  // Check if product is in wishlist when component mounts
  useEffect(() => {
    checkWishlistStatus();
  }, [product.id]);

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Function to check wishlist status
  const checkWishlistStatus = async () => {
    try {
      const token = getAuthToken();
      
      if (!token || !product?.id) {
        return;
      }

      const response = await api.post("/wishlist/check-status", {
        product_id: parseInt(product.id)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setIsInWishlist(response.data.is_in_wishlist);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };
  const dispatchWishlistEvent = (action, isInWishlist) => {
    // Calculate the count change based on action
    const countChange = action === 'added' ? 1 : -1;
    
    window.dispatchEvent(new CustomEvent('wishlistUpdated', {
      detail: {
        action: action, // 'added' or 'removed'
        productId: product.id,
        productName: product.name,
        countChange: countChange, // +1 for add, -1 for remove
        isInWishlist: isInWishlist // current wishlist status
      }
    }));

    // Also dispatch a more specific event for count updates
    window.dispatchEvent(new CustomEvent('wishlistCountChanged', {
      detail: {
        change: countChange,
        productId: product.id,
        action: action
      }
    }));
  };

  // Function to add product to wishlist
  const addToWishlist = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert("Please login to add items to wishlist");
        return false;
      }

      const response = await api.post("/wishlist/add", {
        product_id: parseInt(product.id)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        console.log("Product added to wishlist successfully:", response.data);
        // Dispatch event with 'added' action and updated state
        dispatchWishlistEvent('added', true);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      
      if (error.response) {
        if (error.response.status === 400 && 
            error.response.data.message === "Product is already in your wishlist") {
          // Product is already in wishlist, just update state
          return true;
        } else if (error.response.status === 401) {
          handleAuthError();
        } else {
          alert("Failed to add to wishlist. Please try again.");
        }
      } else {
        alert("Failed to add to wishlist. Please try again.");
      }
      return false;
    }
  };

  // Function to remove product from wishlist
  const removeFromWishlist = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert("Please login to manage wishlist");
        return false;
      }

      // Use the same endpoint as in WishlistPage for consistency
      const response = await api.post("/wishlist/remove-product", {
        product_id: parseInt(product.id)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        console.log("Product removed from wishlist successfully:", response.data);
        // Dispatch event with 'removed' action and updated state
        dispatchWishlistEvent('removed', false);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      
      if (error.response) {
        if (error.response.status === 401) {
          handleAuthError();
        } else {
          alert("Failed to remove from wishlist. Please try again.");
        }
      } else {
        alert("Failed to remove from wishlist. Please try again.");
      }
      return false;
    }
  };


  // Handle authentication errors
  const handleAuthError = () => {
    console.error("Authentication failed - token may be expired");
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsInWishlist(false);
    alert("Session expired. Please login again.");
  };

  // Function to toggle wishlist (add/remove) with 2-second loading and wave effect
  const toggleWishlist = async (e) => {
    // Prevent event bubbling to avoid navigation
    e.stopPropagation();
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert("Please login to manage wishlist");
        return;
      }

      if (!product?.id) {
        console.error("Product ID is missing");
        return;
      }

      setIsWishlistLoading(true);

      let success = false;
      const previousWishlistState = isInWishlist;
      
      if (isInWishlist) {
        // Remove from wishlist
        success = await removeFromWishlist();
        if (success) {
          setIsInWishlist(false);
          console.log(`Wishlist toggle: Removed product ${product.id}, count should decrease by 1`);
        }
      } else {
        // Add to wishlist
        success = await addToWishlist();
        if (success) {
          setIsInWishlist(true);
          console.log(`Wishlist toggle: Added product ${product.id}, count should increase by 1`);
        }
      }

      // If the operation failed, revert the state
      if (!success) {
        setIsInWishlist(previousWishlistState);
        console.log("Wishlist operation failed, reverting state");
      }

    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      // Revert state on error
      setIsInWishlist(isInWishlist);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Function to check if product already exists in cart
  const checkExistingCartItem = async (productId) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        return null;
      }

      const response = await api.get("/cart/get", {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      // Find existing cart item for this product and user
      const existingItem = response.data.items.find(item => 
        String(item.user_id) === String(userId) && 
        String(item.product_id) === String(productId)
      );

      return existingItem || null;
    } catch (error) {
      console.error("Error checking existing cart item:", error);
      return null;
    }
  };

  const addToCart = async (e) => {
    // Prevent event bubbling to avoid navigation
    e.stopPropagation();
    
    // Validation before sending request
    if (!product?.id) {
      console.error("Product ID is missing");
      return;
    }
  
    setIsAddingToCart(true);
  
    try {
      // Start the 2-second timer
      const startTime = Date.now();
      const minimumLoadingTime = 2000; // 2 seconds in milliseconds
  
      // Get token from localStorage
      const token = getAuthToken();
      
      if (!token) {
        console.error("No authentication token found");
        alert("Please login to add items to cart");
        // Still wait for minimum loading time even on error
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        setIsAddingToCart(false);
        return;
      }
  
      // Check if product already exists in cart
      const existingCartItem = await checkExistingCartItem(product.id);
      const quantity = 1; // Default quantity for product card
      
      if (existingCartItem) {
        // Product exists, update quantity instead of adding new item
        const newQuantity = existingCartItem.quantity + quantity;
        
        console.log(`Product already exists in cart. Updating quantity from ${existingCartItem.quantity} to ${newQuantity}`);
        
        const updateResponse = await api.put(`/cart/update/${existingCartItem.id}`, {
          product_id: parseInt(product.id),
          quantity: newQuantity
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
  
        console.log("Cart item updated successfully:", updateResponse.data);
  
        // Update Redux store with new quantity
        dispatch(
          addItem({
            id: product.id,
            name: product.name,
            price: product.offer_price || product.price,
            image: product.images?.[0]?.image_url || product.image_url || null,
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            quantity: quantity, // This will be added to existing quantity in Redux
          })
        );
  
      } else {
        // Product doesn't exist, add new item
        const payload = {
          product_id: parseInt(product.id),
          quantity: parseInt(quantity),
        };
  
        console.log("Adding new product to cart. Payload:", payload);
  
        const response = await api.post("/cart/add", payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
  
        console.log("Product added to cart successfully:", response.data);
  
        // Add to Redux store
        dispatch(
          addItem({
            id: product.id,
            name: product.name,
            price: product.offer_price || product.price,
            image: product.images?.[0]?.image_url || product.image_url || null,
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            quantity: quantity,
          })
        );
      }
  
      // Calculate remaining time to ensure minimum 2-second loading
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
      
      // Wait for remaining time if needed
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
  
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      
    } catch (error) {
      console.error("Failed to sync cart:", error);
      
      // Still ensure minimum loading time even on error
      const elapsedTime = Date.now() - Date.now();
      const remainingTime = Math.max(0, 2000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Log the full error response for debugging
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        console.error("Error headers:", error.response.headers);
        
        // Handle specific error cases
        if (error.response.status === 422) {
          console.error("Validation errors:", error.response.data);
          if (error.response.data.message) {
            alert(`Validation Error: ${error.response.data.message}`);
          }
          if (error.response.data.errors) {
            console.error("Detailed validation errors:", error.response.data.errors);
          }
        } else if (error.response.status === 401) {
          handleAuthError();
        }
      } else {
        console.error("Network or other error:", error.message);
        alert("Failed to add item to cart. Please try again.");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative mb-4 flex justify-center items-center min-h-[200px]">
        <button 
          className={`absolute right-0 top-0 z-10 p-1 rounded-full transition-all duration-200 ${
            isWishlistLoading 
              ? "bg-pink-100 animate-pulse" 
              : wishlistSuccess
              ? "bg-green-100"
              : "hover:bg-gray-100"
          } ${
            isWishlistLoading ? "wishlist-wave" : ""
          }`}
          onClick={toggleWishlist}
          disabled={isWishlistLoading}
          style={{
            animation: isWishlistLoading ? 'wishlistWave 2s ease-in-out infinite' : 'none'
          }}
        >
          <Heart 
            className={`w-6 h-6 transition-all duration-200 ${
              wishlistSuccess
                ? "text-green-500 fill-green-500 scale-110"
                : isInWishlist 
                ? "text-red-500 fill-red-500" 
                : isWishlistLoading 
                ? "text-pink-400 fill-pink-200" 
                : "text-gray-400 hover:text-red-400"
            }`} 
          />
        </button>
        
        {discountPercentage > 0 && (
          <span className="absolute left-0 top-0 bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
            {discountPercentage}% OFF
          </span>
        )}
        <img
          src={product.images?.[0]?.image_url || product.image_url || "/images/placeholder.png"}
          alt={product.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${index < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
          />
        ))}
      </div>

      <p className="text-gray-700 text-md mb-2 min-h-[40px] line-clamp-2">{product.name}</p>
      <div className="mb-3">
        {product.offer_price && product.offer_price < product.price ? (
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">{product.offer_price} AED</span>
            <span className="text-gray-500 line-through text-sm">{product.price} AED</span>
          </div>
        ) : (
          <span className="text-gray-800 font-bold text-lg">{product.price} AED</span>
        )}
      </div>
      
      <button 
        onClick={addToCart}
        disabled={isAddingToCart}
        className={`w-full py-3 rounded-full text-sm font-medium transition-colors ${
          addedToCart 
            ? "bg-green-500 text-white" 
            : isAddingToCart
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-orange-400 hover:bg-orange-500 text-white"
        }`}
      >
        {addedToCart ? "Added to Cart!" : isAddingToCart ? "Adding..." : "Add To Cart"}
      </button>

      {/* Add CSS for wishlist wave animation */}
      <style jsx>{`
        @keyframes wishlistWave {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4);
          }
          25% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(236, 72, 153, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 0 12px rgba(236, 72, 153, 0.2);
          }
          75% {
            transform: scale(1.05);
            box-shadow: 0 0 0 16px rgba(236, 72, 153, 0.1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 20px rgba(236, 72, 153, 0);
          }
        }

        .wishlist-wave {
          position: relative;
          overflow: visible;
        }

        .wishlist-wave::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: wishlistRipple 2s ease-out infinite;
        }

        @keyframes wishlistRipple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const StorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState([]);

  // Price range states
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);

  // Pagination states
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Check for category filter from navigation
  useEffect(() => {
    if (location.state?.filterByPetType) {
      setSelectedPetTypes([location.state.filterByPetType]);
    }
  }, [location.state]);

  // Initial load with normal pagination (first page = oldest products)
  const fetchInitialData = async (page = 1) => {
    try {
      setLoading(true);

      // First, get price range info
      const priceRes = await api.get('/get-all-active-products');
      const min = priceRes.data.min_price ?? 0;
      const max = priceRes.data.max_price ?? 5000;
      setMinPrice(min);
      setMaxPrice(max);

      // Fetch products for the requested page (normal pagination - first page = first added)
      const productsRes = await api.get('/get-all-active-products', {
        params: { page: page }
      });

      const paginated = productsRes.data.products || { data: [], current_page: 1, last_page: 1, total: 0, per_page: 12 };
      const allProducts = [...(paginated.data || [])];

      console.log(`📦 Initial fetch: ${allProducts.length} products from page ${page}`);

      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setCurrentPage(page);
      setTotalPages(paginated.last_page || 1);
      setTotalProducts(paginated.total || 0);
      
    } catch (error) {
      console.error("Initial load error:", error);
      // Set empty state on error
      setProducts([]);
      setFilteredProducts([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with category filter support
  useEffect(() => {
    if (location.state?.filterByPetType) {
      // If we have a category filter, fetch filtered products instead
      fetchFilteredProducts("", [], [location.state.filterByPetType], null, 1);
    } else {
      fetchInitialData(1);
    }
  }, [location.state?.filterByPetType]);

  // Fetch filtered products with normal pagination
  const fetchFilteredProducts = async (
    search = "",
    productTypes = [],
    petTypes = [],
    priceRange = null,
    page = 1
  ) => {
    setLoading(true);
    try {
      const params = { page: page };

      // Only add parameters if they have values
      if (search.trim() !== "") params.search = search;
      if (productTypes.length) params.productTypes = productTypes.join(",");
      if (petTypes.length) params.petTypes = petTypes.join(",");
      if (priceRange) {
        params.minPrice = priceRange.min;
        params.maxPrice = priceRange.max;
      }

      console.log("🔍 Sending filters to backend:", params);

      // Fetch filtered products
      const response = await api.get('/get-filtered-products', {
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "brackets" }),
      });

      const paginated = response.data.products || { data: [], current_page: 1, last_page: 1, total: 0, per_page: 12 };
      const allProducts = [...(paginated.data || [])];

      console.log(`📦 Filtered fetch: ${allProducts.length} products from page ${page}`);

      setFilteredProducts(allProducts);
      setCurrentPage(page);
      setTotalPages(paginated.last_page || 1);
      setTotalProducts(paginated.total || 0);
      
    } catch (error) {
      console.error("Filter fetch error:", error);
      // Set empty state on error
      setFilteredProducts([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter application
  const onApplyFilters = (filters) => {
    console.log("Applying filters:", filters);

    // Update state
    setSelectedRange(filters.priceRange);
    setSelectedProductType(filters.productTypes);
    setSelectedPetTypes(filters.petTypes);
    setCurrentPage(1);

    // Fetch filtered products starting from page 1
    fetchFilteredProducts(
      searchQuery,
      filters.productTypes,
      filters.petTypes,
      filters.priceRange,
      1
    );
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFilteredProducts(
      searchQuery,
      selectedProductType,
      selectedPetTypes,
      selectedRange,
      1
    );
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;

    console.log(`📄 Changing to page ${newPage}`);

    // Check if any filters are active
    const hasActiveFilters =
      searchQuery.trim() !== "" ||
      selectedProductType.length > 0 ||
      selectedPetTypes.length > 0 ||
      selectedRange !== null;

    if (hasActiveFilters) {
      fetchFilteredProducts(
        searchQuery,
        selectedProductType,
        selectedPetTypes,
        selectedRange,
        newPage
      );
    } else {
      fetchInitialData(newPage);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedRange(null);
    setSelectedProductType([]);
    setSelectedPetTypes([]);
    setCurrentPage(1);
    fetchInitialData(1);

    // Clear the navigation state
    navigate(location.pathname, { replace: true });
  };

  // Get page title based on category filter
  const getPageTitle = () => {
    if (location.state?.categoryName) {
      return `${location.state.categoryName} Products`;
    }
    return "Store";
  };

  // Generate pagination buttons with better logic
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    
    if (totalPages <= maxButtons) {
      // Show all pages if total pages is less than or equal to maxButtons
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      // Complex pagination logic
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= maxButtons; i++) {
          buttons.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - maxButtons + 1; i <= totalPages; i++) {
          buttons.push(i);
        }
      } else {
        // Show current page and 2 pages on each side
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          buttons.push(i);
        }
      }
    }
    
    return buttons;
  };

  return (
    <div className="px-4 md:px-10 lg:px-20 py-10 bg-[#F5F6ED] min-h-screen">
      {/* Add global CSS for wishlist animations */}
      <style jsx global>{`
        @keyframes wishlistWave {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4);
          }
          25% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(236, 72, 153, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 0 12px rgba(236, 72, 153, 0.2);
          }
          75% {
            transform: scale(1.05);
            box-shadow: 0 0 0 16px rgba(236, 72, 153, 0.1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 20px rgba(236, 72, 153, 0);
          }
        }

        .wishlist-wave {
          position: relative;
          overflow: visible;
        }

        .wishlist-wave::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: wishlistRipple 2s ease-out infinite;
          pointer-events: none;
        }

        @keyframes wishlistRipple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{getPageTitle()}</h1>

        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-10 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-orange-400" />
            </button>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-orange-400 rounded-full p-2">
              <Search className="w-4 h-4 text-white" />
            </div>
          </form>
        </div>

        <button
          className="lg:hidden flex items-center gap-2 bg-orange-400 text-white px-4 py-2 rounded-full hover:bg-orange-500 transition-colors"
          onClick={() => setIsFilterOpen(true)}
        >
          <Sliders className="w-5 h-5" /> Filters
        </button>
      </div>

     
      {/* Active filters display */}
      {(searchQuery || selectedProductType.length > 0 || selectedPetTypes.length > 0 || selectedRange) && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>

            {searchQuery && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                Search: "{searchQuery}"
              </span>
            )}

            {selectedPetTypes.map(type => (
              <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Pet: {type === 'DOG' ? 'Dogs' : type === 'CAT' ? 'Cats' : type === 'BIRD' ? 'Birds' : type === 'FISH' ? 'Fish' : type}
              </span>
            ))}

            {selectedProductType.map(type => (
              <span key={type} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Product: {type}
              </span>
            ))}

            {selectedRange && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Price: {selectedRange.label}
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          minPrice={minPrice}
          maxPrice={maxPrice}
          selectedRange={selectedRange}
          selectedProductType={selectedProductType}
          selectedPetTypes={selectedPetTypes}
          onApplyFilters={onApplyFilters}
        />

        <main className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No products found.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {filteredProducts.length} of {totalProducts} products 
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded transition-colors ${currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-400 text-white hover:bg-orange-500'
                      }`}
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {generatePaginationButtons().map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded transition-colors ${currentPage === pageNum
                          ? 'bg-orange-400 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded transition-colors ${currentPage === totalPages
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-400 text-white hover:bg-orange-500'
                      }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StorePage;