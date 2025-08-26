const express = require('express');
const router = express.Router();
const { 
    createSwimmingPool,
    bulkCreateSwimmingPools,
    getAllSwimmingPools,
    getSwimmingPoolById,
    updateSwimmingPool,
    deleteSwimmingPool,
    getSwimmingPoolStats
} = require('../controllers/swimmingPool.controller');

// // إنشاء مسبح جديد (للإدارة فقط)
// router.post(
//     '/',
//     createSwimmingPool
// );

// // إنشاء مسابح متعددة دفعة واحدة (للإدارة فقط)
// router.post(
//     '/bulk',
//     bulkCreateSwimmingPools
// );

// الحصول على جميع المسابح (مع البحث والفلترة والتصفح)
router.get(
    '/',
    getAllSwimmingPools
);

// الحصول على إحصائيات المسابح
router.get(
    '/stats',
    getSwimmingPoolStats
);

// الحصول على مسبح بمعرف محدد
router.get(
    '/:id',
    getSwimmingPoolById
);

// // تحديث بيانات مسبح (للإدارة فقط)
// router.put(
//     '/:id',
//     updateSwimmingPool
// );

// // حذف مسبح (للإدارة فقط)
// router.delete(
//     '/:id',
//     deleteSwimmingPool
// );

module.exports = router;