"use client";
import Dexie,{type Table} from "dexie";

export type OfflineReview={id:string;userId:string;cardId:string;deviceId:string;sequence:number;rating:"again"|"hard"|"good"|"easy";reviewedAt:string;previousState:Record<string,unknown>;nextState:Record<string,unknown>;status:"pending"|"synced"|"failed"};
class OfflineStore extends Dexie{
 reviews!:Table<OfflineReview,string>;
 constructor(){super("shyraq-offline");this.version(1).stores({reviews:"id,userId,cardId,deviceId,sequence,status,reviewedAt"});}
}
export const offlineStore=new OfflineStore();
