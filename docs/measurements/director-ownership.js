// Which director owns each built-in level, and does the prover own ANYTHING?
//
// Run this before trusting prover-equivalence.js. That harness captures its cases from
// verified builds only, so if this table shows zero verified builds it will compare nothing
// and still print agreement - which has already happened once. This is the check that says
// whether the guard has work.
//
// Which director owns each built-in level? Builds each one for each outcome in a VM context
// behind a DOM stub and reads back what came out. A verified build pre-commits a deck; a live
// one returns an empty one, which is exactly the signal the equivalence harness keys on.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
  if(!m)throw new Error('script block not found (CRLF?)');
  let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
  const ids=[...new Set([...source.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
  const store={};
  const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
    dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
    setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
    get disabled(){return false;},click(){},files:[],querySelector:()=>null,
    closest:()=>null,hidden:false,scrollIntoView(){},type:'',title:''});
  ids.forEach(id=>store[id]=mk(id));
  const fb={set disabled(v){},get disabled(){return false;}};
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    console:console,setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:()=>0,
    Date:Date,Math:Math,JSON:JSON,parseInt:parseInt,parseFloat:parseFloat,isFinite:isFinite,
    Number:Number,String:String,Array:Array,Object:Object,Set:Set,Map:Map,Error:Error};
  s.globalThis=s;
  vm.createContext(s);vm.runInContext(js,s);return s;
}
const S=ctx(src);
S.OUT2=[];
vm.runInContext(`
OUT2=[];
for(let li=0;li<LEVELS.length;li++){
  const row={name:LEVELS[li].short,obs:null,ver:0,live:0,fail:0,err:null};
  useLevel(li);
  row.obs=obsPresent().join('+')||'none';
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ row.fail++; if(!row.err)row.err=String(e&&e.message||e); continue; }
    if(!lv){row.fail++;continue;}
    if(lv.deck && lv.deck.length) row.ver++; else row.live++;
  }
  OUT2.push(row);
}`,S);

console.log('');
console.log('  level   obstacles          verified   live   failed');
console.log('  ' + '-'.repeat(56));
let anyVer=0;
for(const r of S.OUT2){
  console.log('  '+r.name.padEnd(8)+r.obs.padEnd(19)+
    String(r.ver).padStart(8)+String(r.live).padStart(7)+String(r.fail).padStart(9)+(r.err?('   '+r.err):''));
  anyVer+=r.ver;
}
console.log('');
console.log('  verified builds in total: '+anyVer);
console.log(anyVer>0
  ? '  The prover owns at least one level, so the equivalence guard has real work.'
  : '  NOTHING is verified - the guard would compare zero cases and still print agreement.');
