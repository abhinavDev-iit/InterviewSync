import {useState} from "react";
import {Link,Navigate,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";

function Login(){
    const {user,login}=useAuth();
    const navigate=useNavigate();
    const [form,setForm]=useState({email:"",password:""});
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
            await login(form);
            navigate("/dashboard");
        }catch(error){
            setError(error.message);
        }finally{
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-intro">
                <Link to="/" className="brand light">Interview<span>Sync</span></Link>
                <div>
                    <p className="eyebrow light-text">FOCUSED TECHNICAL INTERVIEWS</p>
                    <h1>One room.<br />One problem.<br />A clearer signal.</h1>
                    <p>Share code in real time without the noise of a complicated collaboration suite.</p>
                </div>
            </section>
            <section className="auth-form-wrap">
                <form className="form-card" onSubmit={handleSubmit}>
                    <div>
                        <p className="eyebrow">WELCOME BACK</p>
                        <h2>Log in to your account</h2>
                        <p className="muted">Continue to your interview rooms.</p>
                    </div>
                    {error && <div className="alert error">{error}</div>}
                    <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
                    <label>Password<input name="password" type="password" value={form.password} onChange={updateField} required /></label>
                    <button className="button primary" disabled={submitting}>{submitting?"Logging in...":"Log in"}</button>
                    <p className="form-foot">New to InterviewSync? <Link to="/register">Create an account</Link></p>
                </form>
            </section>
        </main>
    );
}

export default Login;

