// backend/models/notificationModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { // The user who will receive the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: { // A URL to navigate to when the notification is clicked
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

