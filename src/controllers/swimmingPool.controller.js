const SwimmingPool = require('../models/SwimmingPool');
const mongoose = require('mongoose');

// إنشاء مسبح جديد
// POST /api/swimmingPools
exports.createSwimmingPool = async (req, res) => {
    try {
        const swimmingPool = new SwimmingPool(req.body);
        await swimmingPool.save();
        res.status(201).json({
            success: true,
            SwimmingPools: swimmingPool,
            message: "تم إنشاء المسبح بنجاح"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// إنشاء مسابح متعددة
// POST /api/swimmingPools/bulk
// (تمت إزالة دالة bulkCreateSwimmingPools المكررة وغير المكتملة)

// إنشاء مسابح متعددة دفعة واحدة
exports.bulkCreateSwimmingPools = async (req, res) => {
    try {
        // دعم كلا من swimmingPools و swimmingPool للمرونة
        const { swimmingPools, swimmingPool } = req.body;
        const poolsData = swimmingPools || swimmingPool;

        // التحقق من وجود المصفوفة
        if (!Array.isArray(poolsData) || poolsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "يجب إرسال مصفوفة من المسابح في حقل swimmingPools أو swimmingPool"
            });
        }

        // الحد الأقصى للمسابح في الطلب الواحد
        if (poolsData.length > 50) {
            return res.status(400).json({
                success: false,
                message: "لا يمكن إضافة أكثر من 50 مسبح في المرة الواحدة"
            });
        }

        const validPools = [];
        const errors = [];
        const duplicates = [];
        const currentYear = new Date().getFullYear();

        // التحقق من كل مسبح
        for (let i = 0; i < poolsData.length; i++) {
            const pool = poolsData[i];
            
            // دعم أسماء الحقول المختلفة (المرونة في API)
            const area = pool.area || pool.region;
            const youthCenter = pool.youthCenter || pool.center;
            const poolType = pool.poolType || pool.type;
            const establishedYear = pool.establishedYear || pool.yearEstablished;
            const lanesCount = pool.lanesCount || pool.lanes;
            
            // التحقق من البيانات المطلوبة
            if (!area?.trim() || !youthCenter?.trim() || !poolType?.trim()) {
                errors.push({
                    index: i + 1,
                    message: "المنطقة واسم مركز الشباب ونوع المسبح مطلوبة",
                    SwimmingPools: pool
                });
                continue;
            }

            // التحقق من سنة الإنشاء
            if (establishedYear && (establishedYear < 1900 || establishedYear > currentYear)) {
                errors.push({
                    index: i + 1,
                    message: `سنة الإنشاء يجب أن تكون بين 1900 و ${currentYear}`,
                    SwimmingPools: pool
                });
                continue;
            }

            // تنظيف البيانات
            const cleanPool = {
                area: area.trim(),
                youthCenter: youthCenter.trim(),
                poolType: poolType.trim(),
                establishedYear: establishedYear ? parseInt(establishedYear) : null,
                lanesCount: Math.max(0, parseInt(lanesCount) || 0)
            };

            // التحقق من التكرار في قاعدة البيانات
            const existingPool = await SwimmingPool.findOne({ 
                area: { $regex: new RegExp(`^${cleanPool.area}$`, 'i') },
                youthCenter: { $regex: new RegExp(`^${cleanPool.youthCenter}$`, 'i') }
            });

            if (existingPool) {
                duplicates.push({
                    index: i + 1,
                    message: "يوجد مسبح في نفس المنطقة ومركز الشباب",
                    SwimmingPools: cleanPool
                });
                continue;
            }

            // التحقق من التكرار داخل نفس الطلب
            const duplicateInBatch = validPools.find(vp => 
                vp.area.toLowerCase() === cleanPool.area.toLowerCase() &&
                vp.youthCenter.toLowerCase() === cleanPool.youthCenter.toLowerCase()
            );

            if (duplicateInBatch) {
                duplicates.push({
                    index: i + 1,
                    message: "تكرار داخل نفس الطلب",
                    SwimmingPools: cleanPool
                });
                continue;
            }

            validPools.push(cleanPool);
        }

        // إذا لم تكن هناك مسابح صالحة
        if (validPools.length === 0) {
            return res.status(400).json({
                success: false,
                message: "لا توجد مسابح صالحة للإضافة",
                errors: errors,
                duplicates: duplicates
            });
        }

        // إنشاء المسابح الصالحة
        let createdPools = [];
        let creationErrors = [];

        try {
            createdPools = await SwimmingPool.insertMany(validPools, { 
                ordered: false
            });
        } catch (error) {
            if (error.name === 'BulkWriteError') {
                createdPools = error.result.insertedDocs || [];
                
                if (error.writeErrors) {
                    creationErrors = error.writeErrors.map(err => ({
                        index: err.index + 1,
                        message: err.errmsg || "خطأ في الإنشاء",
                        SwimmingPools: validPools[err.index]
                    }));
                }
            } else {
                throw error;
            }
        }

        // الحصول على إجمالي المسابح في قاعدة البيانات بعد الإضافة
        const totalPoolsInDatabase = await SwimmingPool.countDocuments();

        // إعداد الاستجابة
        const response = {
            success: true,
            message: `تم إنشاء ${createdPools.length} مسبح من أصل ${poolsData.length}`,
            SwimmingPools: {
                created: createdPools,
                summary: {
                    totalSubmitted: poolsData.length,
                    created: createdPools.length,
                    failed: errors.length + creationErrors.length,
                    duplicates: duplicates.length,
                    totalPoolsInDatabase: totalPoolsInDatabase
                }
            }
        };

        if (errors.length > 0 || duplicates.length > 0 || creationErrors.length > 0) {
            response.issues = {
                validationErrors: errors,
                duplicates: duplicates,
                creationErrors: creationErrors
            };
        }

        const statusCode = createdPools.length > 0 ? 
            (errors.length > 0 || duplicates.length > 0 || creationErrors.length > 0 ? 207 : 201) : 
            400;

        res.status(statusCode).json(response);

    } catch (error) {
        console.error("Error bulk creating swimming pools:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في إنشاء المسابح المتعددة",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على جميع المسابح
exports.getAllSwimmingPools = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;
        
        // بناء فلتر البحث
        const filter = {};
        if (req.query.search) {
            filter.$or = [
                { area: { $regex: req.query.search, $options: 'i' } },
                { youthCenter: { $regex: req.query.search, $options: 'i' } },
                { poolType: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // فلترة حسب المنطقة
        if (req.query.area) {
            filter.area = { $regex: req.query.area, $options: 'i' };
        }

        // فلترة حسب نوع المسبح
        if (req.query.poolType) {
            filter.poolType = { $regex: req.query.poolType, $options: 'i' };
        }

        // فلترة حسب سنة الإنشاء
        if (req.query.yearFrom || req.query.yearTo) {
            filter.establishedYear = {};
            if (req.query.yearFrom) filter.establishedYear.$gte = parseInt(req.query.yearFrom);
            if (req.query.yearTo) filter.establishedYear.$lte = parseInt(req.query.yearTo);
        }

        const total = await SwimmingPool.countDocuments(filter);
        const swimmingPools = await SwimmingPool.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            message: "تم الحصول على المسابح بنجاح",
            SwimmingPools: {
                swimmingPools: swimmingPools,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: swimmingPools.length,
                    totalPools: total
                }
            }
        });
    } catch (error) {
        console.error("Error fetching swimming pools:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على المسابح",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على مسبح بمعرف محدد
exports.getSwimmingPoolById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف المسبح غير صالح"
            });
        }

        const swimmingPool = await SwimmingPool.findById(id);

        if (!swimmingPool) {
            return res.status(404).json({
                success: false,
                message: "المسبح غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم الحصول على المسبح بنجاح",
            SwimmingPools: swimmingPool
        });
    } catch (error) {
        console.error("Error fetching swimming pool:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على المسبح",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// تحديث بيانات مسبح
exports.updateSwimmingPool = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف المسبح غير صالح"
            });
        }

        // إزالة الحقول التي لا يجب تحديثها
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        // تنظيف وتحقق من البيانات
        if (updates.area) updates.area = updates.area.trim();
        if (updates.youthCenter) updates.youthCenter = updates.youthCenter.trim();
        if (updates.poolType) updates.poolType = updates.poolType.trim();
        if (updates.lanesCount) updates.lanesCount = Math.max(0, parseInt(updates.lanesCount));

        // التحقق من سنة الإنشاء
        if (updates.establishedYear !== undefined) {
            if (updates.establishedYear === null || updates.establishedYear === '') {
                updates.establishedYear = null;
            } else {
                const currentYear = new Date().getFullYear();
                const year = parseInt(updates.establishedYear);
                if (year < 1900 || year > currentYear) {
                    return res.status(400).json({
                        success: false,
                        message: `سنة الإنشاء يجب أن تكون بين 1900 و ${currentYear}`
                    });
                }
                updates.establishedYear = year;
            }
        }

        // التحقق من عدم وجود مسبح بنفس المنطقة ومركز الشباب (إذا تم تحديثهما)
        if (updates.area || updates.youthCenter) {
            const currentPool = await SwimmingPool.findById(id);
            if (!currentPool) {
                return res.status(404).json({
                    success: false,
                    message: "المسبح غير موجود"
                });
            }

            const checkArea = updates.area || currentPool.area;
            const checkYouthCenter = updates.youthCenter || currentPool.youthCenter;

            const existingPool = await SwimmingPool.findOne({
                _id: { $ne: id },
                area: { $regex: new RegExp(`^${checkArea}$`, 'i') },
                youthCenter: { $regex: new RegExp(`^${checkYouthCenter}$`, 'i') }
            });

            if (existingPool) {
                return res.status(409).json({
                    success: false,
                    message: "يوجد مسبح آخر في نفس المنطقة ومركز الشباب"
                });
            }
        }

        const swimmingPool = await SwimmingPool.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!swimmingPool) {
            return res.status(404).json({
                success: false,
                message: "المسبح غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم تحديث المسبح بنجاح",
            SwimmingPools: swimmingPool
        });
    } catch (error) {
        console.error("Error updating swimming pool:", error);
        
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
            message: "خطأ في تحديث المسبح",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// حذف مسبح
exports.deleteSwimmingPool = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "معرف المسبح غير صالح"
            });
        }

        const swimmingPool = await SwimmingPool.findByIdAndDelete(id);

        if (!swimmingPool) {
            return res.status(404).json({
                success: false,
                message: "المسبح غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم حذف المسبح بنجاح",
            SwimmingPools: { 
                deletedId: id, 
                deletedPool: `${swimmingPool.youthCenter} - ${swimmingPool.area}` 
            }
        });
    } catch (error) {
        console.error("Error deleting swimming pool:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في حذف المسبح",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};

// الحصول على إحصائيات المسابح
exports.getSwimmingPoolStats = async (req, res) => {
    try {
        const totalPools = await SwimmingPool.countDocuments();
        
        // إحصائيات حسب المنطقة
        const areaStats = await SwimmingPool.aggregate([
            {
                $group: {
                    _id: '$area',
                    count: { $sum: 1 },
                    totalLanes: { $sum: '$lanesCount' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // إحصائيات حسب نوع المسبح
        const poolTypeStats = await SwimmingPool.aggregate([
            {
                $group: {
                    _id: '$poolType',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // إحصائيات حسب سنة الإنشاء
        const yearStats = await SwimmingPool.aggregate([
            {
                $match: { establishedYear: { $ne: null } }
            },
            {
                $group: {
                    _id: '$establishedYear',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // المسابح المضافة حديثاً
        const recentlyAdded = await SwimmingPool.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('area youthCenter poolType createdAt');

        // إجمالي عدد الحارات
        const totalLanesResult = await SwimmingPool.aggregate([
            {
                $group: {
                    _id: null,
                    totalLanes: { $sum: '$lanesCount' },
                    avgLanes: { $avg: '$lanesCount' }
                }
            }
        ]);

        const totalLanes = totalLanesResult.length > 0 ? totalLanesResult[0].totalLanes : 0;
        const avgLanes = totalLanesResult.length > 0 ? Math.round(totalLanesResult[0].avgLanes * 100) / 100 : 0;

        res.status(200).json({
            success: true,
            message: "تم الحصول على الإحصائيات بنجاح",
            SwimmingPools: {
                totalPools,
                totalLanes,
                avgLanes,
                areaStats,
                poolTypeStats,
                yearStats,
                recentlyAdded
            }
        });
    } catch (error) {
        console.error("Error fetching swimming pool stats:", error);
        
        res.status(500).json({
            success: false,
            message: "خطأ في الحصول على الإحصائيات",
            error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
        });
    }
};