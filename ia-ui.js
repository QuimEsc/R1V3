(function(){
 'use strict';const store='r1v3-ia-status:'+window.GameData.space;
 const banner=document.createElement('p');banner.id='justificationStatus';banner.className='notice';banner.setAttribute('role','status');banner.hidden=true;
 (document.querySelector('main')||document.body).prepend(banner);
 let pending;try{pending=JSON.parse(localStorage.getItem(store)||'null');}catch{}
 function show(value){if(!value)return;banner.hidden=false;banner.textContent=value.source==='TEACHER'?'Justificació revisada pel docent.':value.status==='AUTO_ACCEPTED'?(value.simulated===false?'Justificació resolta.':'Justificació resolta en simulació MOCK.'):value.status==='AUTO_REJECTED'?(value.simulated===false?'Justificació insuficient o incorrecta.':'Justificació insuficient o incorrecta en simulació MOCK.'):value.status==='REVIEW_REQUIRED'?'Resultat guardat. Justificació pendent de revisió docent.':'Resposta guardada. Justificació pendent; pots continuar.';}
 window.addEventListener('r1v3:answer-saved',event=>{pending=event.detail;window.GameLive.updateDynamic({iaStatus:'PENDING'}).catch(()=>{});localStorage.setItem(store,JSON.stringify(pending));show(pending);poll();});
 let busy=false;async function poll(){if(busy||!pending)return;busy=true;try{const data=await window.GameData.call('submission_status',{studentId:pending.studentId,sessionId:pending.sessionId,activityId:pending.activityId,submissionId:pending.submissionId});show(data.effective||data);if(data.effective?.definitive||data.status==='REVIEW_REQUIRED'){window.GameLive.updateDynamic({iaStatus:data.status}).catch(()=>{});pending=null;}}catch{}finally{busy=false;}}
 show(pending);setInterval(poll,2500);
})();
