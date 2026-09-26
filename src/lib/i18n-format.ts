import type {Locale} from "@/lib/i18n";

const localeMap:Record<Locale,string>={kk:"kk-KZ",ru:"ru-RU",en:"en-US"};

export function intlLocale(locale:Locale){return localeMap[locale];}

export function formatNumber(value:number,locale:Locale,options:Intl.NumberFormatOptions={}){
 return new Intl.NumberFormat(intlLocale(locale),options).format(value);
}

export function formatDate(value:string|number|Date,locale:Locale,options:Intl.DateTimeFormatOptions={}){
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.getTime()))return "—";
 return new Intl.DateTimeFormat(intlLocale(locale),options).format(date);
}

export function formatDateTime(value:string|number|Date,locale:Locale){
 return formatDate(value,locale,{dateStyle:"medium",timeStyle:"short"});
}
