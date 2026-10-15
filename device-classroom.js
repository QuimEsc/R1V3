(function(){
'use strict';if(!location.pathname.endsWith('/seguiment.html'))return;
let panel,ref;
function render(view){panel.querySelector('[data-state]').textContent=view?.status==='CLASS_ACTIVE'?'CLASSE ACTIVA · vinculació d’ordinadors protegida':'Classe parada · treball lliure des de casa';
const list=panel.querySelector('[data-incidents]');list.replaceChildren();let pending=0;
for(const item of (view?.incidents||[])){if(item.status!=='PENDING')continue;pending++;const row=document.createElement('p');row.setAttribute('role','alert');const text=document.createElement('strong');text.textContent=item.name+' · '+({CANVI_PERFIL:'Canvi de perfil',CANVI_NAVEGADOR:'Canvi de navegador',SESSIO_INCOMPATIBLE:'Sessió incompatible'}[item.reason]||'Canvi pendent');row.append(text,' ');const button=document.createElement('button');button.textContent='AUTORITZAR CANVI D’ORDINADOR';button.onclick=()=>act('device_authorize',{requestId:item.id},button);row.append(button);list.append(row);}
panel.querySelector('[data-count]').textContent=pending+' incidències pendents · '+(view?.bindings?.length||0)+' vinculacions';}
async function act(action,payload={},button){if(button)button.disabled=true;try{const v=await GameData.call(action,payload);render(v.deviceControl);}catch(e){panel.querySelector('[data-error]').textContent=e.message;}finally{if(button)button.disabled=false;}}
window.addEventListener('reforc:teacher-ready',()=>{if(panel)return;panel=document.createElement('section');panel.className='game-card';panel.id='deviceClassPanel';panel.innerHTML='<h2>Control d’ordinadors</h2><p>Identifica este navegador; no certifica la identitat física de l’equip.</p><button data-start>INICIAR CLASSE</button> <button data-stop>PARAR CLASSE</button><p data-state></p><p data-count></p><p data-error role="status"></p><div data-incidents aria-live="assertive"></div>';
document.querySelector('.monitor-summary').after(panel);panel.querySelector('[data-start]').onclick=e=>act('device_class_start',{},e.target);panel.querySelector('[data-stop]').onclick=e=>act('device_class_stop',{},e.target);ref=GameLive.getDb().ref(GameLive.pathFor('deviceView'));ref.on('value',s=>render(s.val()));});
})();
