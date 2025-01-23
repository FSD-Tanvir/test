const jwt = require('jsonwebtoken');
const MUser = require('../modules/users/users.schema'); // Ensure correct path

const isAdmin = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
 

    if (!token) {
        return res.status(403).json({ error: 'Access denied, token missing!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await MUser.findById(decoded._id).select('role');

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied, admin only!' });
        }

        req.user = user;
        next();
    } catch (error) {
        
        return res.status(403).json({ error: 'Invalid token or user not found!' });
    }
};

module.exports = {
    isAdmin
};
