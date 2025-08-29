// frontend/src/pages/ApplicationViewerPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Award, X, Download, Flag, CheckCircle, Inbox, Clock, ThumbsUp, ThumbsDown, UserCircle, Calendar, Mail, Save, Eye, ArrowRightCircle } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
    
    const [answers, setAnswers] = useState([]);
    const [totalScore, setTotalScore] = useState(0);

    const isReviewer = user?.role === 'Reviewer';
    const isApprover = user?.role === 'Approver';
    const isGrantMaker = user?.role === 'Grant Maker' || user?.role === 'Super Admin';

    const totalPossiblePoints = useMemo(() => {
        if (!grant) return 0;
        return grant.applicationQuestions.reduce((total, q) => total + (q.points || 0), 0);
    }, [grant]);

    const fetchApplications = async () => {
        if (!user?.token) return;
        setLoading(true);
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

    useEffect(() => {
        fetchApplications();
    }, [grantId, user]);

    useEffect(() => {
        if (selectedApp) {
            setAnswers([...selectedApp.answers]);
        }
    }, [selectedApp]);

    useEffect(() => {
        const newTotal = answers.reduce((sum, answer) => sum + (Number(answer.reviewerScore) || 0), 0);
        setTotalScore(newTotal);
    }, [answers]);

    const handleAnswerFieldChange = (answerId, field, value) => {
        setAnswers(prev => prev.map(a => a._id === answerId ? { ...a, [field]: value } : a));
    };

    const handleSaveScores = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/${selectedApp._id}/score`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ answers }),
            });
            if (!response.ok) throw new Error('Failed to save scores.');
            alert("Scores and comments saved!");
            fetchApplications();
            setSelectedApp(null);
        } catch (err) {
            setError(err.message);
        }
    };
    
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
            fetchApplications();
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
            fetchApplications(); 
        } catch (err) {
            setError(err.message);
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
        return <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{answer.answer || <span className="text-gray-400">No answer provided.</span>}</p>;
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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Applications for: {grant?.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and review all submitted applications.</p>
            </div>
            {error && <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-1 flex space-x-1">
                {tabs.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.status)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.status
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.name} ({categorizedApps[tab.status].length})
                    </button>
                ))}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applicant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Flag</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {categorizedApps[activeTab].length > 0 ? (
                            categorizedApps[activeTab].map(app => (
                                <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{app.applicant.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{app.applicant.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(app.createdAt), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                        {app.score} / {totalPossiblePoints}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={app.flag || 'none'}
                                            onChange={(e) => handleFlagSet(app._id, e.target.value === 'none' ? null : e.target.value)}
                                            className={`text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-1 font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200`}
                                        >
                                            <option value="none">No Flag</option>
                                            <option value="green">Green</option>
                                            <option value="orange">Orange</option>
                                            <option value="red">Red</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setSelectedApp(app)} className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 inline-flex items-center gap-2">
                                            <Eye size={14}/> View {isReviewer ? '& Score' : ''}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    No applications in the "{activeTab}" category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Application Details</h2>
                            <button onClick={() => setSelectedApp(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4">
                                    <UserCircle className="w-12 h-12 text-indigo-500" />
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApp.applicant.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Mail size={14}/> {selectedApp.applicant.email}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Calendar size={14}/> Submitted: {format(new Date(selectedApp.createdAt), 'dd MMM yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between gap-2">
                                    {selectedApp.status === 'Submitted' && isGrantMaker ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleStatusChange(selectedApp, 'In Review')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                               <ArrowRightCircle size={16}/> Move to Review
                                            </button>
                                             <button onClick={() => setSelectedApp(null)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-600 dark:text-gray-300">Status:</span>
                                            <select 
                                                value={selectedApp.status} 
                                                onChange={(e) => handleStatusChange(selectedApp, e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"
                                                disabled={!isGrantMaker && !isApprover}
                                            >
                                                <option disabled={selectedApp.status !== 'Submitted'}>Submitted</option>
                                                <option>In Review</option>
                                                <option>Approved</option>
                                                <option>Rejected</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between gap-2 bg-indigo-50 dark:bg-indigo-900/50 p-2 rounded-md">
                                        <span className="flex items-center gap-2"><Award className="text-indigo-500" /> Total Score:</span>
                                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalScore} / {totalPossiblePoints}</span>
                                    </div>
                                </div>
                            </div>

                            {(selectedApp.reviewedBy || selectedApp.approvedBy) && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Workflow History</h4>
                                    {selectedApp.reviewedBy && <p className="text-sm text-gray-600 dark:text-gray-300">Scored by: <strong>{selectedApp.reviewedBy.name}</strong></p>}
                                    {selectedApp.approvedBy && <p className="text-sm text-gray-600 dark:text-gray-300">Approved by: <strong>{selectedApp.approvedBy.name}</strong></p>}
                                </div>
                            )}
                            
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Application Answers & Scoring</h4>
                                <ul className="space-y-4">
                                    {answers.map(answer => {
                                        const question = grant.applicationQuestions.find(q => q._id === answer.questionId);
                                        const maxPoints = question ? question.points : 0;
                                        return (
                                            <li key={answer._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                                <p className="font-bold text-gray-800 dark:text-white">{answer.questionText}</p>
                                                <div className="mt-2 border-t dark:border-gray-700 pt-2">{renderAnswer(answer)}</div>
                                                {isReviewer && (
                                                    <div className="mt-4 pt-4 border-t border-dashed dark:border-gray-600">
                                                        <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Reviewer's Feedback</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="md:col-span-2">
                                                                <textarea 
                                                                    placeholder="Add comments..." 
                                                                    value={answer.reviewerComments || ''}
                                                                    onChange={(e) => handleAnswerFieldChange(answer._id, 'reviewerComments', e.target.value)}
                                                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                                    rows="2"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    value={answer.reviewerScore || ''}
                                                                    onChange={(e) => handleAnswerFieldChange(answer._id, 'reviewerScore', e.target.value)}
                                                                    max={maxPoints}
                                                                    min="0"
                                                                    className="w-full text-right border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                                                                />
                                                                <span className="text-gray-500 dark:text-gray-400">/ {maxPoints} pts</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-b-xl flex justify-between items-center">
                            <button onClick={() => setSelectedApp(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                Close
                            </button>
                             {isReviewer && (
                                <button onClick={handleSaveScores} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                    <Save size={16} /> Save Scores & Comments
                                </button>
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
