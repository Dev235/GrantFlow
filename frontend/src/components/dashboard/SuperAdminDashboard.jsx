
// src/components/dashboard/SuperAdminDashboard.jsx
import React from 'react';
import GrantMakerDashboard from './GrantMakerDashboard';

export default function SuperAdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
            {/* For now, the Super Admin sees the same as a Grant Maker, plus user management */}
            <GrantMakerDashboard /> 
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-gray-700">User Management</h3>
                <p className="text-gray-600">A table of all users (Applicants, Grant Makers) with options to manage their roles or status would be displayed here.</p>
                {/* A component to list and manage users would go here */}
            </div>
        </div>
    );
};
