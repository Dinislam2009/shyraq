import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const allowed=new Set(["kk","ru","en"]);

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({locale:"en"},{status:401});
 const {data}=await supabase.from("profiles").select("locale").eq("id",user.id).maybeSingle();
 return NextResponse.json({locale:allowed.has(String(data?.locale))?String(data?.locale):"en"});
}

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 let body:{locale?:string};
 try{body=await request.json() as {locale?:string};}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 const locale=String(body.locale||"");
 if(!allowed.has(locale))return NextResponse.json({error:"Unsupported locale"},{status:400});
 const {error}=await supabase.from("profiles").update({locale}).eq("id",user.id);
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({locale});
}
