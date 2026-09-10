const API_URL=import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path,options={}){
    const response=await fetch(`${API_URL}${path}`,{
        credentials:"include",
        ...options,
        headers:{
            ...(options.body?{"Content-Type":"application/json"}:{}),
            ...options.headers
        }
    });

    const data=await response.json().catch(()=>({}));
    if(!response.ok){
        throw new Error(data.message || "Request failed");
    }
    return data;
}

const api={
    get:path=>request(path),
    post:(path,body)=>request(path,{method:"POST",body:JSON.stringify(body)}),
    patch:(path,body)=>request(path,{method:"PATCH",body:JSON.stringify(body)})
};

export {API_URL};
export default api;

