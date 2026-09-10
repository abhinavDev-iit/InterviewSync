import Editor from "@monaco-editor/react";
import {useEffect,useRef,useState} from "react";
import {Link,useParams} from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";
import {createSocket} from "../services/socket.js";

function InterviewRoom(){
    const {roomId}=useParams();
    const {user}=useAuth();
    const [room,setRoom]=useState(null);
    const [code,setCode]=useState("");
    const [stdin,setStdin]=useState("");
    const [result,setResult]=useState(null);
    const [loading,setLoading]=useState(true);
    const [running,setRunning]=useState(false);
    const [error,setError]=useState("");
    const [connection,setConnection]=useState("connecting");
    const [presence,setPresence]=useState("");
    const [feedback,setFeedback]=useState("");
    const [rating,setRating]=useState(5);
    const socketRef=useRef(null);
    const saveTimer=useRef(null);

    useEffect(()=>{
        api.get(`/api/rooms/${roomId}`)
            .then(data=>{
                setRoom(data.room);
                setCode(data.room.currentCode);
                setFeedback(data.room.feedback || "");
                setRating(data.room.rating || 5);
            })
            .catch(error=>setError(error.message))
            .finally(()=>setLoading(false));
    },[roomId]);

    useEffect(()=>{
        const socket=createSocket();
        socketRef.current=socket;
        socket.on("connect",()=>{
            setConnection("connected");
            socket.emit("join-room",{roomId},response=>{
                if(!response.ok){
                    setError(response.message);
                }else if(typeof response.currentCode==="string"){
                    setCode(response.currentCode);
                }
            });
        });
        socket.on("disconnect",()=>setConnection("disconnected"));
        socket.on("connect_error",error=>{
            setConnection("disconnected");
            setError(error.message);
        });
        socket.on("code-update",update=>setCode(update.code));
        socket.on("execution-update",data=>setResult(data.result));
        socket.on("room-completed",()=>setRoom(current=>({...current,status:"completed"})));
        socket.on("user-joined",data=>{
            setPresence(`${data.user.name} joined the room`);
            if(data.user.role==="candidate"){
                setRoom(current=>({...current,candidate:data.user,status:"active"}));
            }
        });
        socket.on("user-left",data=>setPresence(`${data.user.name} left the room`));

        return ()=>{
            clearTimeout(saveTimer.current);
            socket.close();
        };
    },[roomId]);

    const canEdit=user.role==="candidate" && room?.status!=="completed";

    function handleCodeChange(value=""){
        if(!canEdit){
            return;
        }
        setCode(value);
        socketRef.current?.emit("code-change",{roomId,code:value});

        clearTimeout(saveTimer.current);
        saveTimer.current=setTimeout(()=>{
            api.patch(`/api/rooms/${roomId}/code`,{code:value}).catch(error=>setError(error.message));
        },700);
    }

    async function handleRun(){
        setRunning(true);
        setError("");
        setResult(null);
        try{
            const data=await api.post(`/api/rooms/${roomId}/run`,{
                language:room.language,
                code,
                stdin
            });
            setResult(data.result);
        }catch(error){
            setError(error.message);
        }finally{
            setRunning(false);
        }
    }

    async function handleFeedback(event){
        event.preventDefault();
        setError("");
        try{
            const data=await api.post(`/api/rooms/${roomId}/feedback`,{feedback,rating:Number(rating)});
            setRoom({...room,feedback:data.feedback,rating:data.rating});
            setPresence("Feedback saved");
        }catch(error){
            setError(error.message);
        }
    }

    async function handleComplete(){
        setError("");
        try{
            const data=await api.patch(`/api/rooms/${roomId}/complete`,{});
            setRoom(data.room);
            setPresence("Interview completed");
        }catch(error){
            setError(error.message);
        }
    }

    if(loading){
        return <AppShell wide><div className="center-message">Loading interview...</div></AppShell>;
    }
    if(!room){
        return <AppShell><div className="panel empty"><h2>{error || "Room not found"}</h2><Link to="/dashboard">Back to dashboard</Link></div></AppShell>;
    }

    return (
        <AppShell wide>
            <div className="room-header">
                <div>
                    <Link to="/dashboard" className="back-link">← Dashboard</Link>
                    <h1>{room.title}</h1>
                </div>
                <div className="room-header-meta">
                    <span className={`connection ${connection}`}>● {connection}</span>
                    <span className={`status ${room.status}`}>{room.status}</span>
                    <span className="room-code">{room.roomCode}</span>
                </div>
            </div>
            {presence && <div className="alert info">{presence}</div>}
            {error && <div className="alert error">{error}</div>}

            <div className="interview-layout">
                <aside className="problem-panel panel">
                    <p className="eyebrow">PROBLEM</p>
                    <h2>{room.title}</h2>
                    <p className="problem-text">{room.problemStatement}</p>
                    <div className="participant-list">
                        <div><small>Interviewer</small><strong>{room.interviewer.name}</strong></div>
                        <div><small>Candidate</small><strong>{room.candidate?.name || "Waiting to join"}</strong></div>
                    </div>
                    {user.role==="interviewer" && (
                        <form className="feedback-form" onSubmit={handleFeedback}>
                            <h3>Interview feedback</h3>
                            <label>Rating
                                <select value={rating} onChange={event=>setRating(event.target.value)}>
                                    {[5,4,3,2,1].map(value=><option value={value} key={value}>{value} / 5</option>)}
                                </select>
                            </label>
                            <label>Notes<textarea rows="5" value={feedback} onChange={event=>setFeedback(event.target.value)} placeholder="Share concise feedback..." required /></label>
                            <button className="button secondary" type="submit">Save feedback</button>
                            {room.status!=="completed" && <button className="button danger" type="button" onClick={handleComplete}>Complete interview</button>}
                        </form>
                    )}
                    {user.role==="candidate" && room.status==="completed" && room.feedback && (
                        <div className="feedback-view">
                            <p className="eyebrow">FEEDBACK · {room.rating}/5</p>
                            <p>{room.feedback}</p>
                        </div>
                    )}
                </aside>

                <section className="workspace-panel">
                    <div className="editor-bar">
                        <div><span className="file-dot"></span>solution.{room.language==="javascript"?"js":room.language==="python"?"py":"cpp"}</div>
                        <span>{canEdit?"Editable":"Read only"}</span>
                    </div>
                    <Editor
                        height="52vh"
                        theme="vs-dark"
                        language={room.language}
                        value={code}
                        onChange={handleCodeChange}
                        options={{
                            readOnly:!canEdit,
                            minimap:{enabled:false},
                            fontSize:14,
                            padding:{top:18},
                            scrollBeyondLastLine:false,
                            automaticLayout:true
                        }}
                    />
                    <div className="run-panel">
                        <div className="run-controls">
                            <label>Standard input<textarea value={stdin} onChange={event=>setStdin(event.target.value)} placeholder="Optional input for the program" rows="3" /></label>
                            {user.role==="candidate" && <button className="button run" onClick={handleRun} disabled={running || room.status==="completed"}>{running?"Running...":"▶ Run code"}</button>}
                        </div>
                        <div className="output" aria-label="Execution output">
                            <div className="output-head">
                                <strong>Output</strong>
                                {result && <span className={result.stderr?"output-status failed":"output-status"}>{result.status}{result.executionTime?` · ${result.executionTime}s`:""}</span>}
                            </div>
                            <pre>{result?(result.stderr || result.stdout || "Program finished with no output."):"Run your code to see its output here."}</pre>
                        </div>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}

export default InterviewRoom;
