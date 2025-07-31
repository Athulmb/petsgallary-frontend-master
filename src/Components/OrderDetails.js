import React, { useState, useEffect } from 'react';
import { X, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Calendar, Star } from 'lucide-react';
import { api, IMAGE_BASE_URL } from '../utils/api';

const OrderDetailsModal = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to get status color and icon (same as in your ProfilePage)
  const getOrderStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'delivered':
      case 'completed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, text: 'Delivered' };
      case 'shipped':
      case 'shipping':
      case 'dispatched':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Truck, text: 'Shipped' };
      case 'processing':
      case 'confirmed':
      case 'preparing':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, text: 'Processing' };
      case 'cancelled':
      case 'canceled':
      case 'rejected':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, text: 'Cancelled' };
      case 'pending':
      case 'placed':
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock, text: 'Pending' };
    }
  };

  // Function to get auth token (same as in your ProfilePage)
  const getAuthToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) return token;
      
      const sessionToken = sessionStorage.getItem('auth_token');
      if (sessionToken) return sessionToken;
      
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      return cookieToken || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Fetch order details
  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.get(`/orders/${orderId}`);
      
      let orderData = {};
      if (response.data.success && response.data.data) {
        orderData = response.data.data;
      } else if (response.data.order) {
        orderData = response.data.order;
      } else {
        orderData = response.data;
      }

      // Map the order data structure
      const mappedOrder = {
        id: orderData.id,
        orderNumber: orderData.order_number || `#ORD${orderData.id}`,
        status: (orderData.status || 'pending').toLowerCase(),
        total: parseFloat(orderData.total_price || orderData.total || 0),
        subtotal: parseFloat(orderData.subtotal || orderData.sub_total || 0),
        shippingCost: parseFloat(orderData.shipping_cost || orderData.shipping_charge || 0),
        tax: parseFloat(orderData.tax || orderData.tax_amount || 0),
        discount: parseFloat(orderData.discount || orderData.discount_amount || 0),
        currency: orderData.currency || 'AED',
        date: orderData.created_at,
        updatedAt: orderData.updated_at,
        
        // Customer details
        customer: {
          name: orderData.customer_name || 
                `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim() ||
                orderData.user?.name || 'Customer',
          email: orderData.customer_email || orderData.email || orderData.user?.email || '',
          phone: orderData.customer_phone || orderData.phone || orderData.user?.phone || ''
        },
        
        // Shipping address
        shippingAddress: {
          fullAddress: orderData.shipping_address || orderData.address || 'Address not provided',
          street: orderData.shipping_street || orderData.street || '',
          city: orderData.shipping_city || orderData.city || '',
          state: orderData.shipping_state || orderData.state || '',
          country: orderData.shipping_country || orderData.country || '',
          postalCode: orderData.shipping_postal_code || orderData.postal_code || orderData.zip_code || ''
        },
        
        // Billing address (if different)
        billingAddress: {
          fullAddress: orderData.billing_address || orderData.shipping_address || orderData.address || 'Same as shipping',
          street: orderData.billing_street || orderData.shipping_street || '',
          city: orderData.billing_city || orderData.shipping_city || '',
          state: orderData.billing_state || orderData.shipping_state || '',
          country: orderData.billing_country || orderData.shipping_country || '',
          postalCode: orderData.billing_postal_code || orderData.shipping_postal_code || ''
        },
        
        // Payment details
        payment: {
          method: orderData.payment_method || orderData.payment_type || 'Not specified',
          status: orderData.payment_status || 'pending',
          transactionId: orderData.transaction_id || orderData.payment_id || null,
          paidAt: orderData.paid_at || null
        },
        
        // Tracking information
        tracking: {
          number: orderData.tracking_number || orderData.tracking_id || null,
          carrier: orderData.shipping_carrier || orderData.courier || null,
          estimatedDelivery: orderData.estimated_delivery || orderData.delivery_date || null
        },
        
        // Order items with proper image mapping
        items: (orderData.order_items || orderData.items || orderData.products || []).map(item => ({
          id: item.id || item.product_id,
          productId: item.product_id || item.id,
          name: item.product_name || item.name || item.product?.name || 'Product Name',
          description: item.product_description || item.description || item.product?.description || '',
          quantity: parseInt(item.quantity || 1),
          price: parseFloat(item.price || item.unit_price || 0),
          total: parseFloat(item.total || item.line_total || (item.price * item.quantity) || 0),
          
          // Image mapping - handling multiple possible image sources
          image: item.product_image || 
                 item.image || 
                 item.product?.image ||
                 item.product?.images?.[0]?.image_url ||
                 item.product?.images?.[0]?.url ||
                 item.product?.main_image ||
                 item.image_url ||
                 '/images/placeholder.png',
          
          // Additional product details
          sku: item.sku || item.product?.sku || null,
          variant: item.variant || item.product_variant || null,
          attributes: item.attributes || item.product_attributes || {},
          
          // Rating/review info if available
          rating: item.rating || item.product?.rating || 0,
          reviewCount: item.review_count || item.product?.review_count || 0
        })),
        
        // Order notes
        notes: orderData.notes || orderData.special_instructions || orderData.comments || null
      };

      setOrderDetails(mappedOrder);
      
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch details when modal opens or orderId changes
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  // Close modal function
  const handleClose = () => {
    setOrderDetails(null);
    setError(null);
    onClose();
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  const statusDisplay = orderDetails ? getOrderStatusDisplay(orderDetails.status) : null;
  const StatusIcon = statusDisplay?.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
            {orderDetails && (
              <p className="text-gray-600">{orderDetails.orderNumber}</p>
            )}
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">⚠️ {error}</p>
              <button 
                onClick={fetchOrderDetails}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Retry
              </button>
            </div>
          )}

          {orderDetails && (
            <div className="space-y-6">
              {/* Order Status and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Order Status</h3>
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${statusDisplay.bgColor} w-fit`}>
                      <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
                      <span className={`font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span>Placed: {new Date(orderDetails.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      {orderDetails.tracking.number && (
                        <div className="flex items-center">
                          <Truck className="w-4 h-4 mr-2 text-gray-500" />
                          <span>Tracking: {orderDetails.tracking.number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{orderDetails.currency} {orderDetails.subtotal.toFixed(2)}</span>
                    </div>
                    {orderDetails.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{orderDetails.currency} {orderDetails.shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {orderDetails.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{orderDetails.currency} {orderDetails.tax.toFixed(2)}</span>
                      </div>
                    )}
                    {orderDetails.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{orderDetails.currency} {orderDetails.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{orderDetails.currency} {orderDetails.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items ({orderDetails.items.length})</h3>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.image.startsWith('http') ? item.image : `${IMAGE_BASE_URL || ''}${item.image}`}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/images/placeholder.png';
                            }}
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              )}
                              {item.variant && (
                                <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                              )}
                              {item.sku && (
                                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                              )}
                              
                              {/* Rating if available */}
                              {item.rating > 0 && (
                                <div className="flex items-center mt-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= item.rating 
                                            ? "text-yellow-400 fill-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {item.reviewCount > 0 && (
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({item.reviewCount} reviews)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Price and Quantity */}
                            <div className="text-right mt-2 sm:mt-0">
                              <p className="text-lg font-semibold">
                                {orderDetails.currency} {item.total.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {orderDetails.currency} {item.price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping and Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{orderDetails.customer.name}</p>
                    <p className="text-gray-600">{orderDetails.shippingAddress.fullAddress}</p>
                    {orderDetails.customer.phone && (
                      <p className="text-gray-600">{orderDetails.customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{orderDetails.payment.method}</p>
                    <p className="text-gray-600">Status: {orderDetails.payment.status}</p>
                    {orderDetails.payment.transactionId && (
                      <p className="text-sm text-gray-500">ID: {orderDetails.payment.transactionId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              {orderDetails.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{orderDetails.notes}</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;