// backend/models/organizationModel.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // The first user to create the org will be the initial admin.
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
