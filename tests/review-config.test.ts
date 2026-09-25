import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_RATING_ORDER,sanitizePerCardPreferences,sanitizeRatingOrder,sanitizeStyles} from "../src/lib/review/config.ts";

test("rating order normalization restores defaults",()=>{
 assert.deepEqual(sanitizeRatingOrder(["easy","easy","bad"]),["easy","again","hard","good"]);
});
test("per-card preferences are clamped and normalized",()=>{
 assert.deepEqual(sanitizePerCardPreferences({autoRevealSeconds:99,showTimer:false,ratingOrder:["hard","good"]}),{
  autoRevealSeconds:60,showTimer:false,ratingOrder:["hard","again","good","easy"]
 });
});
test("invalid rating colors are rejected while valid colors survive",()=>{
 const styles=sanitizeStyles({again:{background:"red",text:"#123456"},good:{background:"#abcdef"}});
 assert.notEqual(styles.again.background,"red");
 assert.equal(styles.again.text,"#123456");
 assert.equal(styles.good.background,"#abcdef");
});
test("default rating order stays four buttons",()=>assert.deepEqual(DEFAULT_RATING_ORDER,["again","hard","good","easy"]));
