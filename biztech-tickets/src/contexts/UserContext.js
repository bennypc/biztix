import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs only on the client side
    setIsClient(true);

    // Try to get the user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isClient) {
      // If we're not on the client side, don't try to use localStorage
      return;
    }

    // Update local storage whenever the user changes
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user, isClient]);

  const value = {
    user,
    setUser,
    loading
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
