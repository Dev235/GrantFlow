import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Tag, DollarSign, Search } from 'lucide-react';

export default function GrantsPage() {
    const [grants, setGrants] = useState([]);
    const [filteredGrants, setFilteredGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGrants = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/grants');
                if (!response.ok) throw new Error('Could not fetch grants from the server.');
                const data = await response.json();
                setGrants(data);
                setFilteredGrants(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrants();
    }, []);

    // Filter grants based on search term
    useEffect(() => {
        const results = grants.filter(grant =>
            grant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grant.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGrants(results);
    }, [searchTerm, grants]);

    if (loading) return <div className="text-center py-10">Loading available grants...</div>;
    if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

    return (
        <div>
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Discover Grants</h1>
                <p className="text-gray-600 mt-2">Find the perfect funding opportunity for your project.</p>
                <div className="mt-4 relative">
                    <input
                        type="text"
                        placeholder="Search by title, category, or keyword..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>

            {filteredGrants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredGrants.map(grant => (
                        <div key={grant._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-100 py-1 px-3 rounded-full">
                                        <Tag size={14}/> {grant.category}
                                    </span>
                                    <span className="text-lg font-bold text-green-600 inline-flex items-center gap-1.5">
                                        <DollarSign size={18}/> {grant.amount.toLocaleString('en-MY', { style: 'currency', currency: 'MYR' })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{grant.title}</h3>
                                <p className="mt-2 text-gray-600 line-clamp-3 flex-grow">{grant.description}</p>
                            </div>
                            <div className="p-6 bg-gray-50 border-t">
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar size={16} className="text-red-500"/>
                                    Apply Before: <span className="font-medium text-red-600">{format(new Date(grant.deadline), 'dd MMMM yyyy')}</span>
                                </p>
                                <button onClick={() => navigate(`/grants/${grant._id}`)} className="mt-4 w-full py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none">
                                    View Details & Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No Grants Found</h3>
                    <p className="text-gray-500 mt-2">Your search for "{searchTerm}" did not match any available grants. Try a different keyword.</p>
                </div>
            )}
        </div>
    );
};
