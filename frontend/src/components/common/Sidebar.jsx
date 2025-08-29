// frontend/src/components/common/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
    LogOut, LayoutDashboard, FileText, Edit, FolderKanban, Users, History, 
    Building, UserPlus, Sun, Moon, Eye, CheckSquare, ChevronDown, 
    DollarSign, BookOpen, FileCheck2, Bell
} from 'lucide-react';

const VerificationStatus = ({ status }) => {
    if (status === 'Verified') {
        return <CheckSquare size={16} className="text-green-500" title="Verified" />;
    }
    const tooltip = status === 'Pending' 
        ? 'Verification pending admin approval.' 
        : 'Unverified. Please complete your profile.';
    return <UserPlus size={16} className="text-yellow-500" title={tooltip} />;
};

const NavItem = ({ to, icon, children, count }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`
        }
    >
        <div className="flex items-center gap-3">
            {icon}
            <span>{children}</span>
        </div>
        {count > 0 && (
            <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{count}</span>
        )}
    </NavLink>
);

const CollapsibleMenu = ({ title, icon, children, isOpen, onClick }) => {
    const hasChildren = React.Children.count(children) > 0;
    if (!hasChildren) return null;

    return (
        <div>
            <button
                onClick={onClick}
                className="flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`pl-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};


export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || (user.role !== 'Reviewer' && user.role !== 'Approver')) return;
            const type = user.role.toLowerCase();
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/grants/${type}/count`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                const data = await response.json();
                setNotificationCount(data.count);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
        fetchNotifications();
    }, [user]);

    const handleMenuClick = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
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
    ];

    const grantMakerLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
        { name: 'Join Requests', path: '/organization/requests', icon: <UserPlus size={18}/> },
    ];
    

    const superAdminLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'User Management', path: '/admin/users', icon: <Users size={18}/> },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
        { name: 'Audit Log', path: '/admin/audit', icon: <History size={18}/> },
    ];
    
    const reviewerLinks = [
        { name: 'Review Dashboard', path: '/review', icon: <Eye size={18}/>, count: notificationCount },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
    ];

    const approverLinks = [
        { name: 'Approval Dashboard', path: '/approval', icon: <CheckSquare size={18}/>, count: notificationCount },
        { name: 'Organization', path: '/organization', icon: <Building size={18}/> },
    ];
    
    const getRoleSpecificLinks = () => {
        if (!user) return [];
        switch (user.role) {
            case 'Applicant': return applicantLinks;
            case 'Grant Maker': return grantMakerLinks;
            case 'Super Admin': return superAdminLinks;
            case 'Reviewer': return reviewerLinks;
            case 'Approver': return approverLinks;
            default: return [];
        }
    };

    const getApplicationSubMenu = () => {
        switch (user?.role) {
            case 'Applicant':
                return [{ name: 'My Applications', path: '/applications', icon: <FolderKanban size={16}/> }];
            case 'Grant Maker':
                return [
                    { name: 'Create Grant', path: '/manage/create', icon: <Edit size={16}/> },
                    { name: 'Manage Grants', path: '/manage/grants', icon: <FolderKanban size={16}/> }
                ];
            case 'Super Admin':
                return [{ name: 'Manage All Grants', path: '/manage/grants', icon: <FolderKanban size={16}/> }];
            default:
                return [];
        }
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    GrantFlow
                </Link>
            </div>
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                <CollapsibleMenu title="Application" icon={<FileText size={18}/>} isOpen={openMenu === 'application'} onClick={() => handleMenuClick('application')}>
                    {getApplicationSubMenu().map(link => <NavItem key={link.name} to={link.path} icon={link.icon}>{link.name}</NavItem>)}
                </CollapsibleMenu>
                <CollapsibleMenu title="Disbursement" icon={<DollarSign size={18}/>} isOpen={openMenu === 'disbursement'} onClick={() => handleMenuClick('disbursement')}>
                    {/* Placeholder for disbursement links */}
                </CollapsibleMenu>
                <CollapsibleMenu title="Reporting" icon={<FileCheck2 size={18}/>} isOpen={openMenu === 'reporting'} onClick={() => handleMenuClick('reporting')}>
                    {/* Placeholder for reporting links */}
                </CollapsibleMenu>
                
                <div className="pt-2">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Other Pages</p>
                    {getRoleSpecificLinks().map(link => (
                        <NavItem key={link.name} to={link.path} icon={link.icon} count={link.count}>
                            {link.name}
                        </NavItem>
                    ))}
                </div>
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <Link to="/profile">
                        <img 
                            src={user.profile?.profilePictureUrl ? `${import.meta.env.VITE_API_BASE_URL}${user.profile.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    </Link>
                    <div className="flex-1">
                        <Link to="/profile" className="font-semibold text-sm text-gray-800 dark:text-white hover:underline">{user.name}</Link>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {user.role !== 'Super Admin' && <VerificationStatus status={user.verificationStatus} />}
                            <span>{user.role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle theme">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-500" aria-label="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

