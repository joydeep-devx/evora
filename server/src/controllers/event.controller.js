const eventModel = require('../models/event.model');


/**
 * Controller to get all events from the database
 */
const getAllEvents = async (req, res) => {
  try{
    const filters = {};
    
    if(req.query.category){
      filters.category = req.query.category;
    }

    if(req.query.ticketPrice){
      filters.ticketPrice = req.query.ticketPrice;
    }

    const events = await eventModel.find();
    res.status(200).json(events);
  }
  catch(error){
    console.error('Error in getAllEvents:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAllEvents,
}

