    const Center = require("../models/Center");
    const SportActivity = require("../models/SportActivity");
    const SocialActivity = require("../models/SocialActivity");
    const ArtActivity = require("../models/ArtActivity");
    const asyncHandler = require("express-async-handler");

    // @desc    Get all centers
    // @route   GET /api/centers
    // @access  Public
    const getCenters = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Name filter (partial match)
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    // Activity filters by ObjectId
    if (req.query.sportsActivity) {
        filter.sportsActivities = { $in: [req.query.sportsActivity] };
    }
    
    if (req.query.socialActivity) {
        filter.socialActivities = { $in: [req.query.socialActivity] };
    }
    
    if (req.query.artActivity) {
        filter.artActivities = { $in: [req.query.artActivity] };
    }

    // Membership fee filters
    if (req.query.minFirstTimePrice) {
        filter['membership.firstTimePrice'] = { $gte: parseInt(req.query.minFirstTimePrice) };
    }
    
    if (req.query.maxFirstTimePrice) {
        filter['membership.firstTimePrice'] = { 
        ...filter['membership.firstTimePrice'],
        $lte: parseInt(req.query.maxFirstTimePrice) 
        };
    }

    // Search in name and address
    if (req.query.search) {
        filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    const totalCenters = await Center.countDocuments(filter);
    const centers = await Center.find(filter)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: centers.length,
        totalPages: Math.ceil(totalCenters / limit),
        currentPage: page,
        totalCenters,
        Centers: centers
    });
    });

    // @desc    Get single center
    // @route   GET /api/centers/:id
    // @access  Public
    const getCenter = asyncHandler(async (req, res) => {
    const center = await Center.findById(req.params.id)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    res.status(200).json({
        success: true,
        Centers: center
    });
    });

    // @desc    Create new center
    // @route   POST /api/centers
    // @access  Private
    const createCenter = asyncHandler(async (req, res) => {
    const center = await Center.create(req.body);
    
    // Populate the created center
    const populatedCenter = await Center.findById(center._id)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(201).json({
        success: true,
        message: "تم إنشاء المركز بنجاح",
        Centers: populatedCenter
    });
    });

    // @desc    Update center
    // @route   PUT /api/centers/:id
    // @access  Private
    const updateCenter = asyncHandler(async (req, res) => {
    let center = await Center.findById(req.params.id);

    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    center = await Center.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
        new: true,
        runValidators: true
        }
    )
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(200).json({
        success: true,
        message: "تم تحديث المركز بنجاح",
        Centers: center
    });
    });

    // @desc    Delete center
    // @route   DELETE /api/centers/:id
    // @access  Private
    const deleteCenter = asyncHandler(async (req, res) => {
    const center = await Center.findById(req.params.id);

    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    await Center.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "تم حذف المركز بنجاح"
    });
    });

    // @desc    Get centers by activity
    // @route   GET /api/centers/activity/:type/:activityId
    // @access  Public
    const getCentersByActivity = asyncHandler(async (req, res) => {
    const { type, activityId } = req.params;
    
    const validTypes = ['sports', 'social', 'art'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح. يجب أن يكون: sports, social, art"
        });
    }

    const fieldMap = {
        sports: 'sportsActivities',
        social: 'socialActivities',
        art: 'artActivities'
    };

    const filter = {};
    filter[fieldMap[type]] = { $in: [activityId] };

    const centers = await Center.find(filter)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: centers.length,
        Centers: centers
    });
    });

    // @desc    Get all activities
    // @route   GET /api/centers/activities
    // @access  Public
    const getAllActivities = asyncHandler(async (req, res) => {
    const sportsActivities = await SportActivity.find().sort({ name: 1 });
    const socialActivities = await SocialActivity.find().sort({ name: 1 });
    const artActivities = await ArtActivity.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        Centers: {
        sports: sportsActivities,
        social: socialActivities,
        art: artActivities
        }
    });
    });

    // @desc    Get centers statistics
    // @route   GET /api/centers/stats
    // @access  Public
    const getCentersStats = asyncHandler(async (req, res) => {
    const totalCenters = await Center.countDocuments();

    // Get centers with contact info
    const centersWithPhone = await Center.countDocuments({ 
        phone: { $exists: true, $ne: null, $ne: "" } 
    });

    const centersWithAddress = await Center.countDocuments({ 
        address: { $exists: true, $ne: null, $ne: "" } 
    });

    const centersWithLocation = await Center.countDocuments({ 
        location: { $exists: true, $ne: null, $ne: "" } 
    });

    const centersWithImage = await Center.countDocuments({ 
        image: { $exists: true, $ne: null, $ne: "" } 
    });

    const centersWithFacebook = await Center.countDocuments({ 
        facebookLink: { $exists: true, $ne: null, $ne: "" } 
    });

    // Activity statistics
    const centersWithSports = await Center.countDocuments({ 
        sportsActivities: { $exists: true, $not: { $size: 0 } } 
    });
    
    const centersWithSocial = await Center.countDocuments({ 
        socialActivities: { $exists: true, $not: { $size: 0 } } 
    });
    
    const centersWithArt = await Center.countDocuments({ 
        artActivities: { $exists: true, $not: { $size: 0 } } 
    });

    // Membership fee statistics
    const membershipStats = await Center.aggregate([
        {
        $group: {
            _id: null,
            avgFirstTimePrice: { $avg: "$membership.firstTimePrice" },
            minFirstTimePrice: { $min: "$membership.firstTimePrice" },
            maxFirstTimePrice: { $max: "$membership.firstTimePrice" },
            avgRenewalPrice: { $avg: "$membership.renewalPrice" },
            minRenewalPrice: { $min: "$membership.renewalPrice" },
            maxRenewalPrice: { $max: "$membership.renewalPrice" }
        }
        }
    ]);

    // Most popular activities
    const popularSportsActivities = await Center.aggregate([
        { $unwind: "$sportsActivities" },
        { $group: { _id: "$sportsActivities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "sportactivities", localField: "_id", foreignField: "_id", as: "activity" } },
        { $unwind: "$activity" },
        { $project: { name: "$activity.name", count: 1 } }
    ]);

    res.status(200).json({
        success: true,
        Centers: {
        totalCenters,
        contactInfo: {
            withPhone: centersWithPhone,
            withAddress: centersWithAddress,
            withLocation: centersWithLocation,
            withImage: centersWithImage,
            withFacebook: centersWithFacebook
        },
        activities: {
            withSportsActivities: centersWithSports,
            withSocialActivities: centersWithSocial,
            withArtActivities: centersWithArt
        },
        membershipFees: membershipStats[0] || {
            avgFirstTimePrice: 0,
            minFirstTimePrice: 0,
            maxFirstTimePrice: 0,
            avgRenewalPrice: 0,
            minRenewalPrice: 0,
            maxRenewalPrice: 0
        },
        popularActivities: {
            sports: popularSportsActivities
        }
        }
    });
    });

    // @desc    Update center activities
    // @route   PATCH /api/centers/:id/activities
    // @access  Private
    const updateCenterActivities = asyncHandler(async (req, res) => {
    const { sportsActivities, socialActivities, artActivities } = req.body;
    
    const center = await Center.findById(req.params.id);
    
    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    // Validate activity IDs exist
    if (sportsActivities) {
        const validSports = await SportActivity.find({ _id: { $in: sportsActivities } });
        if (validSports.length !== sportsActivities.length) {
        return res.status(400).json({
            success: false,
            message: "بعض الأنشطة الرياضية غير صحيحة"
        });
        }
    }

    if (socialActivities) {
        const validSocial = await SocialActivity.find({ _id: { $in: socialActivities } });
        if (validSocial.length !== socialActivities.length) {
        return res.status(400).json({
            success: false,
            message: "بعض الأنشطة الاجتماعية غير صحيحة"
        });
        }
    }

    if (artActivities) {
        const validArt = await ArtActivity.find({ _id: { $in: artActivities } });
        if (validArt.length !== artActivities.length) {
        return res.status(400).json({
            success: false,
            message: "بعض الأنشطة الفنية غير صحيحة"
        });
        }
    }

    const updateData = {};
    if (sportsActivities !== undefined) updateData.sportsActivities = sportsActivities;
    if (socialActivities !== undefined) updateData.socialActivities = socialActivities;
    if (artActivities !== undefined) updateData.artActivities = artActivities;

    const updatedCenter = await Center.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(200).json({
        success: true,
        message: "تم تحديث أنشطة المركز بنجاح",
        Centers: updatedCenter
    });
    });

    // @desc    Update center membership
    // @route   PATCH /api/centers/:id/membership
    // @access  Private
    const updateCenterMembership = asyncHandler(async (req, res) => {
    const center = await Center.findById(req.params.id);
    
    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    const updatedCenter = await Center.findByIdAndUpdate(
        req.params.id,
        { membership: { ...center.membership?.toObject(), ...req.body } },
        { new: true, runValidators: true }
    )
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(200).json({
        success: true,
        message: "تم تحديث شروط العضوية بنجاح",
        Centers: updatedCenter
    });
    });

    // @desc    Add activity to center
    // @route   POST /api/centers/:id/activities/:type
    // @access  Private
    const addActivityToCenter = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { activityId } = req.body;
    
    const validTypes = ['sports', 'social', 'art'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    const center = await Center.findById(req.params.id);
    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    // Validate activity exists
    const ActivityModel = type === 'sports' ? SportActivity : 
                        type === 'social' ? SocialActivity : ArtActivity;
    
    const activity = await ActivityModel.findById(activityId);
    if (!activity) {
        return res.status(404).json({
        success: false,
        message: "النشاط غير موجود"
        });
    }

    const fieldMap = {
        sports: 'sportsActivities',
        social: 'socialActivities',
        art: 'artActivities'
    };

    const field = fieldMap[type];
    
    // Check if activity is already added
    if (center[field].includes(activityId)) {
        return res.status(400).json({
        success: false,
        message: "النشاط موجود بالفعل في المركز"
        });
    }

    center[field].push(activityId);
    await center.save();

    const updatedCenter = await Center.findById(req.params.id)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(200).json({
        success: true,
        message: "تم إضافة النشاط للمركز بنجاح",
        Centers: updatedCenter
    });
    });

    // @desc    Remove activity from center
    // @route   DELETE /api/centers/:id/activities/:type/:activityId
    // @access  Private
    const removeActivityFromCenter = asyncHandler(async (req, res) => {
    const { type, activityId } = req.params;
    
    const validTypes = ['sports', 'social', 'art'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({
        success: false,
        message: "نوع النشاط غير صحيح"
        });
    }

    const center = await Center.findById(req.params.id);
    if (!center) {
        return res.status(404).json({
        success: false,
        message: "المركز غير موجود"
        });
    }

    const fieldMap = {
        sports: 'sportsActivities',
        social: 'socialActivities',
        art: 'artActivities'
    };

    const field = fieldMap[type];
    center[field] = center[field].filter(id => id.toString() !== activityId);
    await center.save();

    const updatedCenter = await Center.findById(req.params.id)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name');

    res.status(200).json({
        success: true,
        message: "تم إزالة النشاط من المركز بنجاح",
        Centers: updatedCenter
    });
    });

    module.exports = {
    getCenters,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getCentersByActivity,
    getAllActivities,
    getCentersStats,
    updateCenterActivities,
    updateCenterMembership,
    addActivityToCenter,
    removeActivityFromCenter
    };