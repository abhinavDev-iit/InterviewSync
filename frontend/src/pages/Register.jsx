import {useState} from "react";
import {Link,Navigate,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";

function Register(){
    const {user,register}=useAuth();
    const navigate=useNavigate();
    const [form,setForm]=useState({name:"",email:"",password:"",role:"candidate"});
    const [error,setError]=useState("");
    const [submitting,setSubmitting]=useState(false);

    if(user){
        return <Navigate to="/dashboard" replace />;
    }

    function updateField(event){
        setForm({...form,[event.target.name]:event.target.value});
    }

    async function handleSubmit(event){
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try{
            await register(form);
            navigate("/dashboard");
        }catch(error){
            setError(error.message);
        }finally{
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-intro register-intro">
                <Link to="/" className="brand light">Interview<span>Sync</span></Link>
                <div>
                    <p className="eyebrow light-text">GET STARTED</p>
                    <h1>Technical interviews that stay on task.</h1>
                    <p>Create a room as an interviewer or join one as a candidate.</p>
                </div>
            </section>
            <section className="auth-form-wrap">
                <form className="form-card" onSubmit={handleSubmit}>
                    <div>
                        <p className="eyebrow">CREATE ACCOUNT</p>
                        <h2>Join InterviewSync</h2>
                    </div>
                    {error && <div className="alert error">{error}</div>}
                    <label>Name<input name="name" value={form.name} onChange={updateField} required /></label>
                    <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
                    <label>Password<input name="password" type="password" minLength="6" value={form.password} onChange={updateField} required /></label>
                    <label>Role
                        <select name="role" value={form.role} onChange={updateField}>
                            <option value="candidate">Candidate</option>
                            <option value="interviewer">Interviewer</option>
                        </select>
                    </label>
                    <button className="button primary" disabled={submitting}>{submitting?"Creating account...":"Create account"}</button>
                    <p className="form-foot">Already have an account? <Link to="/login">Log in</Link></p>
                </form>
            </section>
        </main>
    );
}

export default Register;

