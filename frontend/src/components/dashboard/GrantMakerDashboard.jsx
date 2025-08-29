// frontend/src/components/dashboard/GrantMakerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, DollarSign, CheckSquare, Edit, XCircle } from 'lucide-react';
import StatCard from './StatCard';
import { useAuth } from '../../context/AuthContext';

export default function GrantMakerDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/grantmaker`, {
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

    if (loading) return <div>Loading dashboard...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!stats) return <div>No data available.</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<Edit />} 
                    title="Draft Grants" 
                    value={stats.draftGrants} 
                    color="yellow" 
                    linkTo="/manage/grants?status=Draft" 
                />
                <StatCard 
                    icon={<FileText />} 
                    title="Active Grants" 
                    value={stats.activeGrants} 
                    color="indigo" 
                    linkTo="/manage/grants?status=Active" 
                />
                <StatCard 
                    icon={<XCircle />} 
                    title="Inactive Grants" 
                    value={stats.inactiveGrants} 
                    color="gray" 
                    linkTo="/manage/grants?status=Inactive" 
                />
                <StatCard 
                    icon={<DollarSign />} 
                    title="Total Awarded" 
                    value={`RM ${stats.totalAwarded.toLocaleString()}`} 
                    color="pink" 
                />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-gray-700 dark:text-gray-200">Applications by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.applicationsByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="applications" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
