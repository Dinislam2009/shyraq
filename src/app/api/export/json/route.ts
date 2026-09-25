import {createClient} from "@/lib/supabase/server";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});

 const {data:workspace}=await supabase.from("workspaces").select("*").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 const workspaceId=workspace?.id;

 const [{data:decks},{data:templates},{data:cards},{data:tags},{data:cardTags},{data:collections},{data:collectionCards},{data:events},{data:states},{data:preferences},{data:media},{data:copies},{data:follows}] = await Promise.all([
   supabase.from("decks").select("*").eq("owner_id",user.id),
   workspaceId?supabase.from("card_templates").select("*").in("deck_id",(await supabase.from("decks").select("id").eq("owner_id",user.id)).data?.map(d=>d.id)??[]):Promise.resolve({data:[]}),
   supabase.from("cards").select("*").eq("owner_id",user.id),
   workspaceId?supabase.from("tags").select("*").eq("workspace_id",workspaceId):Promise.resolve({data:[]}),
   supabase.from("card_tags").select("*").in("card_id",(await supabase.from("cards").select("id").eq("owner_id",user.id)).data?.map(c=>c.id)??[]),
   workspaceId?supabase.from("collections").select("*").eq("workspace_id",workspaceId):Promise.resolve({data:[]}),
   workspaceId?supabase.from("collection_cards").select("*").in("collection_id",(await supabase.from("collections").select("id").eq("workspace_id",workspaceId)).data?.map(c=>c.id)??[]):Promise.resolve({data:[]}),
   supabase.from("review_events").select("*").eq("user_id",user.id).order("reviewed_at",{ascending:true}),
   supabase.from("review_states").select("*").eq("user_id",user.id),
   supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle(),
   workspaceId?supabase.from("media").select("*").eq("workspace_id",workspaceId):Promise.resolve({data:[]}),
   supabase.from("deck_copies").select("*").eq("user_id",user.id),
   supabase.from("public_deck_follows").select("*").eq("user_id",user.id)
 ]);

 const payload={
  format:"shyraq-backup-v2",
  exportedAt:new Date().toISOString(),
  user:{id:user.id,email:user.email},
  workspace,
  decks:decks??[],
  cards:cards??[],
  templates:templates??[],
  tags:tags??[],
  cardTags:cardTags??[],
  collections:collections??[],
  collectionCards:collectionCards??[],
  reviewEvents:events??[],
  reviewStates:states??[],
  reviewPreferences:preferences??null,
  media:media??[],
  deckCopies:copies??[],
  publicDeckFollows:follows??[]
 };
 return new Response(JSON.stringify(payload,null,2),{headers:{"Content-Type":"application/json","Content-Disposition":'attachment; filename="shyraq-backup.json"'}});
}