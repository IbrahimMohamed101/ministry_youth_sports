const Playground = require('../models/Playground');
const mongoose = require('mongoose');

// إنشاء ملاعب متعددة
// POST /api/playgrounds/bulk
exports.bulkCreatePlaygrounds = async (req, res) => {
    try {
        const { playgrounds } = req.body;

        if (!Array.isArray(playgrounds) || playgrounds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "يجب إرسال مصفوفة من الملاعب"
            });
        }

        // التحقق من صحة البياناتf
        const validatedPlaygrounds = [];
        const errors = [];

        for (let i = 0; i < playgrounds.length; i++) {
            const { name, location, contact } = playgrounds[i];

            if (!name?.trim() || !location?.trim()) {
                errors.push(`الملعب في الموقع ${i + 1}: الاسم والموقع مطلوبان`);
                continue;
            }

            // التحقق من التكرار في البيانات المرسلة
            const isDuplicate = validatedPlaygrounds.some(p => 
                p.name.toLowerCase() === name.trim().toLowerCase() &&
                p.location.toLowerCase() === location.trim().toLowerCase()
            );

            if (isDuplicate) {
                errors.push(`تكرار في البيانات: ${name} - ${location}`);
                continue;
            }

            validatedPlaygrounds.push({
                name: name.trim(),
                location: location.trim(),
                contact: contact?.trim() || 'غير متوفر'
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "هناك أخطاء في البيانات",
                errors: errors
            });
        }

        // التحقق من الملاعب الموجودة مسبقاً
        const existingPlaygrounds = await Playground.find({
            $or: validatedPlaygrounds.map(p => ({
                name: { $regex: new RegExp(`^${p.name}$`, 'i') },
                location: { $regex: new RegExp(`^${p.location}$`, 'i') }
            }))
        });

        if (existingPlaygrounds.length > 0) {
            const existingNames = existingPlaygrounds.map(p => `${p.name} - ${p.location}`);
            return res.status(409).json({
                success: false,
                message: "بعض الملاعب موجودة مسبقاً",
                existingPlaygrounds: existingNames
            });
        }

        // إدخال جميع الملاعب الصالحة
        const createdPlaygrounds = await Playground.insertMany(validatedPlaygrounds);

        res.status(201).json({
            success: true,
            message: `تم إنشاء ${createdPlaygrounds.length} ملعب بنجاح`,
            playgrounds: createdPlaygrounds
        });

    } catch (error) {
        console.error("Error in bulk creating playgrounds:", error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "خطأ في التحقق من البيانات",
                errors: validationErrors
            });
        }

        res.status(500).json({ 
            success: false,
            message: "حدث خطأ أثناء إنشاء الملاعب",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// إنشاء ملعب جديد
exports.createPlayground = async (req, res) => {
    try {
        const { name, location, contact } = req.body;

        // التحقق من البيانات المطلوبة
        if (!name?.trim() || !location?.trim()) {
            return res.status(400).json({
                success: false,
                message: "اسم الملعب والموقع مطلوبان"
            });
        }

        // التحقق من عدم وجود ملعب بنفس الاسم والموقع
        const existingPlayground = await Playground.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            location: { $regex: new RegExp(`^${location.trim()}$`, 'i') }
        });

        if (existingPlayground) {
            return res.status(409).json({
                success: false,
                message: "يوجد ملعب بنفس الاسم والموقع"
            });
        }

        const playgroundData = {
            name: name.trim(),
            location: location.trim(),
            contact: contact?.trim() || 'غير متوفر'
        };

        const playground = await Playground.create(playgroundData);

        res.status(201).json({
            success: true,
            message: "تم إنشاء الملعب بنجاح",
            playgrounds: playground
        });
    } catch (error) {
        console.error("Error creating playground:", error);
        
        // التعامل مع أخطاء التحقق
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "فشل في التحقق من البيانات",
                errors: validationErrors
            });
        }

        res.status(500).json({ 
            success: false,
            message: "خطأ في إنشاء الملعب", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على جميع الملاعب
exports.getAllPlaygrounds = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;
        
        // بناء فلتر البحث
        const filter = {};
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { location: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const total = await Playground.countDocuments(filter);
        const playgrounds = await Playground.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            message: "تم الحصول على الملاعب بنجاح",
            playgrounds: {
                playgrounds: playgrounds,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: playgrounds.length,
                    totalPlaygrounds: total
                }
            }
        });
    } catch (error) {
        console.error("Error fetching playgrounds:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على الملاعب",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على ملعب بمعرف محدد
exports.getPlaygroundById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف الملعب غير صالح"
            });
        }

        const playground = await Playground.findById(id);

        if (!playground) {
            return res.status(404).json({
                success: false,
                message: "الملعب غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم الحصول على الملعب بنجاح",
            playgrounds: playground
        });
    } catch (error) {
        console.error("Error fetching playground:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على الملعب",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// تحديث بيانات ملعب
exports.updatePlayground = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف الملعب غير صالح"
            });
        }

        // إزالة الحقول التي لا يجب تحديثها
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        // تنظيف وتحقق من البيانات
        if (updates.name) updates.name = updates.name.trim();
        if (updates.location) updates.location = updates.location.trim();
        if (updates.contact) updates.contact = updates.contact.trim();

        // التحقق من عدم وجود ملعب بنفس الاسم والموقع (إذا تم تحديثهما)
        if (updates.name || updates.location) {
            const existingPlayground = await Playground.findOne({
                _id: { $ne: id },
                $and: [
                    updates.name ? { name: { $regex: new RegExp(`^${updates.name}$`, 'i') } } : {},
                    updates.location ? { location: { $regex: new RegExp(`^${updates.location}$`, 'i') } } : {}
                ]
            });

            if (existingPlayground) {
                return res.status(409).json({
                    success: false,
                    message: "يوجد ملعب آخر بنفس الاسم والموقع"
                });
            }
        }

        const playground = await Playground.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!playground) {
            return res.status(404).json({
                success: false,
                message: "الملعب غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم تحديث الملعب بنجاح",
            playgrounds: playground
        });
    } catch (error) {
        console.error("Error updating playground:", error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "فشل في التحقق من البيانات",
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: "خطأ في تحديث الملعب",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// حذف ملعب
exports.deletePlayground = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف الملعب غير صالح"
            });
        }

        const playground = await Playground.findByIdAndDelete(id);

        if (!playground) {
            return res.status(404).json({
                success: false,
                message: "الملعب غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم حذف الملعب بنجاح",
            playgrounds: { deletedId: id, deletedPlayground: playground.name }
        });
    } catch (error) {
        console.error("Error deleting playground:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في حذف الملعب",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على إحصائيات الملاعب
exports.getPlaygroundStats = async (req, res) => {
    try {
        const totalPlaygrounds = await Playground.countDocuments();
        
        // إحصائيات حسب الموقع
        const locationStats = await Playground.aggregate([
            {
                $group: {
                    _id: '$location',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // الملاعب المضافة حديثاً
        const recentlyAdded = await Playground.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name location createdAt');

        res.status(200).json({
            success: true,
            message: "تم الحصول على الإحصائيات بنجاح",
            playgrounds: {
                totalPlaygrounds,
                locationStats,
                recentlyAdded
            }
        });
    } catch (error) {
        console.error("Error fetching playground stats:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على الإحصائيات",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};
