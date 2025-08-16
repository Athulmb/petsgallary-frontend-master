import React, { useState, useEffect } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Package,
  ImageOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addItem } from "../utils/cartSlice";
import { api } from "../utils/api";

const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [processingItems, setProcessingItems] = useState(new Set());
  const [imageErrors, setImageErrors] = useState(new Set()); // Track failed images

  // Load wishlist data on component mount
  useEffect(() => {
    fetchWishlistItems();
    fetchWishlistCount();
  }, []);

  // Get authentication token
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Please login to access your wishlist');
    }
    return token;
  };

  // Handle image loading errors
  const handleImageError = (itemId) => {
    setImageErrors(prev => new Set([...prev, itemId]));
  };

  // Get image URL with fallback logic
  const getImageUrl = (product, itemId) => {
    // If this image has already failed, return placeholder
    if (imageErrors.has(itemId)) {
      return "/images/placeholder.png";
    }

    // Try different image sources in order of preference
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage && firstImage.image_url) {
        return firstImage.image_url;
      }
    }

    if (product.image_url) {
      return product.image_url;
    }

    if (product.image) {
      return product.image;
    }

    // Default placeholder
    return "/images/placeholder.png";
  };

  // Fetch all wishlist items
  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await api.get('/wishlist/get', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        const items = response.data.items || [];
        console.log("Fetched wishlist items:", items); // Debug log
        setWishlistItems(items);
        setItemCount(response.data.count || items.length || 0);

        // Clear image errors when fetching new data
        setImageErrors(new Set());
      } else {
        throw new Error(response.data.message || 'Failed to fetch wishlist');
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        setError('Please login to access your wishlist');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get wishlist count
  const fetchWishlistCount = async () => {
    try {
      const token = getAuthToken();
      const response = await api.get('/wishlist/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setItemCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  // Remove item from wishlist by ID
  const removeFromWishlist = async (itemId) => {
    try {
      setProcessingItems(prev => new Set([...prev, itemId]));

      const token = getAuthToken();
      const response = await api.delete(`/wishlist/remove/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Remove item from local state
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
        setItemCount(prev => Math.max(0, prev - 1));

        // Remove from image errors tracking
        setImageErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // 🔥 Dispatch event to update navbar counter
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));

        console.log("Item removed successfully");
      } else {
        throw new Error(response.data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error("Error removing item:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to remove item from wishlist";
      alert(errorMessage);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Move item to cart
  const moveToCart = async (wishlistItemId, product) => {
    try {
      setProcessingItems(prev => new Set([...prev, wishlistItemId]));

      const token = getAuthToken();
      const response = await api.post(`/wishlist/move-to-cart/${wishlistItemId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Add to Redux store
        dispatch(
          addItem({
            id: product.id,
            name: product.name,
            price: product.offer_price || product.price,
            image: getImageUrl(product, wishlistItemId),
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            quantity: 1,
          })
        );

        // Remove from wishlist state
        setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
        setItemCount(prev => Math.max(0, prev - 1));

        // 🔥 Dispatch event to update navbar counter
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));

        alert("Product moved to cart successfully!");
      } else {
        throw new Error(response.data.message || 'Failed to move to cart');
      }
    } catch (error) {
      console.error("Error moving to cart:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to move item to cart";
      alert(errorMessage);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(wishlistItemId);
        return newSet;
      });
    }
  };

  // Add to cart (without removing from wishlist)
  const addToCart = async (product, itemId) => {
    try {
      // Add to Redux store
      dispatch(
        addItem({
          id: product.id,
          name: product.name,
          price: product.offer_price || product.price,
          image: getImageUrl(product, itemId),
          description: product.description,
          about_product: product.about_product,
          benefits: product.benefits,
          quantity: 1,
        })
      );

      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await api.delete('/wishlist/clear', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setWishlistItems([]);
        setItemCount(0);
        setImageErrors(new Set());

        // 🔥 Dispatch event to update navbar counter
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));

        alert("Wishlist cleared successfully!");
      } else {
        throw new Error(response.data.message || 'Failed to clear wishlist');
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to clear wishlist";
      alert(errorMessage);
    }
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = (product) => {
    if (product.offer_price && product.price && product.offer_price < product.price) {
      const discount = ((product.price - product.offer_price) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Retry loading wishlist
  const retryLoading = () => {
    setError(null);
    setImageErrors(new Set());
    fetchWishlistItems();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading your wishlist...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Wishlist</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={retryLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            {error.includes('login') && (
              <button
                onClick={() => navigate('/login')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side */}
            <div className="flex items-start sm:items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 fill-red-500" />
                  My Wishlist
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            {/* Right Side */}
            {wishlistItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchWishlistItems}
                  className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={clearWishlist}
                  className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding products you love to your wishlist</p>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product;
              const discountPercentage = calculateDiscountPercentage(product);
              const isProcessing = processingItems.has(item.id);
              const imageUrl = getImageUrl(product, item.id);
              const hasImageError = imageErrors.has(item.id);

              // Debug log for each item
              console.log(`Item ${item.id}:`, {
                product,
                imageUrl,
                hasImageError,
                productImages: product?.images,
                productImageUrl: product?.image_url
              });

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >

                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {hasImageError ? (
                      // Show placeholder when image fails to load
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Image not available</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={product.name || 'Product image'}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                        onError={() => handleImageError(item.id)}
                        onLoad={() => console.log(`Image loaded successfully for item ${item.id}`)}
                      />
                    )}

                    {discountPercentage > 0 && (
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                        {discountPercentage}% OFF
                      </span>
                    )}

                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={isProcessing}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isProcessing
                          ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-100 shadow-sm'
                        }`}
                      title="Remove from wishlist"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                      ) : (
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      )}
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Rating */}
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${index < (product.rating || 4)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                      {product.rating && (
                        <span className="text-sm text-gray-600 ml-1">
                          ({product.rating})
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3
                      className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-600"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name || "Unnamed Product"}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mb-4">
                      {product.offer_price && product.offer_price < product.price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-600">
                            {product.offer_price} AED
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {product.price} AED
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {product.price || "Price not available"} AED
                        </span>
                      )}
                    </div>

                    {/* Button section fixed at bottom */}
                    <div className="mt-auto">
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveToCart(item.id, product)}
                          disabled={isProcessing}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${isProcessing
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                            }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isProcessing ? "Moving..." : "Move to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Export utility functions for use in other components
export const wishlistUtils = {
  checkWishlistStatus: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return false;

      const response = await api.post('/wishlist/check-status',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.is_in_wishlist || false;
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }
  },

  addToWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to add items to wishlist');
      }

      const response = await api.post('/wishlist/add',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // 🔥 Dispatch event to update navbar counter
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      }

      return response.data.success;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      throw error;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to manage your wishlist');
      }

      const response = await api.post('/wishlist/remove-product',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // 🔥 Dispatch event to update navbar counter
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      }

      return response.data.success;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  }
};

export default WishlistPage;