import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.guardian?.guardian_type || user.guardian_type || user.role || null;
      } catch { return null; }
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch { return null; }
    }
    return null;
  });

  const [selectedChild, setSelectedChild] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Sync user state from localStorage — works for cross-tab AND same-tab updates
  const syncFromStorage = useCallback(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRole(userData.guardian?.guardian_type || userData.guardian_type || userData.role || null);
      } catch {
        setUser(null);
        setRole(null);
      }
    } else {
      setUser(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    // Cross-tab storage events
    window.addEventListener('storage', syncFromStorage);
    // Same-tab custom event (fired after login sets localStorage)
    window.addEventListener('user-updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('user-updated', syncFromStorage);
    };
  }, [syncFromStorage]);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const navigate = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const isTherapist = user?.guardian?.guardian_type === 'therapist' || user?.guardian_type === 'therapist';
  const isParent = user?.guardian?.guardian_type === 'parent' || user?.guardian_type === 'parent';

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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};