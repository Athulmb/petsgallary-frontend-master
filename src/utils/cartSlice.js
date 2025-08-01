import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from '../utils/api'; // Adjust path as needed

const initialState = {
  items: [], // { id, name, price, quantity, image, sku, packaging }
  loading: false,
  error: null,
};

// Async thunk to fetch cart from API
export const fetchCartFromAPI = createAsyncThunk(
  'cart/fetchFromAPI',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const isAuthenticated = localStorage.getItem("isAuthenticated");

      if (!token || !userId || isAuthenticated !== "true") {
        return [];
      }

      const { data } = await api.get("/cart/get");

      const userCartItems = data.items.filter(item =>
        String(item.user_id) === String(userId)
      );

      if (userCartItems.length === 0) {
        return [];
      }

      // Fetch product details for each cart item
      const itemsWithProductDetails = await Promise.all(
        userCartItems.map(async (item) => {
          try {
            const res = await api.get(`/get-product-details/${item.product_id}`);

            return {
              ...item,
              ...res.data.product,
              cart_item_id: item.id,
              product_id: item.product_id,
              image_url: res.data.product.images?.[0]?.image_url || 
                        res.data.product.image_url || 
                        "/images/placeholder.png"
            };
          } catch (productError) {
            console.error(`Error fetching product details for product_id ${item.product_id}:`, productError);
            return {
              ...item,
              cart_item_id: item.id,
              name: `Product ${item.product_id} (Error loading details)`,
              price: 0,
              image_url: "/images/placeholder.png"
            };
          }
        })
      );

      return itemsWithProductDetails;
    } catch (error) {
      console.error("Error fetching cart:", error);
      
      // Handle auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.setItem("isAuthenticated", "false");
        window.dispatchEvent(new CustomEvent('userLogout'));
      }
      
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to add item to cart via API
export const addToCartAPI = createAsyncThunk(
  'cart/addToAPI',
  async (productData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/cart/add', productData);

      // Refresh cart after adding
      dispatch(fetchCartFromAPI());
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to remove item from cart via API
export const removeFromCartAPI = createAsyncThunk(
  'cart/removeFromAPI',
  async (cartItemId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/cart/remove/${cartItemId}`);

      // Refresh cart after removing
      dispatch(fetchCartFromAPI());
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update cart item quantity via API
export const updateCartQuantityAPI = createAsyncThunk(
  'cart/updateQuantityAPI',
  async ({ cartItemId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/cart/update/${cartItemId}`, { quantity });

      // Refresh cart after updating
      dispatch(fetchCartFromAPI());
      return true;
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      return rejectWithValue(error.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Local cart operations (for when you want to update locally without API)
    addItem: (state, action) => {
      const product = action.payload;
      const existing = state.items.find(item => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    },
    removeItem: (state, action) => {
      const id = action.payload.id;
      state.items = state.items.filter(item => item.id !== id);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    setCartItems: (state, action) => {
      // Transform API cart items to match your existing structure
      state.items = action.payload.map(apiItem => ({
        id: apiItem.product_id, // Map product_id to id
        name: apiItem.name,
        price: apiItem.price,
        quantity: apiItem.quantity || 1,
        image: apiItem.image_url,
        sku: apiItem.sku || '',
        packaging: apiItem.packaging || '',
        // Keep API specific fields for reference
        cart_item_id: apiItem.cart_item_id,
        product_id: apiItem.product_id,
      }));
    },
    // New action to handle logout
    handleLogout: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCartFromAPI
      .addCase(fetchCartFromAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartFromAPI.fulfilled, (state, action) => {
        state.loading = false;
        // Transform API data to match your structure
        state.items = action.payload.map(apiItem => ({
          id: apiItem.product_id,
          name: apiItem.name,
          price: apiItem.price,
          quantity: apiItem.quantity || 1,
          image: apiItem.image_url,
          sku: apiItem.sku || '',
          packaging: apiItem.packaging || '',
          cart_item_id: apiItem.cart_item_id,
          product_id: apiItem.product_id,
        }));
      })
      .addCase(fetchCartFromAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
      })
      // Handle addToCartAPI
      .addCase(addToCartAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCartAPI.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToCartAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle removeFromCartAPI
      .addCase(removeFromCartAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromCartAPI.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeFromCartAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle updateCartQuantityAPI
      .addCase(updateCartQuantityAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartQuantityAPI.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCartQuantityAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  addItem, 
  removeItem, 
  updateQuantity, 
  clearCart, 
  setCartItems,
  handleLogout 
} = cartSlice.actions;

export default cartSlice.reducer;