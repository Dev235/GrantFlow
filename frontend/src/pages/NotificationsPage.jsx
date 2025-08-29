// frontend/src/pages/NotificationsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell, CheckCheck, Search } from 'lucide-react';

export default function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All' or 'Unread'

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
    
    const handleMarkAllRead = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            fetchNotifications(); // Refresh the list
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        navigate(notification.link);
        if (!notification.read) {
            try {
                await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notification._id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                // Optimistically update the UI before refetching
                setNotifications(prev => prev.map(n => 
                    n._id === notification._id ? { ...n, read: true } : n
                ));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    };
    
    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => {
                if (statusFilter === 'Unread') return !n.read;
                return true;
            })
            .filter(n => 
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [notifications, statusFilter, searchTerm]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    return (
        <div className="fixed top-16 right-6 z-50 w-96 max-h-[80vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Bell /> Notifications
                </h1>
                {unreadCount > 0 && (
                    <button 
                        onClick={handleMarkAllRead} 
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <CheckCheck size={16} /> Mark All Read
                    </button>
                )}
            </div>

            {/* Search & Filter */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md flex flex-col gap-3">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setStatusFilter('All')} 
                        className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setStatusFilter('Unread')} 
                        className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'Unread' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}
                    >
                        Unread
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            {loading ? <p>Loading notifications...</p> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredNotifications.length > 0 ? filteredNotifications.map(notif => (
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
                            <li className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No notifications match your criteria.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
