// API
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function api(method,path,body){
  const opts={method,headers:{'Content-Type':'application/json'}};
  if(body) opts.body=JSON.stringify(body);
  try{
    const r=await fetch(path,opts);
    if(r.status===401){window.location.href='/login';return null;}
    if(r.status===403){const e=await r.json().catch(()=>({error:'Sem permissÃ£o'}));toast('ðŸ”’ '+e.error,'error');return null;}
    if(!r.ok){const e=await r.json().catch(()=>({error:`HTTP ${r.status}`}));toast('âŒ '+e.error,'error');return null;}
    return r.json();
  }catch(e){toast('âŒ Erro de conexÃ£o','error');return null;}
}
const papi=path=>`/api/projects/${currentProjectId}${path}`;

async function loadAll(){
  const [els,conns,dios,pos,incidents,serviceOrders,customers,cables]=await Promise.all([
    api('GET',papi('/elements')),api('GET',papi('/connections')),
    api('GET',papi('/dios')),api('GET',papi('/positions')),
    api('GET',papi('/incidents')),
    api('GET',papi('/service-orders')),
    api('GET',papi('/customers')),
    api('GET',papi('/cables')),
  ]);
  DB.elements=Array.isArray(els)?els:[];
  DB.connections=Array.isArray(conns)?conns:[];
  DB.dios=Array.isArray(dios)?dios:[];
  DB.positions=(pos&&typeof pos==='object'&&!Array.isArray(pos))?pos:{};
  DB.incidents=Array.isArray(incidents)?incidents:[];
  DB.service_orders=Array.isArray(serviceOrders)?serviceOrders:[];
  DB.customers=Array.isArray(customers)?customers:[];
  DB.cables=Array.isArray(cables?.cables)?cables.cables:[];
}

async function loadProjectInsights(){
  const [summary, audit, health] = await Promise.all([
    api('GET', papi('/summary')),
    api('GET', papi('/audit?limit=25')),
    api('GET', papi('/topology-health')),
  ]);
  dashboardSummary = summary && typeof summary === 'object' ? summary : null;
  projectAudit = Array.isArray(audit) ? audit : [];
  topologyHealth = health && typeof health === 'object' ? health : null;
}

async function loadIxcConfig(){
  const cfg = await api('GET','/api/integrations/ixc/config');
  ixcConfig = cfg && typeof cfg === 'object' ? cfg : null;
}

function normalizeText(value){
  return String(value || '').toLowerCase();
}

function elementMatchesFilters(el){
  if(activeFilter && el.tipo !== activeFilter) return false;
  if(activeStatusFilter !== 'all' && el.status !== activeStatusFilter) return false;
  if(!globalSearchTerm) return true;
  const haystack = [
    el.nome, el.tipo, el.status, el.modelo, el.endereco, el.detalhes, el.id
  ].map(normalizeText).join(' ');
  return haystack.includes(normalizeText(globalSearchTerm));
}

function handleGlobalSearch(value){
  globalSearchTerm = value || '';
  const topInput=document.getElementById('global-search-input');
  const sideInput=document.getElementById('sidebar-search');
  if(topInput && topInput.value !== value) topInput.value = value;
  if(sideInput && sideInput.value !== value) sideInput.value = value;
  applyVisibilityFilters();
  renderSidebar();
  renderTable();
  renderDashboard();
}

function setStatusFilter(value){
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

registerPublicApi('core', {
  api,
  papi,
  loadAll,
  loadProjectInsights,
  loadIxcConfig,
  normalizeText,
  elementMatchesFilters,
  handleGlobalSearch,
  setStatusFilter,
  applyVisibilityFilters,
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
