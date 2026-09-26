import {getServerI18n} from "@/lib/i18n-server";
import { AuthForm } from "@/components/auth-form";
export default async function SignupPage() {
 const {t}=await getServerI18n();
 return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><h1 className="sr-only">{t("createAccount")}</h1><AuthForm mode="signup" /></main>;
}
