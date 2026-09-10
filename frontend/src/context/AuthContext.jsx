import {createContext,useContext,useEffect,useState} from "react";
import api from "../services/api.js";

const AuthContext=createContext(null);

export function AuthProvider({children}){
    const [user,setUser]=useState(null);
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
        api.get("/api/auth/get-me")
            .then(data=>setUser(data.user))
            .catch(()=>setUser(null))
            .finally(()=>setLoading(false));
    },[]);

    async function register(formData){
        const data=await api.post("/api/auth/register",formData);
        setUser(data.user);
        return data.user;
    }

    async function login(formData){
        const data=await api.post("/api/auth/login",formData);
        setUser(data.user);
        return data.user;
    }

    async function logout(){
        await api.post("/api/auth/logout",{});
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{user,loading,register,login,logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}

