export const PLAYER_NAME_MAX=20;
export const DEFAULT_PLAYER_NAME='Speedster';
const NAME_KEY='speedster-player-name';
let fallbackName='';

export function sanitizePlayerName(value){
 const name=typeof value==='string'?value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,char=>/\s/u.test(char)?' ':'').replace(/\s+/gu,' ').trim():'';
 return Array.from(name).slice(0,PLAYER_NAME_MAX).join('')||DEFAULT_PLAYER_NAME;
}
function localStorageOrNull(){try{return globalThis.window?.localStorage??null;}catch{return null;}}
export function readPlayerName(storage=localStorageOrNull()){
 if(fallbackName)return fallbackName;
 try{const name=storage?.getItem(NAME_KEY);return name?sanitizePlayerName(name):fallbackName;}catch{return fallbackName;}
}
export function savePlayerName(value,storage=localStorageOrNull()){
 fallbackName=sanitizePlayerName(value);try{storage?.setItem(NAME_KEY,fallbackName);}catch{}
 return fallbackName;
}
