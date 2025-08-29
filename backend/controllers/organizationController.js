// backend/controllers/organizationController.js
const Organization = require('../models/organizationModel');
const User = require('../models/userModel');
const JoinRequest = require('../models/joinRequestModel');
const { logAction } = require('../utils/auditLogger');


const getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({}).select('name');
        res.json(organizations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getOrganizationMembers = async (req, res) => {
    try {
        let orgIdToQuery;

        // Super Admin can query any org by ID passed in the URL params
        if (req.user.role === 'Super Admin') {
            orgIdToQuery = req.params.id;
            if (!orgIdToQuery) {
                return res.status(400).json({ message: 'Organization ID is required for Super Admin.' });
            }
        } else {
            // Other roles (Reviewer, Approver, Grant Maker) can only see their own organization
            orgIdToQuery = req.user.organization;
            if (!orgIdToQuery) {
                 return res.status(400).json({ message: 'User is not associated with an organization.' });
            }
        }

        const organization = await Organization.findById(orgIdToQuery).populate('members', '-password');

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        res.json(organization.members);

    } catch (error) {
        console.error(error); // Log the actual error for debugging
        res.status(500).json({ message: 'Server Error' });
    }
};

// New function to create a new organization for an existing user
const createOrganization = async (req, res) => {
    const { name } = req.body;
    const userId = req.user._id;

    try {
        // Check if the user is already part of an organization
        const user = await User.findById(userId);
        if (user.organization) {
            return res.status(400).json({ message: 'You are already part of an organization.' });
        }

        const orgExists = await Organization.findOne({ name });
        if (orgExists) {
            return res.status(400).json({ message: 'An organization with this name already exists.' });
        }

        const newOrganization = await Organization.create({
            name,
            admins: [userId],
            members: [userId],
        });
        
        // Update the user's document to link them to the new organization
        user.organization = newOrganization._id;
        user.organizationRole = 'Admin';
        user.joinRequestStatus = 'None';
        await user.save();

        await logAction(req.user, 'ORG_CREATED', { organizationId: newOrganization._id, organizationName: newOrganization.name });
        
        res.status(201).json(newOrganization);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const requestToJoinOrganization = async (req, res) => {
    const { organizationId } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (user.organization) {
            return res.status(400).json({ message: 'You are already part of an organization.' });
        }

        const existingRequest = await JoinRequest.findOne({ user: userId, status: 'Pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending join request.' });
        }

        await JoinRequest.create({ user: userId, organization: organizationId });
        user.joinRequestStatus = 'Pending';
        await user.save();

        res.status(201).json({ message: 'Your request to join has been sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const addOrganizationMember = async (req, res) => {
    const { name, email, password, role } = req.body;
    const { id: organizationId } = req.params;

    try {
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        if (!organization.admins.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to add members.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role,
            organization: organizationId,
            organizationRole: 'Member'
        });

        organization.members.push(newUser._id);
        await organization.save();
        
        await logAction(req.user, 'ORG_MEMBER_ADDED', { organizationId, newUserId: newUser._id, newUserEmail: newUser.email });

        res.status(201).json(newUser);

    } catch (error) {
        res.status(400).json({ message: 'Error adding member', error: error.message });
    }
};

const updateOrganizationMember = async (req, res) => {
    const { orgId, memberId } = req.params;
    const { name, organizationRole } = req.body;

    try {
        const organization = await Organization.findById(orgId);
        if (!organization) return res.status(404).json({ message: 'Organization not found.' });

        const isOrgAdmin = organization.admins.some(adminId => adminId.equals(req.user._id));
        if (!isOrgAdmin && req.user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Not authorized to manage members.' });
        }
        
        const member = await User.findById(memberId);
        if (!member || !member.organization || member.organization.toString() !== orgId) {
            return res.status(404).json({ message: 'Member not found in this organization.' });
        }
        
        if (isOrgAdmin && memberId === req.user._id.toString() && member.organizationRole === 'Admin' && organizationRole === 'Member' && organization.admins.length === 1) {
            return res.status(400).json({ message: 'Cannot demote the last admin of an organization.' });
        }

        member.name = name || member.name;
        
        if (organizationRole && ['Admin', 'Member'].includes(organizationRole)) {
            member.organizationRole = organizationRole;
            if (organizationRole === 'Admin' && !organization.admins.some(adminId => adminId.equals(memberId))) {
                organization.admins.push(memberId);
            } else if (organizationRole === 'Member') {
                organization.admins = organization.admins.filter(id => !id.equals(memberId));
            }
        }

        await member.save();
        await organization.save();
        
        await logAction(req.user, 'ORG_MEMBER_ROLE_CHANGED', { organizationId: orgId, memberId: memberId, newRole: member.organizationRole });

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error updating member', error: error.message });
    }
};

const getJoinRequests = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        const isOrgAdmin = organization.admins.some(adminId => adminId.equals(req.user._id));
        
        if (!isOrgAdmin && req.user.role !== 'Super Admin') {
             return res.status(403).json({ message: 'Not authorized to view join requests for this organization.' });
        }

        const requests = await JoinRequest.find({ organization: req.params.id, status: 'Pending' })
            .populate('user', 'name email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const handleJoinRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body;

    try {
        const request = await JoinRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found.' });

        const organization = await Organization.findById(request.organization);
        if (!organization.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to handle this request.' });
        }

        const userToJoin = await User.findById(request.user);
        if (!userToJoin) {
            await JoinRequest.deleteOne({ _id: requestId });
            return res.status(404).json({ message: 'User not found for this request. Request has been deleted.' });
        }

        if (action === 'approve') {
            request.status = 'Approved';
            userToJoin.organization = request.organization;
            userToJoin.organizationRole = 'Member';
            userToJoin.joinRequestStatus = 'None';
            organization.members.push(userToJoin._id);
            await organization.save();
            await request.save();
            await userToJoin.save();
            logAction(req.user, `ORG_JOIN_REQUEST_${action.toUpperCase()}`, { requestId, userId: userToJoin._id });

        } else if (action === 'reject') { 
            // Update the user's status and delete the join request only
            request.status = 'Rejected';
            userToJoin.joinRequestStatus = 'Rejected';
            await request.save();
            await userToJoin.save();
            
            logAction(req.user, `ORG_JOIN_REQUEST_REJECTED`, { requestId, userId: userToJoin._id });
            
            return res.status(200).json({ message: `Request rejected. The user's account remains active but is not a member of this organization.` });
        } else {
             return res.status(400).json({ message: 'Invalid action specified.' });
        }
        res.json({ message: `Request has been ${action.toLowerCase()}.` });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const removeOrganizationMember = async (req, res) => {
    const { orgId, memberId } = req.params;

    try {
        const organization = await Organization.findById(orgId);
        if (!organization) return res.status(404).json({ message: 'Organization not found.' });

        if (!organization.admins.some(adminId => adminId.equals(req.user._id)) && req.user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Not authorized to remove members.' });
        }

        const member = await User.findById(memberId);
        if (!member || !member.organization || member.organization.toString() !== orgId) {
            return res.status(404).json({ message: 'Member not found in this organization.' });
        }
        
        if (memberId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot remove yourself from the organization.' });
        }

        if (member.organizationRole === 'Admin' && organization.admins.length === 1) {
            return res.status(400).json({ message: 'Cannot remove the last admin of an organization.' });
        }

        member.organization = undefined;
        member.organizationRole = undefined;
        await member.save();

        organization.members.pull(memberId);
        organization.admins.pull(memberId);
        await organization.save();

        await logAction(req.user, 'ORG_MEMBER_REMOVED', { organizationId: orgId, memberId: memberId });

        res.json({ message: 'Member removed successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { 
    getOrganizations, 
    getOrganizationMembers,
    createOrganization, // Add new function to exports
    updateOrganizationMember, 
    removeOrganizationMember,
    requestToJoinOrganization,
    getJoinRequests,
    handleJoinRequest,
    addOrganizationMember
};
