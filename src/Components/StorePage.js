import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Sliders, Heart, Star } from "lucide-react";
import FilterSidebar from "./FilterSidebar";
import { api } from '../utils/api';
import qs from "qs";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative mb-4 flex justify-center items-center min-h-[200px]">
        <button className="absolute right-0 top-0 z-10">
          <Heart className="w-6 h-6 text-gray-400" />
        </button>
        <span className="absolute left-0 top-0 bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
          {product.discount || "30%"}
        </span>
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
      <p className="text-xl font-bold mb-4">{product.price} AED</p>

      <button className="w-full bg-orange-400 hover:bg-orange-500 text-white py-3 rounded-full text-sm font-medium transition-colors">
        Add To Cart
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

  // Check for category filter from navigation
  useEffect(() => {
    if (location.state?.filterByPetType) {
      setSelectedPetTypes([location.state.filterByPetType]);
    }
  }, [location.state]);

  // Initial load
  const fetchInitialData = async (page = 1) => {
    try {
      setLoading(true);

      // Fetch price range and initial products
      const priceRes = await api.get('/get-all-active-products');
      const min = priceRes.data.min_price ?? 0;
      const max = priceRes.data.max_price ?? 5000;
      setMinPrice(min);
      setMaxPrice(max);

      // Fetch all active products with pagination
      const productsRes = await api.get('/get-all-active-products', {
        params: { page }
      });

      const paginated = productsRes.data.products || { data: [], current_page: 1, last_page: 1 };

      setProducts(paginated.data || []);
      setFilteredProducts(paginated.data || []);
      setCurrentPage(paginated.current_page || 1);
      const totalItems = paginated.total || 0;
      const perPage = paginated.per_page || 12;
      const computedTotalPages = Math.ceil(totalItems / perPage);
      setTotalPages(computedTotalPages);
    } catch (error) {
      console.error("Initial load error:", error);
      // Set empty state on error
      setProducts([]);
      setFilteredProducts([]);
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
      fetchInitialData();
    }
  }, [location.state?.filterByPetType]);

  const fetchFilteredProducts = async (
    search = "",
    productTypes = [],
    petTypes = [],
    priceRange = null,
    page = 1
  ) => {
    setLoading(true);
    try {
      const params = { page };

      // Only add parameters if they have values
      if (search.trim() !== "") params.search = search;
      if (productTypes.length) params.productTypes = productTypes.join(",");
      if (petTypes.length) params.petTypes = petTypes.join(",");
      if (priceRange) {
        params.minPrice = priceRange.min;
        params.maxPrice = priceRange.max;
      }

      console.log("🔍 Sending filters to backend:", params);

      const response = await api.get('/get-filtered-products', {
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "brackets" }),
      });

      const paginated = response.data.products || { data: [], current_page: 1, last_page: 1 };
      setFilteredProducts(paginated.data || []);
      setCurrentPage(paginated.current_page || 1);
      const totalItems = paginated.total || 0;
      const perPage = paginated.per_page || 12;
      const computedTotalPages = Math.ceil(totalItems / perPage);
      setTotalPages(computedTotalPages);
    } catch (error) {
      console.error("Filter fetch error:", error);
      // Set empty state on error
      setFilteredProducts([]);
      setTotalPages(1);
      setCurrentPage(1);
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

    // Fetch filtered products
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

    setCurrentPage(newPage);

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
                  Showing {filteredProducts.length} products {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
                </p>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                    className={`px-4 py-2 rounded ${currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-400 text-white hover:bg-orange-500'
                      }`}
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const pageNum = currentPage <= 3
                        ? index + 1
                        : currentPage + index - 2;

                      if (pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded ${currentPage === pageNum
                            ? 'bg-orange-400 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded ${currentPage === totalPages
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