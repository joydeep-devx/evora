const express = require('express');
const { protect, admin } = require('../middlewares/auth.middleware');
const { getAllEvents } = require('../controllers/event.controller');

const router = express.Router();


// Get all events - api/events 
router.get('/',protect,getAllEvents);

// Get event by ID - api/events/:id
router.get('/:id',protect,getEventById);


module.exports = router;