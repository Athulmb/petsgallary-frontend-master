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

   // Calculate discount percentage
   const calculateDiscountPercentage = () => {
    if (product.offer_price && product.price && product.offer_price < product.price) {
      const discount = ((product.price - product.offer_price) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercentage = calculateDiscountPercentage();

  // Function to check if product already exists in cart
  const checkExistingCartItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
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
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No authentication token found");
        alert("Please login to add items to cart");
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
            image: product.images?.[0]?.image_url || null,
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
            image: product.images?.[0]?.image_url || null,
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            quantity: quantity,
          })
        );
      }

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      
    } catch (error) {
      console.error("Failed to sync cart:", error);
      
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
          console.error("Authentication failed - token may be expired");
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          alert("Session expired. Please login again.");
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
          className="absolute right-0 top-0 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking heart
        >
          <Heart className="w-6 h-6 text-gray-400" />
        </button>
        
        {discountPercentage > 0 && (
          <span className="absolute left-0 top-0 bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
            {discountPercentage}% OFF
          </span>
        )}
        <img
          src={product.images?.[0]?.image_url || "/images/placeholder.png"}
          alt={product.name}
          className="w-full h-48 object-cover"
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

  // Helper function to calculate backend page from frontend page
  const getFrontendToBackendPage = (frontendPage, totalBackendPages) => {
    return totalBackendPages - frontendPage + 1;
  };

  // Helper function to calculate frontend total pages from backend data
  const calculateFrontendTotalPages = (totalItems, perPage) => {
    return Math.ceil(totalItems / perPage);
  };

  // Function to sort products by creation date (newest first) - additional sorting for consistency
  const sortProductsByDate = (products) => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Check for category filter from navigation
  useEffect(() => {
    if (location.state?.filterByPetType) {
      setSelectedPetTypes([location.state.filterByPetType]);
    }
  }, [location.state]);

  // Initial load with reverse pagination and product filling
  const fetchInitialData = async (frontendPage = 1) => {
    try {
      setLoading(true);

      // First, get price range and total pages info
      const priceRes = await api.get('/get-all-active-products');
      const min = priceRes.data.min_price ?? 0;
      const max = priceRes.data.max_price ?? 5000;
      setMinPrice(min);
      setMaxPrice(max);

      // Get first page to determine total pages and items
      const initialRes = await api.get('/get-all-active-products', {
        params: { page: 1 }
      });
      
      const initialPaginated = initialRes.data.products || { data: [], current_page: 1, last_page: 1, total: 0, per_page: 12 };
      const totalBackendPages = initialPaginated.last_page || 1;
      const totalItems = initialPaginated.total || 0;
      const perPage = initialPaginated.per_page || 12;
      
      // Calculate frontend total pages
      const frontendTotalPages = calculateFrontendTotalPages(totalItems, perPage);
      setTotalPages(frontendTotalPages);
      setTotalProducts(totalItems);

      // Calculate which backend page to fetch for the requested frontend page
      const backendPage = getFrontendToBackendPage(frontendPage, totalBackendPages);

      console.log(`🔄 Frontend page ${frontendPage} -> Backend page ${backendPage} (Total backend pages: ${totalBackendPages})`);

      // Fetch products from the calculated backend page
      const productsRes = await api.get('/get-all-active-products', {
        params: { page: Math.max(1, Math.min(backendPage, totalBackendPages)) }
      });

      const paginated = productsRes.data.products || { data: [], current_page: 1, last_page: 1 };
      let allProducts = [...(paginated.data || [])];

      console.log(`📦 Initial fetch: ${allProducts.length} products from backend page ${backendPage}`);

      // If we have less than 12 products and there are more pages to fetch
      if (allProducts.length < perPage && backendPage > 1) {
        const productsNeeded = perPage - allProducts.length;
        console.log(`📦 Need ${productsNeeded} more products, fetching from next backend page...`);

        try {
          // Fetch from the next backend page (which is backendPage - 1 in reverse order)
          const nextBackendPage = backendPage - 1;
          const additionalRes = await api.get('/get-all-active-products', {
            params: { page: nextBackendPage }
          });

          const additionalPaginated = additionalRes.data.products || { data: [] };
          const additionalProducts = additionalPaginated.data || [];
          
          console.log(`📦 Additional fetch: ${additionalProducts.length} products from backend page ${nextBackendPage}`);
          
          // Take only the number of products we need
          const productsToAdd = additionalProducts.slice(0, productsNeeded);
          allProducts = [...allProducts, ...productsToAdd];
          
          console.log(`📦 Total products after filling: ${allProducts.length}`);
        } catch (additionalError) {
          console.error("Error fetching additional products:", additionalError);
        }
      }

      // Sort products by creation date (newest first) for additional consistency
      const sortedProducts = sortProductsByDate(allProducts);

      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
      setCurrentPage(frontendPage);
      
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

  // Fetch filtered products with reverse pagination and product filling
  const fetchFilteredProducts = async (
    search = "",
    productTypes = [],
    petTypes = [],
    priceRange = null,
    frontendPage = 1
  ) => {
    setLoading(true);
    try {
      const params = { page: 1 }; // Start with page 1 to get total pages

      // Only add parameters if they have values
      if (search.trim() !== "") params.search = search;
      if (productTypes.length) params.productTypes = productTypes.join(",");
      if (petTypes.length) params.petTypes = petTypes.join(",");
      if (priceRange) {
        params.minPrice = priceRange.min;
        params.maxPrice = priceRange.max;
      }

      console.log("🔍 Sending filters to backend:", params);

      // First get total pages for filtered results
      const initialResponse = await api.get('/get-filtered-products', {
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "brackets" }),
      });

      const initialPaginated = initialResponse.data.products || { data: [], current_page: 1, last_page: 1, total: 0, per_page: 12 };
      const totalBackendPages = initialPaginated.last_page || 1;
      const totalItems = initialPaginated.total || 0;
      const perPage = initialPaginated.per_page || 12;

      // Calculate frontend total pages
      const frontendTotalPages = calculateFrontendTotalPages(totalItems, perPage);
      setTotalPages(frontendTotalPages);
      setTotalProducts(totalItems);

      // Calculate which backend page to fetch for the requested frontend page
      const backendPage = getFrontendToBackendPage(frontendPage, totalBackendPages);

      console.log(`🔄 Filtered - Frontend page ${frontendPage} -> Backend page ${backendPage} (Total backend pages: ${totalBackendPages})`);

      // Now fetch the actual page we want (reversed)
      const finalParams = { ...params, page: Math.max(1, Math.min(backendPage, totalBackendPages)) };
      const response = await api.get('/get-filtered-products', {
        params: finalParams,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "brackets" }),
      });

      const paginated = response.data.products || { data: [], current_page: 1, last_page: 1 };
      let allProducts = [...(paginated.data || [])];

      console.log(`📦 Filtered initial fetch: ${allProducts.length} products from backend page ${backendPage}`);

      // If we have less than 12 products and there are more pages to fetch
      if (allProducts.length < perPage && backendPage > 1) {
        const productsNeeded = perPage - allProducts.length;
        console.log(`📦 Filtered: Need ${productsNeeded} more products, fetching from next backend page...`);

        try {
          // Fetch from the next backend page (which is backendPage - 1 in reverse order)
          const nextBackendPage = backendPage - 1;
          const additionalParams = { ...params, page: nextBackendPage };
          
          const additionalResponse = await api.get('/get-filtered-products', {
            params: additionalParams,
            paramsSerializer: params => qs.stringify(params, { arrayFormat: "brackets" }),
          });

          const additionalPaginated = additionalResponse.data.products || { data: [] };
          const additionalProducts = additionalPaginated.data || [];
          
          console.log(`📦 Filtered additional fetch: ${additionalProducts.length} products from backend page ${nextBackendPage}`);
          
          // Take only the number of products we need
          const productsToAdd = additionalProducts.slice(0, productsNeeded);
          allProducts = [...allProducts, ...productsToAdd];
          
          console.log(`📦 Filtered total products after filling: ${allProducts.length}`);
        } catch (additionalError) {
          console.error("Error fetching additional filtered products:", additionalError);
        }
      }
      
      // Sort filtered products by creation date (newest first)
      const sortedProducts = sortProductsByDate(allProducts);
      
      setFilteredProducts(sortedProducts);
      setCurrentPage(frontendPage);
      
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

    // Fetch filtered products starting from frontend page 1
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
  const handlePageChange = (newFrontendPage) => {
    if (newFrontendPage < 1 || newFrontendPage > totalPages) return;

    console.log(`📄 Changing to frontend page ${newFrontendPage}`);

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
        newFrontendPage
      );
    } else {
      fetchInitialData(newFrontendPage);
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

      {/* Category filter indicator */}
      {location.state?.categoryName && (
        <div className="mb-4 p-3 bg-orange-100 rounded-lg">
          <p className="text-orange-800 text-sm">
            Showing products for: <span className="font-semibold">{location.state.categoryName}</span>
          </p>
        </div>
      )}

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
                  <span className="text-sm text-orange-600 ml-2">(Newest products first)</span>
                </p>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4   gap-6">
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