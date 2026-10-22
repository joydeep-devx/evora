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

/**
 * Controller to get a specific event by its ID from the database
 */
const getEventById = async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.id);
    if(!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  }
  catch(error) {
    console.error('Error in getEventById:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Controller to create a new event in the database (Admin Only)
 */
const createEvent = async (req, res) => {
  try {
    const {title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageUrl} = req.body;

    const event = await eventModel.create({
      title,
      description,
      date,
      location,
      category,
      totalSeats,
      availableSeats: totalSeats,
      ticketPrice: ticketPrice || 0,
      image: image || '',
      createdBy: req.user.id
    });

    res.status(201).json(event);
  }
  catch(error) {
    console.error('Error in createEvent:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Controller to update an existing event in the database (Admin Only)
 */
const updateEvent = async (req, res) =>{
  try{
    const event = await eventModel.findByIdAndUpdate(req.params.id,req.body,{new:true});
    if(!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  }
  catch(error){
    console.error('Error in updateEvent:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
}
