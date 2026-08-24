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
const T=[];
eval(js + `
function ok(n,c,d){T.push({n:n,p:!!c,d:d||''});}
function show(){
  const pips=store['pips'].innerHTML.replace(/ title="[^"]*"/g,'')
    .replace(/<div class="pip( red| black| wildp| on)?"><\\/div>/g,function(_,c){
      return c===' red'?'R':c===' black'?'B':c===' wildp'?'W':c===' on'?'o':'.';});
  const x2=store['mx2'];
  return 'STREAK '+pips+'  '+store['mnum'].textContent+
    '  '+(x2.style.display==='none'?'':'['+x2.textContent+' '+x2.className+']')+
    '  '+store['mpay'].textContent;
}
STREAK_REWARD.type='Coins';STREAK_REWARD.amount=100;
buildFixed(2,4,seedFor(LEVELS[2].short,4));
const R=true,B=false;
function feed(list){stkReset();k=0;list.forEach(function(x){
  stkNote(x.l,x.red,!!x.wild,false);k++;});render();}

feed([]);                                    const empty=show();
feed([{l:'K\\u2665',red:R}]);                  const one=show();
feed([{l:'K\\u2665',red:R},{l:'Q\\u2666',red:R},{l:'3\\u2665',red:R}]);  const red3=show();
feed([{l:'K\\u2660',red:B},{l:'Q\\u2663',red:B}]);                        const blk2=show();
feed([{l:'K\\u2665',red:R},{l:'Q\\u2660',red:B}]);                        const mixed=show();
feed([{l:'K\\u2665',red:R},{l:'WILD',red:false,wild:true},{l:'3\\u2665',red:R}]); const wcase=show();

console.log('');
console.log('  HOW THE METER READS');
console.log('');
console.log('  empty        '+empty);
console.log('  1 red        '+one);
console.log('  3 red        '+red3);
console.log('  2 black      '+blk2);
console.log('  mixed        '+mixed);
console.log('  red+wild+red '+wcase);
console.log('');
ok('badge hidden when the streak is empty', empty.indexOf('[')<0);
ok('badge tinted red on a red streak', /x2 red/.test(red3), red3);
ok('badge tinted black on a black streak', /x2 black/.test(blk2), blk2);
ok('badge gone the moment colour breaks', mixed.indexOf('[')<0, mixed);
ok('a wild slot keeps the badge alive', /x2 red/.test(wcase), wcase);
ok('badge text is just the multiplier', /\\u00d72/.test(red3));
ok('reward text shows the doubled value', /200 coins/.test(red3), red3);
ok('no "next" prefix on the reward', !/next/.test(red3+mixed+one), red3);
ok('reward text shows the base when mixed', /100 coins/.test(mixed), mixed);
`);
console.log('');
T.forEach(t=>console.log('  '+(t.p?'PASS':'FAIL')+'  '+t.n.padEnd(44)+(t.d?'  '+t.d:'')));
console.log('');
console.log('  '+T.filter(t=>t.p).length+' / '+T.length);
console.log('');
