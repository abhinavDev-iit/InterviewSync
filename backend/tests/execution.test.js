import request from "supertest";
import {afterEach,describe,expect,it,vi} from "vitest";
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
        title:"Print greeting",
        problemStatement:"Print hello.",
        language:"javascript",
        starterCode:"console.log('hello')"
    });

    const candidateAgent=request.agent(app);
    await candidateAgent.post("/api/auth/register").send(candidate);
    await candidateAgent.post("/api/rooms/join").send({roomCode:created.body.room.roomCode});

    return {interviewerAgent,candidateAgent,roomId:created.body.room._id};
}

afterEach(()=>{
    vi.restoreAllMocks();
});

describe("code execution",()=>{
    it("runs member code through the mocked provider",async()=>{
        const room=await createRoomWithCandidate();
        const fetchMock=vi.spyOn(global,"fetch")
            .mockResolvedValueOnce(new Response(JSON.stringify({token:"submission-token"}),{status:201}))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                stdout:"hello\n",
                stderr:null,
                time:"0.014",
                status:{id:3,description:"Accepted"}
            }),{status:200}));

        const response=await room.candidateAgent
            .post(`/api/rooms/${room.roomId}/run`)
            .send({language:"javascript",code:"console.log('hello')"});

        expect(response.status).toBe(200);
        expect(response.body.result).toEqual({
            stdout:"hello\n",
            stderr:"",
            status:"Accepted",
            executionTime:"0.014"
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).language_id).toBe(63);
    });

    it("rejects an unrelated user",async()=>{
        const room=await createRoomWithCandidate();
        const outsider=request.agent(app);
        await outsider.post("/api/auth/register").send({
            ...candidate,
            email:"outsider@example.com"
        });

        const response=await outsider
            .post(`/api/rooms/${room.roomId}/run`)
            .send({language:"python",code:"print('hello')"});

        expect(response.status).toBe(403);
    });

    it("rejects unsupported languages before calling the provider",async()=>{
        const room=await createRoomWithCandidate();
        const fetchMock=vi.spyOn(global,"fetch");
        const response=await room.candidateAgent
            .post(`/api/rooms/${room.roomId}/run`)
            .send({language:"ruby",code:"puts 'hello'"});

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns a useful error when the provider fails",async()=>{
        const room=await createRoomWithCandidate();
        vi.spyOn(global,"fetch").mockResolvedValueOnce(new Response("unavailable",{status:503}));

        const response=await room.candidateAgent
            .post(`/api/rooms/${room.roomId}/run`)
            .send({language:"cpp",code:"int main(){}"});

        expect(response.status).toBe(502);
        expect(response.body.message).toContain("provider");
    });
});
