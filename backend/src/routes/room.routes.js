import {Router} from "express";
import * as roomController from "../controllers/room.controller.js";
import {protect} from "../middleware/auth.middleware.js";

const roomRouter=Router();

roomRouter.use(protect);
roomRouter.post("/",roomController.createRoom);
roomRouter.get("/",roomController.getRooms);
roomRouter.post("/join",roomController.joinRoom);
roomRouter.post("/:roomId/run",roomController.runCode);
roomRouter.post("/:roomId/feedback",roomController.submitFeedback);
roomRouter.get("/:roomId",roomController.getRoom);
roomRouter.patch("/:roomId/code",roomController.saveCode);
roomRouter.patch("/:roomId/complete",roomController.completeRoom);

export default roomRouter;
