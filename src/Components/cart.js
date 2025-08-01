"use client";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux"; // Add Redux dispatch
import { removeItem, updateQuantity } from "../utils/cartSlice"; // Import Redux actions
import { X } from "lucide-react";
import { api } from "../utils/api";

export default function ShoppingCart() {
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState(null);

  const dispatch = useDispatch(); // Initialize Redux dispatch
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Centralized auth error handler
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      console.error("Authentication failed. Please login again.");
      // Clear invalid tokens
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      // Optionally redirect to login
      // window.location.href = '/login';
      setError("Authentication failed. Please login again.");
    }
  }, []);

  const fetchCartItems = useCallback(async () => {
    if (!token || !userId) {
      console.error("No authentication token or user ID found");
      setLoading(false);
      setError("Authentication required");
      return;
    }

    try {
      setError(null);
      const { data } = await api.get("/cart/get", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Raw cart data:", data); // Debug log

      // Filter cart items for current user - ensure both are strings or numbers
      const userCartItems = data.items.filter(item => 
        String(item.user_id) === String(userId)
      );

      console.log("Filtered user cart items:", userCartItems); // Debug log

      // Fetch product details for each cart item
      const itemsWithProductDetails = await Promise.all(
        userCartItems.map(async (item) => {
          try {
            const res = await api.get(`/get-product-details/${item.product_id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            console.log(`Product details for ID ${item.product_id}:`, res.data); // Debug log
            
            // Extract the first image URL from the product images array
            const productImage = res.data.product.images && res.data.product.images.length > 0 
              ? res.data.product.images[0].image_url 
              : null;
            
            return {
              ...item,
              ...res.data.product,
              // Ensure we maintain the cart item ID and product ID separately
              cart_item_id: item.id,
              product_id: item.product_id,
              // Fix the image field specifically
              image: productImage
            };
          } catch (productError) {
            console.error(`Error fetching product details for product_id ${item.product_id}:`, productError);
            // Return cart item with placeholder product data if product fetch fails
            return {
              ...item,
              cart_item_id: item.id,
              name: `Product ${item.product_id} (Error loading details)`,
              price: 0,
              image: "/placeholder.svg"
            };
          }
        })
      );

      setCartItems(itemsWithProductDetails);

      // Initialize quantities using cart_item_id as key for consistency
      const qtys = {};
      itemsWithProductDetails.forEach(item => {
        qtys[item.cart_item_id] = item.quantity || 1;
      });
      setQuantities(qtys);

      console.log("Final cart items:", itemsWithProductDetails); // Debug log
      console.log("Initial quantities:", qtys); // Debug log

    } catch (err) {
      console.error("Error fetching cart items:", err);
      handleAuthError(err);
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  }, [userId, token, handleAuthError]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const updateQuantityHandler = async (cartItemId, delta) => {
    if (!token) {
      console.error("No authentication token found");
      setError("Authentication required");
      return;
    }

    const currentQty = quantities[cartItemId] || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    // Don't proceed if quantity wouldn't change
    if (newQty === currentQty) return;

    // Find the cart item to get product_id
    const cartItem = cartItems.find(item => item.cart_item_id === cartItemId);
    if (!cartItem) {
      console.error("Cart item not found:", cartItemId);
      setError("Cart item not found");
      return;
    }

    console.log(`Updating quantity for cart item ${cartItemId}, product ${cartItem.product_id}: ${currentQty} -> ${newQty}`); // Debug log
    
    // Optimistic update for local state
    setQuantities((prev) => ({ ...prev, [cartItemId]: newQty }));
    setUpdating((prev) => ({ ...prev, [cartItemId]: true }));
    setError(null);

    try {
      const response = await api.put(`/cart/update/${cartItemId}`, {
        product_id: cartItem.product_id,
        quantity: newQty
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Update response:", response.data); // Debug log

      // Update Redux store after successful API call
      dispatch(updateQuantity({
        id: cartItem.product_id, // Use product_id for consistency with Redux store
        quantity: newQty
      }));

    } catch (err) {
      console.error("Error updating cart item:", err);
      handleAuthError(err);
      
      // Revert optimistic update on error
      setQuantities((prev) => ({ ...prev, [cartItemId]: currentQty }));
      setError("Failed to update quantity");
    } finally {
      setUpdating((prev) => ({ ...prev, [cartItemId]: false }));
    }
  };

  const remove = async (cartItemId) => {
    if (!token) {
      console.error("No authentication token found");
      setError("Authentication required");
      return;
    }

    // Find the cart item to get product details for Redux
    const cartItemToRemove = cartItems.find(item => item.cart_item_id === cartItemId);
    if (!cartItemToRemove) {
      console.error("Cart item not found:", cartItemId);
      setError("Cart item not found");
      return;
    }

    // Store original state for potential revert
    const originalItems = [...cartItems];
    const originalQuantities = { ...quantities };
    
    console.log(`Removing cart item ${cartItemId}, product ${cartItemToRemove.product_id}`); // Debug log

    // Optimistic update for local state
    setCartItems(prev => prev.filter(item => item.cart_item_id !== cartItemId));
    const updated = { ...quantities };
    delete updated[cartItemId];
    setQuantities(updated);
    setError(null);

    try {
      const response = await api.delete(`/cart/delete/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Delete response:", response.data); // Debug log

      // Update Redux store after successful API call
      dispatch(removeItem({
        id: cartItemToRemove.product_id // Use product_id for consistency with Redux store
      }));

    } catch (err) {
      console.error("Error removing cart item:", err);
      handleAuthError(err);
      
      // Revert optimistic update on error
      setCartItems(originalItems);
      setQuantities(originalQuantities);
      setError("Failed to remove item");
    }
  };

  // Calculate totals using cart_item_id
  const orderPrice = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (quantities[item.cart_item_id] || 1),
    0
  );
  const gst = 0;
  const total = orderPrice + gst;

  const SkeletonCard = () => (
    <div className="relative flex animate-pulse flex-col bg-white rounded-lg p-4 shadow">
      <div className="absolute right-2 top-2 h-5 w-5 bg-gray-300 rounded" />
      <div className="flex gap-4">
        <div className="h-20 w-20 bg-gray-300 rounded" />
        <div className="flex flex-col gap-2 w-full">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="h-4 w-4 bg-gray-300 rounded" />
            <div className="h-6 w-6 bg-gray-200 rounded" />
          </div>
          <div className="h-4 bg-gray-300 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F6ED] p-4">
      <div className="mx-auto space-y-6">
        <h2 className="text-4xl font-sans">Shopping Cart</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[70%] space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)
            ) : cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>
                <Link 
                  to="/" 
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((product) => (
                <div key={product.cart_item_id} className="relative flex flex-col bg-white rounded-lg p-4 shadow">
                  <button 
                    onClick={() => remove(product.cart_item_id)} 
                    className="absolute right-2 top-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    disabled={updating[product.cart_item_id]}
                    title="Remove item"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex gap-4">
                    <img 
                      src={product.image || "/placeholder.svg"} 
                      alt={product.name || "Product"} 
                      className="h-20 w-20 object-cover rounded border" 
                      onError={(e) => {
                        console.log(`Image failed to load: ${product.image}, falling back to placeholder`);
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {product.name || `Product ${product.product_id}`}
                        </p>
                        <span className="text-xs text-gray-600">
                          Size: {product.size || "N/A"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Product ID: {product.product_id} | Cart ID: {product.cart_item_id}
                        </p>
                        {/* Debug info for image URL */}
                        <p className="text-xs text-blue-500 mt-1">
                          Image: {product.image ? "✓" : "✗"} {product.image}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateQuantityHandler(product.cart_item_id, -1)} 
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={updating[product.cart_item_id] || quantities[product.cart_item_id] <= 1}
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className={`min-w-[2rem] text-center ${updating[product.cart_item_id] ? "opacity-50" : ""}`}>
                          {quantities[product.cart_item_id] || 1}
                        </span>
                        <button 
                          onClick={() => updateQuantityHandler(product.cart_item_id, 1)} 
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={updating[product.cart_item_id]}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          DH {(product.price || 0).toFixed(2)} each
                        </span>
                        <span className="block text-base font-semibold text-black">
                          Total: DH {((product.price || 0) * (quantities[product.cart_item_id] || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="w-full lg:w-[30%] bg-white rounded-lg p-4 shadow sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm border-b pb-2">
                <span>Items ({cartItems.length})</span>
                <span>{cartItems.reduce((sum, item) => sum + (quantities[item.cart_item_id] || 1), 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-b pb-2">
                <span>Subtotal</span>
                <span>DH {orderPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b pb-2">
                <span>VAT</span>
                <span>DH {gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t">
                <span>Total</span>
                <span>DH {total.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                state={{ 
                  cartItems: cartItems.map(item => ({
                    ...item,
                    quantity: quantities[item.cart_item_id] || 1,
                    total_price: (item.price || 0) * (quantities[item.cart_item_id] || 1)
                  })), 
                  quantities, 
                  orderSummary: {
                    subtotal: orderPrice,
                    vat: gst,
                    total: total,
                    itemCount: cartItems.length,
                    totalQuantity: cartItems.reduce((sum, item) => sum + (quantities[item.cart_item_id] || 1), 0)
                  },
                  userInfo: {
                    userId: userId,
                    token: token
                  }
                }}
                className={`block text-center font-semibold py-3 mt-5 rounded-lg transition-colors ${
                  cartItems.length > 0 
                    ? "bg-orange-500 text-white hover:bg-orange-600" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (cartItems.length === 0) {
                    e.preventDefault();
                    return;
                  }
                  
                  // Log the data being passed for debugging
                  console.log("Checkout data being passed:", {
                    cartItems: cartItems.map(item => ({
                      ...item,
                      quantity: quantities[item.cart_item_id] || 1,
                      total_price: (item.price || 0) * (quantities[item.cart_item_id] || 1)
                    })),
                    quantities,
                    orderSummary: {
                      subtotal: orderPrice,
                      vat: gst,
                      total: total,
                      itemCount: cartItems.length,
                      totalQuantity: cartItems.reduce((sum, item) => sum + (quantities[item.cart_item_id] || 1), 0)
                    }
                  });
                }}
              >
                {cartItems.length > 0 ? "Proceed to Checkout" : "Cart is Empty"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}