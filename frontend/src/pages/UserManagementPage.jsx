// frontend/src/pages/UserManagementPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { User, Briefcase, Shield, PlusCircle, Trash2, CheckCircle, AlertCircle, Eye, X, Key } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { API_BASE_URL } from '../apiConfig';

// ... (AddUserModal component remains the same)
const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Applicant');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create user');
            onUserAdded(data);
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
            setRole('Applicant');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                    {error && <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="Applicant">Applicant</option>
                            <option value="Grant Maker">Grant Maker</option>
                            <option value="Super Admin">Super Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                            {loading ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ViewUserModal Component
const ViewUserModal = ({ user, isOpen, onClose, onVerify }) => {
    const { user: currentUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState({ message: '', error: false });

    useEffect(() => {
        if (!isOpen) {
            setNewPassword('');
            setResetStatus({ message: '', error: false });
        }
    }, [isOpen]);

    const handleResetPassword = async () => {
        if (!newPassword) {
            setResetStatus({ message: 'Please enter a new password.', error: true });
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${user._id}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setResetStatus({ message: 'Password reset successfully!', error: false });
            setNewPassword('');
        } catch (err) {
            setResetStatus({ message: err.message, error: true });
        }
    };

    if (!isOpen || !user) return null;

    const DetailItem = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium text-gray-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* ... User details section ... */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <img src={user.profile?.profilePictureUrl ? `${API_BASE_URL}${user.profile.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                           <DetailItem label="Full Name" value={user.name} />
                           <DetailItem label="Email" value={user.email} />
                           <DetailItem label="Role" value={user.role} />
                           <DetailItem label="Verification" value={user.verificationStatus} />
                           <DetailItem label="IC Number" value={user.profile?.icNumber} />
                           <DetailItem label="Age" value={user.profile?.age} />
                           <DetailItem label="Gender" value={user.profile?.gender} />
                           <DetailItem label="Race" value={user.profile?.race} />
                           <DetailItem label="Income Group" value={user.profile?.incomeGroup} />
                           <DetailItem label="Income (MYR)" value={user.profile?.income?.toLocaleString()} />
                           <DetailItem label="Emergency Contact" value={user.profile?.emergencyContact} />
                           <DetailItem label="Address" value={user.profile?.address} />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">IC Picture</h4>
                        {user.profile?.icPictureUrl ? (
                             <img src={`${API_BASE_URL}${user.profile.icPictureUrl}`} alt="IC" className="rounded-lg border max-w-sm" />
                        ) : <p className="text-gray-500">Not provided.</p>}
                    </div>

                    {/* --- NEW PASSWORD RESET SECTION --- */}
                    <div className="border-t pt-4">
                         <h4 className="font-semibold text-gray-700 mb-2">Reset Password</h4>
                         <div className="flex items-center gap-2">
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-grow px-3 py-2 border rounded-lg"
                                placeholder="Enter new password for user"
                            />
                            <button onClick={handleResetPassword} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 inline-flex items-center gap-2">
                                <Key size={16}/> Reset
                            </button>
                         </div>
                         {resetStatus.message && (
                            <p className={`mt-2 text-sm ${resetStatus.error ? 'text-red-600' : 'text-green-600'}`}>
                                {resetStatus.message}
                            </p>
                         )}
                    </div>
                </div>
                 <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">Close</button>
                    {user.verificationStatus === 'Pending' && (
                        <button onClick={() => onVerify(user)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 inline-flex items-center gap-2">
                            <CheckCircle size={16} /> Verify User
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [userToProcess, setUserToProcess] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser?.token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${currentUser.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch users.');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentUser]);
    
    const handleUserAdded = (newUser) => {
        setUsers(prev => [newUser, ...prev]);
    };
    
    const handleDeleteClick = (user) => {
        setUserToProcess(user);
        setIsDeleteModalOpen(true);
    };

    const handleViewUserClick = (user) => {
        setUserToProcess(user);
        setIsViewModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToProcess) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userToProcess._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser.token}` },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete user.');
            }
            setUsers(users.filter(u => u._id !== userToProcess._id));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleteModalOpen(false);
            setUserToProcess(null);
        }
    };

    const handleVerifyUser = async (userToVerify) => {
        try {
            await fetch(`${API_BASE_URL}/api/users/${userToVerify._id}/verify`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${currentUser.token}` },
            });
            setUsers(users.map(u => u._id === userToVerify._id ? { ...u, verificationStatus: 'Verified' } : u));
            setIsViewModalOpen(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Applicant': return <User className="text-blue-500" />;
            case 'Grant Maker': return <Briefcase className="text-teal-500" />;
            case 'Super Admin': return <Shield className="text-indigo-500" />;
            default: return null;
        }
    };

    const getStatusIndicator = (status) => {
        switch (status) {
            case 'Verified': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Verified</span>;
            case 'Pending': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
            case 'Unverified': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Unverified</span>;
            default: return null;
        }
    };

    const filteredUsers = useMemo(() => {
        if (filter === 'All') return users;
        return users.filter(u => u.verificationStatus === filter);
    }, [users, filter]);

    if (loading) return <div>Loading users...</div>;
    if (error) return <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    <PlusCircle size={20} /> Add New User
                </button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-600">Filter by status:</p>
                    <button onClick={() => setFilter('All')} className={`px-3 py-1 text-sm rounded-full ${filter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>All</button>
                    <button onClick={() => setFilter('Verified')} className={`px-3 py-1 text-sm rounded-full ${filter === 'Verified' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Verified</button>
                    <button onClick={() => setFilter('Pending')} className={`px-3 py-1 text-sm rounded-full ${filter === 'Pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Pending for Verification</button>
                    <button onClick={() => setFilter('Unverified')} className={`px-3 py-1 text-sm rounded-full ${filter === 'Unverified' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Unverified</button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span className="inline-flex items-center gap-2">
                                        {getRoleIcon(u.role)}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusIndicator(u.verificationStatus)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleViewUserClick(u)} className="p-2 text-indigo-600 rounded-md hover:bg-indigo-100" title="View Details"><Eye size={16} /></button>
                                    <button
                                        onClick={() => handleDeleteClick(u)}
                                        disabled={u._id === currentUser._id}
                                        className="p-2 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={u._id === currentUser._id ? "Cannot delete yourself" : "Delete user"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={handleUserAdded} />
            <ViewUserModal user={userToProcess} isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} onVerify={handleVerifyUser} />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm User Deletion"
            >
                Are you sure you want to delete the user "<strong>{userToProcess?.name}</strong>"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
}
