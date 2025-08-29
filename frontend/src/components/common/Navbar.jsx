// src/components/common/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, FileText, Edit, FolderKanban, UserCircle, Users, History, AlertCircle, CheckCircle, Building, UserPlus } from 'lucide-react';

const VerificationStatus = ({ status }) => {
    if (status === 'Verified') {
        return <CheckCircle size={16} className="text-green-500" title="Verified" />;
    }
    const tooltip = status === 'Pending' 
        ? 'Verification pending admin approval. You can still edit your profile.' 
        : 'Unverified. Please complete your profile information.';
    return <AlertCircle size={16} className="text-yellow-500" title={tooltip} />;
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });
        } catch (error) {
            console.error('Failed to log logout action on server:', error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const applicantLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'Discover Grants', path: '/grants', icon: <FileText size={18}/> },
        { name: 'My Applications', path: '/applications', icon: <FolderKanban size={18}/> },
    ];

    const grantMakerLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'Create Grant', path: '/manage/create', icon: <Edit size={18}/> },
        { name: 'Manage Grants', path: '/manage/grants', icon: <FolderKanban size={18}/> },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
        { name: 'Join Requests', path: '/organization/requests', icon: <UserPlus size={18}/> },
    ];
    

    const superAdminLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'User Management', path: '/admin/users', icon: <Users size={18}/> },
        { name: 'Manage All Grants', path: '/manage/grants', icon: <FolderKanban size={18}/> },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
        { name: 'Audit Log', path: '/admin/audit', icon: <History size={18}/> },
    ];

    const getNavLinks = () => {
        if (!user) return [];
        switch (user.role) {
            case 'Applicant': return applicantLinks;
            case 'Grant Maker': return grantMakerLinks;
            case 'Super Admin': return superAdminLinks;
            default: return [];
        }
    };
    
    const navLinks = getNavLinks();

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="text-2xl font-bold text-indigo-600">
                        GrantFlow
                    </Link>
                    {user && (
                        <nav className="hidden md:flex items-center space-x-6">
                            {navLinks.map(link => (
                                <Link key={link.name} to={link.path} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                                    {link.icon}
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            ))}
                        </nav>
                    )}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/profile" className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                   <img 
                                        src={user.profile?.profilePictureUrl ? `${import.meta.env.VITE_API_BASE_URL}${user.profile.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                                        alt="Profile" 
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                   <span className="text-gray-700 font-medium hidden sm:block">{user.name}</span>
                                   {user.role !== 'Super Admin' && <VerificationStatus status={user.verificationStatus} />}
                                </Link>
                                <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600" aria-label="Logout">
                                    <LogOut size={20} />
                                </button>
                            </>
                        ) : (
                            <div className="space-x-2">
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">Login</Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
