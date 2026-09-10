import {act,render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter,Route,Routes} from "react-router-dom";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";
import {createSocket} from "../services/socket.js";
import InterviewRoom from "./InterviewRoom.jsx";

vi.mock("@monaco-editor/react",()=>({
    default:({value,onChange,options})=>(
        <textarea
            aria-label="Code editor"
            data-readonly={String(options.readOnly)}
            value={value}
            onChange={event=>onChange(event.target.value)}
            readOnly={options.readOnly}
        />
    )
}));

vi.mock("../context/AuthContext.jsx",()=>({
    useAuth:vi.fn()
}));

vi.mock("../services/api.js",()=>({
    default:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}
}));

vi.mock("../services/socket.js",()=>({
    createSocket:vi.fn()
}));

vi.mock("../components/AppShell.jsx",()=>({
    default:({children})=><div>{children}</div>
}));

const room={
    _id:"room-123",
    roomCode:"A7K29P",
    title:"Array Sum",
    problemStatement:"Return the sum of all numbers.",
    language:"javascript",
    currentCode:"function sum(values){}",
    status:"active",
    interviewer:{name:"Maya Rao"},
    candidate:{name:"Arjun Singh"}
};

let handlers;
let socket;

function renderRoom(){
    render(
        <MemoryRouter initialEntries={["/rooms/room-123"]}>
            <Routes>
                <Route path="/rooms/:roomId" element={<InterviewRoom />} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(()=>{
    vi.clearAllMocks();
    handlers={};
    socket={
        on:vi.fn((event,handler)=>{
            handlers[event]=handler;
            return socket;
        }),
        emit:vi.fn((event,data,done)=>{
            if(event==="join-room" && done){
                done({ok:true,currentCode:room.currentCode});
            }
        }),
        close:vi.fn()
    };
    createSocket.mockReturnValue(socket);
    api.get.mockResolvedValue({room});
    api.patch.mockResolvedValue({});
});

describe("interview room",()=>{
    it("gives the candidate an editable editor and shows run output",async()=>{
        useAuth.mockReturnValue({user:{name:"Arjun Singh",role:"candidate"}});
        api.post.mockResolvedValue({
            result:{stdout:"6\n",stderr:"",status:"Accepted",executionTime:"0.01"}
        });
        const user=userEvent.setup();
        renderRoom();

        const editor=await screen.findByLabelText("Code editor");
        expect(editor).toHaveAttribute("data-readonly","false");
        await user.click(screen.getByRole("button",{name:/Run code/}));

        expect(api.post).toHaveBeenCalledWith("/api/rooms/room-123/run",expect.objectContaining({
            language:"javascript",
            code:room.currentCode
        }));
        expect(await screen.findByText("6",{exact:false})).toBeInTheDocument();
        expect(screen.getByText(/Accepted/)).toBeInTheDocument();
    });

    it("keeps the interviewer editor read-only and applies live updates",async()=>{
        useAuth.mockReturnValue({user:{name:"Maya Rao",role:"interviewer"}});
        renderRoom();

        const editor=await screen.findByLabelText("Code editor");
        expect(editor).toHaveAttribute("data-readonly","true");
        expect(screen.queryByRole("button",{name:/Run code/})).not.toBeInTheDocument();

        act(()=>handlers["code-update"]({code:"console.log('live')"}));
        expect(editor).toHaveValue("console.log('live')");
    });
});

