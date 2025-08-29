const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const filetypes = /jpe?g|png|webp/;
    const mimetypes = /^image\/(jpe?g|png|webp)$/;
    
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimetypes.test(file.mimetype);
    
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('يُسمح بتحميل ملفات الصور فقط (JPEG, JPG, PNG, WebP)'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 1
    }
});

// Middleware to handle single file upload
const uploadSingleImage = (fieldName) => {
    return (req, res, next) => {
        const uploadSingle = upload.single(fieldName);
        
        uploadSingle(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                return res.status(400).json({
                    success: false,
                    message: err.code === 'LIMIT_FILE_SIZE' 
                        ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' 
                        : 'حدث خطأ أثناء رفع الملف'
                });
            } else if (err) {
                // An unknown error occurred
                return res.status(400).json({
                    success: false,
                    message: err.message || 'حدث خطأ أثناء رفع الملف'
                });
            }
            
            // If file was uploaded, add its path to the request body
            if (req.file) {
                req.file.path = req.file.path.replace(/\\/g, '/'); // Convert Windows paths to forward slashes
            }
            
            next();
        });
    };
};

// Clean up uploaded files from the filesystem after response is sent
const cleanupUploads = (req, res, next) => {
    res.on('finish', function() {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
    });
    next();
};

module.exports = {
    uploadSingleImage,
    cleanupUploads
};
