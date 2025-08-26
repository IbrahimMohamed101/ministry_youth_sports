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
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Name filter (partial match)
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    // Location area filter
    if (req.query.LocationArea) {
        filter.LocationArea = { $regex: req.query.LocationArea, $options: 'i' };
    }

    // Region filter
    if (req.query.region) {
        filter.region = { $regex: req.query.region, $options: 'i' };
    }

    // Phone filter
    if (req.query.phone) {
        filter.phone = { $regex: req.query.phone, $options: 'i' };
    }

    // Address filter
    if (req.query.address) {
        filter.address = { $regex: req.query.address, $options: 'i' };
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

    // General search in name and address
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { address: { $regex: req.query.search, $options: 'i' } },
            { region: { $regex: req.query.search, $options: 'i' } }
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

// @desc    Get centers by LocationArea (المنطقة الشرقية، الغربية، إلخ)
// @route   GET /api/centers/by-location-area/:locationArea
// @access  Public
const getCentersByLocationArea = asyncHandler(async (req, res) => {
    const { locationArea } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = { 
        LocationArea: { $regex: locationArea, $options: 'i' }
    };

    // Add additional filters if provided
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    if (req.query.region) {
        filter.region = { $regex: req.query.region, $options: 'i' };
    }

    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { address: { $regex: req.query.search, $options: 'i' } },
            { region: { $regex: req.query.search, $options: 'i' } }
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
        locationArea: locationArea,
        count: centers.length,
        totalPages: Math.ceil(totalCenters / limit),
        currentPage: page,
        totalCenters,
        Centers: centers
    });
});

// @desc    Get centers by region (اسم المنطقة التفصيلية)
// @route   GET /api/centers/by-region/:region
// @access  Public
const getCentersByRegion = asyncHandler(async (req, res) => {
    const { region } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = { 
        region: { $regex: region, $options: 'i' }
    };

    // Add additional filters if provided
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    if (req.query.LocationArea) {
        filter.LocationArea = { $regex: req.query.LocationArea, $options: 'i' };
    }

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
        region: region,
        count: centers.length,
        totalPages: Math.ceil(totalCenters / limit),
        currentPage: page,
        totalCenters,
        Centers: centers
    });
});

// @desc    Get all centers grouped by LocationArea
// @route   GET /api/centers/grouped-by-location-area
// @access  Public
const getCentersGroupedByLocationArea = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Get all centers grouped by LocationArea
    const pipeline = [
        {
            $lookup: {
                from: "sportactivities",
                localField: "sportsActivities",
                foreignField: "_id",
                as: "sportsActivities"
            }
        },
        {
            $lookup: {
                from: "socialactivities", 
                localField: "socialActivities",
                foreignField: "_id",
                as: "socialActivities"
            }
        },
        {
            $lookup: {
                from: "artactivities",
                localField: "artActivities", 
                foreignField: "_id",
                as: "artActivities"
            }
        },
        {
            $group: {
                _id: "$LocationArea",
                centers: { $push: "$$ROOT" },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                locationArea: "$_id",
                centers: { $slice: ["$centers", skip, limit] },
                totalCenters: "$count"
            }
        },
        {
            $sort: { locationArea: 1 }
        }
    ];

    const result = await Center.aggregate(pipeline);

    // Format response
    const centersByLocationArea = {};
    let totalCenters = 0;

    result.forEach(item => {
        const areaName = item.locationArea || 'غير محدد';
        centersByLocationArea[areaName] = {
            centers: item.centers,
            count: item.totalCenters
        };
        totalCenters += item.totalCenters;
    });

    res.status(200).json({
        success: true,
        totalCenters,
        currentPage: page,
        limit,
        centersByLocationArea
    });
});

