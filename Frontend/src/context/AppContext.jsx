import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Initialize from localStorage immediately (synchronous)
  const [role, setRole] = useState(() => {
    // First check user from login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Check guardian_type from the user object
      return user.guardian?.guardian_type || user.role || 'therapist';
    }
    return 'therapist'; // default
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : {
      id: 1,
      name: 'Dr. Sarah Mitchell',
      email: 'sarah@example.com',
      role: 'guardian',
      guardian: {
        guardian_type: 'therapist'
      }
    };
  });

  const [selectedChild, setSelectedChild] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Listen for storage changes (when user logs in/out)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRole(userData.guardian?.guardian_type || userData.role || 'therapist');
      } else {
        // Reset to default if no user
        setUser({
          id: 1,
          name: 'Dr. Sarah Mitchell',
          email: 'sarah@example.com',
          role: 'guardian',
          guardian: {
            guardian_type: 'therapist'
          }
        });
        setRole('therapist');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const switchRole = () => {
    setRole(prev => (prev === 'parent' ? 'therapist' : 'parent'));
    setUser(prev => ({
      ...prev,
      name: prev.guardian?.guardian_type === 'parent' ? 'Dr. Sarah Mitchell' : 'Sarah Johnson',
      guardian: {
        ...prev.guardian,
        guardian_type: prev.guardian?.guardian_type === 'parent' ? 'therapist' : 'parent'
      }
    }));
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const navigate = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  // Helper to check user type
  const isTherapist = user?.guardian?.guardian_type === 'therapist';
  const isParent = user?.guardian?.guardian_type === 'parent';

  return (
    <AppContext.Provider value={{
      role,
      user,
      selectedChild,
      sidebarCollapsed,
      page,
      isLoading,
      setSelectedChild,
      switchRole,
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