// frontend/src/pages/EditGrantPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Award, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function EditGrantPage() {
    const { id: grantId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState(null);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchGrantAndUsers = async () => {
            if (!user?.token) return;
            try {
                // Fetch grant details
                const grantResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${grantId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!grantResponse.ok) throw new Error('Could not fetch grant details.');
                const grantData = await grantResponse.json();
                if (grantData.deadline) {
                    grantData.deadline = format(new Date(grantData.deadline), 'yyyy-MM-dd');
                }
                setGrant(grantData);

                // Fetch assignable users
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
    }, [grantId, user]);

    const handleMultiSelectChange = (e, field) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setGrant(prev => ({ ...prev, [field]: selectedIds }));
    };

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


    if (pageLoading) return <div>Loading grant data...</div>;
    if (error && !grant) return <div className="text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Grant</h1>
            {grant && (
                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Grant Details</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grant Title</label>
                            <input type="text" name="title" value={grant.title} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={grant.description} onChange={handleGrantChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (MYR)</label>
                                <input type="number" name="amount" value={grant.amount} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input type="text" name="category" value={grant.category} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., Education, Arts" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                                <input type="date" name="deadline" value={grant.deadline} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" value={grant.status} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white">
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                     <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Workflow Assignments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><Users size={16}/> Assign Reviewers</label>
                                <select multiple value={grant.reviewers} onChange={(e) => handleMultiSelectChange(e, 'reviewers')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-32">
                                    {assignableUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><UserCheck size={16}/> Assign Approvers</label>
                                <select multiple value={grant.approvers} onChange={(e) => handleMultiSelectChange(e, 'approvers')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-32">
                                    {assignableUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Application Form Questions</h2>
                        {grant.applicationQuestions.map((q, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-700">Question {index + 1}</label>
                                    <button type="button" onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                                        <Trash2 size={14}/> Remove
                                    </button>
                                </div>
                                <input type="text" name="questionText" value={q.questionText} onChange={(e) => handleQuestionChange(index, e)} placeholder="Enter your question" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <select name="questionType" value={q.questionType} onChange={(e) => handleQuestionChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white">
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Paragraph</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                    <div className="flex items-center">
                                        <input type="checkbox" name="isRequired" checked={q.isRequired} onChange={(e) => handleQuestionChange(index, e)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                        <label className="ml-2 block text-sm text-gray-900">Required</label>
                                    </div>
                                    <div className="relative">
                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="number" name="points" value={q.points} onChange={(e) => handleQuestionChange(index, e)} className="pl-9 pr-2 py-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm" min="0"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="w-full py-2 text-indigo-600 border-2 border-dashed border-indigo-400 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2">
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