// @desc    Search centers with advanced filters
// @route   GET /api/centers/search
// @access  Public
const searchCenters = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const { 
        query, 
        LocationArea,
        region,
        phone, 
        hasActivities,
        activityType 
    } = req.query;

    // Build search conditions
    let searchConditions = {};

    // Text search in name, region or address
    if (query) {
        searchConditions.$or = [
            { name: { $regex: query, $options: 'i' } },
            { region: { $regex: query, $options: 'i' } },
            { address: { $regex: query, $options: 'i' } }
        ];
    }

    // LocationArea filter
    if (LocationArea) {
        searchConditions.LocationArea = { $regex: LocationArea, $options: 'i' };
    }

    // Region filter
    if (region) {
        searchConditions.region = { $regex: region, $options: 'i' };
    }

    // Phone search
    if (phone) {
        searchConditions.phone = { $regex: phone, $options: 'i' };
    }

    // Filter centers with activities
    if (hasActivities === 'true') {
        searchConditions.$or = [
            ...(searchConditions.$or || []),
            { 'sportsActivities.0': { $exists: true } },
            { 'socialActivities.0': { $exists: true } },
            { 'artActivities.0': { $exists: true } }
        ];
    }

    // Filter by specific activity type
    if (activityType) {
        switch (activityType) {
            case 'sports':
                searchConditions['sportsActivities.0'] = { $exists: true };
                break;
            case 'social':
                searchConditions['socialActivities.0'] = { $exists: true };
                break;
            case 'art':
                searchConditions['artActivities.0'] = { $exists: true };
                break;
        }
    }

    const totalCenters = await Center.countDocuments(searchConditions);
    const centers = await Center.find(searchConditions)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

    // Group results by LocationArea
    const groupedResults = {};
    centers.forEach(center => {
        const areaName = center.LocationArea || 'غير محدد';
        if (!groupedResults[areaName]) {
            groupedResults[areaName] = [];
        }
        groupedResults[areaName].push(center);
    });

    res.status(200).json({
        success: true,
        searchQuery: req.query,
        count: centers.length,
        totalPages: Math.ceil(totalCenters / limit),
        currentPage: page,
        totalCenters,
        groupedByLocationArea: groupedResults,
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
    const { LocationArea } = req.query; // Add LocationArea filter option
    
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

    // Add LocationArea filter if provided
    if (LocationArea) {
        filter.LocationArea = { $regex: LocationArea, $options: 'i' };
    }

    const centers = await Center.find(filter)
        .populate('sportsActivities', 'name')
        .populate('socialActivities', 'name')
        .populate('artActivities', 'name')
        .sort({ name: 1 });

    // Group by LocationArea
    const groupedByLocationArea = {};
    centers.forEach(center => {
        const areaName = center.LocationArea || 'غير محدد';
        if (!groupedByLocationArea[areaName]) {
            groupedByLocationArea[areaName] = [];
        }
        groupedByLocationArea[areaName].push(center);
    });

    res.status(200).json({
        success: true,
        count: centers.length,
        activityType: type,
        activityId: activityId,
        groupedByLocationArea,
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

// @desc    Get centers statistics including LocationArea stats
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

    // LocationArea statistics
    const locationAreaStats = await Center.aggregate([
        {
            $group: {
                _id: '$LocationArea',
                count: { $sum: 1 },
                centersWithPhone: {
                    $sum: { $cond: [{ $and: [{ $ne: ['$phone', null] }, { $ne: ['$phone', ''] }] }, 1, 0] }
                },
                centersWithActivities: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $gt: [{ $size: { $ifNull: ['$sportsActivities', []] } }, 0] },
                                    { $gt: [{ $size: { $ifNull: ['$socialActivities', []] } }, 0] },
                                    { $gt: [{ $size: { $ifNull: ['$artActivities', []] } }, 0] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                locationArea: { $ifNull: ['$_id', 'غير محدد'] },
                totalCenters: '$count',
                centersWithPhone: '$centersWithPhone',
                centersWithActivities: '$centersWithActivities',
                phonePercentage: {
                    $multiply: [{ $divide: ['$centersWithPhone', '$count'] }, 100]
                },
                activitiesPercentage: {
                    $multiply: [{ $divide: ['$centersWithActivities', '$count'] }, 100]
                }
            }
        },
        { $sort: { totalCenters: -1 } }
    ]);

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
            locationAreaStatistics: locationAreaStats,
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

// @desc    Get available LocationAreas
// @route   GET /api/centers/location-areas
// @access  Public
const getAvailableLocationAreas = asyncHandler(async (req, res) => {
    const locationAreas = await Center.distinct('LocationArea');
    
    // Remove null/undefined values and sort
    const availableLocationAreas = locationAreas
        .filter(area => area != null && area !== '')
        .sort();

    res.status(200).json({
        success: true,
        count: availableLocationAreas.length,
        locationAreas: availableLocationAreas
    });
});

// @desc    Get available regions
// @route   GET /api/centers/regions
// @access  Public
const getAvailableRegions = asyncHandler(async (req, res) => {
    const regions = await Center.distinct('region');
    
    // Remove null/undefined values and sort
    const availableRegions = regions
        .filter(region => region != null && region !== '')
        .sort();

    res.status(200).json({
        success: true,
        count: availableRegions.length,
        regions: availableRegions
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

module.exports = {
    getCenters,
    getCentersByLocationArea,
    getCentersByRegion,
    getCentersGroupedByLocationArea,
    searchCenters,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getCentersByActivity,
    getAllActivities,
    getCentersStats,
    getAvailableLocationAreas,
    getAvailableRegions,
    updateCenterActivities,
    updateCenterMembership
};