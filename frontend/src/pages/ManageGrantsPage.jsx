// frontend/src/pages/ManageGrantsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, Edit } from 'lucide-react';

export default function ManageGrantsPage() {
    const [myGrants, setMyGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyGrants = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch('http://localhost:5000/api/grants/mygrants', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch your grants.');
                }
                const data = await response.json();
                setMyGrants(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMyGrants();
    }, [user]);

    if (loading) return <div>Loading your grants...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Manage Your Grants</h1>
                <Link to="/manage/create" className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                    <PlusCircle size={20} />
                    Create New Grant
                </Link>
            </div>

            {myGrants.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {myGrants.map(grant => (
                            <li key={grant._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50">
                                <div className="flex-1 mb-4 md:mb-0">
                                    <p className="text-lg font-semibold text-gray-900">{grant.title}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span>Status: <span className={`font-medium ${grant.status === 'Open' ? 'text-green-600' : 'text-red-600'}`}>{grant.status}</span></span>
                                        <span>Deadline: {format(new Date(grant.deadline), 'dd MMM yyyy')}</span>
                                        <span>Amount: RM{grant.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => navigate(`/manage/applications/${grant._id}`)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100">View Applications</button>
                                     {/* UPDATED: Navigate to the new edit page */}
                                     <button onClick={() => navigate(`/manage/grants/edit/${grant._id}`)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 inline-flex items-center gap-1">
                                        <Edit size={16}/> Edit
                                     </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No Grants Created Yet</h3>
                    <p className="text-gray-500 mt-2">Get started by creating your first funding opportunity.</p>
                </div>
            )}
        </div>
    );
}
