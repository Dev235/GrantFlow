// frontend/src/components/dashboard/StatCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function StatCard({ icon, title, value, color, linkTo }) {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-500 dark:text-yellow-400',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-500 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400',
        teal: 'bg-teal-100 dark:bg-teal-900/50 text-teal-500 dark:text-teal-400',
        pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-500 dark:text-pink-400',
        gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400',
    };

    const cardContent = (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
            <div className={`p-3 rounded-full ${colors[color] || 'bg-gray-100 dark:bg-gray-700'}`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );

    if (linkTo) {
        return <Link to={linkTo}>{cardContent}</Link>;
    }

    return cardContent;
};
