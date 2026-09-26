import {spawn} from "node:child_process";

const npm=process.platform==="win32"?"npm.cmd":"npm";
const child=spawn(
 npm,
 ["run","dev","--","--hostname","127.0.0.1","--port","3000"],
 {
  stdio:"inherit",
  shell:process.platform==="win32",
  env:{
   ...process.env,
   NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL||"http://127.0.0.1:54321",
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_e2e_dummy"
  }
 }
);

const forward=(signal)=>child.kill(signal);
process.on("SIGINT",()=>forward("SIGINT"));
process.on("SIGTERM",()=>forward("SIGTERM"));
child.on("exit",(code,signal)=>{
 if(signal)process.kill(process.pid,signal);
 process.exit(code??1);
});
