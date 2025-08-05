// frontend/src/pages/CreateGrantPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Award, AlertCircle } from 'lucide-react';

export default function CreateGrantPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState({
        title: '',
        description: '',
        amount: '',
        category: '',
        deadline: '',
        applicationQuestions: [{ questionText: '', questionType: 'text', isRequired: true, points: 10 }],
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user && user.verificationStatus !== 'Verified') {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h2 className="mt-4 text-2xl font-bold text-gray-800">Account Not Verified</h2>
                <p className="mt-2 text-gray-600">You must complete your profile and be verified by an administrator before you can create grants.</p>
                <Link to="/profile" className="mt-6 inline-block px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    Go to Profile
                </Link>
            </div>
        );
    }

    // Updated preset questions to be generic and in English
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = user?.token;
            if (!token) throw new Error("Authentication error. Please log in again.");

            const response = await fetch('http://localhost:5000/api/grants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(grant),
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Create a New Grant</h1>
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Grant Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Grant Title</label>
                        <input type="text" name="title" value={grant.title} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={grant.description} onChange={handleGrantChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (MYR)</label>
                            <input type="number" name="amount" value={grant.amount} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <input type="text" name="category" value={grant.category} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Education, Arts" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                            <input type="date" name="deadline" value={grant.deadline} onChange={handleGrantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Application Form Builder</h2>
                    <div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Recommended Questions</h3>
                        <div className="flex flex-wrap gap-2">
                            {presetQuestions.map((q, i) => (
                                <button type="button" key={i} onClick={() => addPresetQuestion(q)} className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full hover:bg-teal-200 transition-colors">
                                    + {q.questionText.split('(')[0].trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 pt-4">Custom Questions</h3>
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
                                {/* NEW: Points input field */}
                                <div className="relative">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                      type="number" 
                                      name="points" 
                                      value={q.points} 
                                      onChange={(e) => handleQuestionChange(index, e)} 
                                      className="pl-9 pr-2 py-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                      min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addQuestion} className="w-full py-2 text-indigo-600 border-2 border-dashed border-indigo-400 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2">
                        <PlusCircle size={18}/> Add Custom Question
                    </button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                    {loading ? 'Publishing Grant...' : 'Publish Grant'}
                </button>
            </form>
        </div>
    );
};
