import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { API_BASE_URL } from '../apiConfig';

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchMyApplications = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/applications/my`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch applications.');
                const data = await response.json();
                setApplications(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMyApplications();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Submitted': return 'bg-blue-100 text-blue-800';
            case 'In Review': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading your applications...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Applications</h1>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
            {applications.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {applications.map(app => (
                            <li key={app._id} className="p-4 sm:p-6 hover:bg-gray-50">
                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                    <div>
                                        <p className="text-lg font-semibold text-indigo-600">{app.grant.title}</p>
                                        <p className="text-sm text-gray-500">Category: {app.grant.category}</p>
                                        <p className="text-sm text-gray-500">Submitted: {format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
                                    </div>
                                    <div className="mt-2 sm:mt-0">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                 <div className="text-center py-10 bg-white rounded-xl shadow-md">
                    <p className="text-gray-500">You haven't applied for any grants yet.</p>
                    <Link to="/grants" className="mt-4 inline-block px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                        Discover Grants
                    </Link>
                </div>
            )}
        </div>
    );
}
