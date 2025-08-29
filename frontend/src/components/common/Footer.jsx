// src/components/common/Footer.jsx
import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
            <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} GrantFlow Malaysia. All Rights Reserved.</p>
                 <p className="text-sm mt-1">Empowering Change, One Grant at a Time.</p>
            </div>
        </footer>
    );
};

