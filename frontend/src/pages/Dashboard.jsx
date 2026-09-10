import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";

function Dashboard(){
    const {user}=useAuth();
    const [rooms,setRooms]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    useEffect(()=>{
        api.get("/api/rooms")
            .then(data=>setRooms(data.rooms))
            .catch(error=>setError(error.message))
            .finally(()=>setLoading(false));
    },[]);

    const isInterviewer=user.role==="interviewer";

    return (
        <AppShell>
            <section className="page-heading">
                <div>
                    <p className="eyebrow">YOUR WORKSPACE</p>
                    <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
                    <p>{isInterviewer?"Create an interview or return to an active room.":"Join an interview with the code shared by your interviewer."}</p>
                </div>
                <Link className="button primary" to={isInterviewer?"/create":"/join"}>
                    {isInterviewer?"Create interview":"Join interview"}
                </Link>
            </section>

            {error && <div className="alert error">{error}</div>}
            {loading && <div className="panel empty">Loading rooms...</div>}
            {!loading && rooms.length===0 && (
                <div className="panel empty">
                    <div className="empty-icon">{isInterviewer?"＋":"#"}</div>
                    <h2>{isInterviewer?"No interviews yet":"No joined interviews"}</h2>
                    <p>{isInterviewer?"Create your first room and share its code with a candidate.":"Use a room code to join your first interview."}</p>
                </div>
            )}
            <div className="room-grid">
                {rooms.map(room=>(
                    <Link className="room-card" to={`/rooms/${room._id}`} key={room._id}>
                        <div className="room-card-top">
                            <span className={`status ${room.status}`}>{room.status}</span>
                            <span className="room-code">{room.roomCode}</span>
                        </div>
                        <h2>{room.title}</h2>
                        <p>{room.problemStatement}</p>
                        <div className="room-meta">
                            <span>{room.language==="cpp"?"C++":room.language}</span>
                            <span>{room.candidate?room.candidate.name:"Waiting for candidate"}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </AppShell>
    );
}

export default Dashboard;

