import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ApplyGrantPage() {
    const { id: grantId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrant = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/grants/${grantId}`);
                if (!response.ok) throw new Error('Could not fetch grant details.');
                const data = await response.json();
                setGrant(data);
                // Initialize answers state
                const initialAnswers = {};
                data.applicationQuestions.forEach(q => {
                    initialAnswers[q._id] = '';
                });
                setAnswers(initialAnswers);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrant();
    }, [grantId]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const formattedAnswers = grant.applicationQuestions.map(q => ({
            questionId: q._id,
            questionText: q.questionText,
            answer: answers[q._id] || '',
        }));

        try {
            const response = await fetch(`http://localhost:5000/api/applications/${grantId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ answers: formattedAnswers }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to submit application.');
            }
            alert('Application submitted successfully!');
            navigate('/applications');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading application form...</div>;
    if (error && !grant) return <div className="text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Apply for: {grant?.title}</h1>
            <p className="text-gray-600 mb-6">Please fill out the form below.</p>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                {grant?.applicationQuestions.map((q, index) => (
                    <div key={q._id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {index + 1}. {q.questionText}
                            {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {q.questionType === 'textarea' ? (
                            <textarea
                                value={answers[q._id] || ''}
                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                required={q.isRequired}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows="4"
                            />
                        ) : q.questionType === 'file' ? (
                            <input
                                type="file"
                                onChange={(e) => handleAnswerChange(q._id, e.target.files[0].name)} // Note: Not a real upload, just storing filename
                                required={q.isRequired}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        ) : (
                            <input
                                type={q.questionType}
                                value={answers[q._id] || ''}
                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                required={q.isRequired}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        )}
                    </div>
                ))}
                <button type="submit" disabled={submitting} className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </form>
        </div>
    );
};
