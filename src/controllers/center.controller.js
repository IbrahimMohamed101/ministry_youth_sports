const Center = require("../models/Center");
const SportActivity = require("../models/SportActivity");
const SocialActivity = require("../models/SocialActivity");
const ArtActivity = require("../models/ArtActivity");
const asyncHandler = require("express-async-handler");
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

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
    try {
        // Create center data object
        const { name, phone, address, location, LocationArea, region, facebookLink } = req.body;
        
        // Validate required fields
        if (!name || !phone || !address || !location || !LocationArea || !region) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال جميع الحقول المطلوبة: الاسم، الهاتف، العنوان، الموقع، المنطقة، المنطقة التفصيلية'
            });
        }
        
        const centerData = {
            name,
            phone,
            address,
            location,
            LocationArea,
            region,
            facebookLink: facebookLink || ''
        };
        
        // Handle file upload if exists
        if (req.file) {
            try {
                // Upload image to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'ministry_centers',
                    width: 1200,
                    height: 800,
                    crop: 'fill',
                    quality: 'auto:good'
                });
                
                // Add image data to center
                centerData.image = {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            } catch (error) {
                console.error('Error uploading image:', error);
                return res.status(500).json({
                    success: false,
                    message: 'حدث خطأ أثناء رفع الصورة',
                    error: error.message
                });
            }
        }
        
        // Create the center
        const center = await Center.create(centerData);
        
        // Populate the activities for the response
        const populatedCenter = await Center.findById(center._id)
            .populate('sportsActivities', 'name')
            .populate('socialActivities', 'name')
            .populate('artActivities', 'name');
        
        res.status(201).json({
            success: true,
            message: "تم إنشاء المركز بنجاح",
            Centers: populatedCenter
        });
    } catch (error) {
        console.error('Error creating center:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إنشاء المركز',
            error: error.message
        });
    }
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

    // Handle file upload if exists
    if (req.file) {
        try {
            // Upload image to cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'ministry_centers',
                width: 1200,
                height: 800,
                crop: 'fill',
                quality: 'auto:good'
            });

            // Add/update image data in request body
            req.body.image = {
                public_id: result.public_id,
                url: result.secure_url
            };

            // If there was a previous image, delete it from cloudinary
            if (center.image && center.image.public_id) {
                await cloudinary.uploader.destroy(center.image.public_id);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            return res.status(500).json({
                success: false,
                message: 'حدث خطأ أثناء رفع الصورة',
                error: error.message
            });
        }
    }

    // Create update object
    const updateData = { ...req.body };
    
    // If we have a new image, add it to the update data
    if (req.body.image) {
        updateData.image = {
            public_id: req.body.image.public_id,
            url: req.body.image.url
        };
    }

    // Update center with new data
    center = await Center.findByIdAndUpdate(
        req.params.id,
        updateData,
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

    // Delete image from Cloudinary if it exists
    if (center.image && center.image.public_id) {
        try {
            await cloudinary.uploader.destroy(center.image.public_id);
        } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
            // Continue with deletion even if image deletion fails
        }
    }

    await center.deleteOne();

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

