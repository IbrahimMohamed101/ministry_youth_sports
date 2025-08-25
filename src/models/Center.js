    const mongoose = require("mongoose");

    const centerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    address: String,
    facebookLink: String,
    location: String,
    image: String,

    // العلاقات
    sportsActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: "SportActivity" }],
    socialActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: "SocialActivity" }],
    artActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: "ArtActivity" }],

    // العضوية
    membership: {
        fatherIdImage: String,
        birthCertificateImage: String,
        personalPhotos: [String],
        utilityBillImage: String,
        phone: String,
        firstTimePrice: Number,
        renewalPrice: Number
    }
    });

    module.exports = mongoose.model("Center", centerSchema);
