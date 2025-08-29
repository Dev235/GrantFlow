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
            <h1 className="text-2xl font-bold mb-4">Manage Join Requests</h1>
            {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td className="px-6 py-4">{req.user.name} ({req.user.email})</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleRequest(req._id, 'approve')} className="p-2 text-green-500 rounded-md hover:bg-green-100"><Check size={16}/></button>
                                        <button onClick={() => handleRequest(req._id, 'reject')} className="p-2 text-red-500 rounded-md hover:bg-red-100"><X size={16}/></button>
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
