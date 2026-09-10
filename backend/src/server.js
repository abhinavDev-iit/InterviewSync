import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";

async function startServer(){
    await connectDB();
    app.listen(config.PORT,()=>{
        console.log(`Server listening on port ${config.PORT}`);
    });
}

startServer();

