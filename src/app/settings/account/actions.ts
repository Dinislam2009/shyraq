"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export async function sendPasswordReset(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user?.email)redirect("/settings/account?error=No+account+email+is+available.");
 const origin=(await import("next/headers")).headers().then(h=>h.get("origin"));
 const base=await origin;
 const {error}=await supabase.auth.resetPasswordForEmail(user.email,{redirectTo:(base||"http://localhost:3000")+"/reset-password"});
 if(error)redirect("/settings/account?error="+encodeURIComponent(error.message));
 redirect("/settings/account?saved=password");
}
export async function signOutEverywhere(){
 const supabase=await createClient();
 await supabase.auth.signOut({scope:"global"});
 redirect("/login");
}
export async function deleteAccount(formData:FormData){
 const confirm=String(formData.get("confirm")||"").trim();
 if(confirm!=="DELETE")redirect("/settings/account?error=Type+DELETE+to+confirm+account+deletion.");
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await supabase.functions.invoke("delete-account",{body:{confirm:true}});
 if(error)redirect("/settings/account?error="+encodeURIComponent(error.message));
 await supabase.auth.signOut({scope:"global"});
 redirect("/login?deleted=1");
}
