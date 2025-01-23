const config = require("../config/config");

const errorHandler = (err, req, res, next) => {
     const status = err.status || 500;
     const message = err.message || 'Internal Server Error';
     const stack = process.env.NODE_ENV === 'development' ? err.stack : null;
  
    res.status(status).json({
    error: {
      message,
      status,
      stack
    }
  });
};

module.exports = errorHandler