import request from "supertest";
import {describe,expect,it} from "vitest";
import app from "../src/app.js";

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

async function createRoomWithCandidate(){
    const interviewerAgent=request.agent(app);
    await interviewerAgent.post("/api/auth/register").send(interviewer);
    const created=await interviewerAgent.post("/api/rooms").send({
        title:"Array Sum",
        problemStatement:"Return the sum.",
        starterCode:"function sum(values){}"
    });

    const candidateAgent=request.agent(app);
    await candidateAgent.post("/api/auth/register").send(candidate);
    await candidateAgent.post("/api/rooms/join").send({roomCode:created.body.room.roomCode});

    return {interviewerAgent,candidateAgent,roomId:created.body.room._id};
}

describe("interview feedback",()=>{
    it("lets the room interviewer submit feedback",async()=>{
        const room=await createRoomWithCandidate();
        const response=await room.interviewerAgent
            .post(`/api/rooms/${room.roomId}/feedback`)
            .send({feedback:"Clear approach and good communication.",rating:4});

        expect(response.status).toBe(200);
        expect(response.body.rating).toBe(4);
    });

    it("does not let the candidate submit feedback",async()=>{
        const room=await createRoomWithCandidate();
        const response=await room.candidateAgent
            .post(`/api/rooms/${room.roomId}/feedback`)
            .send({feedback:"My own feedback",rating:5});

        expect(response.status).toBe(403);
    });

    it("does not let another interviewer submit feedback",async()=>{
        const room=await createRoomWithCandidate();
        const outsider=request.agent(app);
        await outsider.post("/api/auth/register").send({
            ...interviewer,
            email:"other-interviewer@example.com"
        });

        const response=await outsider
            .post(`/api/rooms/${room.roomId}/feedback`)
            .send({feedback:"Not my room",rating:1});

        expect(response.status).toBe(403);
    });

    it("validates the rating",async()=>{
        const room=await createRoomWithCandidate();
        const response=await room.interviewerAgent
            .post(`/api/rooms/${room.roomId}/feedback`)
            .send({feedback:"Good",rating:8});

        expect(response.status).toBe(400);
    });

    it("reveals feedback to the candidate only after completion",async()=>{
        const room=await createRoomWithCandidate();
        await room.interviewerAgent
            .post(`/api/rooms/${room.roomId}/feedback`)
            .send({feedback:"Strong solution",rating:5});

        const activeRoom=await room.candidateAgent.get(`/api/rooms/${room.roomId}`);
        expect(activeRoom.body.room.feedback).toBeUndefined();

        await room.interviewerAgent.patch(`/api/rooms/${room.roomId}/complete`);
        const completedRoom=await room.candidateAgent.get(`/api/rooms/${room.roomId}`);
        expect(completedRoom.body.room.feedback).toBe("Strong solution");
        expect(completedRoom.body.room.rating).toBe(5);
    });
});
