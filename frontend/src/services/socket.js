import {io} from "socket.io-client";
import {API_URL} from "./api.js";

export function createSocket(){
    return io(API_URL,{withCredentials:true});
}

