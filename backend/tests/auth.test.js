import request from "supertest";
import {describe,expect,it} from "vitest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";

const interviewer={
    name:"Maya Rao",
    email:"maya@example.com",
    password:"secret123",
    role:"interviewer"
};

describe("authentication",()=>{
    it("registers a user and stores a hashed password",async()=>{
        const response=await request(app).post("/api/auth/register").send(interviewer);

        expect(response.status).toBe(201);
        expect(response.body.user).toMatchObject({
            name:interviewer.name,
            email:interviewer.email,
            role:"interviewer"
        });
        expect(response.body.user.password).toBeUndefined();
        expect(response.headers["set-cookie"][0]).toContain("HttpOnly");

        const savedUser=await userModel.findOne({email:interviewer.email});
        expect(savedUser.password).not.toBe(interviewer.password);
    });

    it("rejects a duplicate email",async()=>{
        await request(app).post("/api/auth/register").send(interviewer);
        const response=await request(app).post("/api/auth/register").send(interviewer);

        expect(response.status).toBe(409);
    });

    it("rejects an invalid role",async()=>{
        const response=await request(app).post("/api/auth/register").send({
            ...interviewer,
            role:"admin"
        });

        expect(response.status).toBe(400);
    });

    it("logs in with the correct password",async()=>{
        await request(app).post("/api/auth/register").send(interviewer);
        const response=await request(app).post("/api/auth/login").send({
            email:interviewer.email,
            password:interviewer.password
        });

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(interviewer.email);
    });

    it("rejects a wrong password",async()=>{
        await request(app).post("/api/auth/register").send(interviewer);
        const response=await request(app).post("/api/auth/login").send({
            email:interviewer.email,
            password:"wrong-password"
        });

        expect(response.status).toBe(401);
    });

    it("returns the current user on a protected route",async()=>{
        const agent=request.agent(app);
        await agent.post("/api/auth/register").send(interviewer);
        const response=await agent.get("/api/auth/get-me");

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe("interviewer");
    });

    it("rejects missing and invalid tokens",async()=>{
        const missing=await request(app).get("/api/auth/get-me");
        const invalid=await request(app)
            .get("/api/auth/get-me")
            .set("Cookie","token=not-a-token");

        expect(missing.status).toBe(401);
        expect(invalid.status).toBe(401);
    });

    it("clears the authentication cookie on logout",async()=>{
        const response=await request(app).post("/api/auth/logout");

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"][0]).toContain("token=;");
    });
});
