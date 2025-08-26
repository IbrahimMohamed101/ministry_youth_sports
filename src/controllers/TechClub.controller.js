const TechnologyClub = require("../models/TechClub");

exports.bulkCreateTechClubs = async (req, res) => {
    try {
        const { clubs } = req.body;

        if (!Array.isArray(clubs) || clubs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Expected an array of clubs in the request body"
            });
        }

        // Validate each club data
        const validatedClubs = [];
        const errors = [];

        for (let i = 0; i < clubs.length; i++) {
            const club = clubs[i];
            const { name, phone, address, location, clubsCount, computers } = club;

            // Validate required fields
            if (!name?.trim() || !address?.trim()) {
                errors.push(`Club at index ${i}: Name and address are required`);
                continue;
            }

            // Check for duplicate names in the input
            const isDuplicate = validatedClubs.some(c => 
                c.name.toLowerCase() === name.trim().toLowerCase()
            );

            if (isDuplicate) {
                errors.push(`Duplicate club name found: ${name}`);
                continue;
            }

            validatedClubs.push({
                name: name.trim(),
                phone: phone?.trim() || "",
                address: address.trim(),
                location: location?.trim() || "",
                clubsCount: Math.max(0, parseInt(clubsCount) || 0),
                computers: Math.max(0, parseInt(computers) || 0)
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation errors in some clubs",
                errors: errors
            });
        }

        // Check for existing clubs in the database
        const existingClubs = await TechnologyClub.find({
            name: { $in: validatedClubs.map(c => new RegExp(`^${c.name}$`, 'i')) }
        });

        if (existingClubs.length > 0) {
            const existingNames = existingClubs.map(c => c.name);
            return res.status(409).json({
                success: false,
                message: "Some clubs already exist",
                existingClubs: existingNames
            });
        }

        // Insert all validated clubs
        const createdClubs = await TechnologyClub.insertMany(validatedClubs);

        res.status(201).json({
            success: true,
            message: `Successfully created ${createdClubs.length} clubs`,
            TechnologyClubs: createdClubs
        });

    } catch (error) {
        console.error("Error in bulk creating tech clubs:", error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        res.status(500).json({ 
            success: false,
            message: "Error creating technology clubs", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.createTechnology = async (req, res) => {
    try {
        const { name, phone, address, location, clubsCount, computers } = req.body;

        // Validate required fields
        if (!name?.trim() || !address?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and address are required and cannot be empty"
            });
        }

        // Check if club with same name already exists
        const existingClub = await TechnologyClub.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });

        if (existingClub) {
            return res.status(409).json({
                success: false,
                message: "A technology club with this name already exists"
            });
        }

        const techClubData = {
            name: name.trim(),
            phone: phone?.trim() || "",
            address: address.trim(),
            location: location?.trim() || "",
            clubsCount: Math.max(0, parseInt(clubsCount) || 0),
            computers: Math.max(0, parseInt(computers) || 0)
        };

        const techClub = await TechnologyClub.create(techClubData);

        res.status(201).json({
            success: true,
            message: "Technology club created successfully",
            TechnologyClubs: techClub
        });
    } catch (error) {
        console.error("Error creating techClub:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        res.status(500).json({ 
            success: false,
            message: "Error creating technology club", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.getAllTechClub = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (req.query.active !== undefined) {
            filter.isActive = req.query.active === 'true';
        }
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { address: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const total = await TechnologyClub.countDocuments(filter);
        const techClubs = await TechnologyClub.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            message: "Technology clubs retrieved successfully",
            TechnologyClubs: {
                clubs: techClubs,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: techClubs.length,
                    totalClubs: total
                }
            }
        });
    } catch (error) {
        console.error("Error fetching tech clubs:", error);
        
        res.status(500).json({
            success: false,
            message: "Error fetching technology clubs",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.getTechClubById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID format"
            });
        }

        const techClub = await TechnologyClub.findById(id);

        if (!techClub) {
            return res.status(404).json({
                success: false,
                message: "Technology club not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Technology club retrieved successfully",
            TechnologyClubs: techClub
        });
    } catch (error) {
        console.error("Error fetching tech club:", error);
        
        res.status(500).json({
            success: false,
            message: "Error fetching technology club",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.updateTechClub = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID format"
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        // Validate and clean data
        if (updates.name) updates.name = updates.name.trim();
        if (updates.address) updates.address = updates.address.trim();
        if (updates.phone) updates.phone = updates.phone.trim();
        if (updates.location) updates.location = updates.location.trim();
        if (updates.clubsCount) updates.clubsCount = Math.max(0, parseInt(updates.clubsCount));
        if (updates.computers) updates.computers = Math.max(0, parseInt(updates.computers));

        const techClub = await TechnologyClub.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!techClub) {
            return res.status(404).json({
                success: false,
                message: "Technology club not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Technology club updated successfully",
            TechnologyClubs: techClub
        });
    } catch (error) {
        console.error("Error updating tech club:", error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating technology club",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.deleteTechClub = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID format"
            });
        }

        const techClub = await TechnologyClub.findByIdAndDelete(id);

        if (!techClub) {
            return res.status(404).json({
                success: false,
                message: "Technology club not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Technology club deleted successfully",
            TechnologyClubs: { deletedId: id }
        });
    } catch (error) {
        console.error("Error deleting tech club:", error);
        
        res.status(500).json({
            success: false,
            message: "Error deleting technology club",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
