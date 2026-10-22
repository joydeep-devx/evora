const express = require('express');
const { protect, admin } = require('../middlewares/auth.middleware');
const { getAllEvents , getEventById , createEvent } = require('../controllers/event.controller');

const router = express.Router();


// Get all events - api/events 
router.get('/',protect,getAllEvents);

// Get event by ID - api/events/:id
router.get('/:id',protect,getEventById);

// Create a new event (Admin Only) - api/events
router.post('/',protect,admin,createEvent);



module.exports = router;