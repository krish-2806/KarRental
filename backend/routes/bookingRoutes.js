import express from 'express';
import authmiddleware from '../middlewares/auth.js';
import { createBooking, deleteBooking, getBookings, getMyBookings, updateBooking, updateBookingStatus } from '../controllers/bookingController.js';
import { upload } from '../middlewares/uploads.js';


const bookingRouter = express.Router();

bookingRouter.post('/', authmiddleware, upload.single('carImage'), createBooking);
bookingRouter.get('/',getBookings);

bookingRouter.get('/mybooking', authmiddleware, getMyBookings);

bookingRouter.get('/:id', upload.single('carImage'), updateBooking);
bookingRouter.patch('/:id/status', updateBookingStatus);
bookingRouter.delete('/:id', deleteBooking);

export default bookingRouter;