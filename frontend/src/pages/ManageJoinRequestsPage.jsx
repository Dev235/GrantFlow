// frontend/src/pages/ManageJoinRequestsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

export default function ManageJoinRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = useCallback(async () => {
        if (!user?.organization) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/${user.organization}/join-requests`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch requests.');
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleRequest = async (requestId, action) => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/join-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ action }),
            });
            fetchRequests(); // Refresh list
        } catch (err) {
            setError('Failed to process request.');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Manage Join Requests</h1>
            {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td className="px-6 py-4">{req.user.name} ({req.user.email})</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleRequest(req._id, 'approve')} className="p-2 text-green-500 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50"><Check size={16}/></button>
                                        <button onClick={() => handleRequest(req._id, 'reject')} className="p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"><X size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
