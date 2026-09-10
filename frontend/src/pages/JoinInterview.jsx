import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";

function JoinInterview(){
    const {user}=useAuth();
    const navigate=useNavigate();
    const [roomCode,setRoomCode]=useState("");
    const [error,setError]=useState("");
    const [submitting,setSubmitting]=useState(false);

    async function handleSubmit(event){
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try{
            const data=await api.post("/api/rooms/join",{roomCode});
            navigate(`/rooms/${data.room._id}`);
        }catch(error){
            setError(error.message);
        }finally{
            setSubmitting(false);
        }
    }

    if(user.role!=="candidate"){
        return <AppShell><div className="panel empty"><h2>Candidate access only</h2><Link to="/dashboard">Back to dashboard</Link></div></AppShell>;
    }

    return (
        <AppShell>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <div className="join-wrap">
                <form className="panel join-card" onSubmit={handleSubmit}>
                    <div className="join-symbol">#</div>
                    <p className="eyebrow">JOIN A ROOM</p>
                    <h1>Enter your interview code</h1>
                    <p>Your interviewer will share a six-character room code with you.</p>
                    {error && <div className="alert error">{error}</div>}
                    <input
                        className="room-code-input"
                        aria-label="Room code"
                        value={roomCode}
                        onChange={event=>setRoomCode(event.target.value.toUpperCase())}
                        maxLength="6"
                        placeholder="A7K29P"
                        required
                    />
                    <button className="button primary" disabled={submitting}>{submitting?"Joining...":"Join interview"}</button>
                </form>
            </div>
        </AppShell>
    );
}

export default JoinInterview;

