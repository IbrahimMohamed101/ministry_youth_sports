    const { body, param, query, validationResult } = require("express-validator");

    // Middleware to handle validation errors
    const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        message: "خطأ في البيانات المرسلة",
        errors: errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }))
        });
    }
    next();
    };

    // Validation rules for creating activity
    const validateCreateActivity = [
    body("projectName")
        .notEmpty()
        .withMessage("اسم المشروع مطلوب")
        .isLength({ max: 200 })
        .withMessage("اسم المشروع لا يمكن أن يتجاوز 200 حرف")
        .trim(),

    body("coordinatorName")
        .notEmpty()
        .withMessage("اسم المنسق مطلوب")
        .isLength({ max: 100 })
        .withMessage("اسم المنسق لا يمكن أن يتجاوز 100 حرف")
        .trim(),

    body("phoneNumber")
        .notEmpty()
        .withMessage("رقم التلفون مطلوب")
        .matches(/^(\+2)?01[0-2,5]{1}[0-9]{8}$/)
        .withMessage("يرجى إدخال رقم تلفون صحيح")
        .trim(),

    body("location")
        .notEmpty()
        .withMessage("المكان مطلوب")
        .isLength({ max: 150 })
        .withMessage("المكان لا يمكن أن يتجاوز 150 حرف")
        .trim(),

    body("date")
        .notEmpty()
        .withMessage("التاريخ مطلوب")
        .isISO8601()
        .withMessage("يرجى إدخال تاريخ صحيح")
        .custom((value) => {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (inputDate < today) {
            throw new Error("التاريخ يجب أن يكون في المستقبل أو اليوم");
        }
        return true;
        }),

    body("time")
        .notEmpty()
        .withMessage("الساعة مطلوبة")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("يرجى إدخال الوقت بصيغة صحيحة (مثال: 14:30)")
        .trim(),

    body("daysCount")
        .notEmpty()
        .withMessage("عدد الأيام مطلوب")
        .isInt({ min: 1, max: 365 })
        .withMessage("عدد الأيام يجب أن يكون بين 1 و 365 يوم"),

    body("participantsCount")
        .notEmpty()
        .withMessage("عدد المشاركين مطلوب")
        .isInt({ min: 1, max: 10000 })
        .withMessage("عدد المشاركين يجب أن يكون بين 1 و 10000"),

    body("targetAge.min")
        .notEmpty()
        .withMessage("الحد الأدنى للعمر مطلوب")
        .isInt({ min: 0, max: 100 })
        .withMessage("العمر يجب أن يكون بين 0 و 100 سنة"),

    body("targetAge.max")
        .notEmpty()
        .withMessage("الحد الأقصى للعمر مطلوب")
        .isInt({ min: 0, max: 100 })
        .withMessage("العمر يجب أن يكون بين 0 و 100 سنة")
        .custom((value, { req }) => {
        if (value < req.body.targetAge.min) {
            throw new Error("الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى");
        }
        return true;
        }),

    body("gender")
        .notEmpty()
        .withMessage("النوع مطلوب")
        .isIn(["بنين", "بنات", "مختلط"])
        .withMessage("النوع يجب أن يكون: بنين، بنات، أو مختلط"),

    body("accessType")
        .notEmpty()
        .withMessage("نوع الوصول مطلوب")
        .isIn(["الأعضاء فقط", "للجميع"])
        .withMessage("نوع الوصول يجب أن يكون: الأعضاء فقط أو للجميع"),

    body("notes")
        .optional()
        .isLength({ max: 500 })
        .withMessage("الملاحظات لا يمكن أن تتجاوز 500 حرف"),

    body("status")
        .optional()
        .isIn(["مجدول", "جاري", "ملغي"])
        .withMessage("حالة النشاط يجب أن تكون: مجدول، جاري، أو ملغي"),

    handleValidationErrors
    ];

    // Validation rules for updating activity
    const validateUpdateActivity = [
    body("projectName")
        .optional()
        .isLength({ max: 200 })
        .withMessage("اسم المشروع لا يمكن أن يتجاوز 200 حرف")
        .trim(),

    body("coordinatorName")
        .optional()
        .isLength({ max: 100 })
        .withMessage("اسم المنسق لا يمكن أن يتجاوز 100 حرف")
        .trim(),

    body("phoneNumber")
        .optional()
        .matches(/^(\+2)?01[0-2,5]{1}[0-9]{8}$/)
        .withMessage("يرجى إدخال رقم تلفون صحيح")
        .trim(),

    body("location")
        .optional()
        .isLength({ max: 150 })
        .withMessage("المكان لا يمكن أن يتجاوز 150 حرف")
        .trim(),

    body("date")
        .optional()
        .isISO8601()
        .withMessage("يرجى إدخال تاريخ صحيح")
        .custom((value) => {
        if (value) {
            const inputDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (inputDate < today) {
            throw new Error("التاريخ يجب أن يكون في المستقبل أو اليوم");
            }
        }
        return true;
        }),

    body("time")
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("يرجى إدخال الوقت بصيغة صحيحة (مثال: 14:30)")
        .trim(),

    body("daysCount")
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage("عدد الأيام يجب أن يكون بين 1 و 365 يوم"),

    body("participantsCount")
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage("عدد المشاركين يجب أن يكون بين 1 و 10000"),

    body("targetAge.min")
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage("العمر يجب أن يكون بين 0 و 100 سنة"),

    body("targetAge.max")
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage("العمر يجب أن يكون بين 0 و 100 سنة")
        .custom((value, { req }) => {
        if (value && req.body.targetAge && req.body.targetAge.min && value < req.body.targetAge.min) {
            throw new Error("الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى");
        }
        return true;
        }),

    body("gender")
        .optional()
        .isIn(["بنين", "بنات", "مختلط"])
        .withMessage("النوع يجب أن يكون: بنين، بنات، أو مختلط"),

    body("accessType")
        .optional()
        .isIn(["الأعضاء فقط", "للجميع"])
        .withMessage("نوع الوصول يجب أن يكون: الأعضاء فقط أو للجميع"),

    body("notes")
        .optional()
        .isLength({ max: 500 })
        .withMessage("الملاحظات لا يمكن أن تتجاوز 500 حرف"),

    body("status")
        .optional()
        .isIn(["مجدول", "جاري", "ملغي"])
        .withMessage("حالة النشاط يجب أن تكون: مجدول، جاري، أو ملغي"),

    handleValidationErrors
    ];

    // Validation for status update
    const validateStatusUpdate = [
    body("status")
        .notEmpty()
        .withMessage("حالة النشاط مطلوبة")
        .isIn(["مجدول", "جاري", "ملغي"])
        .withMessage("حالة النشاط يجب أن تكون: مجدول، جاري، أو ملغي"),

    handleValidationErrors
    ];

    // Validation for MongoDB ObjectId
    const validateObjectId = [
    param("id")
        .custom((value) => {
        if (value.match(/^[0-9a-fA-F]{24}$/)) {
            return true;
        }
        // If not ObjectId, check if it could be a slug (allow for slug validation)
        if (typeof value === 'string' && value.length > 0) {
            return true;
        }
        throw new Error("معرف النشاط غير صحيح");
        }),

    handleValidationErrors
    ];

    // Query validation for filters
    const validateActivityQuery = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("رقم الصفحة يجب أن يكون رقم موجب"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("عدد النتائج يجب أن يكون بين 1 و 100"),

    query("status")
        .optional()
        .isIn(["مجدول", "جاري", "ملغي"])
        .withMessage("حالة النشاط يجب أن تكون: مجدول، جاري، أو ملغي"),

    query("gender")
        .optional()
        .isIn(["بنين", "بنات", "مختلط"])
        .withMessage("النوع يجب أن يكون: بنين، بنات، أو مختلط"),

    query("accessType")
        .optional()
        .isIn(["الأعضاء فقط", "للجميع"])
        .withMessage("نوع الوصول يجب أن يكون: الأعضاء فقط أو للجميع"),

    query("dateFrom")
        .optional()
        .isISO8601()
        .withMessage("تاريخ البداية غير صحيح"),

    query("dateTo")
        .optional()
        .isISO8601()
        .withMessage("تاريخ النهاية غير صحيح"),

    handleValidationErrors
    ];

    module.exports = {
    validateCreateActivity,
    validateUpdateActivity,
    validateStatusUpdate,
    validateObjectId,
    validateActivityQuery,
    handleValidationErrors
    };