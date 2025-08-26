    const mongoose = require("mongoose");

    const swimmingPoolSchema = new mongoose.Schema({
    area: {
        type: String, // المنطقة
        required: true,
    },
    youthCenter: {
        type: String, // اسم مركز الشباب
        required: true,
    },
    poolType: {
        type: String, // النوع (تعليمي / نصف أولمبي / أولمبي / أطفال...)
        required: true,
    },
    establishedYear: {
        type: Number, // تاريخ الإنشاء
        default: null,
    },
    lanesCount: {
        type: Number, // عدد الحارات
        default: 0,
    },
    }, { timestamps: true });

    module.exports = mongoose.model("SwimmingPool", swimmingPoolSchema, "swimming_pools");
