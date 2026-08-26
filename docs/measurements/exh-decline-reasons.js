// WHY does exh() decline a level?
//
// The build's FAIL ledger records one word - "verify" - for every reason the prover refuses a
// candidate deal, so a budget problem and a structural impossibility look identical from
// outside. This splits them apart, which is the question that has to be answered before anyone
// decides to raise the 250k state cap.
//
//   cap                 budget ran out            -> raising the cap MIGHT help
//   radix               a key field overflowed    -> structural, the key needs widening
//   winmiss / losemiss  a line landed off target  -> structural, this deal cannot hold it
//   denial/payout/fork  proved, floor not met     -> the deal works, it is just not wanted
//
// Run: node docs/measurements/exh-decline-reasons.js
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
vm.runInContext(`
ROWS=[];
for(let li=0;li<LEVELS.length;li++){
  useLevel(li);
  const obs=obsPresent().join('+')||'none';
  for(let ti=0;ti<OUT.length;ti++){
    exhWhyReset();
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){}
    const verified = !!(lv && lv.deck && lv.deck.length);
    ROWS.push({lvl:LEVELS[li].short,obs:obs,out:OUT[ti].n,verified:verified,
               why:Object.assign({},EXHWHY)});
  }
}`,S);

const ROWSALL=S.ROWS;
const K=['cap','radix','winmiss','losemiss','denial','payout','fork','ok'];
const byLevel={};
for(const r of S.ROWS){
  const b=byLevel[r.lvl]||(byLevel[r.lvl]={obs:r.obs,ver:0,tot:0,w:{}});
  b.tot++; if(r.verified)b.ver++;
  for(const k of K)b.w[k]=(b.w[k]||0)+r.why[k];
}
console.log('');
console.log('  exh() decline reasons, summed over all five outcomes per level');
console.log('');
console.log('  level  obstacles  ver  '+K.map(k=>k.padStart(9)).join(''));
console.log('  '+'-'.repeat(18+5+K.length*9));
for(const lvl of Object.keys(byLevel)){
  const b=byLevel[lvl];
  console.log('  '+lvl.padEnd(7)+b.obs.padEnd(11)+(b.ver+'/'+b.tot).padEnd(5)+
    K.map(k=>String(b.w[k]||0).padStart(9)).join(''));
}
console.log('');
const t={};for(const k of K){t[k]=0;for(const l of Object.keys(byLevel))t[k]+=byLevel[l].w[k]||0;}
const structural=t.winmiss+t.losemiss+t.radix;
console.log('  Totals   cap '+t.cap+'   structural (winmiss+losemiss+radix) '+structural+
            '   floors '+(t.denial+t.payout+t.fork)+'   proved '+t.ok);
console.log('');
// A level that is neither fully verified nor fully live is the interesting one: something
// about ONE outcome is out of reach while its siblings are fine. Print those rows.
const partial=Object.keys(byLevel).filter(l=>byLevel[l].ver>0&&byLevel[l].ver<byLevel[l].tot);
if(partial.length){
  console.log('  Per-outcome detail for partially verified levels');
  console.log('');
  console.log('  level  outcome                 ver  '+K.map(k=>k.padStart(9)).join(''));
  console.log('  '+'-'.repeat(30+5+K.length*9));
  for(const r of ROWSALL){
    if(partial.indexOf(r.lvl)<0)continue;
    console.log('  '+r.lvl.padEnd(7)+r.out.padEnd(24)+(r.verified?'yes':'NO ').padEnd(5)+
      K.map(k=>String(r.why[k]||0).padStart(9)).join(''));}
  console.log('');
}
if(t.cap===0&&structural>0)
  console.log('  VERDICT: no candidate ever ran out of budget. Every refusal is a deal that\n'+
              '  genuinely cannot hold its target on every legal line. Raising the 250k cap\n'+
              '  would change nothing.');
else if(t.cap>0&&structural===0)
  console.log('  VERDICT: every refusal is the budget. A larger cap is worth measuring.');
else if(t.cap>0)
  console.log('  VERDICT: mixed - '+t.cap+' hit the budget and '+structural+' are structural.\n'+
              '  A larger cap can only ever recover the first group.');
else
  console.log('  VERDICT: nothing was refused by the search itself.');
console.log('');
