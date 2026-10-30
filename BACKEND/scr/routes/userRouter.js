import {Router} from "express";
import {addtoHistory, getUserHistory, login, register ,addParticipant} from "../controllers/user.controller.js";
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(addtoHistory)
router.route("/get_to_activity").get(getUserHistory)
router.route("/add_participant").post(addParticipant)

export default router;