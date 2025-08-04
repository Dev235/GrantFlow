// frontend/src/pages/ApplicationViewerPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Award, X, Download, Flag, CheckCircle, Inbox, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

// A dedicated component for rendering each application as a card
const ApplicationCard = ({ app, totalPossiblePoints, onStatusChange, onFlagSet, onSelectApp, flagColorClass }) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-bold text-gray-800">{app.applicant.name}</h3>
                <p className="text-sm text-gray-500">{app.applicant.email}</p>
            </div>
            <div className="p-4 flex-grow space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium text-gray-700">{format(new Date(app.createdAt), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Award size={16} className="text-yellow-500" /> Score:</span>
                    <span className="font-bold text-lg text-indigo-600">{app.score} / {totalPossiblePoints}</span>
                </div>
                {app.status === 'In Review' && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Flag:</span>
                        <div className="relative group">
                            <Flag className={`cursor-pointer ${flagColorClass}`} />
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex bg-white border rounded-md shadow-lg p-1 space-x-1 z-10">
                                <div onClick={() => onFlagSet(app._id, 'green')} className="w-6 h-6 rounded-full cursor-pointer bg-green-500 hover:bg-green-600 border-2 border-white"></div>
                                <div onClick={() => onFlagSet(app._id, 'orange')} className="w-6 h-6 rounded-full cursor-pointer bg-orange-500 hover:bg-orange-600 border-2 border-white"></div>
                                <div onClick={() => onFlagSet(app._id, 'red')} className="w-6 h-6 rounded-full cursor-pointer bg-red-500 hover:bg-red-600 border-2 border-white"></div>
                                <div onClick={() => onFlagSet(app._id, null)} className="w-6 h-6 rounded-full cursor-pointer bg-gray-300 hover:bg-gray-400 border-2 border-white flex items-center justify-center"><X size={12} /></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                <button onClick={() => onSelectApp(app)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">
                    View Details
                </button>
                {app.status !== 'Approved' && app.status !== 'Rejected' && (
                    <button onClick={() => onStatusChange(app._id, 'Approved')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Approve
                    </button>
                )}
            </div>
        </div>
    );
};


export default function ApplicationViewerPage() {
    const { grantId } = useParams();
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [grant, setGrant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [activeTab, setActiveTab] = useState('Submitted');
    const [applicationFlags, setApplicationFlags] = useState({});

    const API_BASE_URL = 'http://localhost:5000';

    const totalPossiblePoints = useMemo(() => {
        if (!grant) return 0;
        return grant.applicationQuestions.reduce((total, q) => total + (q.points || 0), 0);
    }, [grant]);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user?.token) return;
            try {
                const grantRes = await fetch(`${API_BASE_URL}/api/grants/${grantId}`);
                if (!grantRes.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantRes.json();
                setGrant(grantData);

                const appRes = await fetch(`${API_BASE_URL}/api/applications/grant/${grantId}`, {
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
        if (newStatus === 'Approved') {
            if (!window.confirm('Are you sure you want to approve this application? This action is final.')) {
                return;
            }
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${appId}/status`, {
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
            if (selectedApp && selectedApp._id === appId) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }

        } catch (err) {
            setError(err.message);
        }
    };

    const handleFlagSet = (appId, color) => {
        setApplicationFlags(prev => ({...prev, [appId]: color}));
    };

    const getFlagColorClass = (appId) => {
        const flag = applicationFlags[appId];
        switch (flag) {
            case 'green': return 'text-green-500';
            case 'orange': return 'text-orange-500';
            case 'red': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };
    
    const renderAnswer = (answer) => {
        if (answer.questionType === 'file' && answer.answer) {
            const filePath = `${API_BASE_URL}${answer.answer}`;
            const isImage = /\.(jpeg|jpg|png|gif)$/i.test(answer.answer);

            if (isImage) {
                return (
                    <a href={filePath} target="_blank" rel="noopener noreferrer">
                        <img src={filePath} alt="Uploaded attachment" className="mt-2 rounded-lg max-w-sm border" />
                    </a>
                );
            } else {
                return (
                    <a href={filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
                        <Download size={16} />
                        Download File
                    </a>
                );
            }
        }
        return <p className="text-gray-600 pl-4 border-l-2 border-gray-200 ml-2 mt-1 whitespace-pre-wrap">{answer.answer}</p>;
    };

    const categorizedApps = useMemo(() => ({
        Submitted: applications.filter(app => app.status === 'Submitted'),
        'In Review': applications.filter(app => app.status === 'In Review'),
        Approved: applications.filter(app => app.status === 'Approved'),
        Rejected: applications.filter(app => app.status === 'Rejected'),
    }), [applications]);

    const tabs = [
        { name: 'Submitted', icon: <Inbox size={16} />, status: 'Submitted' },
        { name: 'In Review', icon: <Clock size={16} />, status: 'In Review' },
        { name: 'Approved', icon: <ThumbsUp size={16} />, status: 'Approved' },
        { name: 'Rejected', icon: <ThumbsDown size={16} />, status: 'Rejected' },
    ];

    if (loading) return <div>Loading applications...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Applications for: {grant?.title}</h1>
                <p className="text-gray-500 mt-1">Manage and review all submitted applications.</p>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

            <div className="bg-white rounded-lg shadow-sm border p-1 flex space-x-1">
                {tabs.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.status)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.status
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {tab.icon}
                        {tab.name} ({categorizedApps[tab.status].length})
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorizedApps[activeTab].length > 0 ? (
                    categorizedApps[activeTab].map(app => (
                        <ApplicationCard
                            key={app._id}
                            app={app}
                            totalPossiblePoints={totalPossiblePoints}
                            onStatusChange={handleStatusChange}
                            onFlagSet={handleFlagSet}
                            onSelectApp={setSelectedApp}
                            flagColorClass={getFlagColorClass(app._id)}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border">
                        <p className="text-gray-500">No applications in the "{activeTab}" category.</p>
                    </div>
                )}
            </div>

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
                             <div className="text-lg font-semibold text-gray-700 flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                                <Award className="text-yellow-500" />
                                Total Score: {selectedApp.score} / {totalPossiblePoints}
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Application Answers:</h4>
                                <ul className="space-y-4">
                                    {selectedApp.answers.map(answer => (
                                        <li key={answer._id}>
                                            <p className="font-medium text-gray-700">{answer.questionText}</p>
                                            {renderAnswer(answer)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setSelectedApp(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">
                                Close
                            </button>
                             {selectedApp.status !== 'Approved' && selectedApp.status !== 'Rejected' && (
                                <button onClick={() => handleStatusChange(selectedApp._id, 'Approved')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                    <CheckCircle size={16} />
                                    Approve Application
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
