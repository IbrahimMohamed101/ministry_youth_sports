    const mongoose = require("mongoose");

    const newsSchema = new mongoose.Schema(
    {
        title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxLength: [200, "Title cannot exceed 200 characters"]
        },
        content: {
        type: String,
        required: [true, "Content is required"],
        minLength: [10, "Content must be at least 10 characters"]
        },
        image: {
        type: String,
        required: false,
        },
        socialLink: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
            // إذا كان الحقل فارغ، فهو صحيح
            if (!v) return true;
            // التحقق من صحة الرابط
            const urlRegex = /^https?:\/\/.+/;
            return urlRegex.test(v);
            },
            message: "Please provide a valid URL starting with http:// or https://"
        }
        },
        slug: {
        type: String,
        unique: true,
        lowercase: true
        }, 
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
    );

    // Create slug from title before saving
    newsSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        // For Arabic text, create URL-friendly slug
        let slug = this.title
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^\u0600-\u06FF\u0750-\u077F\w\s-]/g, '') // Keep Arabic chars and basic chars
        .toLowerCase();
        
        // If slug is empty or just dashes, use timestamp-based slug
        if (!slug || slug === '-' || slug.replace(/-/g, '') === '') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        slug = `news-${timestamp}-${random}`;
        }
        
        this.slug = slug;
    }
    next();
    });

    // Virtual for formatted date
    newsSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    });

    // Index for better search performance
    newsSchema.index({ title: 'text', content: 'text' });
    newsSchema.index({ createdAt: -1 });
    newsSchema.index({ slug: 1 });

    module.exports = mongoose.model("News", newsSchema);