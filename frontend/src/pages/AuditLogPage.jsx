// frontend/src/pages/AuditLogPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { History, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        role: '',
        searchName: '',
        startDate: '',
        endDate: '',
        action: ''
    });
    const { user } = useAuth();
    const LOGS_PER_PAGE = 15;

    const actionTypes = [
        'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_CREATED', 'USER_DELETED',
        'GRANT_CREATED', 'GRANT_UPDATED', 'GRANT_DELETED',
        'APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'APPLICATION_FLAG_CHANGED'
    ];

    const fetchLogs = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: LOGS_PER_PAGE
            });
            if (filters.role) params.append('role', filters.role);
            if (filters.searchName) params.append('searchName', filters.searchName);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.action) params.append('action', filters.action);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/audit?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch audit logs.');
            const data = await response.json();
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, filters, currentPage]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ role: '', searchName: '', startDate: '', endDate: '', action: '' });
    };

    const formatDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return 'N/A';
        return Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(', ');
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><History />Audit Log</h1>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" name="searchName" value={filters.searchName} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Search by Name..." />
                    <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="">All Roles</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Grant Maker">Grant Maker</option>
                        <option value="Applicant">Applicant</option>
                    </select>
                    <select name="action" value={filters.action} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="">All Actions</option>
                        {actionTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 inline-flex items-center gap-1"><X size={16}/> Reset</button>
                </div>
            </div>
            
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col">
                {loading ? <div className="flex-grow flex items-center justify-center">Loading logs...</div> : error ? <div className="p-4 text-red-500">{error}</div> : (
                    <>
                        <div className="overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.length > 0 ? logs.map(log => (
                                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{log.user?.name || 'N/A'}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{log.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 break-all">{formatDetails(log.details)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(new Date(log.createdAt), 'dd MMM yyyy, h:mm a')}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-10 text-gray-500 dark:text-gray-400">No audit logs found matching your criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="p-4 border-t dark:border-gray-700 mt-auto">
                                <div className="flex justify-between items-center">
                                    <button 
                                        onClick={() => setCurrentPage(p => p - 1)} 
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        <ChevronLeft size={16} className="inline-block mr-1" /> Previous
                                    </button>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                                    <button 
                                        onClick={() => setCurrentPage(p => p + 1)} 
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        Next <ChevronRight size={16} className="inline-block ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
