import {describe,expect,it} from "vitest";
import {DEFAULT_RATING_ORDER,sanitizePerCardPreferences,sanitizeRatingOrder,sanitizeStyles} from "@/lib/review/config";

describe("review config",()=>{
 it("normalizes rating order without duplicates and restores missing defaults",()=>{
  expect(sanitizeRatingOrder(["easy","easy","bad"])).toEqual(["easy","again","hard","good"]);
 });
 it("clamps and sanitizes per-card review preferences",()=>{
  expect(sanitizePerCardPreferences({autoRevealSeconds:99,showTimer:false,ratingOrder:["hard","good"]})).toEqual({
   autoRevealSeconds:60,showTimer:false,ratingOrder:["hard","again","good","easy"]
  });
 });
 it("rejects invalid rating style colors",()=>{
  const styles=sanitizeStyles({again:{background:"red",text:"#123456"},good:{background:"#abcdef"}});
  expect(styles.again.background).not.toBe("red");
  expect(styles.again.text).toBe("#123456");
  expect(styles.good.background).toBe("#abcdef");
 });
 it("keeps four default ratings available",()=>{
  expect(DEFAULT_RATING_ORDER).toEqual(["again","hard","good","easy"]);
 });
});
