// frontend/src/pages/EditGrantPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Award, Users, UserCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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

export default function EditGrantPage() {
    const { id: grantId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState(null);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const isGrantMaker = user?.role === 'Grant Maker';
    const isAffiliatedGrantMaker = isGrantMaker && user?.organization;


    useEffect(() => {
        const fetchGrantAndUsers = async () => {
            if (!user?.token || (isGrantMaker && !isAffiliatedGrantMaker)) return;
            try {
                const grantResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!grantResponse.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantResponse.json();
                if (grantData.deadline) {
                    grantData.deadline = format(new Date(grantData.deadline), 'yyyy-MM-dd');
                }
                setGrant(grantData);

                const usersResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/assignable`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!usersResponse.ok) throw new Error('Could not fetch users.');
                const usersData = await usersResponse.json();
                setAssignableUsers(usersData);

            } catch (err) {
                setError(err.message);
            } finally {
                setPageLoading(false);
            }
        };
        if(user) fetchGrantAndUsers();
    }, [grantId, user, isGrantMaker, isAffiliatedGrantMaker]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = user?.token;
            if (!token) throw new Error("Authentication error.");

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(grant),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update grant');
            navigate('/manage/grants');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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


    if (pageLoading) return <div>Loading grant data...</div>;
    if (error && !grant) return <div className="text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Edit Grant</h1>
            {grant && (
                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2">Grant Details</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grant Title</label>
                            <input type="text" name="title" value={grant.title} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea name="description" value={grant.description} onChange={handleGrantChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (MYR)</label>
                                <input type="number" name="amount" value={grant.amount} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <input type="text" name="category" value={grant.category} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="e.g., Education, Arts" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Application Deadline</label>
                                <input type="date" name="deadline" value={grant.deadline} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select name="status" value={grant.status} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
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
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2">Application Form Questions</h2>
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
                                        <input type="number" name="points" value={q.points} onChange={(e) => handleQuestionChange(index, e)} className="pl-9 pr-2 py-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" min="0"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="w-full py-2 text-indigo-600 border-2 border-dashed border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 flex items-center justify-center gap-2">
                            <PlusCircle size={18}/> Add Custom Question
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </form>
            )}
        </div>
    );
};
