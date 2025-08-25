    const SportActivity = require("../models/SportActivity");
    const SocialActivity = require("../models/SocialActivity");
    const ArtActivity = require("../models/ArtActivity");
    const asyncHandler = require("express-async-handler");

    // Helper function to get the correct model
    const getActivityModel = (type) => {
    switch (type) {
        case 'sports':
        return SportActivity;
        case 'social':
        return SocialActivity;
        case 'art':
        return ArtActivity;
        default:
        return null;
    }
    };

    // @desc    Get all activities of a specific type
    // @route   GET /api/activities/:type
    // @access  Public
    const getActivitiesByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح. يجب أن يكون: sports, social, art"
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Search filter
    const filter = {};
    if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const totalActivities = await ActivityModel.countDocuments(filter);
    const activities = await ActivityModel.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: activities.length,
        totalPages: Math.ceil(totalActivities / limit),
        currentPage: page,
        totalActivities,
        data: activities
    });
    });

    // @desc    Get single activity
    // @route   GET /api/activities/:type/:id
    // @access  Public
    const getActivity = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    const activity = await ActivityModel.findById(id);

    if (!activity) {
        return res.status(404).json({
        success: false,
        message: "النشاط غير موجود"
        });
    }

    res.status(200).json({
        success: true,
        data: activity
    });
    });

    // @desc    Create new activity
    // @route   POST /api/activities/:type
    // @access  Private (Admin only)
    const createActivity = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    // Check if activity already exists
    const existingActivity = await ActivityModel.findOne({ 
        name: { $regex: `^${req.body.name}$`, $options: 'i' } 
    });

    if (existingActivity) {
        return res.status(400).json({
        success: false,
        message: "النشاط موجود بالفعل"
        });
    }

    const activity = await ActivityModel.create(req.body);

    res.status(201).json({
        success: true,
        message: "تم إنشاء النشاط بنجاح",
        data: activity
    });
    });

    // @desc    Update activity
    // @route   PUT /api/activities/:type/:id
    // @access  Private (Admin only)
    const updateActivity = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    let activity = await ActivityModel.findById(id);

    if (!activity) {
        return res.status(404).json({
        success: false,
        message: "النشاط غير موجود"
        });
    }

    // Check if new name conflicts with existing activity
    if (req.body.name && req.body.name !== activity.name) {
        const existingActivity = await ActivityModel.findOne({ 
        name: { $regex: `^${req.body.name}$`, $options: 'i' },
        _id: { $ne: id }
        });

        if (existingActivity) {
        return res.status(400).json({
            success: false,
            message: "اسم النشاط موجود بالفعل"
        });
        }
    }

    activity = await ActivityModel.findByIdAndUpdate(
        id,
        req.body,
        {
        new: true,
        runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: "تم تحديث النشاط بنجاح",
        data: activity
    });
    });

    // @desc    Delete activity
    // @route   DELETE /api/activities/:type/:id
    // @access  Private (Admin only)
    const deleteActivity = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    const activity = await ActivityModel.findById(id);

    if (!activity) {
        return res.status(404).json({
        success: false,
        message: "النشاط غير موجود"
        });
    }

    // Check if activity is being used by any center
    const Center = require("../models/Center");
    const fieldMap = {
        sports: 'sportsActivities',
        social: 'socialActivities',
        art: 'artActivities'
    };

    const centersUsingActivity = await Center.countDocuments({
        [fieldMap[type]]: { $in: [id] }
    });

    if (centersUsingActivity > 0) {
        return res.status(400).json({
        success: false,
        message: `لا يمكن حذف النشاط لأنه مستخدم في ${centersUsingActivity} مركز`
        });
    }

    await ActivityModel.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "تم حذف النشاط بنجاح"
    });
    });

    // @desc    Get all activities (all types combined)
    // @route   GET /api/activities
    // @access  Public
    const getAllActivities = asyncHandler(async (req, res) => {
    const sports = await SportActivity.find().sort({ name: 1 });
    const social = await SocialActivity.find().sort({ name: 1 });
    const art = await ArtActivity.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        data: {
        sports,
        social,
        art
        },
        totals: {
        sports: sports.length,
        social: social.length,
        art: art.length,
        total: sports.length + social.length + art.length
        }
    });
    });

    // @desc    Bulk create activities
    // @route   POST /api/activities/:type/bulk
    // @access  Private (Admin only)
    const bulkCreateActivities = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { activities } = req.body;
    
    const ActivityModel = getActivityModel(type);
    
    if (!ActivityModel) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    if (!Array.isArray(activities) || activities.length === 0) {
        return res.status(400).json({
        success: false,
        message: "يجب إرسال قائمة من الأنشطة"
        });
    }

    // Filter out duplicates and existing activities
    const existingActivities = await ActivityModel.find({
        name: { $in: activities.map(a => a.name || a) }
    });

    const existingNames = existingActivities.map(a => a.name.toLowerCase());
    
    const newActivities = activities
        .map(a => ({ name: typeof a === 'string' ? a : a.name }))
        .filter(a => a.name && !existingNames.includes(a.name.toLowerCase()));

    if (newActivities.length === 0) {
        return res.status(400).json({
        success: false,
        message: "جميع الأنشطة موجودة بالفعل"
        });
    }

    const createdActivities = await ActivityModel.insertMany(newActivities);

    res.status(201).json({
        success: true,
        message: `تم إنشاء ${createdActivities.length} نشاط بنجاح`,
        data: createdActivities,
        skipped: activities.length - newActivities.length
    });
    });

    // @desc    Search activities across all types
    // @route   GET /api/activities/search
    // @access  Public
    const searchAllActivities = asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
        return res.status(400).json({
        success: false,
        message: "يجب إدخال كلمة للبحث"
        });
    }

    const searchRegex = { $regex: q, $options: 'i' };

    const [sports, social, art] = await Promise.all([
        SportActivity.find({ name: searchRegex }).sort({ name: 1 }),
        SocialActivity.find({ name: searchRegex }).sort({ name: 1 }),
        ArtActivity.find({ name: searchRegex }).sort({ name: 1 })
    ]);

    const results = [
        ...sports.map(activity => ({ ...activity.toObject(), type: 'sports' })),
        ...social.map(activity => ({ ...activity.toObject(), type: 'social' })),
        ...art.map(activity => ({ ...activity.toObject(), type: 'art' }))
    ];

    res.status(200).json({
        success: true,
        query: q,
        count: results.length,
        data: results
    });
    });

    // @desc    Get activity statistics
    // @route   GET /api/activities/stats
    // @access  Public
    const getActivityStats = asyncHandler(async (req, res) => {
    const Center = require("../models/Center");

    const [
        sportsCount,
        socialCount,
        artCount,
        centersWithSports,
        centersWithSocial,
        centersWithArt
    ] = await Promise.all([
        SportActivity.countDocuments(),
        SocialActivity.countDocuments(),
        ArtActivity.countDocuments(),
        Center.countDocuments({ sportsActivities: { $exists: true, $not: { $size: 0 } } }),
        Center.countDocuments({ socialActivities: { $exists: true, $not: { $size: 0 } } }),
        Center.countDocuments({ artActivities: { $exists: true, $not: { $size: 0 } } })
    ]);

    // Most popular activities
    const popularSports = await Center.aggregate([
        { $unwind: "$sportsActivities" },
        { $group: { _id: "$sportsActivities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "sportactivities", localField: "_id", foreignField: "_id", as: "activity" } },
        { $unwind: "$activity" },
        { $project: { _id: "$activity._id", name: "$activity.name", count: 1 } }
    ]);

    const popularSocial = await Center.aggregate([
        { $unwind: "$socialActivities" },
        { $group: { _id: "$socialActivities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "socialactivities", localField: "_id", foreignField: "_id", as: "activity" } },
        { $unwind: "$activity" },
        { $project: { _id: "$activity._id", name: "$activity.name", count: 1 } }
    ]);

    const popularArt = await Center.aggregate([
        { $unwind: "$artActivities" },
        { $group: { _id: "$artActivities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "artactivities", localField: "_id", foreignField: "_id", as: "activity" } },
        { $unwind: "$activity" },
        { $project: { _id: "$activity._id", name: "$activity.name", count: 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
        totalActivities: {
            sports: sportsCount,
            social: socialCount,
            art: artCount,
            total: sportsCount + socialCount + artCount
        },
        centersWithActivities: {
            sports: centersWithSports,
            social: centersWithSocial,
            art: centersWithArt
        },
        popularActivities: {
            sports: popularSports,
            social: popularSocial,
            art: popularArt
        }
        }
    });
    });

    module.exports = {
    getActivitiesByType,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getAllActivities,
    bulkCreateActivities,
    searchAllActivities,
    getActivityStats
    };