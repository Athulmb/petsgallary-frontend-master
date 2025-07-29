import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XCircle, AlertTriangle, RefreshCw, CreditCard, Phone, Mail, ArrowLeft } from 'lucide-react';

const PaymentFailedPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [errorData, setErrorData] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!state || !state.cartItems) {
      console.warn('No error data found, redirecting to cart');
      navigate('/cart');
      return;
    }

    setErrorData(state);
    console.log('Payment failed page received data:', state);
  }, [state, navigate]);

  if (!errorData) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const {
    cartItems = [],
    orderSummary = {},
    deliveryAddress = {},
    contactInfo = {},
    paymentMethod = 'Unknown',
    errorMessage,
    error,
    amount,
    paymentIntent
  } = errorData;

  const handleRetryPayment = () => {
    setIsRetrying(true);
    // Navigate back to checkout with the same data
    navigate('/checkout', {
      state: {
        cartItems,
        quantities: cartItems.reduce((acc, item) => {
          acc[item.cart_item_id] = item.quantity;
          return acc;
        }, {}),
        orderSummary,
        userInfo: {
          userId: errorData.userId,
          token: localStorage.getItem('token')
        }
      }
    });
  };

  const getErrorIcon = () => {
    if (paymentIntent?.status === 'failed' || error?.message?.includes('card')) {
      return <CreditCard className="w-12 h-12 text-red-600" />;
    }
    return <XCircle className="w-12 h-12 text-red-600" />;
  };

  const getErrorTitle = () => {
    if (paymentMethod === 'cod') {
      return 'Order Creation Failed';
    }
    return 'Payment Failed';
  };

  const getErrorDescription = () => {
    if (paymentMethod === 'cod') {
      return 'We were unable to create your cash on delivery order. Please try again or contact support.';
    }
    return 'Your payment could not be processed. Please check your payment details and try again.';
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 lg:px-[98px] py-4">
          <Link 
            to="/cart"
            className="text-gray-600 flex items-center hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
        </div>
      </div>

      <div className="px-4 lg:px-[98px] py-8">
        {/* Error Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            {getErrorIcon()}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getErrorTitle()}</h1>
          <p className="text-xl text-gray-600 mb-6">
            {getErrorDescription()}
          </p>
          
          {/* Error Message */}
          {(errorMessage || error?.message) && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                    <p className="text-red-700 text-sm">
                      {errorMessage || error?.message || 'An unexpected error occurred'}
                    </p>
                    {paymentIntent?.id && (
                      <p className="text-red-600 text-xs mt-2 font-mono">
                        Reference ID: {paymentIntent.id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-[#FF9B57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Your Order Summary
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center space-x-4 p-4 bg-[#F5F6ED] rounded-2xl">
                    <img 
                      src={item.image || '/api/placeholder/60/60'} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                    />
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
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-red-600">
                    DH {amount?.toFixed(2) || orderSummary.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Payment method: {paymentMethod}
                </p>
              </div>
            </div>

            {/* Actions & Support */}
            <div className="space-y-6">
              {/* Retry Actions */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <RefreshCw className="w-6 h-6 mr-3 text-[#FF9B57]" />
                  Try Again
                </h2>
                
                <div className="space-y-4">
                  <button
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
                    className="w-full bg-[#FF9B57] text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF8A42] transition-colors flex items-center justify-center"
                  >
                    {isRetrying ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Redirecting...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Retry Payment
                      </>
                    )}
                  </button>

                  <Link
                    to="/cart"
                    className="w-full bg-white border-2 border-[#FF9B57] text-[#FF9B57] py-4 rounded-2xl font-semibold hover:bg-[#FF9B57] hover:text-white transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Cart
                  </Link>
                </div>
              </div>

              {/* Common Issues & Solutions */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
                  Common Issues
                </h2>
                
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800">Payment Card Issues</h4>
                    <ul className="text-amber-700 mt-1 space-y-1">
                      <li>• Check if your card has sufficient funds</li>
                      <li>• Verify your card details are correct</li>
                      <li>• Ensure your card supports online payments</li>
                      <li>• Try a different payment method</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Network Issues</h4>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Clear your browser cache</li>
                      <li>• Disable ad blockers temporarily</li>
                    </ul>
                  </div>

                  {paymentMethod === 'cod' && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">COD Order Issues</h4>
                      <ul className="text-green-700 mt-1 space-y-1">
                        <li>• Verify your delivery address is complete</li>
                        <li>• Check if COD is available in your area</li>
                        <li>• Ensure all required fields are filled</li>
                        <li>• Try placing the order again</li>
                      </ul>
                    </div>
                  )}
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
                    If you continue to experience issues, our support team is here to help.
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

                  <button className="w-full bg-green-600 text-white py-3 rounded-2xl font-medium hover:bg-green-700 transition-colors">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Other Options</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:border-gray-400 transition-colors"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/contact"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:border-gray-400 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;