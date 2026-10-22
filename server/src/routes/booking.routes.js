const express = require('express');
const { protect , admin } = require('../middlewares/auth.middleware');
const { bookEvent } = require('../controllers/booking.controller');
const router = express.Router();

// Book an event - api/bookings
router.post('/', protect, bookEvent);



module.exports = router;