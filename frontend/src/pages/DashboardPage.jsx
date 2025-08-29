// frontend/src/pages/DashboardPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import the specific dashboard components
import ApplicantDashboard from '../components/dashboard/ApplicantDashboard';
import GrantMakerDashboard from '../components/dashboard/GrantMakerDashboard';
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard';
import ReviewerPage from './ReviewerPage';
import ApproverPage from './ApproverPage';

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    const renderDashboard = () => {
        switch (user.role) {
            case 'Applicant':
                return <ApplicantDashboard />;
            case 'Grant Maker':
                return <GrantMakerDashboard />;
            case 'Super Admin':
                return <SuperAdminDashboard />;
            case 'Reviewer':
                return <ReviewerPage />;
            case 'Approver':
                return <ApproverPage />;
            default:
                return <Navigate to="/login" />;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Welcome back, {user.name}! Here's your personalized overview.</p>
            <div className="flex-grow">
                {renderDashboard()}
            </div>
        </div>
    );
};
