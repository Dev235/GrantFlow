// frontend/src/pages/ApproverPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox, CheckCircle } from 'lucide-react';

export default function ApproverPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrantsForApproval = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/approval`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch grants for approval.');
                const data = await response.json();
                setGrants(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrantsForApproval();
    }, [user]);

    if (loading) return <div className="dark:text-white">Loading approval dashboard...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Approval Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Grants with applications awaiting your approval are listed below.</p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Grant Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pending Approval</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Completed</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {grants.length > 0 ? grants.map(grant => (
                            <tr key={grant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => navigate(`/manage/applications/${grant._id}`)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{grant.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                    <Inbox size={16} />
                                    {grant.pendingApprovalCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {grant.approvedCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <ChevronRight size={20} className="text-gray-400" />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    You have no grants with applications awaiting approval.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
