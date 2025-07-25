import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If the route requires specific roles, check if the user has one of them
    if (roles && !roles.includes(user.role)) {
        // If user's role is not authorized, redirect them to their dashboard
        // This prevents them from accessing pages they shouldn't see
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }

    return children;
};
