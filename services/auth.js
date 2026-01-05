// Authentication service using localStorage

const AUTH_KEY = 'mtg_auth';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123'; // Change this in production!

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  try {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth === 'true';
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Login with username and password
 */
export const login = (username, password) => {
  // Simple authentication - in production, this should call an API
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return { success: true };
  }
  return { success: false, error: 'Invalid username or password' };
};

/**
 * Logout
 */
export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

/**
 * Get current user (if needed for display)
 */
export const getCurrentUser = () => {
  if (isAuthenticated()) {
    return { username: DEFAULT_USERNAME };
  }
  return null;
};

