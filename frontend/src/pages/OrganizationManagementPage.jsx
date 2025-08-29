// frontend/src/pages/OrganizationManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, PlusCircle, Trash2, Crown, Edit } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

const AddMemberModal = ({ isOpen, onClose, onMemberAdded, organizationId }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Reviewer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/${organizationId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create user');
            onMemberAdded(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setEmail('');
            setPassword('');
            setRole('Reviewer');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Member</h3>
                    {error && <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Full Name"/>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Email"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Password"/>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="Reviewer">Reviewer</option>
                        <option value="Approver">Approver</option>
                        <option value="Grant Maker">Grant Maker</option>
                    </select>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            {loading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditMemberModal = ({ isOpen, onClose, onMemberUpdated, organizationId, member }) => {
    const [name, setName] = useState('');
    const [organizationRole, setOrganizationRole] = useState('Member');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (member) {
            setName(member.name);
            setOrganizationRole(member.organizationRole);
        }
    }, [member]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/${organizationId}/members/${member._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({ name, organizationRole }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update user');
            onMemberUpdated(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Member</h3>
                    {error && <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Full Name"/>
                    <select value={organizationRole} onChange={(e) => setOrganizationRole(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            {loading ? 'Updating...' : 'Update Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function OrganizationManagementPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToProcess, setMemberToProcess] = useState(null);

    const isSuperAdmin = user?.role === 'Super Admin';
    const isOrgAdmin = user?.organizationRole === 'Admin';

    const fetchMembers = useCallback(async (orgId) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/${orgId}/members`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch members.');
            const data = await response.json();
            setMembers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isSuperAdmin) {
            const fetchOrgs = async () => {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations`);
                const data = await res.json();
                setOrganizations(data);
                if (data.length > 0) {
                    setSelectedOrg(data[0]._id);
                } else {
                    setLoading(false);
                }
            };
            fetchOrgs();
        } else if (user?.organization) {
            setSelectedOrg(user.organization);
        }
    }, [isSuperAdmin, user]);
    
    useEffect(() => {
        if (selectedOrg) {
            fetchMembers(selectedOrg);
        }
    }, [selectedOrg, fetchMembers]);

    const handleMemberAdded = (newMember) => {
        setMembers(prev => [newMember, ...prev]);
    };

    const handleMemberUpdated = (updatedMember) => {
        setMembers(prev => prev.map(m => m._id === updatedMember._id ? updatedMember : m));
    };
    
    const openEditModal = (member) => {
        setMemberToProcess(member);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (member) => {
        setMemberToProcess(member);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!memberToProcess) return;
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/${selectedOrg}/members/${memberToProcess._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            setMembers(prev => prev.filter(m => m._id !== memberToProcess._id));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleteModalOpen(false);
            setMemberToProcess(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Users /> Organization Management</h1>
                {isOrgAdmin && (
                    <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                        <PlusCircle size={20} /> Add Member
                    </button>
                )}
            </div>

            {isSuperAdmin && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Organization</label>
                    <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        {organizations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}
                    </select>
                </div>
            )}
            
            {loading ? <div>Loading members...</div> : error ? <div className="text-red-500">{error}</div> : (
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">System Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Organization Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {members.map(member => (
                                <tr key={member._id}>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                                        {member.name}
                                        {member.organizationRole === 'Admin' && <Crown size={16} className="text-yellow-500" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{member.organizationRole}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {(isOrgAdmin || isSuperAdmin) && (
                                            <>
                                                <button onClick={() => openEditModal(member)} className="p-2 text-indigo-600 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50"><Edit size={16}/></button>
                                                <button onClick={() => openDeleteModal(member)} className="p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={16}/></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AddMemberModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onMemberAdded={handleMemberAdded}
                organizationId={selectedOrg}
            />
            <EditMemberModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onMemberUpdated={handleMemberUpdated}
                organizationId={selectedOrg}
                member={memberToProcess}
            />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Member Removal"
            >
                Are you sure you want to remove <strong>{memberToProcess?.name}</strong> from the organization?
            </ConfirmationModal>
        </div>
    );
}
