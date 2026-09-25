export function isStaleVersion(expectedUpdatedAt:string|undefined|null,actualUpdatedAt:string|Date|undefined|null){
 if(!expectedUpdatedAt||!actualUpdatedAt)return false;
 const expected=Date.parse(String(expectedUpdatedAt));
 const actual=Date.parse(String(actualUpdatedAt));
 return Number.isFinite(expected)&&Number.isFinite(actual)&&expected!==actual;
}
