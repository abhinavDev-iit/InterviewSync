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

function getSafeBody(body,token=""){
    let safeBody=body;
    if(token){
        safeBody=safeBody.replaceAll(token,"[TOKEN]");
    }
    if(config.CODE_EXECUTION_API_KEY){
        safeBody=safeBody.replaceAll(config.CODE_EXECUTION_API_KEY,"[REDACTED]");
    }
    return safeBody.slice(0,500);
}

function logProviderError(stage,response,body,token=""){
    console.error("Judge0 request failed",{
        stage,
        status:response.status,
        statusText:response.statusText,
        body:getSafeBody(body,token)
    });
}

function parseResponse(body){
    try{
        return JSON.parse(body);
    }catch(error){
        throw new Error("Code execution provider returned invalid JSON");
    }
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
    const requestOptions={
        method:"POST",
        headers:getHeaders(),
        signal:AbortSignal.timeout(15000),
        body:JSON.stringify({
            language_id:languageId,
            source_code:code,
            stdin
        })
    };

    let submissionResponse=await fetch(
        `${apiUrl}/submissions?base64_encoded=false&wait=true`,
        requestOptions
    );
    let submissionBody=await submissionResponse.text();

    if(submissionResponse.status===400 && /wait.*not allowed/i.test(submissionBody)){
        submissionResponse=await fetch(
            `${apiUrl}/submissions?base64_encoded=false`,
            {...requestOptions,signal:AbortSignal.timeout(10000)}
        );
        submissionBody=await submissionResponse.text();
    }

    if(!submissionResponse.ok){
        logProviderError("create-submission",submissionResponse,submissionBody);
        throw new Error("Code execution provider rejected the request");
    }

    const submission=parseResponse(submissionBody);
    if(submission.status?.id>2){
        return normalizeResult(submission);
    }
    if(!submission.token){
        throw new Error("Code execution provider returned no token");
    }

    for(let attempt=0;attempt<10;attempt++){
        const resultResponse=await fetch(
            `${apiUrl}/submissions/${submission.token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time`,
            {headers:getHeaders(),signal:AbortSignal.timeout(10000)}
        );
        const resultBody=await resultResponse.text();
        if(!resultResponse.ok){
            logProviderError("get-submission",resultResponse,resultBody,submission.token);
            throw new Error("Could not read code execution result");
        }

        const result=parseResponse(resultBody);
        if(result.status?.id>2){
            return normalizeResult(result);
        }
        await wait(500);
    }

    throw new Error("Code execution timed out");
}
