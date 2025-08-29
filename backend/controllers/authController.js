// backend/controllers/authController.js
const User = require('../models/userModel');
const Organization = require('../models/organizationModel');
const JoinRequest = require('../models/joinRequestModel');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../utils/auditLogger');

const registerUser = async (req, res) => {
  const { name, email, password, role, organizationId, newOrganizationName } = req.body;
  
  // Convert email to lowercase for consistent storage and lookup
  const normalizedEmail = email.toLowerCase();

  try {
    const userExists = await User.findOne({ email: normalizedEmail, role });
    if (userExists) {
      res.status(400);
      throw new Error(`A user with this email already exists for the ${role} role.`);
    }

    let organization = null;
    let orgRole = null;
    let joinStatus = 'None';

    const user = await User.create({
      name,
      email: normalizedEmail, // Use the normalized email
      password,
      role,
      joinRequestStatus: joinStatus,
    });

    if (role === 'Grant Maker') {
        if (newOrganizationName) {
            const orgExists = await Organization.findOne({ name: newOrganizationName });
            if (orgExists) {
                throw new Error('An organization with this name already exists.');
            }
            organization = new Organization({ 
                name: newOrganizationName,
                admins: [user._id],
                members: [user._id]
            });
            await organization.save();
            
            user.organization = organization._id;
            user.organizationRole = 'Admin';

        } else if (organizationId) {
            organization = await Organization.findById(organizationId);
            if (!organization) throw new Error('Selected organization not found.');
            
            await JoinRequest.create({ user: user._id, organization: organizationId });
            user.joinRequestStatus = 'Pending';

        } else {
            throw new Error('Grant Makers must create or join an organization.');
        }
    }
    
    await user.save();

    if (user) {
      await logAction(user, 'USER_REGISTER', { email: user.email, role: user.role });
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        organizationRole: user.organizationRole,
        verificationStatus: user.verificationStatus,
        joinRequestStatus: user.joinRequestStatus,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  
  // Convert email to lowercase for consistent lookup
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail, role }); // Use normalized email in query

    if (user && (await user.matchPassword(password))) {
      await logAction(user, 'USER_LOGIN', { email: user.email });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        organizationRole: user.organizationRole,
        verificationStatus: user.verificationStatus,
        joinRequestStatus: user.joinRequestStatus,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials for the selected role.' });
    }
  } catch (error) {
     res.status(res.statusCode || 500).json({ message: error.message });
  }
};

const logoutUser = async (req, res) => {
    try {
        await logAction(req.user, 'USER_LOGOUT', { email: req.user.email });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout' });
    }
};


module.exports = { registerUser, loginUser, logoutUser };
