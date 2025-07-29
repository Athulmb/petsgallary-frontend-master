import React, { useRef, useEffect, useState } from "react";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const ProductCard = ({ product, onClick }) => {
  return (
    <div
      className="bg-white w-[262px] h-[460px] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start flex-shrink-0"
      onClick={onClick}
    >
      <div className="relative mb-4 flex justify-center items-center min-h-[200px]">
        <button className="absolute right-0 top-0 z-10">
          <Heart className="w-6 h-6 text-gray-400" />
        </button>
        <span className="absolute left-0 top-0 bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
          {product.discount || "30%"}
        </span>
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
      <p className="text-xl font-bold mb-4">{product.price} AED</p>

      <button className="w-full bg-orange-400 hover:bg-orange-500 text-white py-3 rounded-full text-sm font-medium transition-colors">
        Add To Cart
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
