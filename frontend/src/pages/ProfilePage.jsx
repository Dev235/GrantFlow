// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { API_BASE_URL } from '../apiConfig';


export default function ProfilePage() {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        profile: {
            address: '',
            icNumber: '',
            icPictureUrl: '',
            emergencyContact: '',
            age: '',
            incomeGroup: '',
            income: '',
            race: '',
            gender: '',
            profilePictureUrl: '',
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);


    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                profile: {
                    address: user.profile?.address || '',
                    icNumber: user.profile?.icNumber || '',
                    icPictureUrl: user.profile?.icPictureUrl || '',
                    emergencyContact: user.profile?.emergencyContact || '',
                    age: user.profile?.age || '',
                    incomeGroup: user.profile?.incomeGroup || '',
                    income: user.profile?.income || '',
                    race: user.profile?.race || '',
                    gender: user.profile?.gender || '',
                    profilePictureUrl: user.profile?.profilePictureUrl || '',
                }
            });
        }
    }, [user]);

    const formatIC = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 6) {
            return digits;
        }
        if (digits.length <= 8) {
            return `${digits.slice(0, 6)}-${digits.slice(6)}`;
        }
        return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 12)}`;
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'icNumber') {
            finalValue = formatIC(value);
        }
        setFormData(prev => ({
            ...prev,
            profile: { ...prev.profile, [name]: finalValue }
        }));
    };

    const handleFileChange = async (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: uploadFormData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setFormData(prev => ({
                ...prev,
                profile: { ...prev.profile, [name]: data.filePath }
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    const proceedWithUpdate = async () => {
        setIsConfirmModalOpen(false);
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const submissionData = { ...formData };
            if (!submissionData.password) {
                delete submissionData.password;
            }

            const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(submissionData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            login(data); 
            setSuccess('Profile updated successfully! If you were already verified, your status is now pending re-verification.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- VALIDATION ---
        if (formData.profile.age && parseInt(formData.profile.age, 10) < 21) {
            setError('You must be at least 21 years old.');
            return;
        }
        const icRegex = /^\d{6}-\d{2}-\d{4}$/;
        if (formData.profile.icNumber && !icRegex.test(formData.profile.icNumber)) {
            setError('Invalid IC number format. Please use XXXXXX-XX-XXXX.');
            return;
        }
        // --- END VALIDATION ---

        // --- CONFIRMATION LOGIC ---
        if (user.verificationStatus === 'Verified') {
            setIsConfirmModalOpen(true);
        } else {
            proceedWithUpdate();
        }
    };

    const VerificationBanner = () => {
        if (user.role === 'Super Admin') return null;
        if (user.verificationStatus === 'Verified') {
            return (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} /> Your profile is verified. Note: Changing details will require re-verification.
                </div>
            )
        }
        if (user.verificationStatus === 'Pending') {
            return (
                <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} /> Your profile is pending verification from an administrator.
                </div>
            )
        }
        return (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} /> Your profile is unverified. Please complete all fields to submit for verification.
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
                <VerificationBanner />

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" value={formData.email} disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300" placeholder="Leave blank to keep current password" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Personal Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea name="address" value={formData.profile.address} onChange={handleProfileChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="icNumber" value={formData.profile.icNumber} onChange={handleProfileChange} placeholder="IC Number (e.g., 900101-10-1234)" className="rounded-md border-gray-300" maxLength="15" />
                        <input type="text" name="emergencyContact" value={formData.profile.emergencyContact} onChange={handleProfileChange} placeholder="Emergency Contact (e.g., 012-3456789)" className="rounded-md border-gray-300" />
                        <input type="number" name="age" value={formData.profile.age} onChange={handleProfileChange} placeholder="Age" className="rounded-md border-gray-300" min="0" />
                        <select name="gender" value={formData.profile.gender} onChange={handleProfileChange} className="rounded-md border-gray-300">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select name="race" value={formData.profile.race} onChange={handleProfileChange} className="rounded-md border-gray-300">
                            <option value="">Select Race</option>
                            <option value="Malay">Malay</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Indian">Indian</option>
                            <option value="Other">Other</option>
                        </select>
                        <select name="incomeGroup" value={formData.profile.incomeGroup} onChange={handleProfileChange} className="rounded-md border-gray-300">
                            <option value="">Select Income Group</option>
                            <option value="B40">B40</option>
                            <option value="M40">M40</option>
                            <option value="T20">T20</option>
                        </select>
                        <input type="number" name="income" value={formData.profile.income} onChange={handleProfileChange} placeholder="Monthly Income (MYR)" className="rounded-md border-gray-300" min="0" />
                    </div>
                </div>

                <div className="space-y-4">
                     <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Documents & Images</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                            <input type="file" name="profilePictureUrl" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                            {formData.profile.profilePictureUrl && <img src={`${API_BASE_URL}${formData.profile.profilePictureUrl}`} alt="Profile Preview" className="mt-2 h-24 w-24 rounded-full object-cover"/>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">IC Picture</label>
                            <input type="file" name="icPictureUrl" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                             {formData.profile.icPictureUrl && <img src={`${API_BASE_URL}${formData.profile.icPictureUrl}`} alt="IC Preview" className="mt-2 h-32 rounded-lg object-contain"/>}
                        </div>
                     </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2">
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={proceedWithUpdate}
                title="Confirm Profile Update"
            >
                Are you sure you want to update your profile? Your account status will be set to "Pending" and will require re-verification by an administrator.
            </ConfirmationModal>
        </div>
    );
};
