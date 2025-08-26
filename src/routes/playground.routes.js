const express = require('express');
const router = express.Router();
const { 
    createPlayground,
    getAllPlaygrounds,
    getPlaygroundById,
    updatePlayground,
    deletePlayground,
    getPlaygroundStats,
    bulkCreatePlaygrounds
} = require('../controllers/playground.controller');
const { validateToken } = require('../middleware/auth');
const { validateUserRole } = require('../middleware/roles');

// // إنشاء ملعب جديد (للإدارة فقط)
// router.post(
//     '/',
//     createPlayground
// );

// // إنشاء ملاعب متعددة (للإدارة فقط)
// router.post(
//     '/bulk',
//     bulkCreatePlaygrounds
// );

// الحصول على جميع الملاعب (مع البحث والتصفح)
router.get(
    '/',
    getAllPlaygrounds
);

// الحصول على إحصائيات الملاعب
router.get(
    '/stats',
    getPlaygroundStats
);

// الحصول على ملعب بمعرف محدد
router.get(
    '/:id',
    getPlaygroundById
);

// // تحديث بيانات ملعب (للإدارة فقط)
// router.put(
//     '/:id',
//     updatePlayground
// );

// // حذف ملعب (للإدارة فقط)
// router.delete(
//     '/:id',
//     deletePlayground
// );

module.exports = router;