import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function ApplyGrantPage() {
    const { id: grantId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    // State to manage file upload status for each question
    const [fileUploadStatus, setFileUploadStatus] = useState({});

    useEffect(() => {
        const fetchGrant = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/grants/${grantId}`);
                if (!response.ok) throw new Error('Could not fetch grant details.');
                const data = await response.json();
                setGrant(data);
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

    if (user && user.verificationStatus !== 'Verified') {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h2 className="mt-4 text-2xl font-bold text-gray-800">Account Not Verified</h2>
                <p className="mt-2 text-gray-600">You must complete your profile and be verified by an administrator before you can apply for grants.</p>
                <Link to="/profile" className="mt-6 inline-block px-6 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    Go to Profile
                </Link>
            </div>
        );
    }

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // --- New Function to Handle File Uploads ---
    const handleFileChange = async (questionId, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setFileUploadStatus(prev => ({ ...prev, [questionId]: { status: 'uploading' } }));

        try {
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'File upload failed.');
            }

            // On success, update the answer with the file path from the server
            handleAnswerChange(questionId, data.filePath);
            setFileUploadStatus(prev => ({ ...prev, [questionId]: { status: 'success', name: file.name } }));

        } catch (err) {
            console.error(err);
            setFileUploadStatus(prev => ({ ...prev, [questionId]: { status: 'error', message: err.message } }));
            // Clear the answer if upload fails
            handleAnswerChange(questionId, '');
        }
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
                            <div className="mt-1">
                                <input
                                    type="file"
                                    id={`file-upload-${q._id}`}
                                    onChange={(e) => handleFileChange(q._id, e.target.files[0])}
                                    required={q.isRequired && !answers[q._id]}
                                    className="hidden"
                                />
                                <label htmlFor={`file-upload-${q._id}`} className="relative flex justify-center w-full px-6 py-10 text-center bg-white border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-indigo-500">
                                    <div className="text-gray-600">
                                        <UploadCloud className="w-8 h-8 mx-auto text-gray-400" />
                                        <p className="mt-1 text-sm">Click to upload a file</p>
                                        <p className="text-xs text-gray-500">PNG, JPG, or PDF up to 5MB</p>
                                    </div>
                                </label>
                                {fileUploadStatus[q._id]?.status === 'uploading' && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                                {fileUploadStatus[q._id]?.status === 'success' && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                                        <CheckCircle size={16} />
                                        <span>{fileUploadStatus[q._id].name} uploaded successfully.</span>
                                    </div>
                                )}
                                {fileUploadStatus[q._id]?.status === 'error' && (
                                     <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                        <AlertCircle size={16} />
                                        <span>Error: {fileUploadStatus[q._id].message}</span>
                                    </div>
                                )}
                            </div>
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
