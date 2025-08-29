// frontend/src/components/common/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        if (!user?.token) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
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
                fetchNotifications(); // Refresh notifications
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 overflow-hidden z-20">
                    <div className="p-3 font-semibold text-sm border-b dark:border-gray-700">Notifications</div>
                    <ul className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <li key={notif._id} onClick={() => handleNotificationClick(notif)} className={`p-3 text-sm border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.read ? 'font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                                <p className={`text-xs ${!notif.read ? 'text-indigo-500' : 'text-gray-400'}`}>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                            </li>
                        )) : (
                            <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">You have no new notifications.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
