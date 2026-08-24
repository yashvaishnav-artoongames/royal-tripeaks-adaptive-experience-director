const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const made=[];
const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',style:{cssText:''},
  dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(c){made.push(c);},setAttribute(){},
  classList:{_s:new Set(),toggle(){},add(x){this._s.add(x);},remove(x){this._s.delete(x);},
    contains(x){return this._s.has(x);}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),
  createElement:()=>mk('new'),querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
eval(js + `
const idx=LEVELS.findIndex(function(L){return L.short==='L12';});
document.getElementById('tsel').value='0';
buildFixed(idx,0,seedFor('L12',0));
render();
const html=store['board'].innerHTML;
const badge=html.match(/<span class="plusb">[\\s\\S]{0,220}?<\\/span><\\/span>/);
console.log('');
console.log('  TILE MARKUP');
console.log('   '+(badge?badge[0].replace(/></g,'>\\n   <'):'no badge found'));
console.log('');
console.log('  caption says PLUS CARD : '+/PLUS<br>CARD/.test(html));
console.log('  white body class       : '+/plusc/.test(html));
console.log('');
// fire one and watch what the indicator produces
made.length=0;
let steps=0;
while(PLUSFIRED.length===0&&steps++<200){
  const lg=legals(); if(lg.length)play(lg[0]); else if(deckLeft()>0)draw(); else break;
}
console.log('  FIRED slot '+PLUSFIRED[0]+' after '+steps+' plays');
console.log('  elements created by the indicator: '+made.length);
made.forEach(function(e){
  console.log('    .'+e.className+'   '+(e.textContent||e.innerHTML||'').slice(0,40)+
    (e.style.cssText?('   ['+e.style.cssText.slice(0,46)+']'):''));});
console.log('  deck slot pulsing      : '+store['deck'].classList.contains('pinged'));
`);
