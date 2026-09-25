import {type SupabaseClient} from "@supabase/supabase-js";

export async function buildJsonBackup(supabase:SupabaseClient<any>,user:{id:string;email?:string|null}){
 const {data:workspace}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 const {data:decks}=await supabase.from("decks").select("*").eq("owner_id",user.id);
 const deckRows=decks??[];const deckIds=deckRows.map((deck:any)=>deck.id);
 const {data:cards}=deckIds.length?await supabase.from("cards").select("*").in("deck_id",deckIds):{data:[]};
 const cardRows=cards??[];const cardIds=cardRows.map((card:any)=>card.id);
 const {data:templates}=deckIds.length?await supabase.from("card_templates").select("*").in("deck_id",deckIds):{data:[]};
 const [tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult]=await Promise.all([
  workspace?supabase.from("tags").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
  workspace?supabase.from("collections").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
  supabase.from("review_events").select("*").eq("user_id",user.id).order("reviewed_at",{ascending:true}),
  supabase.from("review_states").select("*").eq("user_id",user.id),
  supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle(),
  workspace?supabase.from("media").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[]}),
  supabase.from("deck_copies").select("*").eq("user_id",user.id),
  supabase.from("public_deck_follows").select("*").eq("user_id",user.id)
 ]);
 const collections=collectionsResult.data??[];const collectionIds=collections.map((item:any)=>item.id);
 const [cardTagsResult,collectionCardsResult]=await Promise.all([
  cardIds.length?supabase.from("card_tags").select("*").in("card_id",cardIds):Promise.resolve({data:[]}),
  collectionIds.length?supabase.from("collection_cards").select("*").in("collection_id",collectionIds):Promise.resolve({data:[]})
 ]);
 return {
  format:"shyraq-backup-v2",exportedAt:new Date().toISOString(),user:{id:user.id,email:user.email},workspace,
  decks:deckRows,cards:cardRows,templates:templates??[],tags:tagsResult.data??[],cardTags:cardTagsResult.data??[],
  collections,collectionCards:collectionCardsResult.data??[],reviewEvents:eventsResult.data??[],reviewStates:statesResult.data??[],
  reviewPreferences:prefsResult.data??null,media:mediaResult.data??[],deckCopies:copiesResult.data??[],publicDeckFollows:followsResult.data??[]
 };
}
