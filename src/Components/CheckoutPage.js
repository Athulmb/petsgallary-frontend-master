import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api'; // Adjust import path as needed
import { api } from '../utils/api'; // Import the api utility for cart operations

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // Extract data from cart state
  const cartItems = state?.cartItems || [];
  const quantities = state?.quantities || {};
  const orderSummary = state?.orderSummary || {};
  const userInfo = state?.userInfo || {};
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Delivery Address
    city: '',
    street: '',
    country: '',
    houseNumber: '',
    zipCode: '',
    // Contact Info
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    const requiredFields = ['city', 'street', 'country', 'name', 'email', 'phone'];
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate shipping
  const calculateShipping = () => {
    return orderSummary.total > 200 ? 0 : 25; // Free shipping over DH 200
  };

  // Build delivery address object
  const buildDeliveryAddress = () => ({
    fullName: formData.name,
    phoneNumber: formData.phone,
    addressLine1: formData.street,
    addressLine2: formData.houseNumber,
    city: formData.city,
    state: formData.city, // Using city as state for now
    postalCode: formData.zipCode,
    country: formData.country,
    houseNumber: formData.houseNumber,
    street: formData.street,
    zipCode: formData.zipCode
  });

  // Clear all cart items after successful payment
  const clearCart = async () => {
    const token = userInfo.token || localStorage.getItem('token');
    
    if (!token || !cartItems.length) {
      console.log('No token or cart items to clear');
      return { success: true, message: 'No items to clear' };
    }

    try {
      console.log('🧹 Clearing cart items...');
      
      // Delete each cart item using the cart_item_id
      const deletePromises = cartItems.map(async (item) => {
        try {
          const response = await api.delete(`/cart/delete/${item.cart_item_id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log(`✅ Deleted cart item ${item.cart_item_id}:`, response.data);
          return { success: true, cartItemId: item.cart_item_id };
        } catch (error) {
          console.error(`❌ Failed to delete cart item ${item.cart_item_id}:`, error);
          return { success: false, cartItemId: item.cart_item_id, error: error.message };
        }
      });

      const results = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failed = results.filter(result => !result.success);
      
      if (failed.length === 0) {
        console.log('✅ All cart items cleared successfully');
        return { success: true, message: 'Cart cleared successfully' };
      } else {
        console.warn(`⚠️ Failed to clear ${failed.length} cart items:`, failed);
        return { 
          success: false, 
          message: `Failed to clear ${failed.length} items`, 
          failedItems: failed 
        };
      }
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return { success: false, message: error.message };
    }
  };

  // Create order function - Updated to match working version
  const createOrder = async (deliveryAddress) => {
    // Format shipping address as a single string
    const shippingAddress = `${deliveryAddress.houseNumber}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.zipCode}, ${deliveryAddress.country}`;
    
    // Format contact info
    const contactInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    };

    // Format the order payload to match your backend API structure
    const orderPayload = {
      shipping_address: shippingAddress,
      items: cartItems.map(item => ({
        product_id: item.product_id, // Use the correct product_id from cart
        cart_item_id: item.cart_item_id,
        product_name: item.name,
        quantity: quantities[item.cart_item_id] || item.quantity || 1,
        price: parseFloat(item.price)
      })),
      order_summary: orderSummary,
      customer_info: contactInfo
    };

    try {
      console.log('Creating order with payload:', orderPayload);
      
      const response = await axios.post(`${API_BASE_URL}/orders`, orderPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        }
      });

      console.log('Order creation response:', response.data);

      if (response.data.success || response.status === 201 || response.status === 200) {
        return response.data.order || response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Enhanced error handling for different HTTP status codes
      if (error.response) {
        console.error('Error response:', error.response.data);
        switch (error.response.status) {
          case 404:
            throw new Error('Order creation endpoint not found. Please contact support.');
          case 401:
            throw new Error('Authentication failed. Please login again.');
          case 422:
            throw new Error('Invalid order data. Please check your information.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(error.response.data?.message || 'Failed to create order');
        }
      }
      throw error;
    }
  };

  // Update stock quantities
  const updateStockQuantities = async () => {
    try {
      const stockUpdateResponse = await fetch(`${API_BASE_URL}/products/update-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cartItems: cartItems.map(item => ({
            ...item,
            quantity: quantities[item.cart_item_id] || item.quantity || 1
          }))
        }),
      });

      const stockUpdateData = await stockUpdateResponse.json();
      
      if (!stockUpdateResponse.ok) {
        console.error('⚠️ Stock update failed:', stockUpdateData.message);
        return false;
      } else {
        console.log('✅ Stock updated successfully');
        return true;
      }
    } catch (stockErr) {
      console.error('⚠️ Stock update failed:', stockErr);
      return false;
    }
  };

  // Handle Stripe payment - UPDATED TO MATCH PHP BACKEND
  const handleStripePayment = async () => {
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const deliveryAddress = buildDeliveryAddress();
      const shippingCost = calculateShipping();
      const finalTotal = (orderSummary.total || 0) + shippingCost;

      // Validate required data
      if (!userInfo.userId) {
        throw new Error('User ID is missing. Please login again.');
      }

      if (!cartItems.length) {
        throw new Error('No items in cart');
      }

      // Validate all cart items have required fields
      const invalidItems = cartItems.filter(item => 
        !item.cart_item_id || !item.name || !item.price || isNaN(parseFloat(item.price))
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid cart items:', invalidItems);
        throw new Error('Some cart items are missing required information');
      }

      // Create Stripe checkout session payload to match PHP backend expectations
      const stripePayload = {
        items: cartItems.map(item => {
          const quantity = quantities[item.cart_item_id] || item.quantity || 1;
          const itemPrice = parseFloat(item.price);
          const totalAmount = itemPrice * quantity;
          
          return {
            id: item.cart_item_id,
            name: item.name,
            totalAmount: totalAmount, // This matches what PHP backend expects
            quantity: quantity
          };
        }),
        // Add success and cancel URLs that match your routes
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-failed`
      };

      console.log('Stripe payload for PHP backend:', stripePayload);

      // Call the PHP Stripe checkout endpoint
      const response = await axios.post(`${API_BASE_URL}/stripe/checkout`, stripePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token || localStorage.getItem('token')}`
        }
      });

      console.log('Stripe checkout response:', response.data);

      if (!response.data.id) {
        throw new Error('Invalid checkout session response - missing session ID');
      }

      // Get Stripe instance
      const stripeKey = process.env.REACT_APP_STRIPE_KEY;
      console.log('Stripe key exists:', !!stripeKey);
      
      if (!stripeKey) {
        throw new Error('Stripe publishable key is not configured');
      }

      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      // Store order data in sessionStorage for success/failure handling
      sessionStorage.setItem('pendingOrderData', JSON.stringify({
        cartItems,
        quantities,
        deliveryAddress,
        userId: userInfo.userId,
        totalAmount: finalTotal,
        shouldClearCart: true,
        token: userInfo.token,
        orderSummary: {
          ...orderSummary,
          shipping: shippingCost,
          finalTotal: finalTotal
        }
      }));

      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.id,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw new Error(error.message || 'Failed to redirect to Stripe checkout');
      }

    } catch (error) {
      console.error('Stripe payment error:', error);
      
      let errorMessage = error.message;
      
      // Handle axios errors
      if (error.response) {
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      }
      
      // Navigate to failure page with detailed error info
      navigate('/payment-failed', {
        state: {
          error: { message: errorMessage },
          errorMessage: errorMessage,
          amount: (orderSummary.total || 0) + calculateShipping(),
          userId: userInfo.userId,
          cartItems,
          deliveryAddress: buildDeliveryAddress(),
          paymentMethod: 'card'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Cash on Delivery - UPDATED WITH CART CLEARING
  const handleCODPayment = async () => {
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const deliveryAddress = buildDeliveryAddress();
      
      console.log('🚀 Processing COD order...');
      
      // Create order
      const order = await createOrder(deliveryAddress);
      console.log('📋 COD Order creation result:', order);

      if (!order) {
        throw new Error('Order creation returned empty result');
      }

      // Update stock
      console.log('📦 Updating stock quantities...');
      const stockUpdateSuccess = await updateStockQuantities();

      if (!stockUpdateSuccess) {
        console.warn('⚠️ Stock update failed after order creation');
      }

      // Clear cart after successful order and stock update
      console.log('🧹 Clearing cart after successful COD order...');
      const cartClearResult = await clearCart();

      // Navigate to success page
      navigate('/payment-success', {
        state: {
          paymentIntent: { id: 'cod_payment', status: 'succeeded' },
          amount: (orderSummary.total || 0) + calculateShipping(),
          userId: userInfo.userId,
          cartItems,
          order,
          orderId: order?.orderId || order?._id,
          stockUpdateSuccess,
          deliveryAddress,
          paymentMethod: 'cod',
          cartCleared: cartClearResult.success,
          cartClearMessage: cartClearResult.message
        }
      });

    } catch (error) {
      console.error('🔥 COD payment processing error:', error);
      
      navigate('/payment-failed', {
        state: {
          error: { message: error.message },
          errorMessage: error.message,
          amount: (orderSummary.total || 0) + calculateShipping(),
          userId: userInfo.userId,
          cartItems,
          deliveryAddress: buildDeliveryAddress(),
          paymentMethod: 'cod'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle payment based on selected method
  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleStripePayment();
    } else if (paymentMethod === 'cod') {
      handleCODPayment();
    }
  };

  // Calculate final totals
  const shippingCost = calculateShipping();
  const finalTotal = (orderSummary.total || 0) + shippingCost;

  // Redirect if no cart data
  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No items in cart</h2>
          <Link to="/products" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-4 md:px-[98px] py-6">
      <div className="mb-6">
        <Link to="/cart" className="text-gray-600 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <h1 className="text-3xl md:text-5xl font-semibold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <section>
            <h2 className="text-2xl font-medium mb-4">Delivery address</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.city ? 'border-2 border-red-500' : ''}`}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Street"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.street ? 'border-2 border-red-500' : ''}`}
                />
                {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.country ? 'border-2 border-red-500' : ''}`}
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleInputChange}
                placeholder="House/Flat/Floor No"
                className="bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500"
              />
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="Zip Code"
                className="bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500"
              />
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <h2 className="text-2xl font-medium mb-6">Contact Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Name"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.name ? 'border-2 border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.email ? 'border-2 border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  className={`w-full bg-[#F5F6ED] p-3 rounded-2xl placeholder-gray-500 ${errors.phone ? 'border-2 border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="text-2xl font-medium mb-6">Payment Method</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-[#FF9B6A]"
                />
                <span>Pay Online (Stripe)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-[#FF9B6A]"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || cartItems.length === 0}
              className={`w-full py-3 rounded-full mt-6 font-semibold transition-colors ${
                loading || cartItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#FF9B57] text-white hover:bg-[#e8824a]'
              }`}
            >
              {loading ? (
                paymentMethod === 'card' ? 'Processing Payment...' : 'Processing Order...'
              ) : (
                paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order (COD)'
              )}
            </button>
          </section>
        </div>

        {/* Right Column - Order Summary */}
        <div className="bg-[#F5F6ED] p-6 rounded">
          <h2 className="text-2xl font-semibold mb-6 border-b border-gray-500 pb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between border-b border-gray-300 pb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.size && (
                    <p className="text-xs text-gray-600">Size: {item.size}</p>
                  )}
                </div>
                <div className="text-sm text-right">
                  <div>Qty: {quantities[item.cart_item_id] || item.quantity || 1}</div>
                  <div>AED {(item.price || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>AED {(orderSummary.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `AED ${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">VAT</span>
              <span>AED {(orderSummary.vat || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span>AED {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;