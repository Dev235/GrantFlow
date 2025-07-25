import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import the specific dashboard components
import ApplicantDashboard from '../components/dashboard/ApplicantDashboard';
import GrantMakerDashboard from '../components/dashboard/GrantMakerDashboard';
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard';

export default function DashboardPage() {
    const { user } = useAuth();

    // If there's no user, they shouldn't be here. Redirect to login.
    if (!user) {
        return <Navigate to="/login" />;
    }

    // This component acts as a router to display the correct dashboard
    // based on the logged-in user's role.
    const renderDashboard = () => {
        switch (user.role) {
            case 'Applicant':
                return <ApplicantDashboard />;
            case 'Grant Maker':
                return <GrantMakerDashboard />;
            case 'Super Admin':
                return <SuperAdminDashboard />;
            default:
                // If role is unrecognized, send back to login as a fallback.
                return <Navigate to="/login" />;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600 mb-6">Welcome back, {user.name}! Here's your personalized overview.</p>
            {renderDashboard()}
        </div>
    );
};
