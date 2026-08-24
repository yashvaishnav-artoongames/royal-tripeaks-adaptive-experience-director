const ROOT=require('path').join(__dirname,'..','index.html');
const BASE=process.env.AED_BASELINE||ROOT;
const fs=require('fs');
function ctx(file){
  const src=fs.readFileSync(file,'utf8');
  const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
  let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
  const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
  const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
    style:{cssText:''},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
    appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){},contains(){return false;}},
    set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
  ids.forEach(id=>store[id]=mk(id));
  const fb={set disabled(v){},get disabled(){return false;}};
  const vm=require('vm');
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    setTimeout:()=>0,console:console,R:null};
  vm.createContext(s);vm.runInContext(js,s);return s;
}
function survey(file){
  const s=ctx(file);
  require('vm').runInContext(`
  R={built:0,total:0,live:0,rows:[],endOne:0,frontLoaded:0,flat:0};
  for(let li=0;li<LEVELS.length;li++){
    for(let ti=0;ti<3;ti++){
      for(let p=0;p<2;p++){
        R.total++;
        let lv=null;
        try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)+p*104729); }catch(e){}
        if(!lv)continue;
        R.built++;
        if(lv.usedMode===4){R.live++;continue;}
        const ln=lv.ln||[];
        if(!ln.length)continue;
        const n=ln.length;
        if(n>=3&&ln[n-1]<2)R.endOne++;
        if(n>=4){
          const mx=Math.max.apply(null,ln);
          if(ln.lastIndexOf(mx)<Math.floor(n/2))R.frontLoaded++;
          let run=0,worst=0;
          for(let i=0;i<n;i++){if(ln[i]<=1){run++;if(run>worst)worst=run;}else run=0;}
          if(worst>=2)R.flat++;
        }
        if(R.rows.length<8)R.rows.push(LEVELS[li].short+' '+OUT[ti].n.slice(0,10)+'  '+ln.join('\\u00b7'));
      }
    }
  }`,s);
  return s.R;
}
const A=survey(BASE);
const B=survey(ROOT);
const p=(a,b)=>b?((100*a/b).toFixed(0)+'%'):'-';
console.log('');
console.log('  WIN-TARGET CHAIN SHAPE            before     after');
console.log('  levels built                    '+String(A.built).padStart(6)+String(B.built).padStart(10));
console.log('  verified (not live)             '+String(A.built-A.live).padStart(6)+String(B.built-B.live).padStart(10));
console.log('  ends on a single chain          '+p(A.endOne,A.built-A.live).padStart(6)+p(B.endOne,B.built-B.live).padStart(10));
console.log('  longest chain in the front half '+p(A.frontLoaded,A.built-A.live).padStart(6)+p(B.frontLoaded,B.built-B.live).padStart(10));
console.log('  two or more singles in a row    '+p(A.flat,A.built-A.live).padStart(6)+p(B.flat,B.built-B.live).padStart(10));
console.log('');
console.log('  sample chains after:');
B.rows.forEach(r=>console.log('    '+r));
console.log('');
