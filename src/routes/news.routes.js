    const express = require("express");
    const router = express.Router();
    const multer = require("multer");
    const path = require("path");
    const newsController = require("../controllers/news.controller");

    // Multer configuration
    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
    });

    // File filter for images only
    const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
    };

    const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
    });

    // Basic CRUD routes
    router.post("/", upload.single("image"), newsController.createNews);
    router.get("/", newsController.getAllNews);

    // Specific routes (should come before parameterized routes)
    router.get("/search", newsController.searchNews);

    // Parameterized routes (should come last)
    router.get("/:id", newsController.getNewsById);
    router.put("/:id", upload.single("image"), newsController.updateNews);
    router.delete("/:id", newsController.deleteNews);

    module.exports = router;