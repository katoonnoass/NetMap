// API
// ═══════════════════════════════════════════════════════
let _csrfToken = '';
let _modalStack = [];

function esc(s){const d=document.createElement('div');d.textContent=String(s??'');return d.innerHTML;}

async function api(method,path,body){
  const opts={method,headers:{}};
  if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  if(_csrfToken && method!=='GET' && method!=='HEAD') opts.headers['X-CSRFToken']=_csrfToken;
  try{
    const r=await fetch(path,opts);
    if(r.status===401){toast('🔒 Sessão expirada. Redirecionando…','warn');setTimeout(()=>{window.location.href='/login';},2000);return null;}
    if(r.status===403){const e=await r.json().catch(()=>({error:'Sem permissão'}));toast('🔒 '+e.error,'error');return null;}
    if(!r.ok){const e=await r.json().catch(()=>({error:`HTTP ${r.status}`}));toast('❌ '+e.error,'error');return null;}
    const data = await r.json();
    if (data && typeof data === 'object' && !Array.isArray(data) && data.items !== undefined) {
      return data.items;
    }
    return data;
  }catch(e){toast('❌ Erro de conexão','error');return null;}
}

async function apiUpload(method,path,formData){
  const opts={method,headers:{},credentials:'same-origin'};
  if(_csrfToken && method!=='GET') opts.headers['X-CSRFToken']=_csrfToken;
  opts.body=formData;
  try{
    const r=await fetch(path,opts);
    if(r.status===401){toast('🔒 Sessão expirada. Redirecionando…','warn');setTimeout(()=>{window.location.href='/login';},2000);return null;}
    if(r.status===403){const e=await r.json().catch(()=>({error:'Sem permissão'}));toast('🔒 '+e.error,'error');return null;}
    if(!r.ok){const e=await r.json().catch(()=>({error:`HTTP ${r.status}`}));toast('❌ '+e.error,'error');return null;}
    return await r.json();
  }catch(e){toast('❌ Erro de conexão','error');return null;}
}
const papi=path=>`/api/projects/${currentProjectId}${path}`;

async function loadAll(){
  const [els,conns,dios,pos,incidents,customers,cables,fences,maint]=await Promise.all([
    api('GET',papi('/elements')),api('GET',papi('/connections')),
    api('GET',papi('/dios')),api('GET',papi('/positions')),
    api('GET',papi('/incidents')),
    api('GET',papi('/customers')),
    api('GET',papi('/cables')),
    api('GET',papi('/fences')),
    api('GET',papi('/maintenance')),
  ]);
  DB.elements=Array.isArray(els)?els:(els?.items||[]);
  DB.connections=Array.isArray(conns)?conns:(conns?.items||[]);
  DB.dios=Array.isArray(dios)?dios:(dios?.items||[]);
  DB.positions=(pos&&typeof pos==='object'&&!Array.isArray(pos))?pos:{};
  DB.incidents=Array.isArray(incidents)?incidents:(incidents?.items||[]);

  DB.customers=Array.isArray(customers)?customers:(customers?.items||[]);
  DB.cables=Array.isArray(cables?.cables)?cables.cables:(cables?.items||[]);
  DB.geofences=Array.isArray(fences)?fences:(fences?.items||[]);
  DB.maintenance=Array.isArray(maint)?maint:(maint?.items||[]);
}

async function loadProjectInsights(){
  const [summary, audit, health] = await Promise.all([
    api('GET', papi('/summary')),
    api('GET', papi('/audit?limit=25')),
    api('GET', papi('/topology-health')),
  ]);
  dashboardSummary = summary && typeof summary === 'object' ? summary : null;
  projectAudit = Array.isArray(audit) ? audit : (audit?.items || []);
  topologyHealth = health && typeof health === 'object' ? health : null;
}

let _sseSource=null;
function startSSEListener(){
  if(_sseSource) return;
  try{
    _sseSource=new EventSource('/api/events');
    _sseSource.onmessage=function(ev){
      try{
        const d=JSON.parse(ev.data);
        const evt=d.event;
        if(!evt||!currentProjectId) return;
        if(d.project_id&&d.project_id!==currentProjectId) return;
        if(evt.startsWith('element_')||evt.startsWith('connection_')){
          toast('📡 Dados atualizados — recarregando...','warn');
          loadAll().then(()=>{
            refreshAllMarkers();
            refreshAllCables();
            refreshAllFences();
            updateStats();renderSidebar();renderTable();
          });
        }
      }catch(e){}
    };
    _sseSource.onerror=function(){
      _sseSource.close();
      _sseSource=null;
      setTimeout(startSSEListener,10000);
    };
  }catch(e){}
}

