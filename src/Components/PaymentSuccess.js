import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, Phone, Mail, ArrowLeft, Share2, AlertCircle } from 'lucide-react';
import { useProfileNavigation, navigateToOrders} from '../utils/profileNavigation';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { api } from '../utils/api';

const PaymentSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { safeGoToOrders, goToGeneral } = useProfileNavigation();
  const [orderData, setOrderData] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderProcessingError, setOrderProcessingError] = useState(null);
  const [processingSteps, setProcessingSteps] = useState({
    orderCreated: false,
    stockUpdated: false,
    cartCleared: false
  });

  // Create order function
  const createOrder = async (orderPayload) => {
    try {
      console.log('Creating order with payload:', orderPayload);
      
      const response = await axios.post(`${API_BASE_URL}/orders`, orderPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orderPayload.token}`
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
  const updateStockQuantities = async (cartItems, quantities) => {
    try {
      console.log('📦 Updating stock quantities...');
      
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
        return { success: false, message: stockUpdateData.message };
      } else {
        console.log('✅ Stock updated successfully');
        return { success: true, message: 'Stock updated successfully' };
      }
    } catch (stockErr) {
      console.error('⚠️ Stock update failed:', stockErr);
      return { success: false, message: stockErr.message };
    }
  };

  // Clear cart items
  const clearCart = async (cartItems, token) => {
    if (!token || !cartItems.length) {
      console.log('No token or cart items to clear');
      return { success: true, message: 'No items to clear' };
    }

    try {
      console.log('🧹 Clearing cart items...');
      
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

  // Process order after payment success
  const processOrder = async (orderData) => {
    setIsProcessingOrder(true);
    setOrderProcessingError(null);
    
    const steps = {
      orderCreated: false,
      stockUpdated: false,
      cartCleared: false
    };

    try {
      console.log('🚀 Processing order after successful payment...');
      
      const {
        cartItems,
        quantities,
        deliveryAddress,
        orderSummary,
        customerInfo,
        token,
        userId
      } = orderData;

      // Format shipping address as a single string
      const shippingAddress = `${deliveryAddress.houseNumber || ''}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.zipCode || ''}, ${deliveryAddress.country}`;
      
      // Format the order payload
      const orderPayload = {
        shipping_address: shippingAddress,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          cart_item_id: item.cart_item_id,
          product_name: item.name,
          quantity: quantities[item.cart_item_id] || item.quantity || 1,
          price: parseFloat(item.price)
        })),
        order_summary: orderSummary,
        customer_info: customerInfo,
        token: token
      };

      // STEP 1: Create order
      console.log('📋 Creating order...');
      const order = await createOrder(orderPayload);
      
      if (!order) {
        throw new Error('Order creation returned empty result');
      }
      
      steps.orderCreated = true;
      setProcessingSteps(prev => ({ ...prev, orderCreated: true }));
      console.log('✅ Order created successfully:', order);

      // STEP 2: Update stock
      console.log('📦 Updating stock quantities...');
      const stockUpdateResult = await updateStockQuantities(cartItems, quantities);
      
      steps.stockUpdated = stockUpdateResult.success;
      setProcessingSteps(prev => ({ ...prev, stockUpdated: stockUpdateResult.success }));
      
      if (stockUpdateResult.success) {
        console.log('✅ Stock updated successfully');
      } else {
        console.warn('⚠️ Stock update failed:', stockUpdateResult.message);
      }

      // STEP 3: Clear cart
      console.log('🧹 Clearing cart...');
      const cartClearResult = await clearCart(cartItems, token);
      
      steps.cartCleared = cartClearResult.success;
      setProcessingSteps(prev => ({ ...prev, cartCleared: cartClearResult.success }));
      
      if (cartClearResult.success) {
        console.log('✅ Cart cleared successfully');
      } else {
        console.warn('⚠️ Cart clearing failed:', cartClearResult.message);
      }

      // Prepare final order data
      const finalOrderData = {
        ...orderData,
        order,
        orderId: order?.orderId || order?._id || `PG-${Date.now()}`,
        stockUpdateSuccess: stockUpdateResult.success,
        stockUpdateMessage: stockUpdateResult.message,
        cartCleared: cartClearResult.success,
        cartClearMessage: cartClearResult.message,
        processingSteps: steps
      };

      console.log('✅ Order processed successfully:', finalOrderData);
      
      // Clear pending data if it exists
      sessionStorage.removeItem('pendingOrderData');
      
      return finalOrderData;

    } catch (error) {
      console.error('🔥 Error processing order:', error);
      setOrderProcessingError(error.message);
      
      return {
        ...orderData,
        processingError: error.message,
        orderId: `FAILED-${Date.now()}`,
        processingSteps: steps
      };
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Process Stripe payment success
  const processStripeOrder = async (pendingData) => {
    console.log('Processing Stripe order from sessionStorage...');
    
    // Add payment intent info for Stripe orders
    const stripeOrderData = {
      ...pendingData,
      paymentIntent: { 
        id: `stripe_${pendingData.sessionId}`, 
        status: 'succeeded' 
      }
    };
    
    return await processOrder(stripeOrderData);
  };

  // Process COD order
  const processCODOrder = async (codOrderData) => {
    console.log('Processing COD order from navigation state...');
    return await processOrder(codOrderData);
  };

  // Function to get the correct image URL
  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0 && item.images[0].image_url) {
      return item.images[0].image_url;
    }
    if (item.image_url) {
      return item.image_url;
    }
    if (item.image) {
      return item.image;
    }
    return "/images/placeholder.png";
  };

  useEffect(() => {
    const initializeOrderData = async () => {
      // Check for pending Stripe order first
      const pendingDataString = sessionStorage.getItem('pendingOrderData');
      
      if (pendingDataString) {
        console.log('Found pending Stripe order data, processing...');
        
        try {
          const pendingData = JSON.parse(pendingDataString);
          const processedOrderData = await processStripeOrder(pendingData);
          setOrderData(processedOrderData);
        } catch (error) {
          console.error('Error parsing pending order data:', error);
          setOrderProcessingError('Failed to process order data');
          
          // Fallback to state data if available
          if (state) {
            const processedOrderData = await processCODOrder(state);
            setOrderData(processedOrderData);
          }
        }
      } else if (state) {
        // Use data from navigation state (COD orders)
        console.log('Using order data from navigation state (COD)');
        const processedOrderData = await processCODOrder(state);
        setOrderData(processedOrderData);
      } else {
        // No order data found - redirect to home or show error
        console.log('No order data found');
        navigate('/', { replace: true });
        return;
      }

      // Calculate estimated delivery date
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 6);
      setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    };

    initializeOrderData();
  }, [state, navigate]);

  const handleContactSupport = () => {
    const email = 'petsgallery033@gmail.com';
    const subject = `Order Support - ${orderData?.orderId || 'N/A'}`;
    const body = `Hello,\n\nI need assistance with my order.\n\nOrder ID: ${orderData?.orderId || 'N/A'}\nTransaction ID: ${orderData?.transactionId || orderData?.paymentIntent?.id || 'N/A'}\n\nPlease describe your issue below:\n\n`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleViewAllOrders = () => {
    console.log('Navigating to My Orders page...');
    safeGoToOrders();
  };

  const handleGoToProfile = () => {
    console.log('Navigating to Profile General page...');
    goToGeneral();
  };

  const handleRetryOrderProcessing = async () => {
    const pendingDataString = sessionStorage.getItem('pendingOrderData');
    if (pendingDataString) {
      try {
        const pendingData = JSON.parse(pendingDataString);
        const processedOrderData = await processStripeOrder(pendingData);
        setOrderData(processedOrderData);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    } else if (state) {
      const processedOrderData = await processCODOrder(state);
      setOrderData(processedOrderData);
    }
  };

  // Loading state with processing steps
  if (isProcessingOrder) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-4">Processing Your Order...</h2>
          <p className="text-gray-600 mb-6">Please wait while we finalize your order details.</p>
          
          {/* Processing Steps */}
          <div className="bg-white rounded-lg p-4 text-left">
            <h3 className="font-medium mb-3">Processing Steps:</h3>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center ${processingSteps.orderCreated ? 'text-green-600' : 'text-gray-500'}`}>
                {processingSteps.orderCreated ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full animate-spin border-t-green-500"></div>
                )}
                Creating Order
              </div>
              <div className={`flex items-center ${processingSteps.stockUpdated ? 'text-green-600' : 'text-gray-500'}`}>
                {processingSteps.stockUpdated ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                )}
                Updating Stock
              </div>
              <div className={`flex items-center ${processingSteps.cartCleared ? 'text-green-600' : 'text-gray-500'}`}>
                {processingSteps.cartCleared ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                )}
                Clearing Cart
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orderProcessingError && !orderData) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Order Processing Error</h2>
          <p className="text-gray-600 mb-6">{orderProcessingError}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetryOrderProcessing}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Retry Order Processing
            </button>
            
            <button
              onClick={handleContactSupport}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Contact Support
            </button>
            
            <Link
              to="/"
              className="block w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:border-gray-400 transition-colors text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const {
    cartItems = [],
    orderSummary = {},
    deliveryAddress = {},
    contactInfo = {},
    customerInfo = {},
    paymentMethod = 'Unknown',
    amount,
    totalAmount,
    orderId,
    paymentIntent,
    transactionId,
    processingError,
    stockUpdateSuccess,
    cartCleared,
    stockUpdateMessage,
    cartClearMessage
  } = orderData;

  const finalContactInfo = contactInfo || customerInfo || {};
  const finalAmount = amount || totalAmount || orderSummary.finalTotal || orderSummary.total || 0;

  const getSuccessIcon = () => {
    return <CheckCircle className="w-12 h-12 text-green-600" />;
  };

  const getSuccessTitle = () => {
    if (paymentMethod === 'cod') {
      return 'Order Confirmed!';
    }
    return 'Payment Successful!';
  };

  const getSuccessDescription = () => {
    if (paymentMethod === 'cod') {
      return 'Your cash on delivery order has been confirmed and is being processed.';
    }
    return 'Your payment has been processed successfully and your order is confirmed.';
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Processing Status Warnings */}
      {(processingError || !stockUpdateSuccess || !cartCleared) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
            <div>
              {processingError && (
                <>
                  <p className="text-sm">
                    <strong>Note:</strong> Your payment was successful, but there was an issue processing your order: {processingError}
                  </p>
                  <p className="text-sm mt-1">
                    Please contact support with your transaction details.
                  </p>
                </>
              )}
              {!stockUpdateSuccess && (
                <p className="text-sm">
                  <strong>Stock Update:</strong> {stockUpdateMessage || 'Failed to update product stock'}
                </p>
              )}
              {!cartCleared && (
                <p className="text-sm">
                  <strong>Cart:</strong> {cartClearMessage || 'Failed to clear cart items'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 lg:px-[98px] py-4">
          <Link 
            to="/"
            className="text-gray-600 flex items-center hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="px-4 lg:px-[98px] py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            {getSuccessIcon()}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getSuccessTitle()}</h1>
          <p className="text-xl text-gray-600 mb-6">
            {getSuccessDescription()}
          </p>
          
          {/* Order Confirmation */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800 text-lg">Order Confirmed</h3>
                  <p className="text-green-700 text-sm">
                    Your order has been received and is being processed
                  </p>
                </div>
              </div>
              
              {(orderId || transactionId || paymentIntent?.id) && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {orderId && (
                      <div>
                        <span className="font-medium text-gray-600">Order ID:</span>
                        <p className="font-mono text-gray-900">{orderId}</p>
                      </div>
                    )}
                    {(transactionId || paymentIntent?.id) && (
                      <div>
                        <span className="font-medium text-gray-600">Transaction ID:</span>
                        <p className="font-mono text-gray-900">{transactionId || paymentIntent?.id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {orderData.processingSteps && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Processing Status:</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${orderData.processingSteps.orderCreated ? 'text-green-600' : 'text-red-500'}`}>
                      {orderData.processingSteps.orderCreated ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      Order Creation: {orderData.processingSteps.orderCreated ? 'Success' : 'Failed'}
                    </div>
                    <div className={`flex items-center ${orderData.processingSteps.stockUpdated ? 'text-green-600' : 'text-orange-500'}`}>
                      {orderData.processingSteps.stockUpdated ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      Stock Update: {orderData.processingSteps.stockUpdated ? 'Success' : 'Warning'}
                    </div>
                    <div className={`flex items-center ${orderData.processingSteps.cartCleared ? 'text-green-600' : 'text-orange-500'}`}>
                      {orderData.processingSteps.cartCleared ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      Cart Cleanup: {orderData.processingSteps.cartCleared ? 'Success' : 'Warning'}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-green-200">
                <button
                  onClick={handleViewAllOrders}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Track This Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-[#FF9B57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Summary
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <div key={item.cart_item_id || index} className="flex items-center space-x-4 p-4 bg-[#F5F6ED] rounded-2xl">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img 
                        src={getImageUrl(item)}
                        alt={item.name || 'Product'}
                        className="w-full h-full object-cover rounded-lg bg-gray-200"
                        onError={(e) => {
                          console.log('Image failed to load, using placeholder');
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <div className="text-sm text-gray-600">
                        <p>Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}</p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        AED {item.total_price?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Paid:</span>
                  <span className="text-2xl font-bold text-green-600">
                    AED {finalAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Payment method: {paymentMethod}
                </p>
              </div>
            </div>

            {/* Delivery & Tracking */}
            <div className="space-y-6">
              {/* Delivery Information */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Truck className="w-6 h-6 mr-3 text-[#FF9B57]" />
                  Delivery Information
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">Estimated Delivery</span>
                    </div>
                    <p className="text-blue-700 font-semibold">{estimatedDelivery}</p>
                    <p className="text-blue-600 text-sm mt-1">5-7 business days</p>
                  </div>

                  {deliveryAddress && Object.keys(deliveryAddress).length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <h4 className="font-medium text-gray-800 mb-2">Delivery Address:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{deliveryAddress.fullName}</p>
                        <p>{deliveryAddress.addressLine1 || deliveryAddress.street}</p>
                        {(deliveryAddress.addressLine2 || deliveryAddress.houseNumber) && (
                          <p>{deliveryAddress.addressLine2 || deliveryAddress.houseNumber}</p>
                        )}
                        <p>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}</p>
                        <p>{deliveryAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-green-600" />
                  Order Status
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-green-800">Order Confirmed</p>
                      <p className="text-sm text-green-600">Just now</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg opacity-60">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-600">Processing</p>
                      <p className="text-sm text-gray-500">Within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg opacity-60">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-600">Shipped</p>
                      <p className="text-sm text-gray-500">2-3 business days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg opacity-60">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-600">Delivered</p>
                      <p className="text-sm text-gray-500">{estimatedDelivery}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleViewAllOrders}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    View Order Details
                  </button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Phone className="w-6 h-6 mr-3 text-green-600" />
                  Need Help?
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Questions about your order? Our support team is here to help.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Call Support</p>
                        <p className="text-sm text-gray-600">+971 56 418 0500</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Email Support</p>
                        <p className="text-sm text-gray-600">petsgallery033@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleContactSupport}
                    className="w-full bg-green-600 text-white py-3 rounded-2xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">What's Next?</h3>
              <p className="text-gray-600 mb-6">
                We'll send you email updates about your order status and tracking information.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="bg-[#FF9B57] text-white px-6 py-3 rounded-2xl font-medium hover:bg-[#FF8A42] transition-colors"
                >
                  Continue Shopping
                </Link>
                
                <button
                  onClick={handleViewAllOrders}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  View All Orders
                </button>
                
                <button
                  onClick={handleGoToProfile}
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:border-gray-400 transition-colors"
                >
                  My Account
                </button>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-[#FF9B57] to-[#FF8A42] text-white rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-2">Thank You for Your Order!</h3>
              <p className="text-lg opacity-90 mb-4">
                We appreciate your business and look forward to serving you again.
              </p>
              <button
                onClick={handleViewAllOrders}
                className="bg-white text-[#FF9B57] px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Track Your Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;