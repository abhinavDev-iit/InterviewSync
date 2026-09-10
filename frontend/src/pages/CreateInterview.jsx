import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import api from "../services/api.js";

const starters={
    javascript:"function solution(input){\n    // Write your solution\n}\n",
    cpp:"#include <iostream>\nusing namespace std;\n\nint main(){\n    // Write your solution\n    return 0;\n}\n",
    python:"def solution(data):\n    # Write your solution\n    pass\n"
};

function CreateInterview(){
    const {user}=useAuth();
    const navigate=useNavigate();
    const [form,setForm]=useState({
        title:"",
        problemStatement:"",
        language:"javascript",
        starterCode:starters.javascript
    });
    const [error,setError]=useState("");
    const [submitting,setSubmitting]=useState(false);

    function updateField(event){
        const {name,value}=event.target;
        if(name==="language"){
            setForm({...form,language:value,starterCode:starters[value]});
            return;
        }
        setForm({...form,[name]:value});
    }

    async function handleSubmit(event){
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try{
            const data=await api.post("/api/rooms",form);
            navigate(`/rooms/${data.room._id}`);
        }catch(error){
            setError(error.message);
        }finally{
            setSubmitting(false);
        }
    }

    if(user.role!=="interviewer"){
        return <AppShell><div className="panel empty"><h2>Interviewer access only</h2><Link to="/dashboard">Back to dashboard</Link></div></AppShell>;
    }

    return (
        <AppShell>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <section className="page-heading compact">
                <div>
                    <p className="eyebrow">NEW ROOM</p>
                    <h1>Create an interview</h1>
                    <p>Add one focused problem and starter code for the candidate.</p>
                </div>
            </section>
            <form className="panel interview-form" onSubmit={handleSubmit}>
                {error && <div className="alert error">{error}</div>}
                <label>Interview title<input name="title" value={form.title} onChange={updateField} placeholder="Frontend algorithms interview" required /></label>
                <label>Problem statement<textarea name="problemStatement" rows="7" value={form.problemStatement} onChange={updateField} placeholder="Describe the task, constraints, and examples..." required /></label>
                <label>Language
                    <select name="language" value={form.language} onChange={updateField}>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                    </select>
                </label>
                <label>Starter code<textarea className="code-input" name="starterCode" rows="10" value={form.starterCode} onChange={updateField} /></label>
                <div className="form-actions">
                    <Link className="button ghost" to="/dashboard">Cancel</Link>
                    <button className="button primary" disabled={submitting}>{submitting?"Creating...":"Create room"}</button>
                </div>
            </form>
        </AppShell>
    );
}

export default CreateInterview;

