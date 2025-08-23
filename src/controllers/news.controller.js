    const News = require("../models/news.model");
    const cloudinary = require("../config/cloudinary");
    const fs = require("fs");

    // إضافة خبر جديد
    exports.createNews = async (req, res) => {
    try {
        const { title, content, socialLink } = req.body;
        
        // التحقق من البيانات المطلوبة
        if (!title || !content) {
        return res.status(400).json({ 
            success: false,
            message: "Title and content are required"
        });
        }

        let imageUrl = null;

        if (req.file) {
        // ارفع الصورة على Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "news",
            transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" }
            ]
        });

        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path); // امسح الملف من السيرفر بعد الرفع
        }

        const newsData = {
        title,
        content,
        image: imageUrl,
        socialLink: socialLink || null // إضافة السوشيل لينك
        };

        const news = await News.create(newsData);
        
        res.status(201).json({
        success: true,
        message: "News created successfully",
        data: news
        });
    } catch (error) {
        console.error("Error creating news:", error);
        
        // معالجة خطأ الـ slug المكرر
        if (error.code === 11000 && error.keyValue.slug) {
        return res.status(400).json({
            success: false,
            message: "A news with similar title already exists"
        });
        }
        
        res.status(500).json({ 
        success: false,
        message: "Error creating news", 
        error: error.message 
        });
    }
    };

exports.getAllNews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // مش محتاج فلترة دلوقتي
        const news = await News.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await News.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
        success: true,
        articles: news,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ 
        success: false,
        message: "Error fetching news", 
        error: error.message 
        });
    }
};

    // جلب خبر واحد بالـ ID أو slug
    exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const mongoose = require('mongoose');
        let news;

        // جرب البحث بالـ ID أولاً، ثم بالـ slug
        if (mongoose.Types.ObjectId.isValid(id)) {
        news = await News.findById(id);
        } else {
        news = await News.findOne({ slug: id });
        }

        if (!news) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
        }

        res.status(200).json({
        success: true,
        articles: news
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({
        success: false,
        message: "Error fetching news",
        error: error.message
        });
    }
    };

    // تحديث خبر
    exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, socialLink, isActive } = req.body;
        
        const existingNews = await News.findById(id);
        if (!existingNews) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
        }

        let imageUrl = existingNews.image;

        // إذا تم رفع صورة جديدة
        if (req.file) {
        // احذف الصورة القديمة من Cloudinary
        if (existingNews.image) {
            const publicId = existingNews.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`news/${publicId}`);
        }

        // ارفع الصورة الجديدة
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "news",
            transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" }
            ]
        });

        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (imageUrl) updateData.image = imageUrl;
        if (socialLink !== undefined) updateData.socialLink = socialLink; // إضافة تحديث السوشيل لينك
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedNews = await News.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
        );

        res.status(200).json({
        success: true,
        message: "News updated successfully",
        articles: updatedNews
        });
    } catch (error) {
        console.error("Error updating news:", error);
        
        // معالجة خطأ الـ slug المكرر
        if (error.code === 11000 && error.keyValue.slug) {
        return res.status(400).json({
            success: false,
            message: "A news with similar title already exists"
        });
        }
        
        res.status(500).json({
        success: false,
        message: "Error updating news",
        error: error.message
        });
    }
    };

    // حذف خبر (soft delete)
    exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query;
        
        const news = await News.findById(id);
        if (!news) {
        return res.status(404).json({
            success: false,
            message: "News not found"
        });
        }

        if (permanent === 'true') {
        // حذف نهائي
        if (news.image) {
            const publicId = news.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`news/${publicId}`);
        }

        await News.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "News deleted permanently"
        });
        } else {
        // soft delete - تعطيل فقط
        await News.findByIdAndUpdate(id, { isActive: false });
        
        res.status(200).json({
            success: true,
            message: "News deactivated successfully"
        });
        }
    } catch (error) {
        console.error("Error deleting news:", error);
        res.status(500).json({
        success: false,
        message: "Error deleting news",
        error: error.message
        });
    }
    };

    // البحث في الأخبار
    exports.searchNews = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
        return res.status(400).json({
            success: false,
            message: "Search query required"
        });
        }

        let searchQuery = { isActive: true };

        if (q) {
        searchQuery.$or = [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } }
        ];
        }

        const news = await News.find(searchQuery).sort({ createdAt: -1 });

        res.status(200).json({
        success: true,
        articles: news,
        count: news.length
        });
    } catch (error) {
        console.error("Error searching news:", error);
        res.status(500).json({
        success: false,
        message: "Error searching news",
        error: error.message
        });
    }
    };