// frontend/src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user?.token) return;
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const handleNotificationClick = async (notification) => {
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
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Bell />All Notifications</h1>
            {loading ? <p>Loading notifications...</p> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <li 
                                key={notif._id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{notif.message}</p>
                                    {!notif.read && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 ml-4 mt-1"></div>}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(new Date(notif.createdAt), "dd MMM yyyy, h:mm a")}</p>
                            </li>
                        )) : (
                            <li className="p-6 text-center text-gray-500 dark:text-gray-400">You have no notifications.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

