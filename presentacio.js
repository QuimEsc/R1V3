(function(){
'use strict';
const metadata=window.R1V3CatalogMetadata,d={};
function render(){
 const m=metadata.missions.find(m=>m.missionId===d.missionSelect.value),lv=Number(d.curriculumLevel.value);
 const guide=metadata.guides.find(g=>g.missionId===m.missionId&&g.curriculumLevel===lv);
 d.missionCode.textContent=`MISSIÓ ${m.missionId} · BLOC ${m.sector} · N${lv}`;
 d.missionTitle.textContent=m.title;d.missionSubtitle.textContent=guide.objective;d.missionRule.textContent=guide.rule;
 d.missionExample.textContent=guide.examples[1]||guide.examples[0];d.guideError.textContent=guide.commonErrors.join(' ');
 d.guideAlternative.textContent=guide.alternative;
 ['supportExample','baseExample','challengeExample'].forEach((id,i)=>d[id].textContent=m.cells[lv-1][i]);
 history.replaceState(null,'',`?mission=${m.missionId}&level=${lv}`);
}
document.addEventListener('DOMContentLoaded',()=>{
 ['missionSelect','curriculumLevel','missionCode','missionTitle','missionSubtitle','missionRule','missionExample','supportExample','baseExample','challengeExample','guideError','guideAlternative','fullscreenButton'].forEach(id=>d[id]=document.getElementById(id));
 d.missionSelect.innerHTML=metadata.missions.map(m=>`<option value="${m.missionId}">${m.missionId} · ${m.title}</option>`).join('');
 const query=new URLSearchParams(location.search);d.missionSelect.value=query.get('mission')||'M01';d.curriculumLevel.value=['1','2','3'].includes(query.get('level'))?query.get('level'):'2';
 d.missionSelect.addEventListener('change',render);d.curriculumLevel.addEventListener('change',render);
 d.fullscreenButton.addEventListener('click',()=>document.documentElement.requestFullscreen?.());render();
});
})();
