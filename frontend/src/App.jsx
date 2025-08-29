// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Page Imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GrantsPage from './pages/GrantsPage';
import CreateGrantPage from './pages/CreateGrantPage';
import EditGrantPage from './pages/EditGrantPage';
import ManageGrantsPage from './pages/ManageGrantsPage';
import ApplyGrantPage from './pages/ApplyGrantPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import NotFoundPage from './pages/NotFoundPage';
import GrantDetailsPage from './pages/GrantDetailsPage';
import ApplicationViewerPage from './pages/ApplicationViewerPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogPage from './pages/AuditLogPage';
import ProfilePage from './pages/ProfilePage';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import JoinOrganizationPage from './pages/JoinOrganizationPage';
import ManageJoinRequestsPage from './pages/ManageJoinRequestsPage';
import ReviewerPage from './pages/ReviewerPage';
import ApproverPage from './pages/ApproverPage';
import NotificationsPage from './pages/NotificationsPage'; // Import the new page

// Component Imports
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Chatbot from './components/chatbot/Chatbot';

// Main App Component that sets up the provider and router
function App() {
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

// Renders the main content, allowing use of hooks that need the Router context
const AppContent = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    const showLayout = !['/login', '/register'].includes(location.pathname);

    if (!showLayout) {
        return (
             <div className="bg-gray-100 dark:bg-gray-900">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/grants" element={<GrantsPage />} />
                        <Route path="/grants/:id" element={<GrantDetailsPage />} />

                        {/* --- Protected Routes --- */}
                        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

                        {/* Applicant Routes */}
                        <Route path="/applications" element={<ProtectedRoute roles={['Applicant']}><MyApplicationsPage /></ProtectedRoute>} />
                        <Route path="/grants/:id/apply" element={<ProtectedRoute roles={['Applicant']}><ApplyGrantPage /></ProtectedRoute>} />

                        {/* Grant Maker Routes */}
                        <Route path="/manage/create" element={<ProtectedRoute roles={['Grant Maker']}><CreateGrantPage /></ProtectedRoute>} />
                        <Route path="/manage/grants" element={<ProtectedRoute roles={['Grant Maker', 'Super Admin']}><ManageGrantsPage /></ProtectedRoute>} />
                        <Route path="/manage/grants/edit/:id" element={<ProtectedRoute roles={['Grant Maker']}><EditGrantPage /></ProtectedRoute>} />
                        <Route path="/manage/applications/:grantId" element={<ProtectedRoute roles={['Grant Maker', 'Super Admin', 'Reviewer', 'Approver']}><ApplicationViewerPage /></ProtectedRoute>} />
                        <Route path="/organization" element={<ProtectedRoute roles={['Grant Maker', 'Super Admin', 'Reviewer', 'Approver']}><OrganizationManagementPage /></ProtectedRoute>} />
                        <Route path="/organization/join" element={<ProtectedRoute roles={['Grant Maker']}><JoinOrganizationPage /></ProtectedRoute>} />
                        <Route path="/organization/requests" element={<ProtectedRoute roles={['Grant Maker']}><ManageJoinRequestsPage /></ProtectedRoute>} />

                        {/* Reviewer & Approver Routes */}
                        <Route path="/review" element={<ProtectedRoute roles={['Reviewer']}><ReviewerPage /></ProtectedRoute>} />
                        <Route path="/approval" element={<ProtectedRoute roles={['Approver']}><ApproverPage /></ProtectedRoute>} />

                        {/* Super Admin Routes */}
                        <Route path="/admin/users" element={<ProtectedRoute roles={['Super Admin']}><UserManagementPage /></ProtectedRoute>} />
                        <Route path="/admin/audit" element={<ProtectedRoute roles={['Super Admin']}><AuditLogPage /></ProtectedRoute>} />

                        {/* Fallback Route */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
            {user && user.role === 'Applicant' && <Chatbot />}
        </div>
    );
};

export default App;

