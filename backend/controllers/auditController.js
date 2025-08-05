// backend/controllers/auditController.js
const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel');

// @desc    Get all audit logs with advanced filtering and pagination
// @route   GET /api/audit
// @access  Private (Super Admin)
const getAuditLogs = async (req, res) => {
    try {
        const { role, searchName, startDate, endDate, action, page = 1, limit = 15 } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let pipeline = [];

        // Step 1: Use $lookup to join with the users collection
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        });
        
        // Step 2: Unwind the userDetails array to de-normalize it
        pipeline.push({ $unwind: '$userDetails' });

        // Step 3: Build a dynamic $match stage based on query parameters
        const matchStage = {};

        if (role) {
            matchStage['userDetails.role'] = role;
        }

        if (searchName) {
            matchStage['userDetails.name'] = { $regex: searchName, $options: 'i' };
        }

        if (action) {
            matchStage.action = action;
        }

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) {
                const startOfDay = new Date(startDate);
                startOfDay.setHours(0, 0, 0, 0);
                matchStage.createdAt.$gte = startOfDay;
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                matchStage.createdAt.$lte = endOfDay;
            }
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        
        // Step 4: Use $facet to get both paginated data and total count
        pipeline.push({
            $facet: {
                logs: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limitNum },
                    {
                        $project: {
                            _id: 1,
                            action: 1,
                            details: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            user: {
                                _id: '$userDetails._id',
                                name: '$userDetails.name',
                                email: '$userDetails.email',
                                role: '$userDetails.role'
                            }
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        });

        const results = await AuditLog.aggregate(pipeline);

        const logs = results[0].logs;
        const totalCount = results[0].totalCount.length > 0 ? results[0].totalCount[0].count : 0;

        res.json({
            logs,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            totalLogs: totalCount
        });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getAuditLogs };
