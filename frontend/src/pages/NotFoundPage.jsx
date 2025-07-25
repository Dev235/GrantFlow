// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="text-center py-20 flex flex-col items-center">
            <AlertTriangle className="text-yellow-400" size={64}/>
            <h1 className="text-6xl font-bold text-indigo-600 mt-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
            <p className="text-gray-600 mt-2 max-w-md">Sorry, the page you are looking for does not exist or may have been moved.</p>
            <Link to="/dashboard" className="mt-8 inline-block px-6 py-3 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
                Return to Dashboard
            </Link>
        </div>
    );
}
