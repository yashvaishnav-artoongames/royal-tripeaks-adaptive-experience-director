const fs=require('fs');
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
eval(js + `
const idx=LEVELS.findIndex(function(L){return L.short==='L12';});
const LX=LEVELS[idx];
console.log('built-in L12 index '+idx);
console.log('  plus field on the level object : '+JSON.stringify(LX.plus));
console.log('  cards '+LX.N+"  deck "+LX.deckN);
document.getElementById('tsel').value='0';
const lv=buildFixed(idx,0,seedFor('L12',0));
console.log('  built: mode '+(lv?lv.usedMode:'FAIL')+'  tv '+(lv?lv.tv:'-'));
console.log('  PLUS global after useLevel     : '+JSON.stringify(PLUS));
console.log('');
let exposed=0,facedown=0;
for(let i=0;i<N;i++){ if(expo(i))exposed++; else facedown++; }
console.log('  exposed at start : '+exposed+'   face-down : '+facedown);
const roots=[];for(let i=0;i<N;i++)if(!(DEP[i]||[]).length)roots.push(i);
console.log('  cards with no blockers (should be the only exposed): '+JSON.stringify(roots));
render();
const html=store['board'].innerHTML;
const faces=(html.match(/class="rk"/g)||[]).length;
const downs=(html.match(/ dn"/g)||[]).length;
const ghosts=(html.match(/ gh"/g)||[]).length;
console.log('');
console.log('  RENDER: '+faces+' cards showing a rank, '+downs+' face-down, '+ghosts+' cleared');
console.log('  TG.reveal is '+TG.reveal);
console.log('  plus badges rendered: '+((html.match(/plusb/g)||[]).length));
`);
