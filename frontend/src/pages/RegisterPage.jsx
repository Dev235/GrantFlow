// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Applicant');
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState('');
    const [newOrganizationName, setNewOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (role === 'Grant Maker') {
            const fetchOrganizations = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations`);
                    const data = await response.json();
                    setOrganizations(data);
                } catch (err) {
                    setError('Could not fetch organizations.');
                }
            };
            fetchOrganizations();
        }
    }, [role]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const body = { name, email, password, role };
            if (role === 'Grant Maker') {
                if (organizationId === 'new') {
                    if (!newOrganizationName) throw new Error('Please enter a name for the new organization.');
                    body.newOrganizationName = newOrganizationName;
                } else {
                    if (!organizationId) throw new Error('Please select an organization.');
                    body.organizationId = organizationId;
                }
            }
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to register');
            }
            login(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Create Your Account</h2>
                <p className="text-center text-gray-500 dark:text-gray-300">Join GrantFlow today to find grants or fund projects!</p>
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 mt-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., Ahmad bin Abdullah" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 mt-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 mt-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Minimum 8 characters" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">I am a...</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 mt-2 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="Applicant">Grant Applicant (Grantee)</option>
                            <option value="Grant Maker">Grant Maker</option>
                        </select>
                    </div>

                    {role === 'Grant Maker' && (
                        <div className="p-4 border-t dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
                            <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="w-full px-4 py-2 mt-2 bg-white border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">-- Select an Organization --</option>
                                {organizations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}
                                <option value="new">-- Create a New Organization --</option>
                            </select>
                            {organizationId === 'new' && (
                                <input type="text" value={newOrganizationName} onChange={(e) => setNewOrganizationName(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="New Organization Name" />
                            )}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                 <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
