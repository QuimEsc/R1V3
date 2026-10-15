(function(){
 'use strict';const errors=window.R1V3ConfigurationErrors=[];
 function verify(value){const c=window.GAMIFICACIO_CONFIG||{},u=new URL(typeof value==='string'?value:value.url,location.href);
  const origins=[location.origin,c.appsScriptUrl,c.firebaseDatabaseUrl].filter(Boolean).map(v=>new URL(v).origin).concat(['https://script.googleusercontent.com','https://identitytoolkit.googleapis.com','https://securetoken.googleapis.com']);
  if(!origins.includes(u.origin)||/r1v2|gamificacio-reforc-v2|api\.openai\.com/i.test(u.href)){errors.push({message:'CONFIGURATION_ERROR: ruta aliena a V3',at:Date.now()});throw Error('CONFIGURATION_ERROR: ruta aliena a V3');}return value;
 }
 const native=window.fetch.bind(window);window.fetch=(url,...args)=>{try{verify(url);return native(url,...args);}catch(e){return Promise.reject(e);}};
 window.R1V3Guard=Object.freeze({verify});
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',location.href)).catch(()=>{}));
})();
