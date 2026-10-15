(function(){
 'use strict';const cfg=window.GAMIFICACIO_CONFIG,space=cfg.isDemoProject?'demo':'local';
 const authKey='r1v3-auth-v3:'+space;let auth;try{auth=JSON.parse(sessionStorage.getItem(authKey)||'null');}catch{}
 let authenticating=null,teacherToken=sessionStorage.getItem('gamificacio-teacher-token-v3:'+space)||'';
 const configured=()=>!!(cfg.appsScriptUrl&&cfg.firebaseDatabaseUrl&&cfg.firebaseWebApiKey&&cfg.firebaseProjectId);
 const key=x=>String(x).split('').map(c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
 async function signIn(){
  if(!configured())throw Error('Configuració V3 pendent. Este paquet està preparat però no connectat.');
  if(auth&&auth.expiresAt>Date.now()+60000)return auth;
  if(auth?.refreshToken){const r=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(cfg.firebaseWebApiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:auth.refreshToken})}),v=await r.json();if(r.ok){auth={...auth,idToken:v.id_token,refreshToken:v.refresh_token,expiresAt:Date.now()+Number(v.expires_in)*1000};sessionStorage.setItem(authKey,JSON.stringify(auth));return auth;}auth=null;}
  if(authenticating)return authenticating;
  authenticating=new Promise((resolve,reject)=>{
   const dialog=document.createElement('dialog');dialog.innerHTML='<form><h2>Accés R1V3</h2><label>Correu del compte V3 <input name="email" type="email" autocomplete="username" required></label><label>Contrasenya <input name="password" type="password" autocomplete="current-password" required></label><p role="status"></p><button type="submit">Entrar</button><button type="button" data-cancel>Cancel·lar</button></form>';document.body.append(dialog);dialog.showModal();
   const cancel=()=>{dialog.remove();reject(Error('Accés cancel·lat'));};dialog.querySelector('[data-cancel]').onclick=cancel;dialog.addEventListener('cancel',cancel);
   dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target;try{const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(cfg.firebaseWebApiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value,returnSecureToken:true})}),v=await response.json();if(!response.ok)throw Error('No s’ha pogut validar el compte V3.');auth={idToken:v.idToken,uid:v.localId,refreshToken:v.refreshToken,expiresAt:Date.now()+Number(v.expiresIn)*1000};sessionStorage.setItem(authKey,JSON.stringify(auth));form.password.value='';dialog.remove();resolve(auth);}catch(e){form.querySelector('[role=status]').textContent=e.message;}};
  }).finally(()=>authenticating=null);return authenticating;
 }
 async function firebase(relative,method='GET',value,etag){const identity=await signIn(),u=cfg.firebaseDatabaseUrl+'/'+cfg.firebaseRoot+'/'+relative+'.json?auth='+encodeURIComponent(identity.idToken),headers={};if(etag)headers['if-match']=etag;if(value!==undefined)headers['Content-Type']='application/json';headers['X-Firebase-ETag']='true';const r=await fetch(u,{method,headers,body:value===undefined?undefined:JSON.stringify(value),signal:AbortSignal.timeout(10000)});if(r.status===412)return {conflict:true};const data=await r.json();if(!r.ok)throw Error('Firebase V3 ha denegat l’operació.');return {value:data,etag:r.headers.get('ETag')};}
 async function backend(action,payload){const identity=await signIn();const r=await fetch(cfg.appsScriptUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload:{...payload,groupId:cfg.groupId},idToken:identity.idToken,space}),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok||data.ok===false)throw Error(data.error||'Backend V3 no disponible');return data;}
 async function persistAnswer(p){const identity=await signIn(),id=key(p.submissionId),relative='answers/'+cfg.groupId+'/'+identity.uid+'/'+id;
  const existing=await firebase(relative);if(existing.value){const a=existing.value;if(a.answer!==p.answer||a.activityId!==p.exerciseId||a.studentId!==p.studentId||a.sessionId!==p.sessionId)throw Error('IMMUTABLE_ANSWER_CONFLICT');return;}
  await backend('resume_submission',{studentId:p.studentId,sessionId:p.sessionId});
  const value={type:'ANSWER',uid:identity.uid,studentId:p.studentId,groupId:cfg.groupId,sessionId:p.sessionId,submissionId:p.submissionId,activityId:p.exerciseId,answer:String(p.answer||''),helpCount:Number(p.helpCount||0),responseTimeMs:Number(p.responseTimeMs||0),createdAt:{'.sv':'timestamp'}};
  const saved=await firebase(relative,'PUT',value,'null_etag');if(saved.conflict)return persistAnswer(p);
 }
 async function call(action,payload={}){
  const cache='r1v3-production-cache:'+space+':'+action+':'+(payload.studentId||''),reads=['list_students','bootstrap','catalog','class_control_get'];
  try{if(action==='submit')await persistAnswer(payload);const data=await backend(action,payload);if(reads.includes(action))localStorage.setItem(cache,JSON.stringify(data));
   if(action==='submit'&&data.iaStatus!=='DETERMINISTIC'){
    window.dispatchEvent(new CustomEvent('r1v3:answer-saved',{detail:{...payload,activityId:payload.exerciseId,mode:data.iaMode,status:data.iaStatus}}));
    // Never await Luna. The scheduled backend worker also recovers a lost request.
    backend('grade_open',{studentId:payload.studentId,sessionId:payload.sessionId,activityId:payload.exerciseId,submissionId:payload.submissionId}).catch(()=>{});
   }return data;
  }catch(e){if(reads.includes(action)){const saved=localStorage.getItem(cache);if(saved){const data=JSON.parse(saved);if(action==='bootstrap'){const ids=new Set(JSON.parse(localStorage.getItem('r1v3-pending-attempts-v1:'+payload.studentId)||'[]').map(x=>x.exerciseId)),items=[data.currentExercise,...(data.exerciseBuffer||[])].filter(x=>x&&!ids.has(x.exerciseId));data.currentExercise=items.shift()||null;data.exerciseBuffer=items;}return data;}}throw e;}
 }
 window.R1V3Production=Object.freeze({signIn,firebase,backend,key});
 window.GameData=Object.freeze({call,space,isDemo:()=>false,isLocal:()=>false,isConfigured:configured,setTeacherToken:v=>{teacherToken=v||'';sessionStorage.setItem('gamificacio-teacher-token-v3:'+space,teacherToken);},hasTeacherToken:()=>!!teacherToken,clearTeacherToken:()=>{teacherToken='';auth=null;sessionStorage.removeItem('gamificacio-teacher-token-v3:'+space);sessionStorage.removeItem(authKey);}});
})();
