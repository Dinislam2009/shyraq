import {cookies} from "next/headers";
import {type Locale,type TranslationKey,translateKey} from "@/lib/i18n";

export async function getRequestLocale():Promise<Locale>{
 const value=(await cookies()).get("shyraq-locale")?.value;
 return value==="kk"||value==="ru"||value==="en"?value:"en";
}

export async function getServerI18n(){
 const locale=await getRequestLocale();
 return {locale,t:(key:TranslationKey)=>translateKey(locale,key)};
}
