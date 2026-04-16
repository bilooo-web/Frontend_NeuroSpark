import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AppContext = createContext();

// ── Pure helper: extract user data from localStorage synchronously ──────────
const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { user: null, role: null };
    const user = JSON.parse(raw);
    // Guardian type can be nested or flat; also check the separate key set by AuthModal
    const role =
      user.guardian?.guardian_type ||
      user.guardian_type            ||
      localStorage.getItem('guardian_type') ||
      user.role                     ||
      null;
    return { user, role };
  } catch {
    return { user: null, role: null };
  }
};

export const AppProvider = ({ children }) => {
  // Initialise synchronously — no async, no delay
  const [user, setUserState] = useState(() => readStoredUser().user);
  const [role, setRole]      = useState(() => readStoredUser().role);

  const [selectedChild, setSelectedChild]   = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage]   = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Single sync function — keeps user + role in sync from localStorage
  const syncFromStorage = useCallback(() => {
    const { user: u, role: r } = readStoredUser();
    setUserState(u);
    setRole(r);
  }, []);

  // Expose setUser so AuthModal/login can push a new user object in directly
  // AND also persist to localStorage so a refresh works
  const setUser = useCallback((userData) => {
    if (!userData) {
      // Logout path
      setUserState(null);
      setRole(null);
      return;
    }
    // Merge into localStorage so sidebar/header read the same thing
    localStorage.setItem('user', JSON.stringify(userData));
    const r =
      userData.guardian?.guardian_type ||
      userData.guardian_type            ||
      localStorage.getItem('guardian_type') ||
      userData.role                     ||
      null;
    if (r) localStorage.setItem('guardian_type', r);
    setUserState(userData);
    setRole(r);
  }, []);

  useEffect(() => {
    // cross-tab: actual StorageEvent fires when another tab changes localStorage
    window.addEventListener('storage', syncFromStorage);
    // same-tab: AuthModal fires 'user-updated' after writing to localStorage
    window.addEventListener('user-updated', syncFromStorage);
    // same-tab: AuthModal fires 'login-success' — re-read immediately
    window.addEventListener('login-success', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('user-updated', syncFromStorage);
      window.removeEventListener('login-success', syncFromStorage);
    };
  }, [syncFromStorage]);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const navigate = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const isTherapist = role === 'therapist' ||
    user?.guardian?.guardian_type === 'therapist' ||
    user?.guardian_type === 'therapist';

  const isParent = role === 'parent' ||
    user?.guardian?.guardian_type === 'parent' ||
    user?.guardian_type === 'parent';

  return (
    <AppContext.Provider value={{
      role,
      user,
      setUser,
      setRole,
      selectedChild,
      sidebarCollapsed,
      page,
      isLoading,
      setSelectedChild,
      toggleSidebar,
      navigate,
      isTherapist,
      isParent,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};