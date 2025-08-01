import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItem } from "../utils/cartSlice";
import { api } from "../utils/api";

const ProductImageGallery = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(product.images?.[0]?.image_url);
  const isSingleImage = product.images?.length === 1;

  return (
    <div className={`flex ${isSingleImage ? "justify-center" : "flex-col md:flex-row"} gap-4 w-full lg:w-1/2`}>
      <div className="w-full aspect-square bg-white flex items-center justify-center rounded-lg">
        <img
          src={selectedImage || "/placeholder.jpg"}
          alt="Product"
          className="max-w-[60%] max-h-[60%] object-contain"
        />
      </div>

      {!isSingleImage && (
        <div className="flex md:flex-col gap-2 w-full md:w-1/4">
          {product.images.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(img.image_url)}
              className={`flex-1 aspect-square bg-white flex items-center justify-center rounded-lg cursor-pointer ${
                selectedImage === img.image_url ? "ring-2 ring-[#FF9B57]" : ""
              }`}
            >
              <img
                src={img.image_url}
                alt={`Thumbnail ${index + 1}`}
                className="max-w-[60%] max-h-[60%] object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPetType, setSelectedPetType] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const dispatch = useDispatch();
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    console.log("Fetching product with ID:", id);
    api.get(`/get-product-details/${id}`)
      .then((res) => {
        console.log("Product fetched successfully:", res.data.product);
        setProduct(res.data.product);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product details", err);
        setLoading(false);
      });
  }, [id]);

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

  const addProduct = async () => {
    // Validation before sending request
    if (!product?.id) {
      console.error("Product ID is missing");
      return;
    }
  
    if (quantity < 1) {
      console.error("Quantity must be at least 1");
      return;
    }
  
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Check if product already exists in cart
      const existingCartItem = await checkExistingCartItem(product.id);
      
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
            price: product.price,
            image: product.images?.[0]?.image_url || null,
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            size: selectedPackage,
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
            price: product.price,
            image: product.images?.[0]?.image_url || null,
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            size: selectedPackage,
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
        }
      } else {
        console.error("Network or other error:", error.message);
      }
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;
  if (!product) return <p className="p-8">No product found</p>;

  return (
    <div className="w-full min-h-screen bg-[#F5F5EB] p-4 sm:p-6 md:p-8 lg:p-[80px]">
      <div className="mb-6">
        <Link to="/store">
          <button className="text-gray-600 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back To Store
          </button>
        </Link>
      </div>

      <div className="mx-auto flex flex-col lg:flex-row gap-6">
        <ProductImageGallery product={product} />
        <div className="w-full lg:w-1/2 space-y-4 mt-6 lg:mt-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="text-2xl font-semibold text-[#FF9B57] mb-4">
            {product.price} <span className="text-sm text-gray-500">AED</span>
          </div>

          {product.product_attributes && product.product_attributes.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                {product.product_attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex items-center gap-4 border rounded-md px-4 py-2 text-sm text-gray-700 bg-white shadow-sm"
                  >
                    <span className="font-semibold text-gray-800">{attr.name}:</span>
                    <span>{attr.pivot?.value || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex md:flex-row flex-col gap-4 items-start">
            <div className="w-full md:w-1/6">
              <p className="font-semibold mb-1">Quantity</p>
              <div className="flex flex-wrap gap-2">
                {product.product_sizes?.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedPackage(size.name)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      selectedPackage === size.name
                        ? "bg-[#FF9B57] text-black"
                        : "border-[#FF9B57] text-black-800 bg-orange-400"
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/6">
              <p className="font-semibold mb-1">Pet Type</p>
              <div className="flex flex-wrap gap-2">
                {product.product_pet_types?.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetType(pet.name)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      selectedPetType === pet.name
                        ? "bg-[#FF9B57] text-black"
                        : "border-[#FF9B57] text-black-800 bg-orange-400"
                    }`}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <p className="font-semibold mb-1">Product Type</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-full border border-[#FF9B57] text-black-800 bg-orange-400 cursor-default">
                  {product.product_type?.name || "N/A"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-base">{product.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex items-center border border-orange-500 rounded-full h-10 px-2">
              <button onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}>-</button>
              <span className="w-12 text-center">{quantity}</span>
              <button onClick={() => setQuantity((prev) => prev + 1)}>+</button>
            </div>
            <button
              onClick={addProduct}
              className="flex-1 h-10 bg-[#FF9B57] text-black font-semibold rounded-full hover:bg-orange-600 transition-colors"
            >
              Add to cart
            </button>
            <button className="w-10 h-10 bg-orange-500 text-black rounded-full hover:bg-orange-600 flex items-center justify-center">
              <FaHeart />
            </button>
          </div>

          {addedToCart && (
            <p className="text-green-600 text-sm font-medium">Added to cart!</p>
          )}
        </div>
      </div>

      <div className="py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Details</h2>
        <hr className="mb-8 border-gray-300" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-semibold text-[#1F2937] mb-3">About Product</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.about_product}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-semibold text-[#1F2937] mb-3">Key Features / Benefits</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.benefits.replace(/^Key Features\/Benefits:\s*/i, "")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;