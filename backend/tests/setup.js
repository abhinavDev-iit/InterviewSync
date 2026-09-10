import mongoose from "mongoose";
import {fileURLToPath} from "node:url";
import {afterAll,afterEach,beforeAll} from "vitest";

let mongoServer;

process.env.NODE_ENV="test";
process.env.JWT_SECRET="test-secret";
process.env.MONGOMS_DOWNLOAD_DIR=fileURLToPath(new URL("../.cache/mongodb-binaries",import.meta.url));
process.env.MONGOMS_PREFER_GLOBAL_PATH="false";
process.env.MONGOMS_MD5_CHECK="false";

beforeAll(async()=>{
    const {MongoMemoryServer}=await import("mongodb-memory-server");
    mongoServer=await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterEach(async()=>{
    const collections=mongoose.connection.collections;
    for(const name in collections){
        await collections[name].deleteMany({});
    }
});

afterAll(async()=>{
    await mongoose.disconnect();
    await mongoServer?.stop();
});
