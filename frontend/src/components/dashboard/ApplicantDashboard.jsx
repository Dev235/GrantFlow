import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { FileText, CheckSquare, XCircle, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ApplicantDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/applicant`, {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<FileText />} title="Applications Sent" value={stats.applicationsSent} color="blue" />
            <StatCard icon={<CheckSquare />} title="In Review" value={stats.inReview} color="yellow" />
            <StatCard icon={<Award />} title="Approved" value={stats.approved} color="green" />
            <StatCard icon={<XCircle />} title="Rejected" value={stats.rejected} color="red" />
        </div>
    );
};
