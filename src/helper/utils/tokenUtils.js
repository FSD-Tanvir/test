const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;



const generateToken = function (_id,role) {
    const token = jwt.sign(
      { _id: _id, role:role }, 
      process.env.JWT_SECRET_KEY, 
      { expiresIn: '1h' } 
    );
    return token;
  };
  

const verifyToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
