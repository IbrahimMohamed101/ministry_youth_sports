        const Activity = require("../models/activity .model");
        const asyncHandler = require("express-async-handler");

        // @desc    Get all activities
        // @route   GET /api/activities
        // @access  Public
        const getActivities = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        
        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Date range filter
        if (req.query.dateFrom || req.query.dateTo) {
            filter.date = {};
            if (req.query.dateFrom) {
            filter.date.$gte = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
            filter.date.$lte = new Date(req.query.dateTo);
            }
        }

        // Gender filter
        if (req.query.gender) {
            filter.gender = req.query.gender;
        }

        // Access type filter
        if (req.query.accessType) {
            filter.accessType = req.query.accessType;
        }

        // Location filter (partial match)
        if (req.query.location) {
            filter.location = { $regex: req.query.location, $options: 'i' };
        }

        // Search in project name and coordinator name
        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        const totalActivities = await Activity.countDocuments(filter);
        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: activities.length,
            totalPages: Math.ceil(totalActivities / limit),
            currentPage: page,
            totalActivities,
            activits: activities
        });
        });

        // @desc    Get single activity
        // @route   GET /api/activities/:id
        // @access  Public
        const getActivity = asyncHandler(async (req, res) => {
        let activity;

        // Check if the parameter is a valid ObjectId or a slug
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a valid ObjectId
            activity = await Activity.findById(req.params.id);
        } else {
            // It's likely a slug
            activity = await Activity.findOne({ slug: req.params.id });
        }

        if (!activity) {
            return res.status(404).json({
            success: false,
            message: "النشاط غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            activits: activity
        });
        });

        // @desc    Create new activity
        // @route   POST /api/activities
        // @access  Private
    const createActivity = asyncHandler(async (req, res) => {
    // Validate target age (double check before reaching schema)
    if (req.body.targetAge && req.body.targetAge.max < req.body.targetAge.min) {
        return res.status(400).json({
        success: false,
        message: "الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى",
        });
    }

    try {
        const activity = await Activity.create(req.body);

        res.status(201).json({
        success: true,
        message: "تم إنشاء النشاط بنجاح",
        activity,
        });
    } catch (error) {
        console.log("خطأ في إنشاء النشاط:", error);

        // لو الخطأ من Mongoose Validation
        if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);

        return res.status(400).json({
            success: false,
            message: "فشل التحقق من صحة البيانات",
            errors: messages,
        });
        }

        // لو الخطأ duplicate key (نادر جداً دلوقتي بسبب الـ slug generator الجديد)
        if (error.code === 11000) {
        // جرب تاني مرة واحدة
        try {
            const activity = await Activity.create(req.body);
            return res.status(201).json({
            success: true,
            message: "تم إنشاء النشاط بنجاح",
            activity,
            });
        } catch (retryError) {
            return res.status(400).json({
            success: false,
            message: "حدث تضارب في البيانات، يرجى المحاولة مرة أخرى",
            });
        }
        }

        // أي خطأ غير متوقع
        res.status(500).json({
        success: false,
        message: "حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
    });
    // @desc    Update activity
    // @route   PUT /api/activities/:id
    // @access  Private
    const updateActivity = asyncHandler(async (req, res) => {
        let activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
            success: false,
            message: "النشاط غير موجود"
            });
        }

        // Validate target age if provided
        if (req.body.targetAge && req.body.targetAge.max < req.body.targetAge.min) {
            return res.status(400).json({
            success: false,
            message: "الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى"
            });
        }

        try {
            activity = await Activity.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
            );

            res.status(200).json({
            success: true,
            message: "تم تحديث النشاط بنجاح",
            activity // مُصحح - كان activits
            });
        } catch (error) {
            // لو الخطأ من Mongoose Validation
            if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);

            return res.status(400).json({
                success: false,
                message: "فشل التحقق من صحة البيانات",
                errors: messages,
            });
            }

            // لو الخطأ duplicate key (slug)
            if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "اسم المشروع موجود بالفعل، يرجى استخدام اسم مختلف",
            });
            }

            // أي خطأ غير متوقع
            res.status(500).json({
            success: false,
            message: "حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    });
        // @desc    Delete activity
        // @route   DELETE /api/activities/:id
        // @access  Private
        const deleteActivity = asyncHandler(async (req, res) => {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
            success: false,
            message: "النشاط غير موجود"
            });
        }

        await Activity.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "تم حذف النشاط بنجاح"
        });
        });

        // @desc    Get activities by status
        // @route   GET /api/activities/status/:status
        // @access  Public
        const getActivitiesByStatus = asyncHandler(async (req, res) => {
        const { status } = req.params;
        
        const validStatuses = ["مجدول", "جاري", "ملغي"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
            success: false,
            message: "حالة النشاط غير صحيحة"
            });
        }

        const activities = await Activity.find({ status }).sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            activits: activities
        });
        });

        // @desc    Get upcoming activities
        // @route   GET /api/activities/upcoming
        // @access  Public
        const getUpcomingActivities = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activities = await Activity.find({
            date: { $gte: today },
            status: { $ne: "ملغي" }
        })
            .sort({ date: 1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: activities.length,
            activits: activities
        });
        });

        // @desc    Update activity status
        // @route   PATCH /api/activities/:id/status
        // @access  Private
        const updateActivityStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const validStatuses = ["مجدول", "جاري", "ملغي"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
            success: false,
            message: "حالة النشاط غير صحيحة"
            });
        }

        const activity = await Activity.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!activity) {
            return res.status(404).json({
            success: false,
            message: "النشاط غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم تحديث حالة النشاط بنجاح",
            activits: activity
        });
        });

        // @desc    Get activities statistics
        // @route   GET /api/activities/stats
        // @access  Public
        const getActivitiesStats = asyncHandler(async (req, res) => {
        const totalActivities = await Activity.countDocuments();
        const scheduledActivities = await Activity.countDocuments({ status: "مجدول" });
        const ongoingActivities = await Activity.countDocuments({ status: "جاري" });
        const cancelledActivities = await Activity.countDocuments({ status: "ملغي" });

        // Get activities by gender
        const byGender = await Activity.aggregate([
            {
            $group: {
                _id: "$gender",
                count: { $sum: 1 }
            }
            }
        ]);

        // Get activities by access type
        const byAccessType = await Activity.aggregate([
            {
            $group: {
                _id: "$accessType",
                count: { $sum: 1 }
            }
            }
        ]);

        res.status(200).json({
            success: true,
            activits: {
            totalActivities,
            statusBreakdown: {
                scheduled: scheduledActivities,
                ongoing: ongoingActivities,
                cancelled: cancelledActivities
            },
            genderBreakdown: byGender,
            accessTypeBreakdown: byAccessType
            }
        });
        });

        module.exports = {
        getActivities,
        getActivity,
        createActivity,
        updateActivity,
        deleteActivity,
        getActivitiesByStatus,
        getUpcomingActivities,
        updateActivityStatus,
        getActivitiesStats
        };