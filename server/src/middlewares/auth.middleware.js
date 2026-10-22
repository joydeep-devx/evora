const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

/**
 * Middleware to authenticate users based on JWT token in the Authorization header.
 */
const protect = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;

  if(token){
    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await userModel.findById(decoded.id).select('-password');

      if(!req.user){
        return res.status(401).json({ message: 'Not authorized , User not found' });
      }
      next();
    }
    catch(error){
      console.error('Error in protect middleware:', error);
      res.status(401).json({ message: 'Not authorized , Invalid token' });
    }
  }
  else{
    res.status(401).json({ message: 'Not authorized , No token provided' });  
  }
}

/**
 * Middleware to check if the authenticated user has an admin role.
 */
const admin = (req, res, next) => {
  if(req.user && req.user.role === 'admin'){
    next();
  }
  else{
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }
}

module.exports = { protect, admin };