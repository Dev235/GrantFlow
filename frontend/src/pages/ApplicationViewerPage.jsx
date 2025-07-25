import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function ApplicationViewerPage() {
    const { grantId } = useParams();
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [grant, setGrant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user?.token) return;
            try {
                // Fetch grant details
                const grantRes = await fetch(`http://localhost:5000/api/grants/${grantId}`);
                if (!grantRes.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantRes.json();
                setGrant(grantData);

                // Fetch applications for the grant
                const appRes = await fetch(`http://localhost:5000/api/applications/grant/${grantId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (!appRes.ok) throw new Error('Could not fetch applications.');
                const appData = await appRes.json();
                setApplications(appData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, [grantId, user]);

    const handleStatusChange = async (appId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status.');
            
            // Update the status in the local state to reflect the change immediately
            setApplications(apps => apps.map(app => 
                app._id === appId ? { ...app, status: newStatus } : app
            ));

        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div>Loading applications...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Applications for: {grant?.title}</h1>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
            {applications.length > 0 ? (
                applications.map(app => (
                    <div key={app._id} className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xl font-semibold">{app.applicant.name}</p>
                                <p className="text-sm text-gray-500">{app.applicant.email}</p>
                                <p className="text-sm text-gray-500">Submitted: {format(new Date(app.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Status:</span>
                                <select 
                                    value={app.status} 
                                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                >
                                    <option>Submitted</option>
                                    <option>In Review</option>
                                    <option>Approved</option>
                                    <option>Rejected</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <h4 className="font-semibold mb-2">Application Answers:</h4>
                            <ul className="space-y-3">
                                {app.answers.map(answer => (
                                    <li key={answer._id}>
                                        <p className="font-medium text-gray-700">{answer.questionText}</p>
                                        <p className="text-gray-600 pl-4 border-l-2 border-gray-200 ml-2 mt-1">{answer.answer}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center py-10 bg-white rounded-xl shadow-md">No applications have been submitted for this grant yet.</p>
            )}
        </div>
    );
}
