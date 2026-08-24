// If the lose bands were wider, rescues would start on bigger boards. That is testable
// without touching the core director: split the SAME runs by how many cards the board
// stranded, and read the full rescue lifecycle for each group.
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
let OUTR=null;
eval(js + `
ecApplyIntensity(0.60);
const boards=[];
for(let li=0;li<LEVELS.length;li++){
  for(const ti of [3,4]){
    for(let s=0;s<3;s++){
      let lv=null;
      try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)+s*7717); }catch(e){ continue; }
      if(!lv)continue;
      srand(8800+li*29+ti*13+s);
      SILENT=true;
      for(let mv=0;mv<900;mv++){
        if(N-cl.size===0)break;
        const lg=legals();
        if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
        else if(deckLeft()>0)draw();
        else break;
      }
      const stranded=N-cl.size;
      if(stranded===0){SILENT=false;continue;}
      const rec={stranded:stranded,rescues:[]};
      for(let t=0;t<8&&N-cl.size>0;t++){
        const before=N-cl.size;
        ecStart(t%2?5:3,t%2?'coins':'ad');
        if(!EC)break;
        for(let mv=0;mv<400;mv++){
          if(N-cl.size===0)break;
          const lg=legals();
          if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
          else if(deckLeft()>0)draw();
          else break;
        }
        let r2=0,mx=0;
        EC.story.forEach(function(x){if(x.cleared===0){r2++;if(r2>mx)mx=r2;}else r2=0;});
        rec.rescues.push({before:before,cleared:EC.cleared,dealt:EC.story.length,
          dead:EC.story.filter(function(x){return x.cleared===0;}).length,blank:mx});
        if(N-cl.size===0)break;
      }
      SILENT=false;
      boards.push(rec);
    }
  }
}
OUTR=boards;
`);
function group(min,max){
  const bs=OUTR.filter(b=>b.stranded>=min&&b.stranded<=max);
  const rs=[].concat.apply([],bs.map(b=>b.rescues));
  if(!rs.length)return null;
  const empty=rs.filter(r=>r.cleared===0).length;
  const dealt=rs.reduce((s,r)=>s+r.dealt,0);
  const dead=rs.reduce((s,r)=>s+r.dead,0);
  const at13=rs.filter(r=>r.before<=3);
  return {boards:bs.length,n:rs.length,
    empty:100*empty/rs.length,
    dead:100*dead/dealt,
    cleared:rs.reduce((s,r)=>s+r.cleared,0)/rs.length,
    share13:100*at13.length/rs.length,
    e13:at13.length?100*at13.filter(r=>r.cleared===0).length/at13.length:0,
    maxBlank:Math.max.apply(null,rs.map(r=>r.blank)),
    perBoard:rs.length/bs.length};
}
console.log('');
console.log('  FULL RESCUE LIFECYCLE, SPLIT BY HOW MANY CARDS THE BOARD STRANDED');
console.log('  (this is what widening the lose bands would change)');
console.log('');
console.log('  stranded   boards  rescues   empty    dead   cleared   share    empty   max');
console.log('                                                /resc   at 1-3   at 1-3  blank');
[[1,3,'1-3 (today)'],[4,6,'4-6'],[7,20,'7+']].forEach(([a,b,lab])=>{
  const g=group(a,b);
  if(!g){console.log('  '+lab.padEnd(12)+'  no data');return;}
  console.log('  '+lab.padEnd(12)+String(g.boards).padStart(5)+
    String(g.n).padStart(8)+'   '+(g.empty.toFixed(0)+'%').padStart(5)+
    '   '+(g.dead.toFixed(0)+'%').padStart(5)+'    '+g.cleared.toFixed(1).padStart(4)+
    '    '+(g.share13.toFixed(0)+'%').padStart(5)+
    '   '+(g.e13.toFixed(0)+'%').padStart(5)+'   '+String(g.maxBlank).padStart(3));
});
const all=group(1,20);
console.log('');
console.log('  all boards combined: empty '+all.empty.toFixed(0)+'%, share at 1-3 '+
  all.share13.toFixed(0)+'%, '+all.perBoard.toFixed(1)+' rescues/board');
console.log('');
