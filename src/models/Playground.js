const mongoose = require('mongoose');

const playgroundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم الملعب مطلوب'],
        trim: true
    },

    location: {
        type: String,
        trim: true,
        required: [true, 'موقع الملعب مطلوب']
    },
    contact: {
        type: String,
        trim: true,
        default: 'غير متوفر'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Playground', playgroundSchema);
