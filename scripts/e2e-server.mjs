import {spawn} from "node:child_process";

const isWindows=process.platform==="win32";
const npm=process.env.npm_execpath||"npm";
const command=isWindows?(process.env.ComSpec||"cmd.exe"):npm;
isWindows
 ? undefined
 : undefined;
const args=isWindows
 ? ["/d","/s","/c",npm+" run start -- --hostname 127.0.0.1 --port 3000"]
 : ["run","start","--","--hostname","127.0.0.1","--port","3000"];

const child=spawn(command,args,{
 stdio:"inherit",
 env:{
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL||"http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_e2e_dummy"
 }
});

const forward=(signal)=>child.kill(signal);
process.on("SIGINT",()=>forward("SIGINT"));
process.on("SIGTERM",()=>forward("SIGTERM"));
child.on("exit",(code,signal)=>{
 if(signal)process.kill(process.pid,signal);
 process.exit(code??1);
});