const ROOT=require('path').join(__dirname,'..','index.html');
const BASE=process.env.AED_BASELINE||ROOT;
// Convert the uploaded level JSON into the demo's own level literals, using the demo's
// parseLevel() so the bot and the app cannot disagree about what a level file means.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
  style:{},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;

const dir=require('path').join(__dirname,'..','levels');
const files=fs.readdirSync(dir).filter(f=>/^L\d+\.json$/i.test(f))
  .sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)));
global.FILES=files.map(f=>({name:f.replace(/\.json$/i,''),
  text:fs.readFileSync(path.join(dir,f),'utf8')}));

let OUTP=null;
eval(js + `
const made=[],warns=[];
FILES.forEach(function(f){
  let lv=null;
  try{ lv=parseLevel(f.name,JSON.parse(f.text)); }
  catch(e){ warns.push(f.name+': '+e.message); return; }
  if(!lv){ warns.push(f.name+': parser returned nothing'); return; }
  made.push(lv);
});
OUTP={levels:made.map(function(L){
  return {name:L.name,short:L.short,N:L.N,deckN:L.deckN,scroll:!!L.scroll,
    pos:L.pos,rot:L.rot,dep:L.dep,warn:L.warn||[],
    plusLit:(L.plus&&Object.keys(L.plus).length)?JSON.stringify(L.plus):null};
}),warns:warns};
`);

const L=OUTP.levels;
console.log('parsed '+L.length+' of '+files.length+' level files');
if(OUTP.warns.length)OUTP.warns.forEach(w=>console.log('  WARN '+w));

// emit as JS literals in the same shape as the built-in table
// dep is an OBJECT keyed by index, not an array. dep.length is undefined, so the old
// loop never ran and every spliced level was written with an empty dependency graph -
// every card exposed, every card face-up, the whole structure gone.
function depLit(dep,N){
  const rows=[];
  for(let i=0;i<N;i++)rows.push('['+i+',['+(dep[i]||[]).join(',')+']]');
  return 'DD(['+rows.join(',')+'])';
}
const lits=L.map(x=>
  "{name:'"+x.short+" \u2014 "+x.N+" cards, deck "+x.deckN+"',short:'"+x.short+
  "',N:"+x.N+",deckN:"+x.deckN+",scroll:"+(x.scroll?'true':'false')+",\n"+
  " pos:["+x.pos.map(p=>'['+p[0]+','+p[1]+']').join(',')+"],\n"+
  " rot:["+x.rot.join(',')+"],\n"+
  " dep:"+depLit(x.dep,x.N)+(x.plusLit?(",\n plus:"+x.plusLit):"")+"}"
).join(',\n');

L.forEach(x=>console.log('  '+x.short.padEnd(5)+String(x.N).padStart(3)+' cards, deck '+
  String(x.deckN).padStart(3)+(x.warn.length?'   WARN '+x.warn.join('; '):'')));

let h=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const start=h.indexOf('const LEVELS=[');
const end=h.indexOf('\n];',start);
if(start<0||end<0){console.error('LEVELS array not found');process.exit(1);}
h=h.slice(0,end)+',\n'+lits+h.slice(end);
fs.writeFileSync(ROOT,h);
console.log('\nappended '+L.length+' levels to the built-in table');
