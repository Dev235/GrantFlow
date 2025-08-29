// frontend/src/pages/JoinOrganizationPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function JoinOrganizationPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOrgs = async () => {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations`);
            const data = await res.json();
            setOrganizations(data);
        };
        fetchOrgs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/organizations/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ organizationId: selectedOrg }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // Update user context
            const updatedUser = { ...user, joinRequestStatus: 'Pending' };
            login(updatedUser);

            alert('Your request has been sent to the organization admin for approval.');
            navigate('/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (user.organization) {
        return <div>You are already a member of an organization.</div>;
    }

    if (user.joinRequestStatus === 'Pending') {
        return <div>Your request to join an organization is currently pending.</div>;
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Join an Organization</h1>
            <p className="mb-4">Select an organization to send a join request. An admin will need to approve you.</p>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
                <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required className="w-full p-2 border rounded">
                    <option value="">-- Select Organization --</option>
                    {organizations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}
                </select>
                <button type="submit" disabled={loading} className="w-full mt-4 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    {loading ? 'Sending Request...' : 'Send Join Request'}
                </button>
            </form>
        </div>
    );
}
