import React, { useState, useEffect } from 'react';
import { Edit, ChevronRight, Package, Gift, Bell, Heart, User, ShoppingBag, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { api, API_BASE_URL, IMAGE_BASE_URL } from '../utils/api'; // Import from your API config file

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("General");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const menuItems = [
    { key: "General", label: "General", icon: User },
    { key: "MyOrders", label: "My Orders", icon: Package },
    { key: "MyCoupons", label: "My Coupons", icon: Gift },
    { key: "AllNotification", label: "All Notification", icon: Bell },
    { key: "MyWishlist", label: "My Wishlist", icon: Heart },
  ];

  // Function to get auth token from localStorage
  const getAuthToken = () => {
    try {
      // First check localStorage
      const token = localStorage.getItem('token');
      const authStatus = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(token && authStatus === "true");
      if (token) {
        return token;
      }
      
      // Fallback to sessionStorage
      const sessionToken = sessionStorage.getItem('auth_token');
      if (sessionToken) {
        return sessionToken;
      }
      
      // Fallback to cookies
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

  // Function to handle API errors
  const handleApiError = (error, context) => {
    if (error.response?.status === 401 || error.message?.includes('401')) {
      setIsAuthenticated(false);
      return 'Session expired. Please log in again.';
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.response?.status === 404) {
      return `${context} not found. Please try again.`;
    }
    
    return error.response?.data?.message || `Failed to load ${context}. Please try again later.`;
  };

  // Function to fetch user orders using axios
  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setOrdersError('No authentication token found. Please log in again.');
        return;
      }
      
      const response = await api.get('/orders');
      
      // Handle the API response structure based on your example
      let ordersData = [];
      
      if (response.data.success && response.data.data) {
        ordersData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else {
        ordersData = [];
      }

      // Map orders to consistent format based on your API structure
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

      // Sort orders by date (newest first)
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

  // Handle tab change - fetch orders when My Orders tab is clicked
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    if (tabKey === "MyOrders") {
      fetchUserOrders();
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAuthToken();
        
        if (!token) {
          setIsAuthenticated(false);
          setError('No authentication token found. Please log in again.');
          return;
        }

        const response = await api.get('/profile');
        
        // Handle different API response structures
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

        // Map profile data to consistent format
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
          // Additional fields that might be useful
          dateOfBirth: profileData.date_of_birth || profileData.dob || null,
          city: profileData.city || null,
          country: profileData.country || null,
          postalCode: profileData.postal_code || profileData.zip_code || null
        };

        setUserData(mappedUserData);
        
      } catch (err) {
        const errorMessage = handleApiError(err, 'profile');
        setError(errorMessage);
        
        // Don't set mock data, let user know there's an issue
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      const token = getAuthToken();
      
      if (token) {
        // Attempt to call logout API
        try {
          const response = await api.post('/logout');
        } catch (logoutError) {
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      // Continue with logout process
    } finally {
      // Clear all possible token storage locations
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (storageError) {
        // Continue with logout even if storage clear fails
      }
      
      setIsAuthenticated(false);
      setUserData(null);
      setOrders([]);
      
      // Redirect to login page
      window.location.href = '/user';
    }
  };

  // Function to get status color and icon
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

  // Component for General tab
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
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{userData?.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-500">{userData?.activeCoupons || 0}</div>
              <div className="text-sm text-gray-600">Active Coupons</div>
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

  // Updated Component for My Orders tab
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
          <button className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
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
                      <p className="text-sm text-gray-600">
                        {order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}
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
                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                    <p className="text-sm text-gray-800">{order.paymentMethod}</p>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                    <p className="text-sm font-mono text-blue-600">{order.trackingNumber}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
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
          
          {/* Load more button if there are many orders */}
          {orders.length >= 10 && (
            <div className="text-center pt-4">
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Load More Orders
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Component for My Coupons tab
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
        <button className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Browse Offers
        </button>
      </div>
    </div>
  );

  // Component for Notifications tab
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

  // Component for Wishlist tab
  const WishlistComponent = () => (
    <div className='bg-white'>
      <div className="flex items-center justify-between mb-6 border-b border-gray-300">
        <h2 className="text-2xl font-semibold mb-3">My Wishlist</h2>
        <Heart className="w-6 h-6 text-gray-500" />
      </div>
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Your wishlist is empty</h3>
        <p className="text-gray-500">Save items you love for later</p>
        <button className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  // Function to render active component
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
        return <WishlistComponent />;
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
            onClick={() => window.location.href = '/user'}
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
                  className="w-full py-2 bg-white border border-gray-200 rounded-xl text-gray-800 hover:bg-gray-50 mt-12"
                >
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
                className="text-gray-600 bg-[#f7f7ee] p-1 rounded-md"
              >
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

export default ProfilePage;