import {createEmptyCard,fsrs,Rating,type Card} from "ts-fsrs";
const scheduler=fsrs({request_retention:0.9,maximum_interval:36500,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]});
const ratings={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy} as const;
export function createNewCard(){return createEmptyCard()}
export function scheduleCard(card:Card,rating:keyof typeof ratings,now=new Date()){const result=scheduler.next(card,now,ratings[rating]);return {card:result.card,log:result.log}}
export function previewCard(card:Card,now=new Date()){const result=scheduler.repeat(card,now);return {again:result[Rating.Again],hard:result[Rating.Hard],good:result[Rating.Good],easy:result[Rating.Easy]}}
