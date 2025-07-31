// utils/profileNavigation.js

import { useNavigate } from 'react-router-dom'; // ✅ Moved to the top

/**
 * Utility functions for navigating to different profile sections
 */

// Profile navigation paths
export const PROFILE_PATHS = {
  GENERAL: 'general',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  NOTIFICATIONS: 'notifications',
  WISHLIST: 'wishlist'
};

/**
 * Navigate to a specific profile section
 * @param {string} section - The section to navigate to (use PROFILE_PATHS constants)
 * @param {object} navigate - React Router navigate function
 */
export const navigateToProfile = (section = PROFILE_PATHS.GENERAL, navigate) => {
  if (!navigate) {
    // Fallback to window.location if navigate is not available
    window.location.href = `/profile?tab=${section}`;
    return;
  }
  navigate(`/profile?tab=${section}`);
};

export const navigateToOrders = (navigate) => {
  navigateToProfile(PROFILE_PATHS.ORDERS, navigate);
};
export const navigateToCoupons = (navigate) => {
  navigateToProfile(PROFILE_PATHS.COUPONS, navigate);
};
export const navigateToWishlist = (navigate) => {
  navigateToProfile(PROFILE_PATHS.WISHLIST, navigate);
};
export const navigateToNotifications = (navigate) => {
  navigateToProfile(PROFILE_PATHS.NOTIFICATIONS, navigate);
};
export const getProfileUrl = (section = PROFILE_PATHS.GENERAL) => {
  return `/profile?tab=${section}`;
};

export const navigateIfAuthenticated = (navigationFunction, navigate) => {
  const token = localStorage.getItem('token');
  const authStatus = localStorage.getItem("isAuthenticated");
  const isAuthenticated = token && authStatus === "true";

  if (!isAuthenticated) {
    if (navigate) {
      navigate('/user');
    } else {
      window.location.href = '/user';
    }
    return false;
  }

  navigationFunction(navigate);
  return true;
};

export const safeNavigateToOrders = (navigate) => {
  navigateIfAuthenticated(navigateToOrders, navigate);
};
export const safeNavigateToCoupons = (navigate) => {
  navigateIfAuthenticated(navigateToCoupons, navigate);
};
export const safeNavigateToWishlist = (navigate) => {
  navigateIfAuthenticated(navigateToWishlist, navigate);
};

/**
 * Custom hook for profile navigation
 * @returns {object} Navigation functions
 */
export const useProfileNavigation = () => {
  const navigate = useNavigate();

  return {
    goToGeneral: () => navigateToProfile(PROFILE_PATHS.GENERAL, navigate),
    goToOrders: () => navigateToOrders(navigate),
    goToCoupons: () => navigateToCoupons(navigate),
    goToWishlist: () => navigateToWishlist(navigate),
    goToNotifications: () => navigateToNotifications(navigate),
    safeGoToOrders: () => safeNavigateToOrders(navigate),
    safeGoToCoupons: () => safeNavigateToCoupons(navigate),
    safeGoToWishlist: () => safeNavigateToWishlist(navigate),
  };
};
