const PROPERTY_TYPES=new Set(["apartment","house","land","commercial","industrial","other"]);
const LISTING_KINDS=new Set(["sale","rent","lease"]);
const AREA_UNITS=new Set(["sqft","katha","decimal","acre","sqm"]);
const AREA_BASES=new Set(["land","floor","built_up","carpet","gross"]);
const SELLER_FIELDS=new Set(["title","description","division","district","upazila","locality","publicLocationLabel","propertyType","listingKind","priceAmount","areaValue","areaUnit","areaBasis","bedrooms","bathrooms","images"]);
const TEXT_RULES={title:[10,180],description:[30,12000],division:[2,80],district:[2,80],upazila:[2,80],locality:[2,160],publicLocationLabel:[3,180]};
function isRecord(v){if(v===null||typeof v!=="object"||Array.isArray(v))return false;const p=Object.getPrototypeOf(v);return p===Object.prototype||p===null;}
function addError(e,f,c){(e[f]??=[]).push(c);}
function validateText(v,f,required,e){if(v===undefined&&!required)return undefined;if(typeof v!=="string"){addError(e,f,required?"REQUIRED_STRING":"INVALID_STRING");return undefined;}const s=v.trim(),[min,max]=TEXT_RULES[f];if(s.length<min)addError(e,f,"TOO_SHORT");if(s.length>max)addError(e,f,"TOO_LONG");if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(s))addError(e,f,"CONTROL_CHARACTERS_NOT_ALLOWED");return s;}
function validateListingDraft(input){
 if(!isRecord(input))return{success:false,errors:{_root:["EXPECTED_OBJECT"]}};
 const errors={},data={};for(const k of Object.keys(input))if(!SELLER_FIELDS.has(k))addError(errors,k,"UNKNOWN_OR_SERVER_MANAGED_FIELD");
 for(const f of Object.keys(TEXT_RULES)){const v=validateText(input[f],f,["title","description","division","district"].includes(f),errors);if(v!==undefined)data[f]=v;}
 if(!PROPERTY_TYPES.has(input.propertyType))addError(errors,"propertyType","INVALID_PROPERTY_TYPE");else data.propertyType=input.propertyType;
 if(!LISTING_KINDS.has(input.listingKind))addError(errors,"listingKind","INVALID_LISTING_KIND");else data.listingKind=input.listingKind;
 if(input.priceAmount!==undefined&&input.priceAmount!==null){if(typeof input.priceAmount!=="number"||!Number.isFinite(input.priceAmount)||input.priceAmount<=0||input.priceAmount>99999999999999.99)addError(errors,"priceAmount","INVALID_PRICE_AMOUNT");else data.priceAmount=input.priceAmount;}
 if(input.areaValue!==undefined||input.areaUnit!==undefined||input.areaBasis!==undefined){if(typeof input.areaValue!=="number"||!Number.isFinite(input.areaValue)||input.areaValue<=0)addError(errors,"areaValue","INVALID_AREA_VALUE");else data.areaValue=input.areaValue;if(!AREA_UNITS.has(input.areaUnit))addError(errors,"areaUnit","INVALID_AREA_UNIT");else data.areaUnit=input.areaUnit;if(!AREA_BASES.has(input.areaBasis))addError(errors,"areaBasis","INVALID_AREA_BASIS");else data.areaBasis=input.areaBasis;}
 if(input.bedrooms!==undefined){if(!Number.isInteger(input.bedrooms)||input.bedrooms<0||input.bedrooms>100)addError(errors,"bedrooms","INVALID_NON_NEGATIVE_INTEGER");else data.bedrooms=input.bedrooms;}
 if(input.bathrooms!==undefined){if(typeof input.bathrooms!=="number"||!Number.isFinite(input.bathrooms)||input.bathrooms<0||input.bathrooms>100||Math.round(input.bathrooms*10)!==input.bathrooms*10)addError(errors,"bathrooms","INVALID_BATHROOM_COUNT");else data.bathrooms=input.bathrooms;}
 if(input.images===undefined)data.images=[];else if(!Array.isArray(input.images))addError(errors,"images","REQUIRED_ARRAY");else{if(input.images.length>12)addError(errors,"images","TOO_MANY_IMAGES");data.images=[];input.images.forEach((im,i)=>{const f=`images[${i}]`;if(!isRecord(im)||Object.keys(im).some(k=>!["src","alt"].includes(k))){addError(errors,f,"INVALID_IMAGE_OBJECT");return;}if(typeof im.src!=="string"||im.src.length>2048){addError(errors,f+".src","INVALID_IMAGE_SOURCE");return;}const src=im.src.trim();let safe=src.startsWith("/")&&!src.startsWith("//")&&!src.includes("\\");if(!safe){try{const u=new URL(src);safe=u.protocol==="https:"&&!u.username&&!u.password;}catch{safe=false;}}if(!safe)addError(errors,f+".src","IMAGE_SOURCE_MUST_BE_HTTPS_OR_LOCAL_PATH");if(typeof im.alt!=="string"||im.alt.trim().length<5||im.alt.trim().length>180)addError(errors,f+".alt","INVALID_IMAGE_ALT");if(safe&&typeof im.alt==="string"&&im.alt.trim().length>=5&&im.alt.trim().length<=180)data.images.push({src,alt:im.alt.trim()});});}
 if(Object.keys(errors).length)return{success:false,errors};return{success:true,data};
}
export{validateListingDraft};
