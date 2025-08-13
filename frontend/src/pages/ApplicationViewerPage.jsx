// frontend/src/pages/ApplicationViewerPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Award, X, Download, Flag, CheckCircle, Inbox, Clock, ThumbsUp, ThumbsDown, UserCircle, Calendar, Mail, ArrowRightCircle } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

// A dedicated component for rendering each application as a card
const ApplicationCard = ({ app, totalPossiblePoints, onStatusChange, onFlagSet, onSelectApp, flagColorClass, currentFlag }) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col hover:shadow-lg transition-shadow duration-300">
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
                        <span className="text-gray-500 flex items-center gap-1"><Flag size={16} className={flagColorClass} /> Flag:</span>
                         <select
                            value={currentFlag || 'none'}
                            onChange={(e) => onFlagSet(app._id, e.target.value === 'none' ? null : e.target.value)}
                            className={`text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-1 font-medium ${
                                currentFlag === 'green' ? 'bg-green-100 text-green-800' :
                                currentFlag === 'orange' ? 'bg-orange-100 text-orange-800' :
                                currentFlag === 'red' ? 'bg-red-100 text-red-800' : 'bg-white text-gray-800'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="none">No Flag</option>
                            <option value="green">Green</option>
                            <option value="orange">Orange</option>
                            <option value="red">Red</option>
                        </select>
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                <button onClick={() => onSelectApp(app)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">
                    View Details
                </button>
                {app.status === 'Submitted' && (
                     <button onClick={() => onStatusChange(app, 'In Review')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-2">
                        Move to Review <ArrowRightCircle size={16}/>
                    </button>
                )}
                {app.status === 'In Review' && (
                    <>
                        <button onClick={() => onStatusChange(app, 'Rejected')} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                            Reject
                        </button>
                        <button onClick={() => onStatusChange(app, 'Approved')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                            Approve
                        </button>
                    </>
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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [appToProcess, setAppToProcess] = useState(null);
    
    const totalPossiblePoints = useMemo(() => {
        if (!grant) return 0;
        return grant.applicationQuestions.reduce((total, q) => total + (q.points || 0), 0);
    }, [grant]);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user?.token) return;
            try {
                const grantRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantId}`);
                if (!grantRes.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantRes.json();
                setGrant(grantData);

                const appRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/grant/${grantId}`, {
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
    
    const handleStatusChange = (app, newStatus) => {
        setAppToProcess({ app, newStatus });
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            setIsConfirmModalOpen(true);
        } else {
            confirmStatusChange(app._id, newStatus);
        }
    };

    const confirmStatusChange = async (appId, newStatus) => {
        if (!appId || !newStatus) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/${appId}/status`, {
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
        } finally {
            setIsConfirmModalOpen(false);
            setAppToProcess(null);
        }
    };

    const handleFlagSet = async (appId, color) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/${appId}/flag`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ flag: color }),
            });
            if (!response.ok) throw new Error('Failed to update flag.');
            const updatedApp = await response.json();
            
            setApplications(apps => apps.map(app => 
                app._id === appId ? { ...app, flag: updatedApp.flag } : app
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    const getFlagColorClass = (flag) => {
        switch (flag) {
            case 'green': return 'text-green-500';
            case 'orange': return 'text-orange-500';
            case 'red': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };
    
    const renderAnswer = (answer) => {
        if (answer.questionType === 'file' && answer.answer) {
            const filePath = `${import.meta.env.VITE_API_BASE_URL}${answer.answer}`;
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
        return <p className="text-gray-800 mt-1 whitespace-pre-wrap">{answer.answer || <span className="text-gray-400">No answer provided.</span>}</p>;
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
                            flagColorClass={getFlagColorClass(app.flag)}
                            currentFlag={app.flag || null}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border">
                        <p className="text-gray-500">No applications in the "{activeTab}" category.</p>
                    </div>
                )}
            </div>

            {selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Application Details</h2>
                            <button onClick={() => setSelectedApp(null)} className="p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto bg-gray-50">
                            <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4">
                                    <UserCircle className="w-12 h-12 text-indigo-500" />
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{selectedApp.applicant.name}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Mail size={14}/> {selectedApp.applicant.email}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> Submitted: {format(new Date(selectedApp.createdAt), 'dd MMM yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-600">Status:</span>
                                        <select 
                                            value={selectedApp.status} 
                                            onChange={(e) => handleStatusChange(selectedApp, e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        >
                                            <option>Submitted</option>
                                            <option>In Review</option>
                                            <option>Approved</option>
                                            <option>Rejected</option>
                                        </select>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-800 flex items-center justify-between gap-2 bg-indigo-50 p-2 rounded-md">
                                        <span className="flex items-center gap-2"><Award className="text-indigo-500" /> Total Score:</span>
                                        <span className="text-2xl font-bold text-indigo-600">{selectedApp.score} / {totalPossiblePoints}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-700">Application Answers</h4>
                                <ul className="space-y-4">
                                    {selectedApp.answers.map(answer => (
                                        <li key={answer._id} className="bg-white p-4 rounded-lg shadow-sm border">
                                            <p className="font-bold text-gray-800">{answer.questionText}</p>
                                            <div className="mt-2 border-t pt-2">{renderAnswer(answer)}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-100 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setSelectedApp(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">
                                Close
                            </button>
                             {selectedApp.status === 'Submitted' && (
                                <button onClick={() => handleStatusChange(selectedApp, 'In Review')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    Move to Review
                                </button>
                            )}
                            {selectedApp.status === 'In Review' && (
                                <>
                                <button onClick={() => handleStatusChange(selectedApp, 'Rejected')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                    <ThumbsDown size={16} />
                                    Reject
                                </button>
                                <button onClick={() => handleStatusChange(selectedApp, 'Approved')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                    <CheckCircle size={16} />
                                    Approve
                                </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={() => confirmStatusChange(appToProcess.app._id, appToProcess.newStatus)}
                title={`Confirm Application ${appToProcess?.newStatus}`}
            >
                Are you sure you want to {appToProcess?.newStatus?.toLowerCase()} the application from <strong>{appToProcess?.app.applicant.name}</strong>? This action is final.
            </ConfirmationModal>
        </div>
    );
}
