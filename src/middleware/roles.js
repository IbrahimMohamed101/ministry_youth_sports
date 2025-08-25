function isNewsUser(req, res, next) {
    if (req.user.role !== "news") {
        return res.status(403).json({ message: "Only news users allowed" });
    }
    next();
    }

    function isActivitiesUser(req, res, next) {
    if (req.user.role !== "activities") {
        return res.status(403).json({ message: "Only activities users allowed" });
    }
    next();
    }

    function isCentersUser(req, res, next) {
    if (req.user.role !== "centers") {
        return res.status(403).json({ message: "Only centers users allowed" });
    }
    next();
}

module.exports = { isNewsUser, isActivitiesUser, isCentersUser };
