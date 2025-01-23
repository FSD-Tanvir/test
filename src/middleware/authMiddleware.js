const { verifyToken } = require('../helper/utils/tokenUtils.js');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const decoded = verifyToken(tokenParts[1]);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Failed to authenticate token' });
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;

