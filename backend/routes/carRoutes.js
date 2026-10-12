import express from "express";
import { getCars, getCarById, createCar, updateCar, deleteCar } from "../controllers/carController.js";
import { upload } from "../middlewares/uploads.js";


const carRouter = express.Router();

carRouter.get("/", getCars);
carRouter.get("/:id", getCarById);
carRouter.post("/", upload.single('image'), createCar);
carRouter.put("/:id", upload.single('image'), updateCar);
carRouter.delete("/:id", deleteCar);

export default carRouter;