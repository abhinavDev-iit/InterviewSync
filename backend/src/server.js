import {createServer} from "node:http";
import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import setupSocket from "./socket/socket.js";

async function startServer(){
    if(!config.JWT_SECRET){
        throw new Error("JWT_SECRET is not defined in environmental variables");
    }
    await connectDB();
    const httpServer=createServer(app);
    setupSocket(httpServer,app);
    httpServer.listen(config.PORT,()=>{
        console.log(`Server listening on port ${config.PORT}`);
    });
}

startServer();
