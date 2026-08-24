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
console.log('');
console.log('  level  cards  deck   roots  exposed   plus');
let bad=0;
for(let i=0;i<LEVELS.length;i++){
  useLevel(i);
  const roots=[];for(let z=0;z<N;z++)if(!(DEP[z]||[]).length)roots.push(z);
  const flag=(roots.length===N&&N>3)?'  <-- NO DEPENDENCY GRAPH':'';
  if(flag)bad++;
  console.log('  '+LEVELS[i].short.padEnd(6)+String(N).padStart(5)+String(DECKN).padStart(6)+
    String(roots.length).padStart(7)+String(roots.length).padStart(9)+
    String(Object.keys(PLUS).length).padStart(7)+flag);
}
console.log('');
console.log('  levels with a broken dependency graph: '+bad);
`);
