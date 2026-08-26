// Run: node docs/measurements/inspector-undo.js
// Does an undone move get tagged, and does replaying the same card log it twice?
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=process.env.AED_SRC||path.join(__dirname,'..','..','index.html');
const src=fs.readFileSync(SRC,'utf8');
function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
  const js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
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
  s.globalThis=s;s.__store=store;
  vm.createContext(s);vm.runInContext(js,s);return s;
}
const S=ctx(src);
vm.runInContext(`
OUT2=[];function line(x){OUT2.push(x);}
let li=-1;for(let i=0;i<LEVELS.length;i++)if(LEVELS[i].short==='L21')li=i;
buildFixed(li,0,seedFor('L21',0));
INSPON=true;INSP=[];INSPOPEN={};
srand(seedFor('L21',0)+3);
reset();

// play a few real moves so the log has depth
let played=0;
while(played<6){
  const lg=legals();
  if(!lg.length){ if(deckLeft()<=0)break; draw(); continue; }
  play(lg[0]); played++;
}
const before=INSP.length, mvBefore=log.length;
line('after '+played+' plays: '+before+' records, log length '+mvBefore);

// undo one move
back();
const undoneNow=INSP.filter(function(o){return o.undone;}).length;
line('after one undo: log length '+log.length+', '+undoneNow+' records tagged undone');

// replay - the same position is available again
const lg2=legals();
if(lg2.length)play(lg2[0]);
const after=INSP.length;
const stillUndone=INSP.filter(function(o){return o.undone;}).length;
line('after replay: '+after+' records ('+(after-before)+' new), '+stillUndone+' still tagged');

// the tag must survive into the rendered panel
inspRender();
const html=__store['inspdock'].innerHTML;
line('panel shows an undone tag: '+(html.indexOf('ins-undone')>=0));
line('panel shows a dimmed row:  '+(html.indexOf('wasundone')>=0));
line('badges carry icons:        '+(html.indexOf('ins-ico')>=0));
line('values render as chips:    '+(html.indexOf('ins-chip')>=0));
line('rows carry a colour rail:  '+(/class="inspr r-[clidprg]/.test(html)));
line('no undefined / NaN:        '+(html.indexOf('undefined')<0&&html.indexOf('NaN')<0));

// a NON-undone record must not be tagged - otherwise the label means nothing
const live=INSP.filter(function(o){return !o.undone;}).length;
line('records NOT tagged:        '+live+' of '+after);
line(undoneNow>0&&live>0?'TAG IS SELECTIVE - some undone, some not'
                        :'TAG IS BROKEN - it is all-or-nothing');
`,S);
console.log('');
S.OUT2.forEach(function(l){console.log('  '+l);});
console.log('');
