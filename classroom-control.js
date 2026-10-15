(function(){
 'use strict';let current=null,timer=null,unsubscribe=null,cacheKey='',busy=false,onChange=()=>{},focusBefore=null;
 const overlay=document.createElement('dialog');overlay.id='classExplanationOverlay';overlay.className='class-explanation-overlay';overlay.setAttribute('aria-labelledby','classExplanationTitle');overlay.innerHTML='<h1 id="classExplanationTitle">MIRA LA PISSARRA</h1><p>Escolta l’explicació. El teu treball està guardat.</p>';
 document.addEventListener('DOMContentLoaded',()=>document.body.append(overlay));overlay.addEventListener('cancel',e=>e.preventDefault());
 const blocked=()=>current?.state==='EXPLAIN';
 function render(){if(blocked()){if(!overlay.open){focusBefore=document.activeElement;overlay.showModal();}}else if(overlay.open){overlay.close();if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});}}
 function apply(control){if(!control||!['READY','EXPLAIN','ACTIVITY','CHECKPOINT','BATTLE','FINISH'].includes(control.state))return;
  const version=Number(control.stateVersion||0);if(current&&version<=Number(current.stateVersion||0))return;
  const previous=current;current={...control};if(cacheKey)localStorage.setItem(cacheKey,JSON.stringify(current));render();onChange(current,previous);
 }
 function stop(){clearInterval(timer);timer=null;unsubscribe?.();unsubscribe=null;current=null;cacheKey='';render();}
 function start(studentId,initial,callback){stop();onChange=callback||(()=>{});cacheKey='r1v3-class-control:'+window.GameData.space+':'+studentId;let saved;try{saved=JSON.parse(localStorage.getItem(cacheKey)||'null');}catch{}
  // Select the newest control before invoking the callback. Replaying an older
  // cached assignment first could launch a second bootstrap over the new one.
  apply(saved&&(!initial||Number(saved.stateVersion||0)>Number(initial.stateVersion||0))?saved:initial);
  unsubscribe=window.GameLive.subscribeClassControl(apply);const poll=async()=>{if(busy)return;busy=true;try{const data=await window.GameData.call('class_control_get',{studentId});apply(data.control);}catch{}finally{busy=false;}};timer=setInterval(poll,window.GAMIFICACIO_CONFIG.classControlPollMs||2500);poll();
 }
 // Capture also covers battle/forms and programmatic click/requestSubmit. Background jobs continue.
 for(const type of ['click','submit','keydown'])document.addEventListener(type,e=>{if(blocked()&&!overlay.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.GameClassControl=Object.freeze({start,stop,apply,isBlocked:blocked,current:()=>current});
})();
