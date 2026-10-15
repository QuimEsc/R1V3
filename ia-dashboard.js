(function(){
 'use strict';let ready=false,refreshing=false,showRequested=false;
 const section=document.createElement('section');section.className='game-card';section.id='iaControl';
 section.innerHTML='<h2>Justificacions</h2><p id="iaModeLabel">Carregant…</p><label for="iaModeSelect">Mode local</label> <select id="iaModeSelect"><option>OFF</option><option>MOCK</option></select> <button id="iaSetMode" class="secondary-button" type="button">Aplicar</button> <button id="iaHistoryButton" class="secondary-button" type="button">Historial de correccions</button><p id="iaControlMessage" role="status"></p>';
 document.getElementById('pendingReviewCard').after(section);
 if(!window.GAMIFICACIO_CONFIG.localMode){section.querySelector('label').hidden=true;section.querySelector('select').hidden=true;section.querySelector('#iaSetMode').hidden=true;}
 const dialog=document.createElement('dialog');dialog.id='iaHistoryDialog';dialog.className='monitor-dialog';dialog.innerHTML='<form method="dialog" class="dialog-close-row"><button aria-label="Tancar">✕</button></form><h2>Historial de justificacions</h2><p>Les decisions MOCK són simulades. Les revisions docents tenen prioritat.</p><div id="iaHistoryList"></div>';
 document.body.append(dialog);
 async function refresh(show=false){if(show)showRequested=true;if(refreshing||!window.GameData.hasTeacherToken())return;refreshing=true;try{
  const data=await window.GameData.call('ia_history');document.getElementById('iaModeLabel').textContent=data.mode==='MOCK'?'MOCK: circuit simulat, sense peticions a Luna ni calibratge real.':data.mode==='OFF'?'OFF: correcció determinista i revisió docent.':'LIVE: evidència automàtica subjecta a calibratge aprovat.';document.getElementById('iaModeSelect').value=data.mode;
  const list=document.getElementById('iaHistoryList');list.replaceChildren();for(const r of data.history.slice().reverse()){
   const card=document.createElement('article');card.className='game-card';const title=document.createElement('p');title.textContent=r.studentName+' · '+r.missionId+' · N'+r.level+' · '+r.phase+' · '+(r.effective?.decision||r.effective?.status||'PENDENT');const open=document.createElement('button');open.className='secondary-button';open.textContent='Consultar / revisar';open.dataset.submission=r.submissionId;open.onclick=()=>{dialog.close();window.dispatchEvent(new CustomEvent('r1v3:review-open',{detail:r}));};card.append(title,open);list.append(card);
  }if(!data.history.length)list.textContent='Encara no hi ha justificacions guardades.';if(showRequested){showRequested=false;dialog.showModal();}
 }catch(e){document.getElementById('iaControlMessage').textContent=e.message;}finally{refreshing=false;}}
 document.getElementById('iaHistoryButton').onclick=()=>refresh(true);
 document.getElementById('iaSetMode').onclick=async()=>{try{await window.GameData.call('ia_configure',{mode:document.getElementById('iaModeSelect').value});document.getElementById('iaControlMessage').textContent='Mode actualitzat per als nous enviaments.';refresh();}catch(e){document.getElementById('iaControlMessage').textContent=e.message;}};
 window.addEventListener('reforc:teacher-ready',()=>{ready=true;refresh();});setInterval(()=>{if(ready)refresh();},5000);
})();
