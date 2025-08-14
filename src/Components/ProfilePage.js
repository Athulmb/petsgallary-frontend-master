import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Edit, ChevronRight, Package, Gift, Bell, Heart, User, ShoppingBag, 
  Mail, Phone, MapPin, Calendar, Clock, CheckCircle, XCircle, Truck, 
  ShoppingCart, X, Star, ArrowLeft, RefreshCw, AlertCircle, Trash2, 
  ImageOff, Plus, LogOut
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItem } from '../utils/cartSlice';
import { api } from '../utils/api';

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState("General");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  
  // Wishlist states
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [processingItems, setProcessingItems] = useState(new Set());
  const [imageErrors, setImageErrors] = useState(new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const menuItems = [
    { key: "General", label: "General", icon: User, path: "general" },
    { key: "MyOrders", label: "My Orders", icon: Package, path: "orders" },
    { key: "MyCoupons", label: "My Coupons", icon: Gift, path: "coupons" },
    { key: "AllNotification", label: "All Notification", icon: Bell, path: "notifications" },
    { key: "MyWishlist", label: "My Wishlist", icon: Heart, path: "wishlist" },
  ];

  // Authentication and API utilities
  const getAuthToken = () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to access your profile');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleApiError = (error, context) => {
    if (error.response?.status === 401 || error.message?.includes('401')) {
      setIsAuthenticated(false);
      return 'Session expired. Please log in again.';
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.response?.data?.message || error.message || `Failed to load ${context}`;
  };

  // Image handling utilities
  const handleImageError = (itemId) => {
    setImageErrors(prev => new Set([...prev, itemId]));
  };

  const getImageUrl = (product, itemId) => {
    if (imageErrors.has(itemId)) {
      return "/images/placeholder.png";
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage && firstImage.image_url) {
        return firstImage.image_url;
      }
    }

    if (product.image_url) {
      return product.image_url;
    }

    if (product.image) {
      return product.image;
    }

    return "/images/placeholder.png";
  };

  // Wishlist functions
  const fetchWishlistItems = async () => {
    try {
      setWishlistLoading(true);
      setWishlistError(null);

      const token = getAuthToken();
      const response = await api.get('/wishlist/get', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        const items = response.data.items || [];
        setWishlistItems(items);
        setItemCount(response.data.count || items.length || 0);
        setImageErrors(new Set());
      } else {
        throw new Error(response.data.message || 'Failed to fetch wishlist');
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      const errorMessage = handleApiError(error, 'wishlist');
      setWishlistError(errorMessage);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const token = getAuthToken();
      const response = await api.get('/wishlist/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setItemCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      setProcessingItems(prev => new Set([...prev, itemId]));

      const token = getAuthToken();
      const response = await api.delete(`/wishlist/remove/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
        setItemCount(prev => Math.max(0, prev - 1));
        setImageErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        throw new Error(response.data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error("Error removing item:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to remove item from wishlist";
      alert(errorMessage);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const moveToCart = async (wishlistItemId, product) => {
    try {
      setProcessingItems(prev => new Set([...prev, wishlistItemId]));

      const token = getAuthToken();
      const response = await api.post(`/wishlist/move-to-cart/${wishlistItemId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        dispatch(
          addItem({
            id: product.id,
            name: product.name,
            price: product.offer_price || product.price,
            image: getImageUrl(product, wishlistItemId),
            description: product.description,
            about_product: product.about_product,
            benefits: product.benefits,
            quantity: 1,
          })
        );

        setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
        setItemCount(prev => Math.max(0, prev - 1));

        alert("Product moved to cart successfully!");
      } else {
        throw new Error(response.data.message || 'Failed to move to cart');
      }
    } catch (error) {
      console.error("Error moving to cart:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to move item to cart";
      alert(errorMessage);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(wishlistItemId);
        return newSet;
      });
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await api.delete('/wishlist/clear', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setWishlistItems([]);
        setItemCount(0);
        setImageErrors(new Set());
        alert("Wishlist cleared successfully!");
      } else {
        throw new Error(response.data.message || 'Failed to clear wishlist');
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to clear wishlist";
      alert(errorMessage);
    }
  };

  const calculateDiscountPercentage = (product) => {
    if (product.offer_price && product.price && product.offer_price < product.price) {
      const discount = ((product.price - product.offer_price) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Orders functions
  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      const token = getAuthToken();
      const response = await api.get('/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      let ordersData = [];
      
      if (response.data.success && response.data.data) {
        ordersData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else {
        ordersData = [];
      }

      const mappedOrders = ordersData.map(order => ({
        id: order.id,
        orderNumber: order.order_number || `#ORD${order.id}`,
        status: (order.status || 'pending').toLowerCase(),
        total: parseFloat(order.total_price || 0),
        currency: 'AED',
        date: order.created_at,
        items: order.order_items || [],
        itemsCount: order.order_items?.length || 0,
        shippingAddress: order.shipping_address || 'Address not provided',
        paymentMethod: 'Not specified',
        trackingNumber: null,
        user: order.user || null
      }));

      mappedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(mappedOrders);
      
    } catch (err) {
      const errorMessage = handleApiError(err, 'orders');
      setOrdersError(errorMessage);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Profile functions
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const response = await api.get('/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      let profileData = {};
      
      if (response.data.success && response.data.data) {
        profileData = response.data.data;
      } else if (response.data.user) {
        profileData = response.data.user;
      } else if (response.data.profile) {
        profileData = response.data.profile;
      } else {
        profileData = response.data;
      }

      const mappedUserData = {
        id: profileData.id || profileData.user_id || profileData._id,
        firstName: profileData.first_name || profileData.firstName || profileData.fname || 
                  (profileData.name ? profileData.name.split(' ')[0] : '') || 'User',
        lastName: profileData.last_name || profileData.lastName || profileData.lname || 
                 (profileData.name ? profileData.name.split(' ').slice(1).join(' ') : '') || '',
        email: profileData.email || 'Not provided',
        phoneNumber: profileData.phone || profileData.phone_number || profileData.phoneNumber || 
                    profileData.mobile || 'Not provided',
        address: profileData.address || profileData.full_address || profileData.location || 'Not provided',
        gender: profileData.gender || 'Not specified',
        joinDate: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        }) : 'Not available',
        totalOrders: parseInt(profileData.orders_count || profileData.totalOrders || profileData.total_orders || 0),
        activeCoupons: parseInt(profileData.coupons_count || profileData.activeCoupons || profileData.active_coupons || 0),
        avatar: profileData.avatar || profileData.profile_image || profileData.image || null,
        dateOfBirth: profileData.date_of_birth || profileData.dob || null,
        city: profileData.city || null,
        country: profileData.country || null,
        postalCode: profileData.postal_code || profileData.zip_code || null
      };

      setUserData(mappedUserData);
      
    } catch (err) {
      const errorMessage = handleApiError(err, 'profile');
      setError(errorMessage);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = getAuthToken();
      
      if (token) {
        try {
          await api.post('/logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
        } catch (logoutError) {
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      // Continue with logout process
    } finally {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('token');
        
        // Clear cookies
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (storageError) {
        // Continue with logout even if storage clear fails
      }
      
      setIsAuthenticated(false);
      setUserData(null);
      setOrders([]);
      setWishlistItems([]);
      
      navigate('/login');
    }
  };

  // Tab management
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    const menuItem = menuItems.find(item => item.key === tabKey);
    if (menuItem) {
      navigate(`/profile?tab=${menuItem.path}`, { replace: true });
    }
    
    if (tabKey === "MyOrders") {
      fetchUserOrders();
    } else if (tabKey === "MyWishlist") {
      fetchWishlistItems();
    }
  };

  const getTabFromUrl = () => {
    const tab = searchParams.get('tab');
    if (!tab) return "General";
    
    const menuItem = menuItems.find(item => item.path === tab);
    return menuItem ? menuItem.key : "General";
  };

  // Status utilities
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

  // Modal functions
  const handleViewOrderDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  // Effects
  useEffect(() => {
    const urlTab = getTabFromUrl();
    setActiveTab(urlTab);
    
    if (urlTab === "MyOrders") {
      setTimeout(() => {
        fetchUserOrders();
      }, 100);
    } else if (urlTab === "MyWishlist") {
      setTimeout(() => {
        fetchWishlistItems();
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  // Component renderers
  const GeneralComponent = () => (
    <div className='bg-white'>
      <div className="flex items-center justify-between mb-6 border-b border-gray-300">
        <h2 className="text-2xl font-semibold mb-3">Personal Information</h2>
        <button className="text-gray-500 hover:text-orange-500">
          <Edit className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-600 mb-2 text-sm font-medium">First Name</label>
            <div className="p-3 bg-[#f7f7ee] rounded text-gray-800">
              {userData?.firstName || 'Not provided'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-2 text-sm font-medium">Last Name</label>
            <div className="p-3 bg-[#f7f7ee] rounded text-gray-800">
              {userData?.lastName || 'Not provided'}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-2 text-sm font-medium">Email</label>
          <div className="p-3 bg-[#f7f7ee] rounded text-gray-800 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-gray-500" />
            {userData?.email || 'Not provided'}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-2 text-sm font-medium">Phone Number</label>
          <div className="p-3 bg-[#f7f7ee] rounded text-gray-800 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-gray-500" />
            {userData?.phoneNumber || 'Not provided'}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-2 text-sm font-medium">Address</label>
          <div className="p-3 bg-[#f7f7ee] rounded text-gray-800 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            {userData?.address || 'Not provided'}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-2 text-sm font-medium">Gender</label>
          <div className="p-3 bg-[#f7f7ee] rounded text-gray-800">
            {userData?.gender || 'Not specified'}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                 onClick={() => handleTabChange("MyOrders")}>
              <div className="text-2xl font-bold text-orange-500">{userData?.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-xs text-orange-600 mt-1">Click to view →</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                 onClick={() => handleTabChange("MyCoupons")}>
              <div className="text-2xl font-bold text-green-500">{userData?.activeCoupons || 0}</div>
              <div className="text-sm text-gray-600">Active Coupons</div>
              <div className="text-xs text-green-600 mt-1">Click to view →</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-500" />
              <div>
                <div className="text-lg font-bold text-blue-500">{userData?.joinDate || 'Not available'}</div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const MyOrdersComponent = () => (
    <div className='bg-white'>
      <div className="flex items-center justify-between mb-6 border-b border-gray-300">
        <h2 className="text-2xl font-semibold mb-3">My Orders</h2>
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-6 h-6 text-gray-500" />
          {orders.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {orders.length}
            </span>
          )}
        </div>
      </div>

      {ordersError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">⚠️ {ordersError}</p>
          <button 
            onClick={fetchUserOrders}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {ordersLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
          <p className="text-gray-500">Your order history will appear here once you make your first purchase</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusDisplay = getOrderStatusDisplay(order.status);
            const StatusIcon = statusDisplay.icon;
            const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Date not available';

            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">Placed on {orderDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusDisplay.bgColor}`}>
                      <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                      <span className={`text-sm font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">
                        {order.currency} {order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
                    <p className="text-sm text-gray-800">{order.shippingAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Items</p>
                    <p className="text-sm text-gray-800">{order.itemsCount} item(s)</p>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                    <p className="text-sm font-mono text-blue-600">{order.trackingNumber}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-3">
                  <button 
                    onClick={() => handleViewOrderDetails(order.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const MyCouponsComponent = () => (
    <div className='bg-white'>
      <div className="flex items-center justify-between mb-6 border-b border-gray-300">
        <h2 className="text-2xl font-semibold mb-3">My Coupons</h2>
        <Gift className="w-6 h-6 text-gray-500" />
      </div>
      <div className="text-center py-12">
        <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No active coupons</h3>
        <p className="text-gray-500">Your available coupons will appear here</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Browse Offers
        </button>
      </div>
    </div>
  );

  const NotificationsComponent = () => (
    <div className='bg-white'>
      <div className="flex items-center justify-between mb-6 border-b border-gray-300">
        <h2 className="text-2xl font-semibold mb-3">All Notifications</h2>
        <Bell className="w-6 h-6 text-gray-500" />
      </div>
      <div className="text-center py-12">
        <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications</h3>
        <p className="text-gray-500">You'll see important updates here</p>
      </div>
    </div>
  );

  const MyWishlistComponent = () => (
    <div className='bg-white'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-gray-300 gap-4 sm:gap-0">
  {/* Left side: Title and item count */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
      <Heart className="w-6 h-6 text-red-500 fill-red-500" />
      My Wishlist
    </h2>
    <p className="text-sm text-gray-600">
      {itemCount} {itemCount === 1 ? "item" : "items"}
    </p>
  </div>

  {/* Right side: Buttons */}
  {wishlistItems.length > 0 && (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={fetchWishlistItems}
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
      <button
        onClick={clearWishlist}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
      </button>
    </div>
  )}
</div>


      {wishlistError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">⚠️ {wishlistError}</p>
          <button 
            onClick={fetchWishlistItems}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {wishlistLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500">Start adding products you love to your wishlist</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const product = item.product;
            const discountPercentage = calculateDiscountPercentage(product);
            const isProcessing = processingItems.has(item.id);
            const imageUrl = getImageUrl(product, item.id);
            const hasImageError = imageErrors.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col border border-gray-200"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {hasImageError ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Image not available</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={product.name || 'Product image'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                      onError={() => handleImageError(item.id)}
                    />
                  )}

                  {discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      {discountPercentage}% OFF
                    </span>
                  )}

                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    disabled={isProcessing}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isProcessing
                        ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-100 shadow-sm'
                      }`}
                    title="Remove from wishlist"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                    ) : (
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    )}
                  </button>
                </div>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Rating */}
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${index < (product.rating || 4)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                    {product.rating && (
                      <span className="text-sm text-gray-600 ml-1">
                        ({product.rating})
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3
                    className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-600"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.name || "Unnamed Product"}
                  </h3>

                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {product.offer_price && product.offer_price < product.price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          {product.offer_price} AED
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {product.price} AED
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {product.price || "Price not available"} AED
                      </span>
                    )}
                  </div>

                  {/* Button section */}
                  <div className="mt-auto">
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(item.id, product)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${isProcessing
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                          }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {isProcessing ? "Moving..." : "Move to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "General":
        return <GeneralComponent />;
      case "MyOrders":
        return <MyOrdersComponent />;
      case "MyCoupons":
        return <MyCouponsComponent />;
      case "AllNotification":
        return <NotificationsComponent />;
      case "MyWishlist":
        return <MyWishlistComponent />;
      default:
        return <GeneralComponent />;
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-[#f7f7ee] min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your profile</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-[#f7f7ee] min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile couldn't be loaded
  if (error && !userData) {
    return (
      <div className="bg-[#f7f7ee] min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = userData ? 
    `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}` : 
    'U';

  const userName = userData ? 
    `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User' : 
    'User';

  return (
    <div className="bg-[#f7f7ee] min-h-screen p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl">
        <div className="flex flex-col md:flex-row">
          
          {/* Sidebar - ONLY visible on desktop */}
          <div className="hidden md:block md:w-1/4 bg-[#f7f7ee] p-8 m-2 rounded-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <span className="font-semibold">{userName}</span>
              </div>
              
              {/* Navigation Menu */}
              <nav>
                <ul className="space-y-6">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <li key={item.key}>
                        <button 
                          onClick={() => handleTabChange(item.key)}
                          className={`w-full text-left flex items-center space-x-3 pb-1 border-b ${
                            activeTab === item.key
                              ? "text-orange-500 border-orange-500"
                              : "text-gray-400 border-gray-300 hover:text-orange-500"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              {/* Logout Button */}
              <div className="mt-auto p-1">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 bg-white border border-gray-200 rounded-xl text-gray-800 hover:bg-gray-50 mt-12 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:w-3/4 p-4 lg:p-20">
            {/* Mobile Header - Only visible on small screens */}
            <div className="md:hidden flex items-center justify-between mb-4 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <span className="font-semibold">{userName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-600 bg-[#f7f7ee] p-1 rounded-md flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            
            {/* Mobile Navigation - Only visible on small screens */}
            <div className="md:hidden flex items-center space-x-5 text-sm mb-6 overflow-x-auto pb-2 border-b">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleTabChange(item.key)}
                  className={`whitespace-nowrap pb-2 flex items-center space-x-1 ${
                    activeTab === item.key
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-600"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            
            {/* Dynamic Content Based on Active Tab */}
            {error && userData && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-600">⚠️ Some data may not be up to date: {error}</p>
              </div>
            )}
            
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export utility functions for use in other components
export const wishlistUtils = {
  checkWishlistStatus: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return false;

      const response = await api.post('/wishlist/check-status',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.is_in_wishlist || false;
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }
  },

  addToWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to add items to wishlist');
      }

      const response = await api.post('/wishlist/add',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.success;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      throw error;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to manage your wishlist');
      }

      const response = await api.post('/wishlist/remove-product',
        { product_id: productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.success;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  }
};

export default ProfilePage;