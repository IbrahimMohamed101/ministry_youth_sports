    const { body, validationResult } = require('express-validator');
    const multer = require('multer');

    // Validation rules for news creation
    exports.validateNewsCreation = [
    body('title')
        .notEmpty()
        .withMessage('العنوان مطلوب')
        .isLength({ min: 5, max: 200 })
        .withMessage('العنوان يجب أن يكون بين 5 و 200 حرف'),
    
    body('content')
        .notEmpty()
        .withMessage('المحتوى مطلوب')
        .isLength({ min: 10 })
        .withMessage('المحتوى يجب أن يكون على الأقل 10 أحرف'),
    
    body('category')
        .optional()
        .isIn(['عام', 'رياضة', 'شباب', 'فعاليات', 'إعلانات'])
        .withMessage('التصنيف غير صحيح'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('العلامات يجب أن تكون مصفوفة'),
    ];

    // Validation rules for news update
    exports.validateNewsUpdate = [
    body('title')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('العنوان يجب أن يكون بين 5 و 200 حرف'),
    
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('المحتوى يجب أن يكون على الأقل 10 أحرف'),
    
    body('category')
        .optional()
        .isIn(['عام', 'رياضة', 'شباب', 'فعاليات', 'إعلانات'])
        .withMessage('التصنيف غير صحيح'),
    ];

    // Check validation results
    exports.checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
        });
    }
    next();
    };

    // Error handling middleware
    exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'حجم الملف كبير جداً (الحد الأقصى 5MB)'
        });
        }
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
        success: false,
        message: 'خطأ في التحقق من البيانات',
        errors
        });
    }

    // Mongoose cast errors
    if (err.name === 'CastError') {
        return res.status(400).json({
        success: false,
        message: 'معرف غير صحيح'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: 'خطأ في الخادم'
    });
    };