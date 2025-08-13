// src/components/dashboard/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { Users, User, Briefcase, FileText, DollarSign, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../apiConfig';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard/superadmin`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch dashboard data.');
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    if (loading) return <div>Loading platform overview...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!stats) return <div>No data available.</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users />} title="Total Users" value={stats.totalUsers} color="indigo" />
                <StatCard icon={<UserCheck />} title="Verified Users" value={stats.verifiedUsers} color="green" />
                <StatCard icon={<UserX />} title="Pending/Unverified" value={stats.unverifiedUsers} color="yellow" />
                <StatCard icon={<FileText />} title="Total Grants" value={stats.totalGrants} color="pink" />
                <StatCard icon={<User />} title="Applicants" value={stats.totalApplicants} color="blue" />
                <StatCard icon={<Briefcase />} title="Grant Makers" value={stats.totalGrantMakers} color="teal" />
                <StatCard icon={<FileText />} title="Total Applications" value={stats.totalApplications} color="indigo" />
                <StatCard icon={<DollarSign />} title="Total Awarded" value={`RM ${stats.totalAwarded.toLocaleString()}`} color="green" />
            </div>
             <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-gray-700">Management</h3>
                <p className="text-gray-600 mb-4">Oversee all users and grants on the platform.</p>
                <div className="flex gap-4">
                    <Link to="/admin/users" className="px-6 py-3 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                        Manage Users
                    </Link>
                     <Link to="/manage/grants" className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">
                        Manage All Grants
                    </Link>
                </div>
            </div>
        </div>
    );
};
