type BackupRecord=Record<string,unknown>;

const list=(value:unknown):BackupRecord[]=>Array.isArray(value)?value.filter((item):item is BackupRecord=>Boolean(item&&typeof item==="object")):[];

export function summarizeBackupPayload(payload:BackupRecord){
 const decks=list(payload.decks);
 const cards=list(payload.cards);
 const templates=list(payload.templates);
 const tags=list(payload.tags);
 const cardTags=list(payload.cardTags);
 const collections=list(payload.collections);
 const collectionCards=list(payload.collectionCards);
 const reviewStates=list(payload.reviewStates);
 const reviewEvents=list(payload.reviewEvents);
 const media=list(payload.media);
 const deckCopies=list(payload.deckCopies);
 const publicDeckFollows=list(payload.publicDeckFollows);
 return {
  decks:decks.length,
  cards:cards.length,
  templates:templates.length,
  tags:tags.length,
  cardTags:cardTags.length,
  collections:collections.length,
  collectionCards:collectionCards.length,
  reviewStates:reviewStates.length,
  reviewEvents:reviewEvents.length,
  media:media.length,
  deckCopies:deckCopies.length,
  publicDeckFollows:publicDeckFollows.length,
  hasReviewPreferences:Boolean(payload.reviewPreferences&&typeof payload.reviewPreferences==="object"),
  exportedAt:typeof payload.exportedAt==="string"?payload.exportedAt:null
 };
}
