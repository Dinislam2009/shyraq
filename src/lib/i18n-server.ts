import {cookies} from "next/headers";
import type {Locale} from "@/lib/i18n";

export async function getRequestLocale():Promise<Locale>{
 const value=(await cookies()).get("shyraq-locale")?.value;
 return value==="kk"||value==="ru"||value==="en"?value:"en";
}