// @desc    Add existing activities to a center
// @route   POST /api/v1/centers/:centerId/activities
// @access  Private
const addActivitiesToCenter = asyncHandler(async (req, res) => {
    const { centerId } = req.params;
    const { activityIds, activityType = 'sports' } = req.body;

    // Validate input
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'يجب إرسال مصفوفة من معرفات الأنشطة'
        });
    }

    // Validate ObjectIds
    console.log('Center ID:', centerId, 'is valid:', mongoose.Types.ObjectId.isValid(centerId));
    
    const invalidActivityIds = activityIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    
    if (!mongoose.Types.ObjectId.isValid(centerId) || invalidActivityIds.length > 0) {
        console.log('Invalid activity IDs:', invalidActivityIds);
        return res.status(400).json({
            success: false,
            message: 'معرف غير صالح للمركز أو أحد الأنشطة',
            invalidActivityIds: invalidActivityIds
        });
    }

    // Find the center
    const center = await Center.findById(centerId);
    if (!center) {
        return res.status(404).json({
            success: false,
            message: 'المركز غير موجود'
        });
    }

    // Define activity model based on type
    let ActivityModel;
    let activityField;
    
    switch(activityType.toLowerCase()) {
        case 'sports':
            ActivityModel = SportActivity;
            activityField = 'sportsActivities';
            break;
        case 'social':
            ActivityModel = SocialActivity;
            activityField = 'socialActivities';
            break;
        case 'art':
            ActivityModel = ArtActivity;
            activityField = 'artActivities';
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'نوع النشاط غير صحيح. الأنواع المتاحة: sports, social, art'
            });
    }

    // Find all activities
    const activities = await ActivityModel.find({ _id: { $in: activityIds } });
    
    // Check if all activities exist
    if (activities.length !== activityIds.length) {
        const foundIds = activities.map(a => a._id.toString());
        const missingIds = activityIds.filter(id => !foundIds.includes(id));
        return res.status(404).json({
            success: false,
            message: 'بعض الأنشطة غير موجودة',
            missingActivities: missingIds
        });
    }

    // Check if activity is already added to the center
    const newActivities = activityIds.filter(
        id => !center[activityField].includes(id)
    );

    if (newActivities.length === 0) {
        return res.status(400).json({
            success: false,
            message: `جميع الأنشطة المحددة مضافه بالفعل للمركز في قسم ${activityType}`
        });
    }

    // Add new activities to center
    center[activityField].push(...newActivities);
    await center.save();

    // Populate the activities for the response
    const updatedCenter = await Center.findById(centerId)
        .populate(activityField, 'name');

    res.status(200).json({
        success: true,
        message: newActivities.length === 1 
            ? `تمت إضافة النشاط إلى المركز بنجاح في قسم ${activityType}`
            : `تمت إضافة ${newActivities.length} أنشطة إلى المركز بنجاح في قسم ${activityType}`,
        addedCount: newActivities.length,
        activityType,
        data: updatedCenter
    });
});

// @desc    Remove activities from a center
// @route   DELETE /api/v1/centers/:centerId/activities
// @access  Private
const removeActivityFromCenter = asyncHandler(async (req, res) => {
    const { centerId } = req.params;
    const { activityIds, activityType = 'sports' } = req.body;

    // Validate input
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'يجب إرسال مصفوفة من معرفات الأنشطة'
        });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(centerId) || 
        activityIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({
            success: false,
            message: 'معرف غير صالح للمركز أو أحد الأنشطة'
        });
    }

    // Define activity field based on type
    let activityField;
    switch(activityType.toLowerCase()) {
        case 'sports':
            activityField = 'sportsActivities';
            break;
        case 'social':
            activityField = 'socialActivities';
            break;
        case 'art':
            activityField = 'artActivities';
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'نوع النشاط غير صحيح. الأنواع المتاحة: sports, social, art'
            });
    }

    // Find and update the center
    const center = await Center.findById(centerId);
    if (!center) {
        return res.status(404).json({
            success: false,
            message: 'المركز غير موجود'
        });
    }

    // Filter out activities that don't exist in the center
    const existingActivities = center[activityField].filter(id => activityIds.includes(id.toString()));
    
    if (existingActivities.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'لا توجد أنشطة مطابقة في المركز'
        });
    }

    // Remove the activities
    center[activityField] = center[activityField].filter(id => !activityIds.includes(id.toString()));
    await center.save();

    // Populate the updated activities for the response
    const updatedCenter = await Center.findById(centerId)
        .populate(activityField, 'name');

    res.status(200).json({
        success: true,
        message: existingActivities.length === 1 
            ? 'تم حذف النشاط من المركز بنجاح' 
            : `تم حذف ${existingActivities.length} أنشطة من المركز بنجاح`,
        deletedCount: existingActivities.length,
        activityType,
        data: updatedCenter
    });
});

module.exports = {
    getCenters,
    getCentersByLocationArea,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    addActivitiesToCenter,
    removeActivityFromCenter,
    getAllActivities
};