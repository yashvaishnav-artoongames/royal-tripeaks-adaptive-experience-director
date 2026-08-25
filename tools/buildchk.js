const ROOT=require('path').join(__dirname,'..','index.html');
const BASE=process.env.AED_BASELINE||ROOT;
// Which level/outcome combinations can still be built at the wider lose bands, and do
// they still verify? A band the generator cannot satisfy is worse than a narrow one.
const fs=require('fs'),vm=require('vm');
function ctx(file){
  const src=fs.readFileSync(file,'utf8');
  const m=src.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
  let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
  const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
  const store={};
  const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',style:{},
    dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
    setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
    get disabled(){return false;},click(){},files:[],offsetWidth:1});
  ids.forEach(id=>store[id]=mk(id));
  const fb={set disabled(v){},get disabled(){return false;}};
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    setTimeout:()=>0,console:console,R:null};
  vm.createContext(s); vm.runInContext(js,s); return s;
}
function survey(file){
  const s=ctx(file);
  vm.runInContext(`
  R=[];
  for(let li=0;li<LEVELS.length;li++){
    for(const ti of [3,4]){
      let lv=null,err=null;
      try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ err=e.message; }
      R.push({level:LEVELS[li].short, N:LEVELS[li].N, deck:LEVELS[li].deckN,
        outcome:OUT[ti].n, band:OUT[ti].lo+'-'+OUT[ti].hi,
        built:!!lv, mode:lv?lv.usedMode:null, tv:lv?lv.tv:null, err:err});
    }
  }`,s);
  return s.R;
}
const before=survey(BASE);
const after =survey(ROOT);
console.log('');
console.log('  LOSE-TARGET BUILDABILITY  (narrow bands -> wide bands)');
console.log('');
console.log('  level  cards deck   outcome              before            after');
for(let i=0;i<after.length;i++){
  const b=before[i],a=after[i];
  const f=x=>!x.built?'FAILED':(x.mode===4?'live':'verified tv='+x.tv);
  const flag=(b.built&&!a.built)?'  <-- lost':((!b.built&&a.built)?'  <-- gained':
              (b.mode!==4&&a.mode===4?'  <-- dropped to live':''));
  console.log('  '+a.level.padEnd(6)+String(a.N).padStart(4)+String(a.deck).padStart(5)+
    '   '+a.outcome.padEnd(18)+f(b).padEnd(17)+f(a).padEnd(17)+flag);
}
const bb=before.filter(x=>x.built).length, ab=after.filter(x=>x.built).length;
const bv=before.filter(x=>x.built&&x.mode!==4).length, av=after.filter(x=>x.built&&x.mode!==4).length;
console.log('');
console.log('  built:    '+bb+'/'+before.length+'  ->  '+ab+'/'+after.length);
console.log('  verified: '+bv+'/'+before.length+'  ->  '+av+'/'+after.length);
console.log('');
