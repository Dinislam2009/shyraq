import {type SupabaseClient} from "@supabase/supabase-js";

export async function buildJsonBackup(supabase:SupabaseClient<any>,user:{id:string;email?:string|null}){
 const {data:workspace,error:workspaceError}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(workspaceError)throw new Error(workspaceError.message);
 const {data:decks,error:decksError}=await supabase.from("decks").select("*").eq("owner_id",user.id);
 if(decksError)throw new Error(decksError.message);
 const deckRows=decks??[];
 const deckIds=deckRows.map((deck:any)=>deck.id);
 const {data:cards,error:cardsError}=deckIds.length?await supabase.from("cards").select("*").in("deck_id",deckIds):{data:[],error:null};
 if(cardsError)throw new Error(cardsError.message);
 const cardRows=cards??[];
 const cardIds=cardRows.map((card:any)=>card.id);
 const {data:templates,error:templatesError}=deckIds.length?await supabase.from("card_templates").select("*").in("deck_id",deckIds):{data:[],error:null};
 if(templatesError)throw new Error(templatesError.message);
 const [tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult]=await Promise.all([
  workspace?supabase.from("tags").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[],error:null}),
  workspace?supabase.from("collections").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[],error:null}),
  supabase.from("review_events").select("*").eq("user_id",user.id).order("reviewed_at",{ascending:true}),
  supabase.from("review_states").select("*").eq("user_id",user.id),
  supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle(),
  workspace?supabase.from("media").select("*").eq("workspace_id",workspace.id):Promise.resolve({data:[],error:null}),
  supabase.from("deck_copies").select("*").eq("user_id",user.id),
  supabase.from("public_deck_follows").select("*").eq("user_id",user.id)
 ]);
 const firstError=[tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult].find(result=>result.error)?.error;
 if(firstError)throw new Error(firstError.message);
 const collections=collectionsResult.data??[];
 const collectionIds=collections.map((item:any)=>item.id);
 const [cardTagsResult,collectionCardsResult]=await Promise.all([
  cardIds.length?supabase.from("card_tags").select("*").in("card_id",cardIds):Promise.resolve({data:[],error:null}),
  collectionIds.length?supabase.from("collection_cards").select("*").in("collection_id",collectionIds):Promise.resolve({data:[],error:null})
 ]);
 const linkError=cardTagsResult.error||collectionCardsResult.error;
 if(linkError)throw new Error(linkError.message);
 return {
  format:"shyraq-backup-v2",
  exportedAt:new Date().toISOString(),
  user:{id:user.id,email:user.email},
  workspace,
  decks:deckRows,
  cards:cardRows,
  templates:templates??[],
  tags:tagsResult.data??[],
  cardTags:cardTagsResult.data??[],
  collections,
  collectionCards:collectionCardsResult.data??[],
  reviewEvents:eventsResult.data??[],
  reviewStates:statesResult.data??[],
  reviewPreferences:prefsResult.data??null,
  media:mediaResult.data??[],
  deckCopies:copiesResult.data??[],
  publicDeckFollows:followsResult.data??[]
 };
}
