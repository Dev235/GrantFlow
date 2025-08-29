// frontend/src/pages/CreateOrganizationPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, AlertCircle } from 'lucide-react';

export default function CreateOrganizationPage() {
    const [organizationName, setOrganizationName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ name: organizationName }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create organization');
            }

            // Update user context with the new organization details
            const updatedUser = {
                ...user,
                organization: data._id,
                organizationRole: 'Admin',
            };
            login(updatedUser);

            alert('Organization created successfully! You are now an admin of this organization.');
            navigate('/manage/grants'); // Redirect to manage grants page
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Redirect if user is not a Grant Maker or already has an organization
    if (user?.role !== 'Grant Maker' || user.organization) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">You do not have permission to create an organization or are already a member of one.</p>
                <Link to="/dashboard" className="mt-6 inline-block px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <Building size={28} /> Create a New Organization
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Create a new organization to start creating and managing grants.</p>
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization Name</label>
                        <input
                            type="text"
                            id="orgName"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            placeholder="e.g., GrantFlow Foundation"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? 'Creating...' : 'Create Organization'}
                    </button>
                </form>
            </div>
        </div>
    );
}
