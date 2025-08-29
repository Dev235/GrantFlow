// backend/controllers/notificationController.js
const Notification = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    try {
        const query = Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

        // Check for a limit query parameter
        if (req.query.limit) {
            const limit = parseInt(req.query.limit, 10);
            if (!isNaN(limit) && limit > 0) {
                query.limit(limit);
            }
        }

        const notifications = await query;
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.user.toString() === req.user._id.toString()) {
            notification.read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
