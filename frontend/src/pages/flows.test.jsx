import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter,Route,Routes} from "react-router-dom";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";
import CreateInterview from "./CreateInterview.jsx";
import JoinInterview from "./JoinInterview.jsx";

vi.mock("../context/AuthContext.jsx",()=>({
    useAuth:vi.fn()
}));

vi.mock("../services/api.js",()=>({
    default:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}
}));

vi.mock("../components/AppShell.jsx",()=>({
    default:({children})=><div>{children}</div>
}));

function renderFlow(page,path){
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={path} element={page} />
                <Route path="/rooms/:roomId" element={<div>Interview room opened</div>} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(()=>{
    vi.clearAllMocks();
});

describe("room flows",()=>{
    it("creates an interview and opens its room",async()=>{
        useAuth.mockReturnValue({user:{name:"Maya",role:"interviewer"}});
        api.post.mockResolvedValue({room:{_id:"room-123"}});
        const user=userEvent.setup();
        renderFlow(<CreateInterview />,"/create");

        await user.type(screen.getByLabelText("Interview title"),"Array interview");
        await user.type(screen.getByLabelText("Problem statement"),"Return the array sum.");
        await user.click(screen.getByRole("button",{name:"Create room"}));

        expect(api.post).toHaveBeenCalledWith("/api/rooms",expect.objectContaining({
            title:"Array interview",
            language:"javascript"
        }));
        expect(await screen.findByText("Interview room opened")).toBeInTheDocument();
    });

    it("joins an interview with an uppercase room code",async()=>{
        useAuth.mockReturnValue({user:{name:"Arjun",role:"candidate"}});
        api.post.mockResolvedValue({room:{_id:"room-456"}});
        const user=userEvent.setup();
        renderFlow(<JoinInterview />,"/join");

        await user.type(screen.getByLabelText("Room code"),"a7k29p");
        await user.click(screen.getByRole("button",{name:"Join interview"}));

        expect(api.post).toHaveBeenCalledWith("/api/rooms/join",{roomCode:"A7K29P"});
        expect(await screen.findByText("Interview room opened")).toBeInTheDocument();
    });
});

