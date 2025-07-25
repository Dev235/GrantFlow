import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Tag, DollarSign, ArrowLeft } from 'lucide-react';

export default function GrantDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [grant, setGrant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrant = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/grants/${id}`);
                if (!response.ok) throw new Error('Grant not found.');
                const data = await response.json();
                setGrant(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrant();
    }, [id]);

    if (loading) return <div>Loading grant details...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!grant) return <div>Grant not found.</div>;

    return (
        <div>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                <ArrowLeft size={18} />
                Back to Grants
            </button>
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-100 py-1 px-3 rounded-full">
                        <Tag size={14}/> {grant.category}
                    </span>
                    <span className="text-2xl font-bold text-green-600 inline-flex items-center gap-1.5">
                        <DollarSign size={22}/> {grant.amount.toLocaleString('en-MY', { style: 'currency', currency: 'MYR' })}
                    </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">{grant.title}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                    <Calendar size={16} className="text-red-500"/>
                    Application Deadline: <span className="font-medium text-red-600">{format(new Date(grant.deadline), 'dd MMMM yyyy')}</span>
                </p>
                <div className="prose max-w-none mt-6 text-gray-700">
                    <p>{grant.description}</p>
                </div>
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Application Questions</h3>
                    <ul className="list-decimal list-inside space-y-2 text-gray-600">
                        {grant.applicationQuestions.map(q => (
                            <li key={q._id}>{q.questionText} <span className="text-red-500">{q.isRequired && '*'}</span></li>
                        ))}
                    </ul>
                </div>
                {user && user.role === 'Applicant' && (
                    <div className="mt-8 text-center">
                        <Link to={`/grants/${id}/apply`} className="w-full md:w-auto inline-block px-10 py-3 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 text-lg">
                            Apply Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
