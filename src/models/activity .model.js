    const mongoose = require("mongoose");

    const activitySchema = new mongoose.Schema(
    {
        projectName: {
        type: String,
        required: [true, "اسم المشروع مطلوب"],
        trim: true,
        maxLength: [200, "اسم المشروع لا يمكن أن يتجاوز 200 حرف"],
        },
        coordinatorName: {
        type: String,
        required: [true, "اسم المنسق مطلوب"],
        trim: true,
        maxLength: [100, "اسم المنسق لا يمكن أن يتجاوز 100 حرف"],
        },
        phoneNumber: {
        type: String,
        required: [true, "رقم التلفون مطلوب"],
        trim: true,
        validate: {
            validator: function (v) {
            // تصحيح الـ Regex (من غير الفاصلة)
            const phoneRegex = /^(\+2)?01[0-25][0-9]{8}$/;
            return phoneRegex.test(v);
            },
            message: "يرجى إدخال رقم تلفون صحيح (مثال: 01012345678)",
        },
        },
        location: {
        type: String,
        required: [true, "المكان مطلوب"],
        trim: true,
        maxLength: [150, "المكان لا يمكن أن يتجاوز 150 حرف"],
        },
        date: {
        type: Date,
        required: [true, "التاريخ مطلوب"],
        validate: {
            validator: function (v) {
            // التأكد من أن التاريخ ليس في الماضي
            return v >= new Date(new Date().setHours(0, 0, 0, 0));
            },
            message: "التاريخ يجب أن يكون في المستقبل أو اليوم",
        },
        },
        time: {
        type: String,
        required: [true, "الساعة مطلوبة"],
        trim: true,
        validate: {
            validator: function (v) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(v);
            },
            message: "يرجى إدخال الوقت بصيغة صحيحة (مثال: 14:30)",
        },
        },
        daysCount: {
        type: Number,
        required: [true, "عدد الأيام مطلوب"],
        min: [1, "عدد الأيام يجب أن يكون على الأقل يوم واحد"],
        max: [365, "عدد الأيام لا يمكن أن يتجاوز 365 يوم"],
        },
        participantsCount: {
        type: Number,
        required: [true, "عدد المشاركين مطلوب"],
        min: [1, "عدد المشاركين يجب أن يكون على الأقل شخص واحد"],
        max: [10000, "عدد المشاركين لا يمكن أن يتجاوز 10000"],
        },
        targetAge: {
        min: {
            type: Number,
            required: [true, "الحد الأدنى للعمر مطلوب"],
            min: [0, "العمر لا يمكن أن يكون أقل من صفر"],
            max: [100, "العمر لا يمكن أن يتجاوز 100 سنة"],
        },
        max: {
            type: Number,
            required: [true, "الحد الأقصى للعمر مطلوب"],
            min: [0, "العمر لا يمكن أن يكون أقل من صفر"],
            max: [100, "العمر لا يمكن أن يتجاوز 100 سنة"],
        },
        },
        gender: {
        type: String,
        required: [true, "النوع مطلوب"],
        enum: {
            values: ["بنين", "بنات", "مختلط"],
            message: "النوع يجب أن يكون: بنين، بنات، أو مختلط",
        },
        },
        accessType: {
        type: String,
        required: [true, "نوع الوصول مطلوب"],
        enum: {
            values: ["الأعضاء فقط", "للجميع"],
            message: "نوع الوصول يجب أن يكون: الأعضاء فقط أو للجميع",
        },
        },
        notes: {
        type: String,
        maxLength: [500, "الملاحظات لا يمكن أن تتجاوز 500 حرف"],
        },
        slug: {
        type: String,
        unique: true,
        lowercase: true,
        },
        status: {
        type: String,
        enum: ["مجدول", "جاري", "ملغي"],
        default: "مجدول",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
    );

    // Validator: تأكد أن max > min
    activitySchema.pre("validate", function (next) {
    if (this.targetAge && this.targetAge.max < this.targetAge.min) {
        this.invalidate(
        "targetAge.max",
        "الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى"
        );
    }
    next();
    });

    // Slug Generator
activitySchema.pre('save', function(next) {
  if (this.isModified('projectName')) {
    let slug = this.projectName
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\u0600-\u06FF\u0750-\u077F\w\s-]/g, '') // Keep Arabic chars and basic chars
      .toLowerCase();

    // Append date (yyyyMMddHHmmss) to make it unique
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1)
      .toString().padStart(2,'0')}${now.getDate()
      .toString().padStart(2,'0')}${now.getHours()
      .toString().padStart(2,'0')}${now.getMinutes()
      .toString().padStart(2,'0')}${now.getSeconds()
      .toString().padStart(2,'0')}`;

    slug = `${slug}-${timestamp}`;

    this.slug = slug;
  }
  next();
});

    // Virtuals
    activitySchema.virtual("formattedDate").get(function () {
    return this.date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    });

    activitySchema.virtual("ageRange").get(function () {
    if (this.targetAge.min === this.targetAge.max) {
        return `${this.targetAge.min} سنة`;
    }
    return `من ${this.targetAge.min} إلى ${this.targetAge.max} سنة`;
    });

    activitySchema.virtual("duration").get(function () {
    if (this.daysCount === 1) return "يوم واحد";
    if (this.daysCount === 2) return "يومان";
    if (this.daysCount <= 10) return `${this.daysCount} أيام`;
    return `${this.daysCount} يوماً`;
    });

    // Indexes
    activitySchema.index({ projectName: "text", location: "text", coordinatorName: "text" });
    activitySchema.index({ date: 1 });
    activitySchema.index({ status: 1 });
    activitySchema.index({ slug: 1 });
    activitySchema.index({ createdAt: -1 });

    module.exports = mongoose.model("Activity", activitySchema);
