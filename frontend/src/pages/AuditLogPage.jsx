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
            
            const response = await fetch(`http://localhost:5000/api/audit?${params.toString()}`, {
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
    
    // Reset to page 1 when filters change
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><History />Audit Log</h1>

            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Search by Name</label>
                        <input type="text" name="searchName" value={filters.searchName} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 border rounded-lg" placeholder="Enter user name..." />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 bg-white border rounded-lg">
                            <option value="">All Roles</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Grant Maker">Grant Maker</option>
                            <option value="Applicant">Applicant</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Action Type</label>
                        <select name="action" value={filters.action} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 bg-white border rounded-lg">
                            <option value="">All Actions</option>
                            {actionTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 border rounded-lg" />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 inline-flex items-center gap-1"><X size={16}/> Reset</button>
                </div>
            </div>
            
            {loading ? <div>Loading logs...</div> : error ? <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div> : (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             {logs.length > 0 ? logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{log.user?.name || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{log.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 break-all">{formatDetails(log.details)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(log.createdAt), 'dd MMM yyyy, h:mm a')}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-gray-500">No audit logs found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                     {totalPages > 1 && (
                        <div className="p-4 flex justify-between items-center">
                            <button 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} className="inline-block mr-1" /> Previous
                            </button>
                            <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next <ChevronRight size={16} className="inline-block ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
