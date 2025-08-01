import React, { useRef, useEffect, useState } from "react";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addItem } from "../utils/cartSlice";
import { api } from "../utils/api";

const ProductCard = ({ product, onClick }) => {
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

  return (
    <div
      className="bg-white w-[262px] h-[460px] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start flex-shrink-0"
      onClick={onClick}
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
          src={product.images?.[0]?.image_url || product.image_url || "/images/placeholder.png"}
          alt={product.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${index < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>

      <p className="text-gray-700 text-md mb-2 min-h-[40px] line-clamp-2">
        {product.name || "No description"}
      </p>
      
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

const ProductCarousel = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [scrollAmount, setScrollAmount] = useState(300);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateScrollAmount = () => {
      if (window.innerWidth < 640) {
        setScrollAmount(270);
      } else if (window.innerWidth < 1024) {
        setScrollAmount(280);
      } else {
        setScrollAmount(300);
      }
    };
    updateScrollAmount();
    window.addEventListener("resize", updateScrollAmount);
    return () => window.removeEventListener("resize", updateScrollAmount);
  }, []);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const fetchInitialData = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get("/get-bestseller-products", {
        params: { page },
      });
      console.log("API Response:", res);
      const paginated = res.data.products || { data: [] };
      setProducts(paginated.data || []);
    } catch (error) {
      console.error("Initial load error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="relative px-4 sm:px-10 lg:px-20 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
        Our Best Seller
      </h1>

      {/* Scroll Buttons */}
      <div className="absolute top-6 right-4 flex gap-2 z-10">
        <button
          onClick={scrollLeft}
          className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={scrollRight}
          className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Product Scroll Area */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="inline-flex space-x-4 sm:space-x-6 w-max">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products found.</p>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;