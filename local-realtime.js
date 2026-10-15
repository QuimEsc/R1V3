(function(){
 'use strict';
 let context=null,record=null,commentRef=null,controlRef=null,ownerRef=null,heartbeat=null,liveWrites=Promise.resolve();
 const refs=new Set(),draftKey=id=>'r1v3-local-live-draft:'+id;
 const safeKey=value=>String(value||'').replace(/[.#$\[\]/]/g,'_');
 function pathFor(section,id){return [window.GAMIFICACIO_CONFIG.firebaseRoot,section,window.GAMIFICACIO_CONFIG.groupId,id&&safeKey(id)].filter(Boolean).join('/');}
 const space=()=>new URLSearchParams(location.search).get('demo')==='1'?'demo':'local';
 async function request(path,op,value,revision){
  const cfg=window.GAMIFICACIO_CONFIG,prefix=cfg.firebaseRoot+'/';if(!path.startsWith(prefix)||/r1v2|reforc-v2/.test(path))throw Error('V3_PATH_ONLY');
  const relative=path.slice(prefix.length),method=op==='get'?'GET':op==='update'?'PATCH':'PUT';
  const data=await window.R1V3Production.firebase(relative,method,value,op==='transaction'?revision:undefined);
  if(data.conflict)return data;return {ok:true,value:data.value,revision:data.etag};
 }
 function ref(path){
  let timer=null,listeners=new Set(),last='',busy=false;
  async function poll(){if(busy)return;busy=true;try{const data=await request(path,'get');let signature=JSON.stringify(data.value);if(signature!==last){last=signature;for(let listener of listeners)listener({val:()=>data.value});}}catch{}finally{busy=false;}}
  const obj={
   child:suffix=>ref(path+'/'+suffix),once:async()=>{let data=await request(path,'get');return {val:()=>data.value};},
   set:async value=>request(path,'set',value),update:async value=>request(path,'update',value),remove:async()=>request(path,'set',null),
   transaction:async updater=>{for(let i=0;i<12;i++){const old=await request(path,'get'),next=updater(old.value);if(next===undefined)return {committed:false,snapshot:{val:()=>old.value}};const data=await request(path,'transaction',next,old.revision);if(!data.conflict)return {committed:true,snapshot:{val:()=>data.value}};}throw Error('Transacció local ocupada');},
   on:(event,listener)=>{listeners.add(listener);refs.add(obj);if(!timer)timer=setInterval(poll,750);poll();},
   off:(event,listener)=>{if(listener)listeners.delete(listener);else listeners.clear();if(!listeners.size){clearInterval(timer);timer=null;refs.delete(obj);}}
  };return obj;
 }
 const db={ref};
 async function start(value){stopListeners();context={...value,active:true};let previous;try{previous=JSON.parse(localStorage.getItem(draftKey(value.studentId))||'null');}catch{}record={sessionId:value.sessionId,studentId:value.studentId,studentName:value.studentName,updatedAt:Date.now(),focusState:document.visibilityState==='hidden'?'HIDDEN':'VISIBLE',focusChangedAt:Math.max(Date.now(),Number(previous?.focusChangedAt||0)+1),state:'WORKING',connectionState:'ONLINE',lastActivityAt:Date.now()};
  ownerRef=ref(pathFor('sessions',value.studentId));
  // Session ownership is claimed by the authenticated backend, never by browser writes.
  ownerRef.on('value',s=>{let owner=s.val();if(context?.active&&owner&&owner.sessionId!==value.sessionId){context.active=false;clearInterval(heartbeat);value.onReplaced?.();}});
  commentRef=ref(pathFor('comments',value.sessionId));let seen=0;commentRef.on('value',snapshot=>{let c=snapshot.val();if(c&&c.updatedAt>seen){seen=c.updatedAt;value.onComment?.(c);}});
  heartbeat=setInterval(()=>updateDynamic({}).catch(()=>{}),15000);return {active:true,previous};
 }
 async function updateDynamic(changes){if(!context?.active)return;
  if(changes.focusState && changes.focusState!==record.focusState){const at=Math.max(Date.now(),Number(record.focusChangedAt||0)+1);changes={...changes,focusChangedAt:at,...(changes.focusState==='VISIBLE'?{focusReturnedAt:at}:{focusIncidentAt:at})};}
  record={...record,...changes,updatedAt:Date.now(),connectionState:navigator.onLine?'ONLINE':'OFFLINE'};if(changes.answer!==undefined||changes.exerciseId)record.lastActivityAt=Date.now();localStorage.setItem(draftKey(context.studentId),JSON.stringify(record));
  const target=pathFor('live',context.studentId),snapshot={...record};
  // Preserve event order even when a previous network write is delayed.
  const write=liveWrites.catch(()=>{}).then(()=>ref(target).set(snapshot));liveWrites=write;await write;
 }
 async function publishExercise(exercise,mission,extra){if(!context)return;let saved;try{saved=JSON.parse(localStorage.getItem(draftKey(context.studentId))||'null');}catch{}record={...record,exerciseId:exercise.exerciseId,missionId:exercise.missionId,missionTitle:mission?.title,questionHtml:exercise.questionHtml,curriculumLevel:exercise.curriculumLevel,answer:saved?.exerciseId===exercise.exerciseId?saved.answer:'',...extra};await updateDynamic({});}
 function subscribeClassControl(callback){const subscribed=ref(pathFor('classControl'));controlRef=subscribed;subscribed.on('value',s=>callback(s.val()));return ()=>subscribed.off();}
 async function publishClassControl(control){return (await window.GameData.call('class_control_get')).control;}
 window.addEventListener('online',()=>updateDynamic({}).catch(()=>{}));
 window.addEventListener('offline',()=>updateDynamic({}).catch(()=>{}));
 function stopListeners(){commentRef?.off();controlRef?.off();ownerRef?.off();clearInterval(heartbeat);commentRef=controlRef=ownerRef=heartbeat=null;}
 // Original live API is preserved. All I/O uses the loopback mock and local drafts.
 window.GameLive=Object.freeze({init:()=>true,start,publishExercise,updateDynamic,markSubmitted:(reason,answer,preview)=>updateDynamic({state:'SUBMITTED',answer,answerPreviewHtml:preview,submissionReason:reason}),contributeClass:async()=>true,publishClassControl,subscribeClassControl,removeCurrent:async()=>true,stopListeners,getDb:()=>db,pathFor,safeKey});
 window.R1V3LocalRealtime=Object.freeze({db});
 // Timestamp compatibility for the original comment UI; this object cannot connect to Firebase.
 const serverValue={};Object.defineProperty(serverValue,'TIMESTAMP',{get:()=>Date.now()});
 window.firebase={database:{ServerValue:serverValue}};
})();
