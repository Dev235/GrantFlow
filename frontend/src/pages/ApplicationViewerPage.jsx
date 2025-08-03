// frontend/src/pages/ApplicationViewerPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Award, X } from 'lucide-react';

export default function ApplicationViewerPage() {
    const { grantId } = useParams();
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [grant, setGrant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null); // State for modal

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user?.token) return;
            try {
                const grantRes = await fetch(`http://localhost:5000/api/grants/${grantId}`);
                if (!grantRes.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantRes.json();
                setGrant(grantData);

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
            
            setApplications(apps => apps.map(app => 
                app._id === appId ? { ...app, status: newStatus } : app
            ));
            // Also update the selected app if it's open
            if (selectedApp && selectedApp._id === appId) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }

        } catch (err) {
            alert(err.message);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Submitted': return 'bg-blue-100 text-blue-800';
            case 'In Review': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading applications...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Applications for: {grant?.title}</h1>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
            
            {applications.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map(app => (
                                <tr key={app._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{app.applicant.name}</div>
                                        <div className="text-sm text-gray-500">{app.applicant.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(app.createdAt), 'dd MMM yyyy')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 flex items-center gap-1">
                                        <Award size={16} className="text-yellow-500" /> {app.score}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => setSelectedApp(app)} className="text-indigo-600 hover:text-indigo-900">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center py-10 bg-white rounded-xl shadow-md">No applications have been submitted for this grant yet.</p>
            )}

            {/* Application Details Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Application Details</h2>
                            <button onClick={() => setSelectedApp(null)} className="p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xl font-semibold">{selectedApp.applicant.name}</p>
                                    <p className="text-sm text-gray-500">{selectedApp.applicant.email}</p>
                                    <p className="text-sm text-gray-500">Submitted: {format(new Date(selectedApp.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Status:</span>
                                    <select 
                                        value={selectedApp.status} 
                                        onChange={(e) => handleStatusChange(selectedApp._id, e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    >
                                        <option>Submitted</option>
                                        <option>In Review</option>
                                        <option>Approved</option>
                                        <option>Rejected</option>
                                    </select>
                                </div>
                            </div>
                             <div className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                <Award className="text-yellow-500" />
                                Total Score: {selectedApp.score}
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Application Answers:</h4>
                                <ul className="space-y-4">
                                    {selectedApp.answers.map(answer => (
                                        <li key={answer._id}>
                                            <p className="font-medium text-gray-700">{answer.questionText}</p>
                                            <p className="text-gray-600 pl-4 border-l-2 border-gray-200 ml-2 mt-1 whitespace-pre-wrap">{answer.answer}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
