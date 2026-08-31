module.exports = (req, res, next) => {
    const { title } = req.body;
    if (!title || title.trim().length < 3) {
        return res.status(400).json({ success: false, message: 'Title is required and must be at least 3 characters' });
    }
    next();
};
