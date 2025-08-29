// frontend/src/components/common/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]); // limited list for dropdown
    const [unreadCount, setUnreadCount] = useState(0); // badge count
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchData = async () => {
        if (!user?.token) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.filter(n => !n.read).length);
                setNotifications(data.slice(0, 3)); // show latest 3
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // poll every minute
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        setIsOpen(false);
        navigate(notification.link);
        if (!notification.read) {
            try {
                await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notification._id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                fetchData(); // refresh badge + list
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            fetchData();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 overflow-hidden z-40">
                    {/* Header */}
                    <div className="p-3 flex justify-between items-center border-b dark:border-gray-700">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                <CheckCheck size={14} /> Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <ul className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((notif) => (
                            <li
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-3 text-sm border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.read ? 'font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                                <p className={`text-xs ${!notif.read ? 'text-indigo-500' : 'text-gray-400'}`}>
                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </p>
                            </li>
                        )) : (
                            <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                You have no new notifications.
                            </li>
                        )}
                    </ul>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/50 text-center">
                        <button
                            onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                            className="w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1"
                        >
                            <BookOpen size={14} /> View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
