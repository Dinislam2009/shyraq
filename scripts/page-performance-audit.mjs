import {spawn} from "node:child_process";
import {request} from "node:http";
import {resolve} from "node:path";

const port=Number(process.env.PERF_AUDIT_PORT||3197);
const base="http://127.0.0.1:"+port;
const routes=["/","/login","/signup","/offline","/api/health"];
const maxMs=Number(process.env.PERF_AUDIT_MAX_MS||5000);

function fetchRoute(url){
 return new Promise((resolvePromise,reject)=>{
  const started=performance.now();
  const req=request(url,{method:"GET",headers:{accept:"text/html,application/json"}},res=>{
   res.resume();
   res.on("end",()=>resolvePromise({status:res.statusCode||0,ms:Math.round(performance.now()-started)}));
  });
  req.on("error",reject);
  req.setTimeout(maxMs,()=>req.destroy(new Error("request timeout")));
  req.end();
 });
}

const nextBin=resolve("node_modules/next/dist/bin/next");
const child=spawn(process.execPath,[nextBin,"start","-p",String(port)],{stdio:["ignore","pipe","pipe"],env:{...process.env,NODE_ENV:"production"}});
const stop=()=>{if(!child.killed){child.kill("SIGTERM");setTimeout(()=>child.kill("SIGKILL"),1500);}};
process.on("exit",stop);

let ready=false;
for(let attempt=0;attempt<60;attempt++){
 try{
  await fetchRoute(base+"/api/health");
  ready=true;
  break;
 }catch{
  await new Promise(resolve=>setTimeout(resolve,250));
 }
}
if(!ready)throw new Error("Next production server did not become ready.");

const results=[];
for(const route of routes){
 const result=await fetchRoute(base+route);
 results.push({route,...result});
}

console.log("Page performance audit:",JSON.stringify(results));
const slow=results.filter(result=>result.ms>maxMs);
stop();
if(slow.length)throw new Error("Slow production route response: "+slow.map(result=>result.route+"="+result.ms+"ms").join(", "));
