type Entry={count:number;resetAt:number};
const buckets=new Map<string,Entry>();
const WINDOW_MS=10*60*1000;
const LIMIT=10;
const IP_LIMIT=30;

function take(key:string,limit:number){
 const now=Date.now();
 const existing=buckets.get(key);
 if(!existing||existing.resetAt<=now){const next={count:1,resetAt:now+WINDOW_MS};buckets.set(key,next);return {allowed:true,retryAfter:Math.ceil(WINDOW_MS/1000)};}
 existing.count++;
 if(existing.count>limit)return {allowed:false,retryAfter:Math.max(1,Math.ceil((existing.resetAt-now)/1000))};
 return {allowed:true,retryAfter:Math.ceil((existing.resetAt-now)/1000)};
}

export function checkAuthRateLimit(ip:string,email:string){
 const ipResult=take("ip:"+ip,IP_LIMIT);
 if(!ipResult.allowed)return ipResult;
 return take("credential:"+ip+":"+email.toLowerCase(),LIMIT);
}
