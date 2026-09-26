    for(const key of Object.keys(fields))fields[key]=cleanMediaTokens(fields[key],card.mediaNames);
    const front=cleanMediaTokens(card.front,card.mediaNames);
    const back=cleanMediaTokens(card.back,card.mediaNames);
    fields.front=front;
    fields.back=back;
    return {
     deck_id:deck.id,owner_id:user.id,kind:card.kind,
     content:{front,back,tags:card.tags,fields,mediaItems,clozeIndex:card.kind==="cloze"?card.ord+1:undefined,
      anki:{
       sourceCardId:card.sourceCardId,sourceModelId:card.modelId,ord:card.ord,due:card.due,interval:card.interval,reps:card.reps,lapses:card.lapses,factor:card.factor,
       queue:card.queue,type:card.type,flags:card.flags,deckName:card.deckName,modelName:card.modelName,rawFields
      }
     },
     template_id:templateIdsByKey.get(deck.id+":"+String(card.modelId)+":"+String(card.ord))||templateIdsByKey.get(deck.id+":"+String(card.modelId)+":0")||null,
     sort_order:index
    };
   });

   for(let offset=0;offset<rows.length;offset+=500){
    const chunk=rows.slice(offset,offset+500);
    if(!chunk.length)continue;
    const {data:created,error:cardsError}=await supabase.from("cards").insert(chunk).select("id");
    if(cardsError)throw new Error(cardsError.message);
    for(let index=0;index<sourceDeck.cards.slice(offset,offset+chunk.length).length;index++){
     const sourceId=sourceDeck.cards[offset+index].sourceCardId;
     const importedId=created?.[index]?.id;
     if(importedId)sourceToImported.set(sourceId,importedId);
    }
    imported+=chunk.length;
   }
  }

  const scheduler=fsrs({request_retention:0.9,maximum_interval:36500,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]});
  const ratingValues={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;
  const reviewsByCard=new Map<number,any[]>();
  for(const review of parsed.reviews){
   const bucket=reviewsByCard.get(review.cardId)||[];
   bucket.push(review);
   reviewsByCard.set(review.cardId,bucket);
  }

  const reviewStateRows:any[]=[];
  for(const [sourceCardId,history] of reviewsByCard.entries()){
   const importedCardId=sourceToImported.get(sourceCardId);
   if(!importedCardId||!history.length)continue;
   history.sort((a,b)=>Number(a.timestamp)-Number(b.timestamp));
   let state=createEmptyCard(new Date(history[0].timestamp));
   let lastTimestamp=history[0].timestamp;
   for(const review of history){
    const mapped=ratingMap[review.rating];
    if(!mapped)continue;
    const result=scheduler.next(state,new Date(review.timestamp),ratingValues[mapped]);
    state=result.card;
    lastTimestamp=review.timestamp;
   }
   const stateJson=JSON.parse(JSON.stringify(state));
   const queue=state.state===2?"review":state.state===3?"relearning":"learning";
   reviewStateRows.push({
    user_id:user.id,card_id:importedCardId,queue,state_data:stateJson,due_at:new Date(state.due).toISOString(),
    last_reviewed_at:new Date(lastTimestamp).toISOString(),reps:Number(state.reps)||0,lapses:Number(state.lapses)||0,
    stability:Number(state.stability)||null,difficulty:Number(state.difficulty)||null,scheduled_days:Number(state.scheduled_days)||0
   });
  }

  if(reviewStateRows.length){
   for(let offset=0;offset<reviewStateRows.length;offset+=500){
    const {error}=await supabase.from("review_states").upsert(reviewStateRows.slice(offset,offset+500),{onConflict:"user_id,card_id"});
    if(error)throw new Error(error.message);
   }
  }
