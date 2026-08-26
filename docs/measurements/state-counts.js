// How many states does exh() actually explore on a verified build? Needed to price stage 4:
// modelling plus tiles exactly means carrying the pending-grant queue in the state, and the
// only question that matters is whether base x multiplier fits under the 250k cap.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
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
ST=[];
for(let li=0;li<LEVELS.length;li++){
  useLevel(li);
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){}
    if(lv&&lv.deck&&lv.deck.length&&lv.ver)
      ST.push({lvl:LEVELS[li].short,out:OUT[ti].n,states:lv.ver.states,forks:lv.ver.forks,
               N:N,deckN:DECKN});
  }
}`,S);
console.log('');
console.log('  states explored by the WINNING proof on each verified build');
console.log('');
console.log('  level  outcome                  N  deck    states   forks');
console.log('  '+'-'.repeat(60));
let mx=0;
for(const r of S.ST){
  console.log('  '+r.lvl.padEnd(7)+r.out.padEnd(22)+String(r.N).padStart(3)+
    String(r.deckN).padStart(6)+String(r.states).padStart(10)+String(r.forks).padStart(8));
  if(r.states>mx)mx=r.states;
}
console.log('');
console.log('  worst verified build: '+mx+' states, against a 250,000 cap');
console.log('');
console.log('  Pricing stage 4 on L12 (3 plus tiles, Value 3 each, 21 cards, deck 10):');
const perTile=4, tiles=3;              // pending count 0..3 per tile
const counts=Math.pow(perTile,tiles);  // which grants remain undrawn
const orders=6;                        // 3! orderings of simultaneously pending blocks
console.log('    pending-count combinations   '+counts);
console.log('    block orderings (worst case) '+orders);
console.log('    upper-bound multiplier       '+(counts*orders));
console.log('');
console.log('    worst base x multiplier      '+(mx*counts*orders).toLocaleString()+
            (mx*counts*orders>250000?'   OVER the 250k cap':'   fits'));
console.log('');
console.log('  The multiplier is an UPPER bound - most combinations are unreachable, because a');
console.log('  tile can only be pending between the play that uncovers it and the next draw.');
console.log('  Treat it as the ceiling, not the estimate.');
