import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter,Route,Routes} from "react-router-dom";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {useAuth} from "../context/AuthContext.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

vi.mock("../context/AuthContext.jsx",()=>({
    useAuth:vi.fn()
}));

function renderPage(page,path){
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={path} element={page} />
                <Route path="/dashboard" element={<div>Dashboard loaded</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(()=>{
    useAuth.mockReset();
});

describe("authentication pages",()=>{
    it("logs in and opens the dashboard",async()=>{
        const login=vi.fn().mockResolvedValue({role:"candidate"});
        useAuth.mockReturnValue({user:null,login});
        const user=userEvent.setup();
        renderPage(<Login />,"/login");

        await user.type(screen.getByLabelText("Email"),"arjun@example.com");
        await user.type(screen.getByLabelText("Password"),"secret123");
        await user.click(screen.getByRole("button",{name:"Log in"}));

        expect(login).toHaveBeenCalledWith({
            email:"arjun@example.com",
            password:"secret123"
        });
        expect(await screen.findByText("Dashboard loaded")).toBeInTheDocument();
    });

    it("registers with the selected role",async()=>{
        const register=vi.fn().mockResolvedValue({role:"interviewer"});
        useAuth.mockReturnValue({user:null,register});
        const user=userEvent.setup();
        renderPage(<Register />,"/register");

        await user.type(screen.getByLabelText("Name"),"Maya Rao");
        await user.type(screen.getByLabelText("Email"),"maya@example.com");
        await user.type(screen.getByLabelText("Password"),"secret123");
        await user.selectOptions(screen.getByLabelText("Role"),"interviewer");
        await user.click(screen.getByRole("button",{name:"Create account"}));

        expect(register).toHaveBeenCalledWith({
            name:"Maya Rao",
            email:"maya@example.com",
            password:"secret123",
            role:"interviewer"
        });
    });
});

