import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createCard} from "@/app/decks/[id]/cards/actions";
import {CardEditor} from "@/components/card-editor";

export default async function NewCardPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href={"/decks/"+id} className="text-sm text-slate-400 hover:text-slate-700">← Back to deck</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight">Add card</h1><p className="mt-2 text-sm text-slate-500">Write on the left and see the study card on the right.</p><CardEditor action={createCard.bind(null,id)}/></div></AppShell>;
}