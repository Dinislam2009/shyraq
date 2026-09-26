import test from "node:test";
import assert from "node:assert/strict";
import {summarizeBackupPayload} from "../src/lib/backup/summary.ts";

test("backup summary counts portable snapshot entities",()=>{
 const summary=summarizeBackupPayload({
  format:"shyraq-backup-v2",
  exportedAt:"2026-09-26T07:00:00.000Z",
  decks:[{id:"d1"},{id:"d2"}],
  cards:[{id:"c1"}],
  templates:[{id:"t1"}],
  tags:[{id:"tag1"}],
  cardTags:[{card_id:"c1",tag_id:"tag1"}],
  collections:[{id:"col1"}],
  collectionCards:[{collection_id:"col1",card_id:"c1"}],
  reviewStates:[{card_id:"c1"}],
  reviewEvents:[{card_id:"c1"}],
  media:[{storage_path:"a.png"}],
  deckCopies:[{id:"copy1"}],
  publicDeckFollows:[{id:"follow1"}],
  reviewPreferences:{daily_limit:50}
 });
 assert.deepEqual(summary,{
  decks:2,
  cards:1,
  templates:1,
  tags:1,
  cardTags:1,
  collections:1,
  collectionCards:1,
  reviewStates:1,
  reviewEvents:1,
  media:1,
  deckCopies:1,
  publicDeckFollows:1,
  hasReviewPreferences:true,
  exportedAt:"2026-09-26T07:00:00.000Z"
 });
});
