const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').split('\r\n').join('\n');

console.log('='.repeat(78));
console.log('VALIDATION 1  -  is canMatch() an exact no-op on obstacle-free levels?');
console.log('='.repeat(78));
console.log('');
console.log('The plan swaps the prover\'s bare cyc(rank[i],w) for one shared canMatch(). That is');
console.log('only safe if, on a level carrying no obstacle, the two agree on EVERY input. Below,');
console.log('cyc and WILD_RANK are pulled out of index.html verbatim - not retyped.');
console.log('');

// pull the real constants and the real cyc straight out of the shipped source
const wr=src.match(/const WILD_RANK=(\d+), WASTE_RADIX=(\d+);/);
if(!wr)throw new Error('WILD_RANK not found');
const WILD_RANK=+wr[1], WASTE_RADIX=+wr[2];
const cycSrc=src.match(/const cyc=\(a,b\)=>\{[\s\S]*?\};/);
if(!cycSrc)throw new Error('cyc not found');
console.log('  from source: WILD_RANK='+WILD_RANK+'  WASTE_RADIX='+WASTE_RADIX);
console.log('  from source: '+cycSrc[0].replace(/\n\s*/g,' '));
console.log('');
const cyc=eval('('+cycSrc[0].replace('const cyc=','').replace(/;$/,'')+')');

// the proposed single rule, with every obstacle predicate false (no obstacles on the level)
const isPlusCard=()=>false, isLKSlot=()=>false, isWildSlot=()=>false, isDblSlot=()=>false;
const secondOf=r=>(r===13?1:r+1);
function canMatch(i,w,rank,w2){
  if(isPlusCard(i))return false;
  if(isLKSlot(i))return false;
  if(isWildSlot(i))return w!==WILD_RANK;
  if(w===WILD_RANK)return true;
  const r=rank[i];
  if(r===undefined)return false;
  if(cyc(r,w))return true;
  if(w2&&cyc(r,w2))return true;
  if(isDblSlot(i)){const sd=secondOf(r);
    if(cyc(sd,w))return true;
    if(w2&&cyc(sd,w2))return true;}
  return false;
}

let checked=0,diff=0;
const ranks=[undefined,1,2,3,4,5,6,7,8,9,10,11,12,13];
for(const r of ranks)for(let w=1;w<=WILD_RANK;w++){
  const a=cyc(r,w);                    // what the prover does today
  const b=canMatch(0,w,{0:r},0);       // what the plan proposes, w2=0 (no doubles)
  checked++;
  if(!!a!==!!b){diff++;
    console.log('  MISMATCH  rank='+r+' waste='+w+'  cyc='+a+'  canMatch='+b);}
}
console.log('  '+checked+' (rank, waste) pairs compared - every rank 1..13 plus undefined,');
console.log('  every waste 1..13 plus WILD.');
console.log('  differences: '+diff);
console.log('');
console.log(diff===0
  ? '  RESULT: exact no-op. Swapping the rule cannot change any level that reaches the\n'+
    '  prover today, because every obstacle level is already gated to live. So the prover\n'+
    '  becomes obstacle-aware by construction, at zero behavioural risk today.'
  : '  RESULT: NOT a no-op - the plan is unsafe as written.');
console.log('');

