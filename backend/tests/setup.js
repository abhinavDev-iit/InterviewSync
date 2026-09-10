import mongoose from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";
import {afterAll,afterEach,beforeAll} from "vitest";

let mongoServer;

process.env.NODE_ENV="test";
process.env.JWT_SECRET="test-secret";

beforeAll(async()=>{
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
    await mongoServer.stop();
});

