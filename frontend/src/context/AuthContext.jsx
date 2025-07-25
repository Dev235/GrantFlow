import React, { useState, useMemo, createContext, useContext } from 'react';

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// The provider component
export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage to persist login
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('grantFlowUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    // Login function
    const login = (userData) => {
        localStorage.setItem('grantFlowUser', JSON.stringify(userData));
        setUser(userData);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('grantFlowUser');
        setUser(null);
    };

    // Memoize the context value to prevent unnecessary re-renders
    const authValue = useMemo(() => ({
        user,
        login,
        logout,
    }), [user]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};
