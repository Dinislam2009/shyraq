import test from "node:test";
import assert from "node:assert/strict";
import {createSchedulerCard,scheduleReview} from "../src/lib/scheduler/index.ts";

test("FSRS scheduler returns scheduler metadata and due card",()=>{
 const card=createSchedulerCard("fsrs");
 const result=scheduleReview(card,"good",{engine:"fsrs",desiredRetention:0.9,maximumInterval:36500,enableFuzz:true,enableShortTerm:true});
 assert.equal(result.scheduler,"fsrs");
 assert.ok(result.card.due);
});

test("SM-2 scheduler creates interval/ease state",()=>{
 const card=createSchedulerCard("sm2");
 const result=scheduleReview(card,"good",{engine:"sm2",maximumInterval:36500});
 assert.equal(result.scheduler,"sm2");
 assert.equal(result.card.reps,1);
 assert.equal(result.card.intervalDays,1);
 assert.equal(result.card.easeFactor,2.5);
});

test("SM-2 easy advances faster than good",()=>{
 const card=createSchedulerCard("sm2");
 const good=scheduleReview(card,"good",{engine:"sm2"});
 const easy=scheduleReview(card,"easy",{engine:"sm2"});
 assert.ok(Number(easy.card.intervalDays)>Number(good.card.intervalDays));
});
