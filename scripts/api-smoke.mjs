import {spawn} from "node:child_process";

const port=process.env.SHYRAQ_SMOKE_PORT||"3100";
const nextBin=new URL("../node_modules/next/dist/bin/next",import.meta.url);
const child=spawn(process.execPath,[nextBin.pathname,"start","-p",port],{stdio:["ignore","pipe","pipe"],env:{...process.env,NODE_ENV:"production"}});
let output="";
child.stdout.on("data",chunk=>{output+=String(chunk);});
child.stderr.on("data",chunk=>{output+=String(chunk);});

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitForServer(){
 const deadline=Date.now()+30000;
 while(Date.now()<deadline){
  try{
   const response=await fetch("http://127.0.0.1:"+port+"/api/health");
   return response;
  }catch{await sleep(500);}
 }
 throw new Error("Next production server did not start in time.\n"+output.slice(-4000));
}

try{
 const response=await waitForServer();
 const text=await response.text();
 let body;
 try{body=JSON.parse(text);}catch{throw new Error("Health endpoint did not return JSON.\n"+text.slice(0,1000));}
 if(!("ok" in body)||body.service!=="shyraq")throw new Error("Health endpoint contract mismatch: "+JSON.stringify(body));
 if(response.status!==200&&response.status!==503)throw new Error("Unexpected health status "+response.status+": "+JSON.stringify(body));
 console.log("API smoke passed:",response.status,JSON.stringify(body));
}finally{
 if(!child.killed)child.kill("SIGTERM");
 await sleep(500);
 if(!child.killed)child.kill("SIGKILL");
}
