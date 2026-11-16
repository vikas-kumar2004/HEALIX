import express from "express";
import { medicalDetailsUpdate, personalDetailsUpdate } from "../controllers/update.controllers.js";


const router = express.Router();

router.post("/personal-details", personalDetailsUpdate);
router.post("/medical-detals", medicalDetailsUpdate);


export default router;