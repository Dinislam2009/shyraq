import test from "node:test";
import assert from "node:assert/strict";
import {diffCopiedCards} from "../src/lib/decks/copy-diff.ts";

test("copied card diff counts changed added and removed cards",()=>{
 const source=[
  {id:"1",kind:"basic",content:{front:"A"},sort_order:0,is_suspended:false,is_marked:false},
  {id:"2",kind:"basic",content:{front:"B2"},sort_order:1,is_suspended:false,is_marked:false},
  {id:"3",kind:"basic",content:{front:"C"},sort_order:2,is_suspended:false,is_marked:false}
 ];
 const target=[
  {id:"10",kind:"basic",content:{_sourceCardId:"1",front:"A"},sort_order:0,is_suspended:false,is_marked:false},
  {id:"20",kind:"basic",content:{_sourceCardId:"2",front:"B"},sort_order:1,is_suspended:false,is_marked:false},
  {id:"40",kind:"basic",content:{_sourceCardId:"4",front:"D"},sort_order:3,is_suspended:false,is_marked:false}
 ];
 assert.deepEqual(diffCopiedCards(source,target),{changed:1,added:1,removed:1});
});
