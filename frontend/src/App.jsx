// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

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
import ProfilePage from './pages/ProfilePage'; // Import ProfilePage


// Component Imports
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Chatbot from './components/chatbot/Chatbot';

// Main App Component that sets up the provider and router
function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
                    <AppContent />
                </div>
            </AuthProvider>
        </Router>
    );
}

// Renders the main content, allowing use of hooks that need the Router context
const AppContent = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    const showLayout = !['/login', '/register'].includes(location.pathname);

    return (
        <>
            {showLayout && <Navbar />}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/grants" element={<GrantsPage />} />
                    <Route path="/grants/:id" element={<GrantDetailsPage />} />

                    {/* --- Protected Routes --- */}
                    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                    
                    {/* Applicant Routes */}
                    <Route path="/applications" element={<ProtectedRoute roles={['Applicant']}><MyApplicationsPage /></ProtectedRoute>} />
                    <Route path="/grants/:id/apply" element={<ProtectedRoute roles={['Applicant']}><ApplyGrantPage /></ProtectedRoute>} />

                    {/* Grant Maker Routes */}
                    <Route path="/manage/create" element={<ProtectedRoute roles={['Grant Maker']}><CreateGrantPage /></ProtectedRoute>} />
                    <Route path="/manage/grants" element={<ProtectedRoute roles={['Grant Maker', 'Super Admin']}><ManageGrantsPage /></ProtectedRoute>} />
                    <Route path="/manage/grants/edit/:id" element={<ProtectedRoute roles={['Grant Maker']}><EditGrantPage /></ProtectedRoute>} />
                    <Route path="/manage/applications/:grantId" element={<ProtectedRoute roles={['Grant Maker', 'Super Admin']}><ApplicationViewerPage /></ProtectedRoute>} />

                    {/* Super Admin Routes */}
                    <Route path="/admin/users" element={<ProtectedRoute roles={['Super Admin']}><UserManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/audit" element={<ProtectedRoute roles={['Super Admin']}><AuditLogPage /></ProtectedRoute>} />


                    {/* Fallback Route */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            {showLayout && <Footer />}
            {user && user.role === 'Applicant' && <Chatbot />}
        </>
    );
};

export default App;
