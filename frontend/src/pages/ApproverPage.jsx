// frontend/src/pages/ApproverPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle, FileWarning, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';

export default function ApproverPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const GRANTS_PER_PAGE = 5;

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

    const totalPending = useMemo(() => {
        return grants.reduce((sum, grant) => sum + grant.pendingApprovalCount, 0);
    }, [grants]);

    const filteredGrants = useMemo(() => {
        return grants.filter(grant =>
            grant.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [grants, searchTerm]);

    const paginatedGrants = useMemo(() => {
        const startIndex = (currentPage - 1) * GRANTS_PER_PAGE;
        return filteredGrants.slice(startIndex, startIndex + GRANTS_PER_PAGE);
    }, [filteredGrants, currentPage]);

    const totalPages = Math.ceil(filteredGrants.length / GRANTS_PER_PAGE);


    if (loading) return <div className="dark:text-white">Loading approval dashboard...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Approval Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Grants with applications awaiting your approval are listed below.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    icon={<FileWarning />} 
                    title="Total Pending Approval" 
                    value={totalPending} 
                    color="yellow" 
                />
            </div>

            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search by grant title..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Grant Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pending Approval</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Completed</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedGrants.length > 0 ? paginatedGrants.map(grant => (
                            <tr key={grant._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{grant.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                                    <div className="flex items-center gap-2">
                                        <Inbox size={16} />
                                        {grant.pendingApprovalCount}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        {grant.approvedCount}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                     <button 
                                        onClick={() => navigate(`/manage/applications/${grant._id}`)} 
                                        className="p-2 text-indigo-600 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                        title="View Applications"
                                    >
                                        <Eye size={18} />
                                    </button>
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

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 inline-flex items-center"
                    >
                        <ChevronLeft size={16} className="mr-1" /> Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 inline-flex items-center"
                    >
                        Next <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
}

