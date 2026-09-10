import {BrowserRouter,Navigate,Route,Routes} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import CreateInterview from "./pages/CreateInterview.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InterviewRoom from "./pages/InterviewRoom.jsx";
import JoinInterview from "./pages/JoinInterview.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

function PrivatePage({children}){
    return <ProtectedRoute>{children}</ProtectedRoute>;
}

function App(){
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
                    <Route path="/create" element={<PrivatePage><CreateInterview /></PrivatePage>} />
                    <Route path="/join" element={<PrivatePage><JoinInterview /></PrivatePage>} />
                    <Route path="/rooms/:roomId" element={<PrivatePage><InterviewRoom /></PrivatePage>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
