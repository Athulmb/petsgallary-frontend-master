import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, Phone, Mail, ArrowLeft, Share2 } from 'lucide-react';
import { useProfileNavigation, navigateToOrders} from '../utils/profileNavigation';

const PaymentSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { safeGoToOrders, goToGeneral } = useProfileNavigation();
  const [orderData, setOrderData] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Mock data for testing - Updated with proper image handling
  const mockOrderData = {
    cartItems: [
      {
        cart_item_id: 1,
        name: "Premium Dog Food - Royal Canin",
        // Using a proper fallback image path that should exist in your public folder
        image_url: "/images/placeholder.png",
        images: [{ image_url: "/images/placeholder.png" }],
        size: "5kg",
        color: "Original",
        quantity: 2,
        price: 299.99,
        total_price: 599.98
      },
      {
        cart_item_id: 2,
        name: "Cat Scratching Post",
        image_url: "/images/placeholder.png",
        images: [{ image_url: "/images/placeholder.png" }],
        size: "Large",
        color: "Brown",
        quantity: 1,
        price: 159.99,
        total_price: 159.99
      },
      {
        cart_item_id: 3,
        name: "Pet Carrier Bag",
        image_url: "/images/placeholder.png",
        images: [{ image_url: "/images/placeholder.png" }],
        size: "Medium",
        color: "Blue",
        quantity: 1,
        price: 89.99,
        total_price: 89.99
      }
    ],
    orderSummary: {
      subtotal: 849.96,
      shipping: 25.00,
      tax: 43.75,
      total: 918.71
    },
    deliveryAddress: {
      fullName: "John Doe",
      addressLine1: "123 Pet Street",
      addressLine2: "Apartment 4B",
      city: "Dubai",
      state: "Dubai",
      zipCode: "12345",
      country: "UAE"
    },
    contactInfo: {
      email: "john.doe@example.com",
      phone: "+971 50 123 4567"
    },
    paymentMethod: "Credit Card",
    amount: 918.71,
    orderId: "PG-" + Date.now(),
    transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    paymentIntent: {
      id: "pi_" + Math.random().toString(36).substr(2, 24)
    }
  };

  // Function to get the correct image URL (matching ProductCard logic)
  const getImageUrl = (item) => {
    // Check for images array first (like in ProductCard)
    if (item.images && item.images.length > 0 && item.images[0].image_url) {
      return item.images[0].image_url;
    }
    // Fall back to direct image_url
    if (item.image_url) {
      return item.image_url;
    }
    // Fall back to image property
    if (item.image) {
      return item.image;
    }
    // Final fallback to placeholder
    return "/images/placeholder.png";
  };

  useEffect(() => {
    // Use real data if available, otherwise use mock data for testing
    const dataToUse = state || mockOrderData;
    
    if (!state) {
      console.log('No real order data found, using mock data for testing');
    }

    setOrderData(dataToUse);
    
    // Calculate estimated delivery date (5-7 business days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 6);
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));

    console.log('Payment success page data:', dataToUse);
  }, [state]);

  const handleContactSupport = () => {
    const email = 'petsgallery033@gmail.com';
    const subject = `Order Support - ${orderId || 'N/A'}`;
    const body = `Hello,\n\nI need assistance with my order.\n\nOrder ID: ${orderId || 'N/A'}\nTransaction ID: ${transactionId || paymentIntent?.id || 'N/A'}\n\nPlease describe your issue below:\n\n`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // Enhanced navigation handlers
  const handleViewAllOrders = () => {
    console.log('Navigating to My Orders page...');
    safeGoToOrders();
  };

  const handleGoToProfile = () => {
    console.log('Navigating to Profile General page...');
    goToGeneral();
  };

  // Alternative handler using direct navigation (if you need more control)
  const handleDirectOrdersNavigation = () => {
    // Check authentication first
    const token = localStorage.getItem('token');
    const authStatus = localStorage.getItem("isAuthenticated");
    const isAuthenticated = token && authStatus === "true";
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/user');
      return;
    }
    
    // Navigate directly to orders
    navigateToOrders(navigate);
  };

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
    paymentMethod = 'Unknown',
    amount,
    orderId,
    paymentIntent,
    transactionId
  } = orderData;

  const handleShareOrder = () => {
    // Placeholder for sharing functionality
    if (navigator.share) {
      navigator.share({
        title: 'My Order Confirmation',
        text: `Order #${orderId || 'N/A'} has been confirmed!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Order #${orderId || 'N/A'} confirmed! ${window.location.href}`);
    }
  };

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
      {/* Test Mode Indicator */}
      {!state && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">
                <strong>Test Mode:</strong> This page is showing mock data for testing purposes.
              </p>
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

              {/* Quick Action to View Orders */}
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
                {cartItems.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center space-x-4 p-4 bg-[#F5F6ED] rounded-2xl">
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
                        DH {item.total_price?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
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
                    DH {amount?.toFixed(2) || orderSummary.total?.toFixed(2) || '0.00'}
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
                        <p>{deliveryAddress.addressLine1}</p>
                        {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
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

                {/* Enhanced Order Tracking Button */}
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

          {/* Next Steps - Enhanced with Proper Navigation */}
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
                
                {/* Enhanced Navigation Buttons */}
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