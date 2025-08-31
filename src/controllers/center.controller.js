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
    console.log('Raw req.body:', req.body);
    console.log('Uploaded file:', req.file);

    // تحويل JSON strings إلى arrays (للـ FormData)
    ['sportsActivities', 'socialActivities', 'artActivities'].forEach(activityType => {
        if (req.body[activityType] && typeof req.body[activityType] === 'string') {
            try {
                req.body[activityType] = JSON.parse(req.body[activityType]);
                console.log(`Parsed ${activityType}:`, req.body[activityType]);
            } catch (e) {
                console.error(`Error parsing ${activityType}:`, e);
                req.body[activityType] = [];
            }
        }
    });

    // تحويل activities object
    if (req.body.activities && typeof req.body.activities === 'string') {
        try {
            req.body.activities = JSON.parse(req.body.activities);
            console.log('Parsed activities object:', req.body.activities);
        } catch (e) {
            console.error('Error parsing activities:', e);
            delete req.body.activities;
        }
    }

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

    // Create update object (exclude activities from direct update)
    const updateData = { ...req.body };
    delete updateData.sportsActivities;
    delete updateData.socialActivities;
    delete updateData.artActivities;
    delete updateData.activities;

    // معالجة membership data - نقل firstTimePrice و renewalPrice إلى membership object
    if (req.body.firstTimePrice || req.body.renewalPrice) {
        updateData.membership = {
            ...center.membership?.toObject?.() || {},
            ...(req.body.firstTimePrice && { firstTimePrice: Number(req.body.firstTimePrice) }),
            ...(req.body.renewalPrice && { renewalPrice: Number(req.body.renewalPrice) })
        };
        delete updateData.firstTimePrice;
        delete updateData.renewalPrice;
    }

    // Handle activities update - REPLACE existing activities completely
    if (req.body.activities) {
        // Activities sent as object { sports: [...], social: [...], art: [...] }
        const { sports = [], social = [], art = [] } = req.body.activities;

        // Validate and process activities
        const activitiesData = await validateAndProcessActivities({
            sports,
            social, 
            art
        });

        if (!activitiesData.success) {
            return res.status(activitiesData.statusCode).json({
                success: false,
                message: activitiesData.message,
                ...(activitiesData.missing && { missing: activitiesData.missing }),
                ...(activitiesData.invalidIds && { invalidIds: activitiesData.invalidIds })
            });
        }

        // REPLACE activities completely
        updateData.sportsActivities = sports;
        updateData.socialActivities = social;
        updateData.artActivities = art;
        
    } else {
        // Handle individual activity arrays - REPLACE completely
        if (req.body.sportsActivities !== undefined) {
            const sportsResult = await validateActivityArray(req.body.sportsActivities, SportActivity, 'الأنشطة الرياضية');
            if (!sportsResult.success) {
                return res.status(sportsResult.statusCode).json(sportsResult.response);
            }
            updateData.sportsActivities = req.body.sportsActivities;
        }

        if (req.body.socialActivities !== undefined) {
            const socialResult = await validateActivityArray(req.body.socialActivities, SocialActivity, 'الأنشطة الاجتماعية');
            if (!socialResult.success) {
                return res.status(socialResult.statusCode).json(socialResult.response);
            }
            updateData.socialActivities = req.body.socialActivities;
        }

        if (req.body.artActivities !== undefined) {
            const artResult = await validateActivityArray(req.body.artActivities, ArtActivity, 'الأنشطة الفنية');
            if (!artResult.success) {
                return res.status(artResult.statusCode).json(artResult.response);
            }
            updateData.artActivities = req.body.artActivities;
        }
    }

    console.log('Final Update Data:', updateData);

    try {
        // Update center with new data
        center = await Center.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!center) {
            return res.status(404).json({
                success: false,
                message: "فشل في تحديث المركز"
            });
        }

        // Populate the updated center's activities
        center = await Center.findById(center._id)
            .populate('sportsActivities', 'name')
            .populate('socialActivities', 'name')
            .populate('artActivities', 'name');

        console.log('Updated Center Activities:', {
            sports: center.sportsActivities,
            social: center.socialActivities,
            art: center.artActivities
        });

        res.status(200).json({
            success: true,
            message: "تم تحديث المركز بنجاح",
            data: center // غيّرت من Centers إلى data
        });

    } catch (error) {
        console.error('Database update error:', error);
        return res.status(400).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث المركز في قاعدة البيانات',
            error: error.message
        });
    }
});

// Helper function to validate activity array
async function validateActivityArray(activities, ActivityModel, activityTypeName) {
    if (!Array.isArray(activities)) {
        return {
            success: false,
            statusCode: 400,
            response: {
                success: false,
                message: `${activityTypeName} يجب أن تكون مصفوفة`
            }
        };
    }

    // Allow empty arrays (this will clear all activities of this type)
    if (activities.length === 0) {
        return { success: true };
    }

    // Validate ObjectIds
    const invalidIds = activities.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return {
            success: false,
            statusCode: 400,
            response: {
                success: false,
                message: `بعض معرفات ${activityTypeName} غير صالحة`,
                invalidIds: invalidIds
            }
        };
    }

    // Check if activities exist in database
    const existingActivities = await ActivityModel.find({ _id: { $in: activities } });
    if (existingActivities.length !== activities.length) {
        const foundIds = existingActivities.map(a => a._id.toString());
        const missingIds = activities.filter(id => !foundIds.includes(id));
        
        return {
            success: false,
            statusCode: 404,
            response: {
                success: false,
                message: `بعض ${activityTypeName} غير موجودة`,
                missingIds: missingIds
            }
        };
    }

    return { success: true };
}

// Helper function to validate activities object
async function validateAndProcessActivities({ sports, social, art }) {
    // Validate ObjectIds for non-empty arrays
    const allIds = [...sports, ...social, ...art];
    const invalidIds = allIds.filter(id => id && !mongoose.Types.ObjectId.isValid(id));
    
    if (invalidIds.length > 0) {
        return {
            success: false,
            statusCode: 400,
            message: 'بعض معرفات الأنشطة غير صالحة',
            invalidIds
        };
    }

    // Verify activities exist (only for non-empty arrays)
    const verificationPromises = [
        sports.length > 0 ? SportActivity.find({ _id: { $in: sports } }) : Promise.resolve([]),
        social.length > 0 ? SocialActivity.find({ _id: { $in: social } }) : Promise.resolve([]),
        art.length > 0 ? ArtActivity.find({ _id: { $in: art } }) : Promise.resolve([])
    ];

    const [existingSports, existingSocial, existingArt] = await Promise.all(verificationPromises);

    // Check if all specified activities exist
    const missingSports = sports.length > 0 ? sports.filter(id => !existingSports.find(a => a._id.toString() === id)) : [];
    const missingSocial = social.length > 0 ? social.filter(id => !existingSocial.find(a => a._id.toString() === id)) : [];
    const missingArt = art.length > 0 ? art.filter(id => !existingArt.find(a => a._id.toString() === id)) : [];

    if (missingSports.length > 0 || missingSocial.length > 0 || missingArt.length > 0) {
        return {
            success: false,
            statusCode: 404,
            message: 'بعض الأنشطة غير موجودة',
            missing: {
                sports: missingSports,
                social: missingSocial,
                art: missingArt
            }
        };
    }

    return { success: true };
}

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