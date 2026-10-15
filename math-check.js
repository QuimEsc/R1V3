(function(root){
  'use strict';
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  function rational(a,b=1){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!b)throw Error('Valor no exacte');const g=gcd(a,b),s=b<0?-1:1;return [s*a/g,s*b/g];}
  function number(text){
    const s=String(text).trim().replace(/−/g,'-').replace(/,/g,'.');
    if(!/^[+-]?\d+(?:\.\d+)?(?:\s*\/\s*[+-]?\d+)?$/.test(s))return null;
    try{if(s.includes('/')){const [a,b]=s.split('/').map(Number);return rational(a,b);}const [whole,dec='']=s.replace(/^[+-]/,'').split('.');const sign=s.startsWith('-')?-1:1;return rational(sign*Number(whole+dec),10**dec.length);}catch{return null;}
  }
  function expression(source,variableValue){
    let s=String(source).toLowerCase().replace(/−/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/\s+/g,'');
    s=s.replace(/(\d|\))([nx(])/g,'$1*$2').replace(/([nx])(\d|\()/g,'$1*$2');
    const tokens=s.match(/\d+(?:\.\d+)?|[nx]|[()+*/^\-]/g)||[];
    if(tokens.join('')!==s||tokens.length>100)throw Error('Expressió no admesa');let i=0;
    function atom(){let t=tokens[i++];if(t==='('){let v=sum();if(tokens[i++]!==')')throw Error('Parèntesi');return v;}if(t==='n'||t==='x'){if(!Number.isFinite(variableValue))throw Error('Variable');return variableValue;}if(!/^\d/.test(t||''))throw Error('Nombre');return Number(t);}
    function power(){let v=atom();if(tokens[i]==='^'){i++;let e=unary();if(!Number.isInteger(e)||Math.abs(e)>8)throw Error('Exponent');v=v**e;}return v;}
    function unary(){if(tokens[i]==='+'||tokens[i]==='-'){let op=tokens[i++],v=unary();return op==='-'?-v:v;}return power();}
    function product(){let v=unary();while(tokens[i]==='*'||tokens[i]==='/'){let op=tokens[i++],b=unary();if(op==='/'&&b===0)throw Error('Divisor');v=op==='*'?v*b:v/b;}return v;}
    function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){let op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
    const v=sum();if(i!==tokens.length||!Number.isFinite(v))throw Error('Expressió incompleta');return v;
  }
  function polynomial(source){
    let s=String(source).toLowerCase().replace(/−/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/\s+/g,'');
    s=s.replace(/(\d|\))([nx(])/g,'$1*$2').replace(/([nx])(\d|\()/g,'$1*$2');
    let t=s.match(/\d+(?:\.\d+)?|[nx]|[()+*/^\-]/g)||[],i=0;
    if(t.join('')!==s||t.length>100)throw Error('Expressió');
    const trim=a=>{while(a.length>1&&Math.abs(a.at(-1))<1e-12)a.pop();return a;};
    const add=(a,b,sign=1)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,j)=>(a[j]||0)+sign*(b[j]||0)));
    function multiply(a,b){if(a.length+b.length>18)throw Error('Grau');let c=Array(a.length+b.length-1).fill(0);a.forEach((x,j)=>b.forEach((y,k)=>c[j+k]+=x*y));return trim(c);}
    function atom(){let v=t[i++];if(v==='('){let a=sum();if(t[i++]!==')')throw Error('Parèntesi');return a;}if(v==='n'||v==='x')return [0,1];if(!/^\d/.test(v||''))throw Error('Nombre');return [Number(v)];}
    function power(){let a=atom();if(t[i]==='^'){i++;let e=unary();if(e.length!==1||!Number.isInteger(e[0])||e[0]<0||e[0]>8)throw Error('Exponent');let b=[1];for(let k=0;k<e[0];k++)b=multiply(b,a);a=b;}return a;}
    function unary(){if(t[i]==='+'||t[i]==='-'){let op=t[i++],a=unary();return op==='-'?a.map(x=>-x):a;}return power();}
    function product(){let a=unary();while(t[i]==='*'||t[i]==='/'){let op=t[i++],b=unary();if(op==='*')a=multiply(a,b);else{if(b.length!==1||b[0]===0)throw Error('Divisor no constant');a=a.map(x=>x/b[0]);}}return a;}
    function sum(){let a=product();while(t[i]==='+'||t[i]==='-'){let op=t[i++];a=add(a,product(),op==='+'?1:-1);}return a;}
    let result=trim(sum());if(i!==t.length||result.some(x=>!Number.isFinite(x)))throw Error('Expressió incompleta');return result;
  }
  const normalize=s=>String(s).trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/−/g,'-').replace(/\s+/g,' ');
  function finalAnswer(s){s=String(s).trim().split(/\n/).pop().replace(/^\s*resposta\s*:\s*/i,'').trim();if(['=','<','>'].includes(s)||s.startsWith('{'))return s;return s.split(/→|=/).pop().trim();}
  function check(answer,spec){
    try{
      let s=finalAnswer(answer);if(!s)return false;
      if(spec.kind==='text')return spec.accepted.map(normalize).includes(normalize(s));
      if(spec.kind==='geometry'){let obj=JSON.parse(s);let points=Array.isArray(obj)?obj:obj.points;if(!Array.isArray(points)||points.length!==spec.points.length)return false;let received=points.map(p=>Array.isArray(p)?p:[p.x,p.y]);let expected=spec.points;return received.every((p,i)=>p.length===2&&p.every((n,k)=>Number.isFinite(n)&&Math.abs(n-expected[i][k])<=(spec.tolerance||0)));}
      if(spec.kind==='linear'){let coefficients=polynomial(s);return coefficients.length<=2&&Math.abs((coefficients[1]||0)-spec.a)<1e-10&&Math.abs(coefficients[0]-spec.b)<1e-10;}
      if(spec.kind==='factors'){
        s=s.replace(/[×·]/g,'*').replace(/\s/g,'');let terms=s.split('*'),values=[];
        for(let term of terms){let m=term.match(/^(\d+)(?:\^(\d+))?$/);if(!m)return false;let p=Number(m[1]),e=Number(m[2]||1);if(p<2||e<1||e>8||Array.from({length:Math.floor(Math.sqrt(p))-1},(_,i)=>i+2).some(d=>p%d===0))return false;values.push(p**e);}
        return values.reduce((a,b)=>a*b,1)===spec.value;
      }
      if(spec.kind==='set'||spec.kind==='order'||spec.kind==='pair'){
        let vals=s.replace(/[\[\]()]/g,'').split(/\s*;\s*|\s*<\s*|\s*>\s*|\s*,\s+(?=[+-]?\d)/).map(number);if(vals.some(v=>!v))return false;
        let expected=spec.values.map(v=>number(v));if(spec.kind==='set'){vals.sort((a,b)=>a[0]/a[1]-b[0]/b[1]);expected.sort((a,b)=>a[0]/a[1]-b[0]/b[1]);}
        return vals.length===expected.length&&vals.every((v,i)=>v[0]*expected[i][1]===expected[i][0]*v[1]);
      }
      const unit=s.match(/\s*(€|eur|cm²|cm2|m²|m2|cm|km|mm|m|kg|g|l|ml|min|°c|%)\s*$/i);
      if(unit){if(spec.unit&&!spec.unitAliases?.map(normalize).includes(normalize(unit[1]))&&normalize(unit[1])!==normalize(spec.unit))return false;if(!spec.unit)return false;s=s.slice(0,unit.index).trim();}
      if(spec.unitRequired&&!unit)return false;
      let v=number(s);if(!v){let n=expression(s);v=number(String(n));}if(!v)return false;
      if(spec.kind==='interval')return v[0]/v[1]>spec.min&&v[0]/v[1]<spec.max;
      const e=number(spec.value);return !!e&&v[0]*e[1]===e[0]*v[1];
    }catch{return false;}
  }
  const api={check,number,rational,gcd,expression,finalAnswer,normalize};root.R1V3Math=api;if(typeof module==='object')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
