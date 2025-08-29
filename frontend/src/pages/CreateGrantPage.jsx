// frontend/src/pages/CreateGrantPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Award, AlertCircle, Save, Users, UserCheck } from 'lucide-react';

// A more intuitive component for assigning users
const UserAssigner = ({ users, selectedUsers, onChange, title, icon }) => {
    const handleToggle = (userId) => {
        const newSelection = selectedUsers.includes(userId)
            ? selectedUsers.filter(id => id !== userId)
            : [...selectedUsers, userId];
        onChange(newSelection);
    };

    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">{icon} {title}</label>
            <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto space-y-2 bg-white dark:bg-gray-700">
                {users.length > 0 ? users.map(user => (
                    <div key={user._id} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`${title}-${user._id}`}
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleToggle(user._id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`${title}-${user._id}`} className="text-sm text-gray-800 dark:text-gray-200">{user.name} ({user.email})</label>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400">No users available to assign.</p>}
            </div>
        </div>
    );
};


export default function CreateGrantPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState({
        title: '',
        description: '',
        amount: '',
        category: '',
        deadline: '',
        applicationQuestions: [{ questionText: 'Please describe your project.', questionType: 'textarea', isRequired: true, points: 10 }],
        status: 'Draft',
        reviewers: [],
        approvers: []
    });
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssignableUsers = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/assignable`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!response.ok) throw new Error('Could not fetch users.');
                const data = await response.json();
                setAssignableUsers(data);
            } catch (err) {
                setError(err.message);
            }
        };
        if (user) fetchAssignableUsers();
    }, [user]);

    const isGrantMaker = user?.role === 'Grant Maker';
    const isAffiliatedGrantMaker = isGrantMaker && user?.organization;
    
    if (user && user.verificationStatus !== 'Verified' && isGrantMaker) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Account Not Verified</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">You must complete your profile and be verified by an administrator before you can create grants.</p>
                <Link to="/profile" className="mt-6 inline-block px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    Go to Profile
                </Link>
            </div>
        );
    }
    
    if (isGrantMaker && !isAffiliatedGrantMaker) {
         return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Join an Organization First</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">As a Grant Maker, you must be part of an organization to create grants. Please join an existing one or create a new one.</p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/organization/join" className="px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                        Join an Organization
                    </Link>
                     <Link to="/organization/create" className="px-6 py-2 text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50">
                        Create a New Organization
                    </Link>
                </div>
            </div>
        );
    }


    const presetQuestions = [
        { questionText: "Please describe your organization's background and mission.", questionType: 'textarea', isRequired: true, points: 10 },
        { questionText: "What is the primary goal of this project?", questionType: 'textarea', isRequired: true, points: 20 },
        { questionText: "Provide a detailed budget breakdown for this project.", questionType: 'textarea', isRequired: true, points: 15 },
        { questionText: "How will you measure the success and impact of this project?", questionType: 'textarea', isRequired: true, points: 15 },
        { questionText: "Upload your organization's registration document.", questionType: 'file', isRequired: true, points: 5 },
    ];
    
    const handleGrantChange = (e) => {
        const { name, value } = e.target;
        setGrant({ ...grant, [name]: value });
    };

    const handleQuestionChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newQuestions = [...grant.applicationQuestions];
        newQuestions[index][name] = type === 'checkbox' ? checked : value;
        setGrant({ ...grant, applicationQuestions: newQuestions });
    };

    const addQuestion = () => {
        setGrant({ ...grant, applicationQuestions: [...grant.applicationQuestions, { questionText: '', questionType: 'text', isRequired: true, points: 10 }] });
    };

    const removeQuestion = (index) => {
        const newQuestions = grant.applicationQuestions.filter((_, i) => i !== index);
        setGrant({ ...grant, applicationQuestions: newQuestions });
    };

    const addPresetQuestion = (question) => {
        if (!grant.applicationQuestions.some(q => q.questionText === question.questionText)) {
            setGrant({ ...grant, applicationQuestions: [...grant.applicationQuestions, {...question}] });
        }
    };

    const handleFormSubmit = async (newStatus) => {
        setLoading(true);
        setError('');
        try {
            const token = user?.token;
            if (!token) throw new Error("Authentication error.");

            const grantData = { ...grant, status: newStatus };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(grantData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create grant');
            navigate('/manage/grants');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Create a New Grant</h1>
            <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit('Active'); }} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2">Grant Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grant Title</label>
                        <input type="text" name="title" value={grant.title} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea name="description" value={grant.description} onChange={handleGrantChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (MYR)</label>
                            <input type="number" name="amount" value={grant.amount} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <input type="text" name="category" value={grant.category} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="e.g., Education, Arts" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Application Deadline</label>
                            <input type="date" name="deadline" value={grant.deadline} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2">Workflow Assignments</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UserAssigner 
                            users={assignableUsers.filter(u => u.role === 'Reviewer')}
                            selectedUsers={grant.reviewers}
                            onChange={(selection) => setGrant(prev => ({ ...prev, reviewers: selection }))}
                            title="Assign Reviewers"
                            icon={<Users size={16}/>}
                        />
                        <UserAssigner 
                            users={assignableUsers.filter(u => u.role === 'Approver')}
                            selectedUsers={grant.approvers}
                            onChange={(selection) => setGrant(prev => ({ ...prev, approvers: selection }))}
                            title="Assign Approvers"
                            icon={<UserCheck size={16}/>}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2">Application Form Builder</h2>
                    <div>
                        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Recommended Questions</h3>
                        <div className="flex flex-wrap gap-2">
                            {presetQuestions.map((q, i) => (
                                <button type="button" key={i} onClick={() => addPresetQuestion(q)} className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full hover:bg-teal-200 transition-colors">
                                    + {q.questionText.split('(')[0].trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 pt-4">Custom Questions</h3>
                    {grant.applicationQuestions.map((q, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question {index + 1}</label>
                                <button type="button" onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                                    <Trash2 size={14}/> Remove
                                </button>
                            </div>
                            <input type="text" name="questionText" value={q.questionText} onChange={(e) => handleQuestionChange(index, e)} placeholder="Enter your question" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                            <div className="grid grid-cols-3 items-center gap-4">
                                <select name="questionType" value={q.questionType} onChange={(e) => handleQuestionChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="text">Short Text</option>
                                    <option value="textarea">Paragraph</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="file">File Upload</option>
                                </select>
                                <div className="flex items-center">
                                    <input type="checkbox" name="isRequired" checked={q.isRequired} onChange={(e) => handleQuestionChange(index, e)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                    <label className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Required</label>
                                </div>
                                <div className="relative">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                      type="number" 
                                      name="points" 
                                      value={q.points} 
                                      onChange={(e) => handleQuestionChange(index, e)} 
                                      className="pl-9 pr-2 py-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                      min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addQuestion} className="w-full py-2 text-indigo-600 border-2 border-dashed border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 flex items-center justify-center gap-2">
                        <PlusCircle size={18}/> Add Custom Question
                    </button>
                </div>

                <div className="flex justify-end gap-4 border-t dark:border-gray-600 pt-6">
                    <button type="button" onClick={() => handleFormSubmit('Draft')} disabled={loading} className="px-6 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center gap-2">
                        <Save size={18} /> Save as Draft
                    </button>
                    <button type="submit" disabled={loading} className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        {loading ? 'Publishing...' : 'Publish Grant'}
                    </button>
                </div>
            </form>
        </div>
    );
}
