// frontend/src/pages/ManageGrantsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, Edit, Trash2, User, Eye } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

export default function ManageGrantsPage() {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [grantToDelete, setGrantToDelete] = useState(null);
    
    const queryParams = new URLSearchParams(location.search);
    const statusFilterParam = queryParams.get('status');
    const [statusFilter, setStatusFilter] = useState(statusFilterParam || 'All');

    const isSuperAdmin = user?.role === 'Super Admin';

    useEffect(() => {
        const fetchGrants = async () => {
            if (!user?.token) return;
            const endpoint = isSuperAdmin ? 'all' : 'mygrants';
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch grants.');
                const data = await response.json();
                setGrants(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrants();
    }, [user, isSuperAdmin]);

    const filteredGrants = useMemo(() => {
        if (statusFilter === 'All') return grants;
        return grants.filter(g => g.status === statusFilter);
    }, [grants, statusFilter]);

    const handleStatusChange = async (grantId, newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status.');
            const updatedGrant = await response.json();
            setGrants(grants.map(g => g._id === grantId ? { ...g, status: updatedGrant.status } : g));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (grant) => {
        setGrantToDelete(grant);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!grantToDelete) return;
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            setGrants(grants.filter(g => g._id !== grantToDelete._id));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleteModalOpen(false);
            setGrantToDelete(null);
        }
    };

    if (loading) return <div>Loading grants...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{isSuperAdmin ? 'Manage All Grants' : 'Manage Your Grants'}</h1>
                {!isSuperAdmin && (
                    <Link to="/manage/create" className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                        <PlusCircle size={20} /> Create New Grant
                    </Link>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-600 dark:text-gray-300">Filter by status:</p>
                    {['All', 'Draft', 'Active', 'Inactive'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm rounded-full ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

            {filteredGrants.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredGrants.map(grant => (
                            <li key={grant._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="flex-1 mb-4 md:mb-0">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{grant.title}</p>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span>Deadline: {format(new Date(grant.deadline), 'dd MMM yyyy')}</span>
                                        <span>Amount: RM{grant.amount.toLocaleString()}</span>
                                        {isSuperAdmin && grant.grantMaker && <span className="flex items-center gap-1"><User size={14}/> {grant.grantMaker.name}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={grant.status} onChange={(e) => handleStatusChange(grant._id, e.target.value)} className="text-sm rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700">
                                        <option value="Draft">Draft</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <button onClick={() => navigate(`/manage/applications/${grant._id}`)} className="p-2 text-gray-600 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600" title="View Applications"><Eye size={18}/></button>
                                    {!isSuperAdmin && <button onClick={() => navigate(`/manage/grants/edit/${grant._id}`)} className="p-2 text-indigo-600 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50" title="Edit Grant"><Edit size={18}/></button>}
                                    <button onClick={() => handleDeleteClick(grant)} className="p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Grant"><Trash2 size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Grants Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">No grants match the "{statusFilter}" filter.</p>
                </div>
            )}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirm Grant Deletion">
                Are you sure you want to delete the grant "<strong>{grantToDelete?.title}</strong>"? This will also remove all associated applications and cannot be undone.
            </ConfirmationModal>
        </div>
    );
}
