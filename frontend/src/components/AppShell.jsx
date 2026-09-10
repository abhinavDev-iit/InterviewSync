import {Link,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";

function AppShell({children,wide=false}){
    const {user,logout}=useAuth();
    const navigate=useNavigate();

    async function handleLogout(){
        await logout();
        navigate("/login");
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <Link to="/dashboard" className="brand">Interview<span>Sync</span></Link>
                <div className="user-menu">
                    <div>
                        <strong>{user.name}</strong>
                        <small>{user.role}</small>
                    </div>
                    <button className="button ghost small" onClick={handleLogout}>Log out</button>
                </div>
            </header>
            <main className={wide?"page wide":"page"}>{children}</main>
        </div>
    );
}

export default AppShell;

