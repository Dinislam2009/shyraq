export function parseCardFormData(formData:FormData){
 const kind=String(formData.get("kind")||"basic");
 const content:any={front:String(formData.get("front")||""),back:String(formData.get("back")||"")};
 const tags=String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
 const markers=String(formData.get("markers")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,20);
 const status=String(formData.get("status")||"").trim().slice(0,60);
 if(tags.length)content.tags=tags;
 if(markers.length)content.markers=markers;
 if(status)content.status=status;
 if(kind==="multiple_choice"){
  content.options=String(formData.get("options")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,10);
  const answer=Number(formData.get("answer")||0);
  content.answer=content.options.length?Math.max(0,Math.min(content.options.length-1,Number.isFinite(answer)?Math.trunc(answer):0)):0;
 }
 if(kind==="image"){
  const imageUrl=String(formData.get("image_url")||"").trim();
  if(imageUrl)content.imageUrl=imageUrl;
  const raw=String(formData.get("occlusions")||"").trim();
  if(raw)try{const parsed=JSON.parse(raw);if(Array.isArray(parsed))content.occlusions=parsed.slice(0,100);}catch{}
 }
 try{const fields=JSON.parse(String(formData.get("fields")||"{}"));if(fields&&typeof fields==="object"&&!Array.isArray(fields))content.fields=fields;}catch{}
 try{const mediaItems=JSON.parse(String(formData.get("media_items")||"[]"));if(Array.isArray(mediaItems)&&mediaItems.length)content.mediaItems=mediaItems.slice(0,10);}catch{}
 try{const prefs=JSON.parse(String(formData.get("review_preferences")||"{}"));if(prefs&&typeof prefs==="object"&&!Array.isArray(prefs))content.reviewPreferences=prefs;}catch{}
 return {
  kind,
  content,
  template_id:String(formData.get("template_id")||"").trim()||null
 };
}

export function parseDeckFormData(formData:FormData){
 return {
  name:String(formData.get("name")||"").trim().slice(0,120),
  description:String(formData.get("description")||"").slice(0,5000),
  visibility:String(formData.get("visibility")||"private"),
  workspace_id:String(formData.get("workspace_id")||"").trim(),
  settings:{
   category:String(formData.get("category")||"").trim().slice(0,60),
   subject:String(formData.get("subject")||"").trim().slice(0,80),
   language:String(formData.get("language")||"").trim().slice(0,20),
   difficulty:String(formData.get("difficulty")||"").trim().slice(0,30)
  }
 };
}
