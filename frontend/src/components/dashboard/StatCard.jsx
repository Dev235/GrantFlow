// src/components/dashboard/StatCard.jsx
import React from 'react';

export default function StatCard({ icon, title, value, color }) {
    const colors = {
        blue: 'bg-blue-100 text-blue-500',
        yellow: 'bg-yellow-100 text-yellow-500',
        green: 'bg-green-100 text-green-500',
        red: 'bg-red-100 text-red-500',
        indigo: 'bg-indigo-100 text-indigo-500',
        teal: 'bg-teal-100 text-teal-500',
        pink: 'bg-pink-100 text-pink-500',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colors[color] || 'bg-gray-100'}`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};
