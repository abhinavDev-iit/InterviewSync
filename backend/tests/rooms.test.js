import request from "supertest";
import {describe,expect,it} from "vitest";
import app from "../src/app.js";

async function registerAgent(user){
    const agent=request.agent(app);
    await agent.post("/api/auth/register").send(user).expect(201);
    return agent;
}

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

const roomData={
    title:"Array Sum",
    problemStatement:"Return the sum of all numbers in an array.",
    language:"javascript",
    starterCode:"function sum(numbers){\n    \n}"
};

describe("interview rooms",()=>{
    it("lets an interviewer create a room",async()=>{
        const agent=await registerAgent(interviewer);
        const response=await agent.post("/api/rooms").send(roomData);

        expect(response.status).toBe(201);
        expect(response.body.room.roomCode).toMatch(/^[A-F0-9]{6}$/);
        expect(response.body.room.status).toBe("waiting");
        expect(response.body.room.currentCode).toBe(roomData.starterCode);
    });

    it("does not let a candidate create a room",async()=>{
        const agent=await registerAgent(candidate);
        const response=await agent.post("/api/rooms").send(roomData);

        expect(response.status).toBe(403);
    });

    it("lets a candidate join using a room code",async()=>{
        const interviewerAgent=await registerAgent(interviewer);
        const created=await interviewerAgent.post("/api/rooms").send(roomData);
        const candidateAgent=await registerAgent(candidate);
        const response=await candidateAgent.post("/api/rooms/join").send({
            roomCode:created.body.room.roomCode
        });

        expect(response.status).toBe(200);
        expect(response.body.room.status).toBe("active");
        expect(response.body.room.candidate.email).toBe(candidate.email);
    });

    it("rejects an invalid room code",async()=>{
        const agent=await registerAgent(candidate);
        const response=await agent.post("/api/rooms/join").send({roomCode:"BAD123"});

        expect(response.status).toBe(404);
    });

    it("does not let a second candidate take a room",async()=>{
        const interviewerAgent=await registerAgent(interviewer);
        const created=await interviewerAgent.post("/api/rooms").send(roomData);
        const firstCandidate=await registerAgent(candidate);
        await firstCandidate.post("/api/rooms/join").send({roomCode:created.body.room.roomCode});

        const secondCandidate=await registerAgent({
            ...candidate,
            name:"Riya Shah",
            email:"riya@example.com"
        });
        const response=await secondCandidate.post("/api/rooms/join").send({
            roomCode:created.body.room.roomCode
        });

        expect(response.status).toBe(409);
    });

    it("limits room access to its participants",async()=>{
        const interviewerAgent=await registerAgent(interviewer);
        const created=await interviewerAgent.post("/api/rooms").send(roomData);
        const outsider=await registerAgent({
            ...candidate,
            email:"outsider@example.com"
        });

        const response=await outsider.get(`/api/rooms/${created.body.room._id}`);
        expect(response.status).toBe(403);
    });

    it("returns only rooms relevant to the current user",async()=>{
        const interviewerAgent=await registerAgent(interviewer);
        const created=await interviewerAgent.post("/api/rooms").send(roomData);
        const candidateAgent=await registerAgent(candidate);

        expect((await candidateAgent.get("/api/rooms")).body.rooms).toHaveLength(0);
        await candidateAgent.post("/api/rooms/join").send({roomCode:created.body.room.roomCode});
        expect((await candidateAgent.get("/api/rooms")).body.rooms).toHaveLength(1);
    });

    it("only lets the owning interviewer complete a room",async()=>{
        const interviewerAgent=await registerAgent(interviewer);
        const created=await interviewerAgent.post("/api/rooms").send(roomData);
        const candidateAgent=await registerAgent(candidate);

        const denied=await candidateAgent.patch(`/api/rooms/${created.body.room._id}/complete`);
        const completed=await interviewerAgent.patch(`/api/rooms/${created.body.room._id}/complete`);

        expect(denied.status).toBe(403);
        expect(completed.status).toBe(200);
        expect(completed.body.room.status).toBe("completed");
    });
});
