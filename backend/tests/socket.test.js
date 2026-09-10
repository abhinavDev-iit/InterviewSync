import {createServer} from "node:http";
import request from "supertest";
import {io as createClient} from "socket.io-client";
import {afterAll,afterEach,beforeAll,describe,expect,it} from "vitest";
import app from "../src/app.js";
import setupSocket from "../src/socket/socket.js";

let httpServer;
let ioServer;
let serverUrl;
const clients=[];

const interviewer={
    name:"Maya Rao",
    email:"maya@example.com",
    password:"secret123",
    role:"interviewer"
};

const candidate={
    name:"Arjun Singh",
    email:"arjun@example.com",
    password:"secret123",
    role:"candidate"
};

async function register(user){
    const response=await request(app).post("/api/auth/register").send(user);
    return response.headers["set-cookie"][0].split(";")[0];
}

function connect(cookie){
    return new Promise((resolve,reject)=>{
        const client=createClient(serverUrl,{
            transports:["websocket"],
            extraHeaders:cookie?{Cookie:cookie}:{}
        });
        clients.push(client);
        client.once("connect",()=>resolve(client));
        client.once("connect_error",reject);
    });
}

function emit(client,event,data){
    return new Promise(resolve=>client.emit(event,data,resolve));
}

async function createJoinedRoom(){
    const interviewerAgent=request.agent(app);
    const interviewerResponse=await interviewerAgent.post("/api/auth/register").send(interviewer);
    const candidateAgent=request.agent(app);
    const candidateResponse=await candidateAgent.post("/api/auth/register").send(candidate);
    const interviewerCookie=interviewerResponse.headers["set-cookie"][0].split(";")[0];
    const candidateCookie=candidateResponse.headers["set-cookie"][0].split(";")[0];

    const created=await interviewerAgent.post("/api/rooms").send({
        title:"Array Sum",
        problemStatement:"Return the sum.",
        language:"javascript",
        starterCode:"function sum(values){}"
    });
    await candidateAgent.post("/api/rooms/join").send({roomCode:created.body.room.roomCode});

    return {
        roomId:created.body.room._id,
        interviewerCookie,
        candidateCookie,
        interviewerAgent,
        candidateAgent
    };
}

beforeAll(async()=>{
    httpServer=createServer(app);
    ioServer=setupSocket(httpServer);
    await new Promise(resolve=>httpServer.listen(0,"127.0.0.1",resolve));
    serverUrl=`http://127.0.0.1:${httpServer.address().port}`;
});

afterEach(()=>{
    while(clients.length){
        clients.pop().close();
    }
});

afterAll(async()=>{
    await new Promise(resolve=>ioServer.close(resolve));
});

describe("real-time code sync",()=>{
    it("rejects an unauthenticated socket",async()=>{
        await expect(connect()).rejects.toThrow("Authentication required");
    });

    it("lets both room participants join",async()=>{
        const room=await createJoinedRoom();
        const interviewerClient=await connect(room.interviewerCookie);
        const candidateClient=await connect(room.candidateCookie);

        expect((await emit(interviewerClient,"join-room",{roomId:room.roomId})).ok).toBe(true);
        expect((await emit(candidateClient,"join-room",{roomId:room.roomId})).ok).toBe(true);
    });

    it("sends candidate code changes to the interviewer",async()=>{
        const room=await createJoinedRoom();
        const interviewerClient=await connect(room.interviewerCookie);
        const candidateClient=await connect(room.candidateCookie);
        await emit(interviewerClient,"join-room",{roomId:room.roomId});
        await emit(candidateClient,"join-room",{roomId:room.roomId});

        const update=new Promise(resolve=>interviewerClient.once("code-update",resolve));
        const result=await emit(candidateClient,"code-change",{
            roomId:room.roomId,
            code:"console.log('synced')"
        });

        expect(result.ok).toBe(true);
        expect((await update).code).toBe("console.log('synced')");
    });

    it("does not let an unrelated user join",async()=>{
        const room=await createJoinedRoom();
        const outsiderCookie=await register({
            ...candidate,
            email:"outsider@example.com"
        });
        const outsider=await connect(outsiderCookie);

        const result=await emit(outsider,"join-room",{roomId:room.roomId});
        expect(result.ok).toBe(false);
    });

    it("does not let the interviewer change code",async()=>{
        const room=await createJoinedRoom();
        const interviewerClient=await connect(room.interviewerCookie);
        await emit(interviewerClient,"join-room",{roomId:room.roomId});

        const result=await emit(interviewerClient,"code-change",{
            roomId:room.roomId,
            code:"not allowed"
        });

        expect(result.ok).toBe(false);
    });

    it("persists a debounced candidate save for reconnects",async()=>{
        const room=await createJoinedRoom();
        const saved=await room.candidateAgent
            .patch(`/api/rooms/${room.roomId}/code`)
            .send({code:"const restored = true;"});
        const fetched=await room.interviewerAgent.get(`/api/rooms/${room.roomId}`);

        expect(saved.status).toBe(200);
        expect(fetched.body.room.currentCode).toBe("const restored = true;");
    });
});
