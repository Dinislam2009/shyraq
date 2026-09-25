export type RatingKey = "again" | "hard" | "good" | "easy";

export const DEFAULT_RATING_ORDER: RatingKey[] = ["again","hard","good","easy"];

export const DEFAULT_RATING_STYLES: Record<RatingKey,{background:string;text:string}> = {
  again:{background:"#fee2e2",text:"#991b1b"},
  hard:{background:"#fef3c7",text:"#92400e"},
  good:{background:"#dcfce7",text:"#166534"},
  easy:{background:"#dbeafe",text:"#1e40af"}
};

export function sanitizeRatingOrder(value: unknown): RatingKey[] {
  const values=Array.isArray(value)?value.map(String):[];
  const unique: RatingKey[]=[];
  for(const item of values){
    if((DEFAULT_RATING_ORDER as string[]).includes(item) && !unique.includes(item as RatingKey)) unique.push(item as RatingKey);
  }
  return [...unique,...DEFAULT_RATING_ORDER.filter(item=>!unique.includes(item))];
}

export function sanitizeStyles(value: unknown): Record<RatingKey,{background:string;text:string}> {
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,any>:{};
  const result={...DEFAULT_RATING_STYLES};
  for(const key of DEFAULT_RATING_ORDER){
    const background=String(source[key]?.background||"");
    const text=String(source[key]?.text||"");
    if(/^#[0-9a-fA-F]{6}$/.test(background))result[key]={...result[key],background};
    if(/^#[0-9a-fA-F]{6}$/.test(text))result[key]={...result[key],text};
  }
  return result;
}

export type PerCardReviewPreferences = {
  autoRevealSeconds?: number;
  showTimer?: boolean;
  swipeEnabled?: boolean;
  ratingOrder?: RatingKey[];
};

export function sanitizePerCardPreferences(value: unknown): PerCardReviewPreferences {
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const result: PerCardReviewPreferences={};
  const seconds=Number(source.autoRevealSeconds);
  if(Number.isFinite(seconds))result.autoRevealSeconds=Math.min(60,Math.max(0,seconds));
  if(typeof source.showTimer==="boolean")result.showTimer=source.showTimer;
  if(typeof source.swipeEnabled==="boolean")result.swipeEnabled=source.swipeEnabled;
  if(Array.isArray(source.ratingOrder))result.ratingOrder=sanitizeRatingOrder(source.ratingOrder);
  return result;
}
