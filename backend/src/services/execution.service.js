import config from "../config/config.js";

const languageIds={
    javascript:63,
    cpp:54,
    python:71
};

function getHeaders(){
    const headers={"Content-Type":"application/json"};
    if(config.CODE_EXECUTION_API_KEY){
        headers["X-Auth-Token"]=config.CODE_EXECUTION_API_KEY;
    }
    return headers;
}

function wait(milliseconds){
    return new Promise(resolve=>setTimeout(resolve,milliseconds));
}

function normalizeResult(result){
    return {
        stdout:result.stdout || "",
        stderr:result.stderr || result.compile_output || result.message || "",
        status:result.status?.description || "Unknown",
        executionTime:result.time || null
    };
}

export async function executeCode(language,code,stdin=""){
    const languageId=languageIds[language];
    if(!languageId){
        throw new Error("Unsupported language");
    }

    const apiUrl=config.CODE_EXECUTION_API_URL.replace(/\/$/,"");
    const submissionResponse=await fetch(`${apiUrl}/submissions?base64_encoded=false`,{
        method:"POST",
        headers:getHeaders(),
        signal:AbortSignal.timeout(10000),
        body:JSON.stringify({
            language_id:languageId,
            source_code:code,
            stdin
        })
    });

    if(!submissionResponse.ok){
        throw new Error("Code execution provider rejected the request");
    }

    const submission=await submissionResponse.json();
    if(!submission.token){
        throw new Error("Code execution provider returned no token");
    }

    for(let attempt=0;attempt<10;attempt++){
        const resultResponse=await fetch(
            `${apiUrl}/submissions/${submission.token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time`,
            {headers:getHeaders(),signal:AbortSignal.timeout(10000)}
        );
        if(!resultResponse.ok){
            throw new Error("Could not read code execution result");
        }

        const result=await resultResponse.json();
        if(result.status?.id>2){
            return normalizeResult(result);
        }
        await wait(500);
    }

    throw new Error("Code execution timed out");
}
