const Center = require("../models/Center");
const SportActivity = require("../models/SportActivity");
const SocialActivity = require("../models/SocialActivity");
const ArtActivity = require("../models/ArtActivity");
const asyncHandler = require("express-async-handler");

// Location area mapping (English to Arabic) - Updated to match database
const locationAreaMap = {
    'eastern': 'المنطقة الشرقية',
    'western': 'المنطقة الغربية', 
    'northern': 'المنطقة الشمالية',
    'southern': 'المنطقة الجنوبية'
};

// Reverse mapping (Arabic to English for validation)
const arabicToEnglishMap = {
    'المنطقة الشرقية': 'eastern',
    'المنطقة الغربية': 'western',
    'المنطقة الشمالية': 'northern', 
    'المنطقة الجنوبية': 'southern'
};

// @desc    Get all centers with optional filters
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

    // General search in name, address, and region
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

// @desc    Get centers by LocationArea (English input, Arabic results)
// @route   GET /api/centers/by-location-area/:locationArea
// @access  Public
const getCentersByLocationArea = asyncHandler(async (req, res) => {
    const { locationArea } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Convert English location area to Arabic
    const arabicLocationArea = locationAreaMap[locationArea.toLowerCase()];
    
    if (!arabicLocationArea) {
        return res.status(400).json({
            success: false,
            message: "منطقة غير صحيحة. المناطق المتاحة: eastern, western, northern, southern",
            availableAreas: {
                eastern: 'المنطقة الشرقية',
                western: 'المنطقة الغربية',
                northern: 'المنطقة الشمالية', 
                southern: 'المنطقة الجنوبية'
            }
        });
    }

    const filter = { 
        LocationArea: arabicLocationArea
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
        locationArea: arabicLocationArea, // Return Arabic name
        locationAreaEn: locationArea, // Return English input
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

module.exports = {
    getCenters,
    getCentersByLocationArea,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getAllActivities
};