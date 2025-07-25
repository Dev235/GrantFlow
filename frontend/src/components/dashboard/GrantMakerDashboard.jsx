import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, DollarSign, Users, CheckSquare } from 'lucide-react';
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
                const response = await fetch('http://localhost:5000/api/dashboard/grantmaker', {
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
                <StatCard icon={<FileText />} title="Active Grants" value={stats.activeGrants} color="indigo" />
                <StatCard icon={<Users />} title="Total Applications" value={stats.totalApplications} color="teal" />
                <StatCard icon={<CheckSquare />} title="Approved Applications" value={stats.approvedApplications} color="green" />
                <StatCard icon={<DollarSign />} title="Total Awarded" value={`RM ${stats.totalAwarded.toLocaleString()}`} color="pink" />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-gray-700">Applications by Category</h3>
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