console.log('='.repeat(78));
console.log('VALIDATION 2  -  does every proposed memo key still fit a JS safe integer?');
console.log('='.repeat(78));
console.log('');
const keySrc=src.match(/const key=\(\(mlo\*WR\+w\)\*DJR\+dj\)\*PIPS\+mt;/);
console.log('  from source: '+(keySrc?keySrc[0]:'KEY NOT FOUND'));
console.log('');
console.log('  mlo is a 26-bit mask, so its ceiling is 2^26. PIPS=5. WR=WASTE_RADIX='+WASTE_RADIX+'.');
console.log('  DJR = deck length + 2. Worst built-in deck is L41 at 14, so DJR=16.');
console.log('');
const SAFE=Number.MAX_SAFE_INTEGER;
const rows=[
  ['today',                            Math.pow(2,26)*WASTE_RADIX*16*5,            'mask x waste x draw x meter'],
  ['+ double (w2 bit)',                Math.pow(2,26)*WASTE_RADIX*2*16*5,          'x2 for a two-valued waste'],
  ['+ plus (deck grows to 10+9)',      Math.pow(2,26)*WASTE_RADIX*2*21*5,          'DJR 16 -> 21 on L12'],
  ['+ up/down, 2 tiles (13^2)',        Math.pow(2,26)*WASTE_RADIX*2*21*5*169,      'per-tile live rank'],
  ['+ up/down, 8 tiles (13^8)',        Math.pow(2,26)*WASTE_RADIX*2*21*5*Math.pow(13,8), 'L1499 shape'],
];
for(const [n,v,note] of rows){
  const ok=v<=SAFE;
  console.log('  '+n.padEnd(30)+v.toExponential(2).padStart(11)+'   '+
    (ok?'fits ':'OVERFLOWS')+'   '+note);
}
console.log('');
console.log('  Safe-integer ceiling: '+SAFE.toExponential(2));
console.log('  RESULT: the key packing survives wild, double, lock/key and plus. It breaks only');
console.log('  at the 8-tile up/down shape, and by then the state COUNT has already killed it -');
console.log('  see validation 3.');
console.log('');

console.log('='.repeat(78));
console.log('VALIDATION 3  -  does the state count survive, against the 250k cap in exh()?');
console.log('='.repeat(78));
console.log('');
const cap=src.match(/if\(\+\+cap>(\d+)\)/g);
console.log('  from source: caps found -> '+(cap?cap.join(', '):'none'));
console.log('');
console.log('  obstacle      new key field         state multiplier   verdict');
console.log('  ' + '-'.repeat(70));
const st=[
 ['wild',      'none',                    '1x',      'free. A wild slot is rankless and legal against any\n                                                    non-wild waste - no new state at all.'],
 ['double',    'one bit (waste is dbl)',  '2x',      'cheap.'],
 ['lock & key','none',                    '~1x',     'the mask already says which tiles are gone; the pair\n                                                    collect adds a branch, not a dimension.'],
 ['plus',      'none - deck len f(mask)', '~1x',     'the KEY insight: which tiles have fired is determined\n                                                    by the mask, so deck length is too.'],
 ['up & down', 'live rank per tile',      '13^k',    'k=1 13x, k=2 169x, k=8 8.2e8x. The cap is 250k.'],
];
for(const [o,f,m,v] of st)
  console.log('  '+o.padEnd(13)+f.padEnd(24)+m.padEnd(18)+v);
console.log('');
console.log('  Why up/down cannot be keyed on total moves instead: a tile is frozen until it is');
console.log('  REVEALED, so its live rank is start + step x (moves since ITS reveal). Two lines can');
console.log('  reach the same mask having made different numbers of moves, and the mask does not');
console.log('  record when each tile was uncovered - so reveal time is not recoverable from the');
console.log('  state. The live rank has to be carried per tile, which is where 13^k comes from.');
console.log('');
console.log('  RESULT: wild, double, lock/key and plus are all tractable. Up/down is not, and');
console.log('  that is a property of the obstacle rather than of the implementation.');
console.log('');

console.log('='.repeat(78));
console.log('VALIDATION 4  -  what does each stage actually unlock?');
console.log('='.repeat(78));
console.log('');
const lv=[
 ['L12','plus',      ['plus']],
 ['L21','wild',      ['wild']],
 ['L111','double',   ['dbl']],
 ['L7','lock & key', ['lock']],
 ['L41','up & down', ['ud']],
];
const taught={};
const stages=[['1 wild','wild'],['2 double','dbl'],['3 lock & key','lock'],['4 plus','plus']];
console.log('  after stage        verified levels');
console.log('  '+'-'.repeat(60));
console.log('  (today)            '+lv.filter(l=>l[2].every(k=>taught[k])).map(l=>l[0]).join(', ')+'  none');
for(const [label,key] of stages){
  taught[key]=true;
  const on=lv.filter(l=>l[2].every(k=>taught[k])).map(l=>l[0]);
  console.log('  '+label.padEnd(19)+(on.length?on.join(', '):'none'));
}
console.log('');
console.log('  L41 (up & down) stays live at every stage, by design.');
console.log('  Each stage is one obstacle, so each can be checked in the browser on its own');
console.log('  level before the next begins. No stage depends on a later one.');
