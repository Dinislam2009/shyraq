export type DeckCopyDiff={changed:number;added:number;removed:number};

export function diffCopiedCards(sourceCards:any[],targetCards:any[]):DeckCopyDiff{
 const sourceById=new Map(sourceCards.map(card=>[String(card.id),card]));
 const targetBySourceId=new Map(targetCards.filter(card=>card.content?._sourceCardId).map(card=>[String(card.content._sourceCardId),card]));
 let changed=0,added=0,removed=0;
 for(const sourceCard of sourceCards){
  const local=targetBySourceId.get(String(sourceCard.id));
  if(!local){added++;continue;}
  const sourceContent={...(sourceCard.content||{})}; delete sourceContent._sourceCardId;
  const localContent={...(local.content||{})}; delete localContent._sourceCardId;
  const sourceComparable=JSON.stringify({kind:sourceCard.kind,content:sourceContent,sort_order:sourceCard.sort_order,is_suspended:sourceCard.is_suspended,is_marked:sourceCard.is_marked});
  const localComparable=JSON.stringify({kind:local.kind,content:localContent,sort_order:local.sort_order,is_suspended:local.is_suspended,is_marked:local.is_marked});
  if(sourceComparable!==localComparable)changed++;
 }
 for(const local of targetCards){
  const sourceId=local.content?._sourceCardId;
  if(sourceId&&!sourceById.has(String(sourceId)))removed++;
 }
 return {changed,added,removed};
}
