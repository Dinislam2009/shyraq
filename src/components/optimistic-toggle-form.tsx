"use client";

import type {ReactNode} from "react";
import {useState} from "react";
import {useFormStatus} from "react-dom";

type Action=(formData:FormData)=>void|Promise<void>;

export function OptimisticToggleForm({action,initialActive,activeLabel,inactiveLabel,className="text-xs font-semibold text-slate-500",activeClassName="text-amber-600",inactiveClassName="text-slate-400",children}:{action:Action;initialActive:boolean;activeLabel?:string;inactiveLabel?:string;className?:string;activeClassName?:string;inactiveClassName?:string;children?:(active:boolean,pending:boolean)=>ReactNode}){
 const [active,setActive]=useState(initialActive);
 return <form action={action} onSubmit={()=>setActive(value=>!value)}>
  <SubmitButton active={active} activeLabel={activeLabel} inactiveLabel={inactiveLabel} className={className} activeClassName={activeClassName} inactiveClassName={inactiveClassName}>{children}</SubmitButton>
 </form>;
}

function SubmitButton({active,activeLabel,inactiveLabel,className,activeClassName,inactiveClassName,children}:{active:boolean;activeLabel?:string;inactiveLabel?:string;className:string;activeClassName:string;inactiveClassName:string;children?:((active:boolean,pending:boolean)=>ReactNode)}){const {pending}=useFormStatus();return <button disabled={pending} className={className+" disabled:opacity-50 "+(active?activeClassName:inactiveClassName)}>{children?children(active,pending):(pending?"Saving…":active?(activeLabel||"Active"):(inactiveLabel||"Inactive"))}</button>}
