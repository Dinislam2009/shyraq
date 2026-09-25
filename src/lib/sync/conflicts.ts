export type ConflictDecision="incoming"|"remote";

export function compareReviewTimestamps(currentReviewedAt:string|Date|null|undefined,incomingReviewedAt:string|Date|null|undefined):ConflictDecision{
 const current=currentReviewedAt?new Date(currentReviewedAt).getTime():0;
 const incoming=incomingReviewedAt?new Date(incomingReviewedAt).getTime():0;
 return current>incoming?"remote":"incoming";
}

export function shouldPreserveRemoteState(currentReviewedAt:string|Date|null|undefined,incomingReviewedAt:string|Date|null|undefined){
 return compareReviewTimestamps(currentReviewedAt,incomingReviewedAt)==="remote";
}