function showProjectAlerts(){
  const broken = (DB.connections||[]).filter(c => c.broken).length;
  const openInc = (DB.incidents||[]).filter(i => i.status === 'open' || i.status === 'in_progress').length;
  const parts = [];
  if (broken) parts.push(`💔 ${broken} cabo(s) rompido(s)`);
  if (openInc) parts.push(`🚨 ${openInc} incidente(s) aberto(s)`);
  if (parts.length) toast('⚠️ Atenção: ' + parts.join(' · '), 'warn');
}

async function loadIxcConfig(){
  const cfg = await api('GET','/api/integrations/ixc/config');
  ixcConfig = cfg && typeof cfg === 'object' ? cfg : null;
}

function normalizeText(value){
  return String(value || '').toLowerCase();
}

function elementMatchesFilters(el){
  if(showOnlyUnpositioned && el.lat && el.lng) return false;
  if(!showOnlyUnpositioned){
    if(activeFilter && el.tipo !== activeFilter) return false;
    if(activeStatusFilter !== 'all' && el.status !== activeStatusFilter) return false;
  }
  if(!globalSearchTerm) return true;
  const haystack = [
    el.nome, el.tipo, el.status, el.modelo, el.endereco, el.detalhes, el.id
  ].map(normalizeText).join(' ');
  return haystack.includes(normalizeText(globalSearchTerm));
}

function handleGlobalSearch(value){
  showOnlyUnpositioned=false;
  globalSearchTerm = value || '';
  const topInput=document.getElementById('global-search-input');
  const sideInput=document.getElementById('sidebar-search');
  if(topInput && topInput.value !== value) topInput.value = value;
  if(sideInput && sideInput.value !== value) sideInput.value = value;
  applyVisibilityFilters();
  renderSidebar();
  renderTable();
  renderDashboard();
  renderCables();
  renderCustomers();
  renderIncidents();
}

function setStatusFilter(value){
  showOnlyUnpositioned=false;
  activeStatusFilter = value || 'all';
  applyVisibilityFilters();
  renderSidebar();
  renderTable();
  renderDashboard();
}

function applyVisibilityFilters(){
  if(nodesDS){
    DB.elements.forEach(el=>nodesDS.update({id:el.id, hidden:!elementMatchesFilters(el)}));
  }
  Object.entries(mapMarkers).forEach(([id, marker])=>{
    const el=DB.elements.find(item=>String(item.id)===String(id));
    if(!el || !marker?.setOpacity) return;
    marker.setOpacity(elementMatchesFilters(el)?1:0.18);
  });
}

function focusUnpositionedElements(){
  activeFilter=null;
  activeStatusFilter='all';
  showOnlyUnpositioned=true;
  switchTab('geomap');
  updateStats();renderSidebar();renderTable();
  const count=DB.elements.filter(e=>!(e.lat&&e.lng)).length;
  toast(`${count} elemento(s) sem coordenadas. Use o filtro da barra lateral para navegar.`,'success');
}

function goToOfflineElements(){
  showOnlyUnpositioned=false;
  activeFilter=null;
  setStatusFilter('offline');
  switchTab('geomap');
}

function goToSaturatedCTOs(){
  showOnlyUnpositioned=false;
  activeStatusFilter='all';
  setFilter('cto');
  switchTab('geomap');
}

async function fetchCsrfToken(){
  const meta = document.querySelector('meta[name="csrf-token"]');
  if(meta && meta.content){_csrfToken=meta.content;return;}
  try{
    const r=await fetch('/api/auth/csrf-token',{credentials:'same-origin'});
    const d=await r.json();
    if(d.csrf_token) _csrfToken=d.csrf_token;
  }catch(e){}
}

registerPublicApi('core', {
  api,
  apiUpload,
  papi,
  esc,
  loadAll,
  loadProjectInsights,
  showProjectAlerts,
  loadIxcConfig,
  normalizeText,
  elementMatchesFilters,
  handleGlobalSearch,
  setStatusFilter,
  applyVisibilityFilters,
  focusUnpositionedElements,
  goToOfflineElements,
  goToSaturatedCTOs,
  fetchCsrfToken,
});

// ═══════════════════════════════════════════════════════
