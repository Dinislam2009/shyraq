import {createEmptyCard,fsrs,Rating,type Card as FsrsCard,type StepUnit} from "ts-fsrs";

export type SchedulerEngine="fsrs"|"sm2";
export type SchedulerPreferences={
 engine?:SchedulerEngine;
 desiredRetention?:number;
 maximumInterval?:number;
 enableFuzz?:boolean;
 enableShortTerm?:boolean;
 learningSteps?:string[];
 relearningSteps?:string[];
};

export type ScheduledReview={
 card:Record<string,unknown>;
 log?:Record<string,unknown>;
 scheduler:SchedulerEngine;
};

const ratingMap={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;

const DEFAULT_LEARNING_STEPS=["1m","10m"] as const satisfies readonly StepUnit[];
const DEFAULT_RELEARNING_STEPS=["10m"] as const satisfies readonly StepUnit[];

function normalizeSteps(values:string[]|undefined,fallback:readonly StepUnit[]):readonly StepUnit[]{
 const valid=(values??[]).filter((step):step is StepUnit=>/^\\d+(?:m|h|d)$/.test(step));
 return valid.length?valid:fallback;
}


function fsrsSchedule(card:FsrsCard,rating:keyof typeof ratingMap,now:Date,prefs:SchedulerPreferences):ScheduledReview{
 const scheduler=fsrs({
  request_retention:prefs.desiredRetention??0.9,
  maximum_interval:prefs.maximumInterval??36500,
  enable_fuzz:prefs.enableFuzz??true,
  enable_short_term:prefs.enableShortTerm??true,
  learning_steps:prefs.learningSteps??["1m","10m"],
  relearning_steps:prefs.relearningSteps??["10m"]
 });
 const result=scheduler.next(card,now,ratingMap[rating]);
 return {card:result.card as unknown as Record<string,unknown>,log:result.log as unknown as Record<string,unknown>,scheduler:"fsrs"};
}

function sm2Schedule(previous:Record<string,unknown>|null,rating:keyof typeof ratingMap,now:Date,prefs:SchedulerPreferences):ScheduledReview{
 const prior=previous&&typeof previous==="object"?previous:{};
 const reps=Math.max(0,Number(prior.reps||0));
 const priorInterval=Math.max(0,Number(prior.intervalDays||0));
 const ease=Math.min(3,Math.max(1.3,Number(prior.easeFactor||2.5)));
 const quality={again:1,hard:2,good:3,easy:4}[rating];
 let nextEase=ease;
 let interval=priorInterval;
 let nextReps=reps+1;

 if(quality<3){
  nextReps=0;
  interval=quality===1?0:Math.max(1,Math.round(Math.max(1,priorInterval)*0.5));
  nextEase=Math.max(1.3,ease-0.2);
 }else{
  if(reps===0)interval=quality===4?4:1;
  else if(reps===1)interval=quality===4?10:6;
  else{
   const multiplier=quality===4?ease*1.3:quality===2?1.2:ease;
   interval=Math.max(1,Math.round(Math.max(1,priorInterval)*multiplier));
  }
  if(quality===4)nextEase=Math.min(3.0,ease+0.15);
  if(quality===2)nextEase=Math.max(1.3,ease-0.15);
 }
 const maximum=Math.max(1,prefs.maximumInterval??36500);
 interval=Math.min(maximum,interval);
 const due=new Date(now);
 if(interval<=0)due.setMinutes(due.getMinutes()+10);
 else due.setDate(due.getDate()+interval);
 return {
  scheduler:"sm2",
  card:{
   due,
   state:2,
   reps:nextReps,
   lapses:quality<3?Number(prior.lapses||0)+1:Number(prior.lapses||0),
   stability:interval,
   difficulty:Math.round((5-nextEase)*100)/100,
   scheduled_days:interval,
   intervalDays:interval,
   easeFactor:Math.round(nextEase*100)/100,
   last_review:now
  }
 };
}

export function createSchedulerCard(engine:SchedulerEngine="fsrs"){
 return engine==="sm2"?{due:new Date(),state:0,reps:0,lapses:0,intervalDays:0,easeFactor:2.5}:createEmptyCard();
}

export function scheduleReview(
 previous:Record<string,unknown>|null,
 rating:keyof typeof ratingMap,
 prefs:SchedulerPreferences,
 now=new Date()
):ScheduledReview{
 const engine=prefs.engine??"fsrs";
 if(engine==="sm2")return sm2Schedule(previous,rating,now,prefs);
 const card=(previous&&typeof previous==="object"&&"state" in previous?{
  ...previous,
  due:new Date(String(previous.due)),
  last_review:previous.last_review?new Date(String(previous.last_review)):undefined
 } as unknown as FsrsCard:createEmptyCard(now));
 return fsrsSchedule(card,rating,now,prefs);
}

export function previewReview(
 previous:Record<string,unknown>|null,
 prefs:SchedulerPreferences,
 now=new Date()
){
 const engine=prefs.engine??"fsrs";
 if(engine==="sm2"){
  return {
   again:sm2Schedule(previous,"again",now,prefs),
   hard:sm2Schedule(previous,"hard",now,prefs),
   good:sm2Schedule(previous,"good",now,prefs),
   easy:sm2Schedule(previous,"easy",now,prefs)
  };
 }
 const card=(previous&&typeof previous==="object"&&"state" in previous?{
  ...previous,
  due:new Date(String(previous.due)),
  last_review:previous.last_review?new Date(String(previous.last_review)):undefined
 } as unknown as FsrsCard:createEmptyCard(now));
 const scheduler=fsrs({
  request_retention:prefs.desiredRetention??0.9,
  maximum_interval:prefs.maximumInterval??36500,
  enable_fuzz:prefs.enableFuzz??true,
  enable_short_term:prefs.enableShortTerm??true,
  learning_steps:prefs.learningSteps??["1m","10m"],
  relearning_steps:prefs.relearningSteps??["10m"]
 });
 const result=scheduler.repeat(card,now);
 return {again:{card:result[Rating.Again].card as unknown as Record<string,unknown>,scheduler:"fsrs"},hard:{card:result[Rating.Hard].card as unknown as Record<string,unknown>,scheduler:"fsrs"},good:{card:result[Rating.Good].card as unknown as Record<string,unknown>,scheduler:"fsrs"},easy:{card:result[Rating.Easy].card as unknown as Record<string,unknown>,scheduler:"fsrs"}};
}
