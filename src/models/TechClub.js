    const mongoose = require("mongoose");

    const techClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Club name is required"],
        trim: true,
        maxlength: [100, "Club name cannot exceed 100 characters"]
    },
    phone: {
        type: String,
        default: "",
        trim: true,
        validate: {
        validator: function(v) {
            // Allow empty string or valid phone number
            return v === "" || /^[\+]?[1-9][\d]{0,15}$/.test(v);
        },
        message: "Please enter a valid phone number"
        }
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
        maxlength: [200, "Address cannot exceed 200 characters"]
    },
    location: {
        type: String,
        default: "",
        trim: true,
        validate: {
        validator: function(v) {
            // Allow empty string or valid URL
            return v === "" || /^https?:\/\/.+/.test(v);
        },
        message: "Location must be a valid URL"
        }
    },
    clubsCount: {
        type: Number,
        default: 0,
        min: [0, "Clubs count cannot be negative"]
    },
    computers: {
        type: Number,
        default: 0,
        min: [0, "Computers count cannot be negative"]
    },
    isActive: {
        type: Boolean,
        default: true
    }
    }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
    });

    // Add indexes for better query performance
    techClubSchema.index({ name: 1 });
    techClubSchema.index({ createdAt: -1 });

    // Virtual for computing equipment density
    techClubSchema.virtual('computersPerClub').get(function() {
    return this.clubsCount > 0 ? Math.round((this.computers / this.clubsCount) * 100) / 100 : 0;
    });

    module.exports = mongoose.model("TechnologyClub", techClubSchema, "technology_clubs");
