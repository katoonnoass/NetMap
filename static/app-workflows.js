// ═══════════════════════════════════════════════════════
function renderIncidents(){
  const q=(document.getElementById('incident-search')?.value||'').toLowerCase();
  const statusFilter=document.getElementById('incident-filter-status')?.value||'all';
  const severityFilter=document.getElementById('incident-filter-severity')?.value||'all';
  const rows=DB.incidents.filter(incident=>{
    const haystack=[incident.title,incident.status,incident.severity,incident.category,incident.assigned_to,incident.notes]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    const matchesSearch=!q || haystack.includes(q);
    const matchesStatus=statusFilter==='all' || incident.status===statusFilter;
    const matchesSeverity=severityFilter==='all' || incident.severity===severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });
  const visible=rows.slice(0,_incidentsShown);
  document.getElementById('incident-list').innerHTML = visible.length ? visible.map(incident=>{
    const element=DB.elements.find(el=>String(el.id)===String(incident.element_id));
    return `<div class="incident-card">
      <div class="list-title">${esc(incident.title)}</div>
      <div class="list-meta">${esc(incident.created_at || 'sem data')} ${incident.assigned_to ? `· ${esc(incident.assigned_to)}` : ''}</div>
      <div class="incident-meta">
        <span class="incident-badge status-${incident.status}">${esc(incident.status)}</span>
        <span class="incident-badge severity-${incident.severity}">${esc(incident.severity)}</span>
        <span class="incident-badge">${esc(incident.category || 'geral')}</span>
      </div>
      <div class="list-meta">${element ? `Elemento: ${esc(element.nome)}` : 'Sem elemento vinculado'}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${esc(incident.notes || 'Sem observações.')}</div>
      <div class="incident-actions">
        <button class="btn-ghost" onclick="openIncidentModal(${incident.id})">Editar</button>
        <button class="btn-warn" onclick="focusIncidentElement(${incident.element_id || 0})">Ir para elemento</button>
      </div>
    </div>`;
  }).join('') : '<div class="muted-empty">Nenhum incidente encontrado.</div>';
  if(rows.length>_incidentsShown){
    document.getElementById('incident-list').insertAdjacentHTML('beforeend',`<div style="text-align:center;margin-top:12px"><span style="font-size:10px;color:var(--text3)">Exibindo ${visible.length} de ${rows.length}</span><br><button class="btn-ghost" style="margin-top:6px" onclick="this.disabled=true;this.textContent='Carregando…';_incidentsShown+=${_PAGE_SIZE};renderIncidents()">Carregar mais (${rows.length-_incidentsShown} restantes)</button></div>`);
  }
}

function renderCustomers(){
  const q=(document.getElementById('customer-search')?.value||'').toLowerCase();
  const rows=DB.customers.filter(customer=>{
    const haystack=[customer.nome,customer.status,customer.endereco,customer.detalhes]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  const visible=rows.slice(0,_customersShown);
  document.getElementById('customer-list').innerHTML = visible.length ? visible.map(customer=>`
    <div class="customer-card">
      <div class="list-title">${esc(customer.nome)}</div>
      <div class="list-meta">${esc(customer.endereco || 'Sem endereço')} · status ${esc(customer.status)}</div>
      <div class="incident-meta">
        <span class="incident-badge">${customer.connected ? 'Conectado' : 'Sem rota'}</span>
        <span class="incident-badge">${customer.connection_count} conexões</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${esc(customer.detalhes || 'Sem detalhes adicionais.')}</div>
      <div class="card-actions">
        <button class="btn-ghost" onclick="openEditModal(${customer.id})">✏️ Editar</button>
        <button class="btn-ghost" style="color:var(--red)" onclick="deleteElement(${customer.id})">🗑️ Excluir</button>
        <button class="btn-ghost" onclick="focusNode(${customer.id})">Abrir</button>
        <button class="btn-primary" style="font-size:11px;padding:5px 12px" onclick="openTraceModal(${customer.id})">🔍 Caminho Óptico</button>
      </div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum cliente encontrado.</div>';
  if(rows.length>_customersShown){
    document.getElementById('customer-list').insertAdjacentHTML('beforeend',`<div style="text-align:center;margin-top:12px"><span style="font-size:10px;color:var(--text3)">Exibindo ${visible.length} de ${rows.length}</span><br><button class="btn-ghost" style="margin-top:6px" onclick="this.disabled=true;this.textContent='Carregando…';_customersShown+=${_PAGE_SIZE};renderCustomers()">Carregar mais (${rows.length-_customersShown} restantes)</button></div>`);
  }
}

function renderReports(){
  const summary = dashboardSummary || {top_cto_occupancy:[], type_counts:{}, totals:{open_incidents:0}};
  document.getElementById('reports-cto-table').innerHTML = (summary.top_cto_occupancy||[]).length ? `
    <table class="report-table">
      <thead><tr><th>CTO</th><th>Uso</th><th>Ocupação</th></tr></thead>
      <tbody>${summary.top_cto_occupancy.map(cto=>`<tr><td>${esc(cto.nome)}</td><td>${cto.used}/${cto.total}</td><td>${cto.occupancy}%</td></tr>`).join('')}</tbody>
    </table>` : '<div class="muted-empty">Sem dados de CTO.</div>';

  document.getElementById('reports-type-table').innerHTML = Object.keys(summary.type_counts||{}).length ? `
    <table class="report-table">
      <thead><tr><th>Tipo</th><th>Quantidade</th></tr></thead>
      <tbody>${Object.entries(summary.type_counts||{}).map(([type,count])=>`<tr><td>${esc(type)}</td><td>${count}</td></tr>`).join('')}</tbody>
    </table>` : '<div class="muted-empty">Sem dados por tipo.</div>';

  const openIncidents=DB.incidents.filter(item=>item.status!=='closed');
  document.getElementById('reports-open-incidents').innerHTML = openIncidents.length ? openIncidents.map(item=>`
    <div class="list-card">
      <div class="list-title">${esc(item.title)}</div>
      <div class="list-meta">${esc(item.severity)} · ${esc(item.status)} · ${esc(item.assigned_to || 'sem responsável')}</div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum incidente aberto.</div>';

  document.getElementById('reports-activity').innerHTML = projectAudit.length ? projectAudit.slice(0,6).map(event=>`
    <div class="list-card">
      <div class="list-title">${esc(event.message)}</div>
      <div class="list-meta">${esc(event.timestamp)} · ${esc(event.username)}</div>
    </div>
  `).join('') : '<div class="muted-empty">Sem atividade recente.</div>';
}

function populateIncidentElementOptions(selectedId=''){
  const select=document.getElementById('incident-element');
  select.innerHTML = ['<option value="">Sem vinculo</option>'].concat(
    DB.elements.map(el=>`<option value="${el.id}" ${String(selectedId)===String(el.id)?'selected':''}>#${el.id} · ${esc(el.nome)}</option>`)
  ).join('');
}

function openIncidentModal(id=null, prefillElementId=null){
  const incident = id ? DB.incidents.find(item=>String(item.id)===String(id)) : null;
  document.getElementById('incident-modal-title').textContent = incident ? 'Editar Incidente' : 'Novo Incidente';
  document.getElementById('incident-id').value = incident?.id || '';
  document.getElementById('incident-title').value = incident?.title || '';
  document.getElementById('incident-status').value = incident?.status || 'open';
  document.getElementById('incident-severity').value = incident?.severity || 'medium';
  document.getElementById('incident-category').value = incident?.category || 'rede';
  document.getElementById('incident-assigned').value = incident?.assigned_to || '';
  document.getElementById('incident-notes').value = incident?.notes || '';
  populateIncidentElementOptions(incident?.element_id || prefillElementId || '');
  document.getElementById('incident-delete-btn').style.display = incident ? '' : 'none';
  renderIncidentTimeline(incident);
  openModal('modal-incident');
}

function renderIncidentTimeline(incident){
  const section=document.getElementById('incident-timeline-section');
  const list=document.getElementById('incident-timeline-list');
  if(!incident){section.style.display='none';return;}
  const events=[];
  if(incident.created_at) events.push({time:incident.created_at,label:'Incidente criado',icon:'📝',color:'var(--text2)'});
  if(projectAudit && projectAudit.length){
    projectAudit.filter(ev=>ev.entity_type==='incident' && String(ev.entity_id)===String(incident.id)).forEach(ev=>{
      events.push({time:ev.timestamp||'—',label:ev.message||ev.action||'Atualização',icon:'🔧',color:'var(--accent)'});
    });
  }
  if(incident.status==='closed' && incident.updated_at) events.push({time:incident.updated_at,label:'Incidente fechado',icon:'✅',color:'var(--green)'});
  events.sort((a,b)=>String(a.time).localeCompare(String(b.time)));
  if(events.length){
    section.style.display='';
    list.innerHTML=events.map(ev=>`
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:11px">
        <span style="font-size:14px;flex-shrink:0">${ev.icon}</span>
        <div>
          <div style="font-weight:600;color:var(--text)">${esc(ev.label)}</div>
          <div style="color:var(--text3);font-size:10px;font-family:'Courier New',monospace">${esc(ev.time)}</div>
        </div>
      </div>
    `).join('');
  } else {
    section.style.display='none';
  }
  const commentsList=document.getElementById('incident-comments-list');
  if(commentsList){
    const comments=incident.comments||[];
    if(comments.length){
      commentsList.innerHTML=comments.map(c=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span style="font-size:10px;font-weight:700;color:var(--accent)">${esc(c.author||'')}</span>
          <span style="font-size:9px;color:var(--text3)">${esc(c.created_at||'')}</span>
        </div>
        <div style="font-size:11px;color:var(--text2)">${esc(c.text)}</div>
      </div>`).join('');
    } else {
      commentsList.innerHTML='<div style="font-size:10px;color:var(--text3)">Sem comentários</div>';
    }
  }
}

async function addIncidentComment(){
  const incId=document.getElementById('incident-id').value;
  const input=document.getElementById('incident-comment-input');
  if(!incId||!input) return;
  const text=input.value.trim();
  if(!text){toast('⚠️ Comentário vazio','error');return;}
  const res=await api('POST',papi(`/incidents/${incId}/comments`),{text});
  if(!res) return;
  input.value='';
  const incident=DB.incidents.find(i=>String(i.id)===String(incId));
  if(incident){
    if(!incident.comments) incident.comments=[];
    incident.comments.push(res);
    renderIncidentTimeline(incident);
  }
  toast('💬 Comentário adicionado!','success');
}

async function saveIncident(){
  const id=document.getElementById('incident-id').value;
  const payload={
    title: document.getElementById('incident-title').value.trim(),
    status: document.getElementById('incident-status').value,
    severity: document.getElementById('incident-severity').value,
    category: document.getElementById('incident-category').value.trim(),
    assigned_to: document.getElementById('incident-assigned').value.trim(),
    element_id: document.getElementById('incident-element').value || null,
    notes: document.getElementById('incident-notes').value.trim(),
  };
  if(!payload.title){toast('Informe o título do incidente','error');return;}
  const method=id?'PUT':'POST';
  const path=id?papi(`/incidents/${id}`):papi('/incidents');
  const res=await api(method,path,payload);
  if(!res) return;
  closeModal('modal-incident');
  await loadAll();
  await loadProjectInsights();
  updateStats();renderIncidents();renderReports();renderDashboard();
  toast('Incidente salvo','success');
}

async function deleteIncidentUI(){
  const id=document.getElementById('incident-id').value;
  if(!id || !confirm('Excluir este incidente?')) return;
  const res=await api('DELETE',papi(`/incidents/${id}`));
  if(!res) return;
  closeModal('modal-incident');
  await loadAll();
  await loadProjectInsights();
  updateStats();renderIncidents();renderReports();renderDashboard();
  toast('Incidente removido','success');
}

function focusIncidentElement(id){
  if(!id) return;
  focusNode(Number(id));
}

function switchTab(tab){
  if(window.matchMedia('(max-width: 768px)').matches){
    document.getElementById('sidebar')?.classList.add('collapsed');
  }
  // Update URL hash for routing
  const route = ROUTES[tab];
  if(route && window.location.hash !== '#'+route.path){
    window.location.hash = route.path;
  }
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.view-tab').forEach(v=>v.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.getElementById(`view-${tab}`)?.classList.add('active');
  if(tab==='dashboard') renderDashboard();
  if(tab==='geomap') scheduleMapRender();
  if(tab==='topology'&&!network) initTopology();
  if(tab==='topology'&&network) scheduleMapRender();
  if(tab==='dio') renderDioPanels();
  if(tab==='table') renderTable();
  if(tab==='cables') renderCables();
  if(tab==='validation') renderValidation();
  if(tab==='customers') renderCustomers();
  if(tab==='incidents') renderIncidents();
  if(tab==='reports') renderReports();
  if(tab==='ixc') renderIxcSettings();
  if(tab==='audit') loadGlobalAudit();
}

// ═══════════════════════════════════════════════════════
// CTX MENU
// ═══════════════════════════════════════════════════════
function showCtxMenu(x, y) {
  const m = document.getElementById('ctx-menu');
  m.style.left = x + 'px';
  m.style.top = y + 'px';
  m.style.pointerEvents = '';
  m.style.opacity = '1';
  const isCable = (ctxTargetType === 'cable');
  if (!isCable && ctxTargetId) {
    const el = DB.elements.find(e => e.id === ctxTargetId);
    const showFusion = el?.tipo === 'ceo' || el?.tipo === 'cto';
    document.getElementById('ctx-fusion').style.display = showFusion ? 'flex' : 'none';
    const showCtoPorts = el?.tipo === 'cto';
    document.getElementById('ctx-cto-ports').style.display = showCtoPorts ? 'flex' : 'none';
  } else {
    document.getElementById('ctx-fusion').style.display = 'none';
    document.getElementById('ctx-cto-ports').style.display = 'none';
  }
  document.getElementById('ctx-toggle-broken').style.display = isCable ? 'flex' : 'none';
  const items = m.querySelectorAll('.ctx-item[style*="display: flex"],.ctx-item[style*="display:flex"],.ctx-item:not([style*="display"])');
  items.forEach(i => i.setAttribute('tabindex', '-1'));
  const visible = Array.from(items).filter(i => i.offsetHeight > 0);
  if (visible.length) {
    visible.forEach(i => i.setAttribute('tabindex', '-1'));
    visible[0].setAttribute('tabindex', '0');
    visible[0].focus();
  }
}
function _ctxKeyDown(e) {
  const m = document.getElementById('ctx-menu');
  if (!m || m.style.opacity === '0') return;
  const items = Array.from(m.querySelectorAll('.ctx-item')).filter(i => i.offsetHeight > 0);
  const idx = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    const next = items[(idx + 1) % items.length];
    if (next) { items.forEach(i => i.setAttribute('tabindex', '-1')); next.setAttribute('tabindex', '0'); next.focus(); }
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = items[(idx - 1 + items.length) % items.length];
    if (prev) { items.forEach(i => i.setAttribute('tabindex', '-1')); prev.setAttribute('tabindex', '0'); prev.focus(); }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.activeElement.click();
  }
}

function ctxToggleBroken() {
  if (ctxTargetType === 'cable' && ctxTargetId) {
    toggleCableBroken(ctxTargetId);
  }
  hideCtxMenu();
}
function hideCtxMenu(){const m=document.getElementById('ctx-menu');m.style.opacity='0';m.style.pointerEvents='none';}
document.addEventListener('click',hideCtxMenu);
function ctxEdit(){if(ctxTargetId)openEditModal(ctxTargetId);hideCtxMenu();}
function ctxCable(){if(ctxTargetId)beginCableFrom(ctxTargetId);hideCtxMenu();}
function ctxFusion(){if(ctxTargetId)openFusionMap(ctxTargetId);hideCtxMenu();}
function ctxReposition(){if(ctxTargetId)startRepositionMode(ctxTargetId);hideCtxMenu();}
function ctxLocate(){
  if(!ctxTargetId) return;
  const el=DB.elements.find(e=>e.id===ctxTargetId);
  if(el?.lat&&el?.lng){switchTab('geomap');geoMap.setView([el.lat,el.lng],16,{animate:true});}
  else toast('⚠️ Elemento sem coordenadas','error');
  hideCtxMenu();
}
async function ctxStatus(status){
  if(!ctxTargetId) return;
  const el=DB.elements.find(e=>e.id===ctxTargetId);
  if(el){
    el.status=status;
    await api('PUT',papi(`/elements/${el.id}`),el);
    addOrUpdateMarker(el);
    if(nodesDS){const sc=status==='offline'?'#ff3d57':status==='alerta'?'#ff9100':TYPE_CONFIG[el.tipo]?.color||'#888';nodesDS.update({id:el.id,color:{background:sc+'22',border:sc}});}
    if(selectedNodeId===el.id) showPanel(el.id);
    updateStats();renderSidebar();
  }
  hideCtxMenu();toast(`Status: ${status}`,'success');
}
async function ctxDelete(){
  if(!ctxTargetId||!confirm('Remover elemento?')) return;
  await deleteElement(ctxTargetId);
  hideCtxMenu();
}
function ctxCreateIncident(){
  if(!ctxTargetId) return;
  hideCtxMenu();
  openIncidentModal(null, ctxTargetId);
}
async function ctxDuplicate(){
  if(!ctxTargetId) return;
  hideCtxMenu();
  const el=await api('POST',papi(`/elements/${ctxTargetId}/duplicate`));
  DB.elements.push(el);
  addOrUpdateMarker(el);
  if(nodesDS){const tc=TYPE_CONFIG[el.tipo]||{};nodesDS.add({id:el.id,label:el.nome,color:{background:(tc.color||'#888')+'22',border:tc.color||'#888'},shape:'dot',size:18});}
  updateStats();renderSidebar();renderTable();
  toast(`📋 "${el.nome}" copiado!`,'success');
}

registerPublicApi('workflows', {
  renderIncidents,
  renderCustomers,
  renderReports,
  populateIncidentElementOptions,
  openIncidentModal,
  renderIncidentTimeline,
  addIncidentComment,
  saveIncident,
  deleteIncidentUI,
  focusIncidentElement,
  switchTab,
  showCtxMenu,
  ctxToggleBroken,
  hideCtxMenu,
  ctxEdit,
  ctxCable,
  ctxFusion,
  ctxReposition,
  ctxLocate,
  ctxStatus,
  ctxDelete,
  ctxCreateIncident,
  ctxDuplicate,
  loadMaintenanceList,
  renderMaintenanceList,
  openMaintenanceModal,
  saveMaintenance,
  deleteMaintenance,
}, [
  'deleteIncidentUI',
  'openIncidentModal',
  'renderIncidentTimeline',
  'addIncidentComment',
  'switchTab',
  'ctxCable',
  'ctxDelete',
  'ctxDuplicate',
  'ctxEdit',
  'ctxFusion',
  'ctxLocate',
  'ctxReposition',
  'ctxStatus',
  'ctxToggleBroken',
]);

async function loadMaintenanceList(){
  const data=await api('GET',papi('/maintenance'));
  if(!data) return;
  DB.maintenance=Array.isArray(data.items)?data.items:[];
  renderMaintenanceList();
}

function renderMaintenanceList(){
  const list=document.getElementById('maintenance-list');
  if(!list) return;
  const schedules=DB.maintenance||[];
  if(!schedules.length){list.innerHTML='<div style="font-size:11px;color:var(--text3);text-align:center;padding:12px">Nenhuma manutenção agendada.</div>';return;}
  const statusColors={agendada:'var(--blue)',em_andamento:'var(--orange)',concluida:'var(--green)',cancelada:'var(--text3)'};
  const priorityLabels={normal:'Normal',alta:'Alta',urgente:'Urgente'};
  const typeLabels={preventiva:'Preventiva',corretiva:'Corretiva',emergencia:'Emergência',expansao:'Expansão'};
  list.innerHTML=schedules.map(s=>{
    const sc=statusColors[s.status]||'var(--text3)';
    const elName=s.element_id?DB.elements.find(e=>e.id===s.element_id)?.nome||'#'+s.element_id:'';
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text1)">${esc(s.title)}</div>
        <div style="font-size:10px;color:var(--text3)">${esc(typeLabels[s.type]||s.type||'')} · ${esc(s.scheduled_date||'Sem data')}${elName?' · '+esc(elName):''} ${s.assigned_to?'· '+esc(s.assigned_to):''}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span style="font-size:10px;font-weight:600;color:${sc}">${esc(s.status||'')}</span>
        <button class="btn-ghost" style="padding:2px 6px;font-size:10px" onclick="openMaintenanceModal(${s.id})">✏️</button>
        <button class="btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteMaintenance(${s.id})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function openMaintenanceModal(editId){
  const sel=document.getElementById('maint-element');
  if(sel){
    sel.innerHTML='<option value="">Nenhum</option>'+
      DB.elements.map(e=>`<option value="${e.id}">${esc(e.nome)} (${esc(e.tipo)})</option>`).join('');
  }
  if(editId){
    const s=(DB.maintenance||[]).find(m=>m.id===editId);
    if(!s) return;
    document.getElementById('maint-id').value=s.id;
    document.getElementById('maint-title').value=s.title||'';
    document.getElementById('maint-type').value=s.type||'preventiva';
    document.getElementById('maint-priority').value=s.priority||'normal';
    document.getElementById('maint-date').value=s.scheduled_date||'';
    document.getElementById('maint-assigned').value=s.assigned_to||'';
    document.getElementById('maint-element').value=s.element_id||'';
    document.getElementById('maint-status').value=s.status||'agendada';
    document.getElementById('maint-description').value=s.description||'';
    document.getElementById('maintenance-modal-title').textContent='🗓️ Editar Manutenção';
  } else {
    document.getElementById('maint-id').value='';
    document.getElementById('maint-title').value='';
    document.getElementById('maint-type').value='preventiva';
    document.getElementById('maint-priority').value='normal';
    document.getElementById('maint-date').value='';
    document.getElementById('maint-assigned').value='';
    document.getElementById('maint-element').value='';
    document.getElementById('maint-status').value='agendada';
    document.getElementById('maint-description').value='';
    document.getElementById('maintenance-modal-title').textContent='🗓️ Agendar Manutenção';
  }
  openModal('modal-maintenance');
}

async function saveMaintenance(){
  const id=document.getElementById('maint-id').value;
  const payload={
    title:document.getElementById('maint-title').value.trim(),
    type:document.getElementById('maint-type').value,
    priority:document.getElementById('maint-priority').value,
    scheduled_date:document.getElementById('maint-date').value,
    assigned_to:document.getElementById('maint-assigned').value.trim(),
    element_id:document.getElementById('maint-element').value?parseInt(document.getElementById('maint-element').value):null,
    status:document.getElementById('maint-status').value,
    description:document.getElementById('maint-description').value.trim(),
  };
  if(!payload.title){toast('⚠️ Título obrigatório','error');return;}
  let saved;
  if(id){
    saved=await api('PUT',papi(`/maintenance/${id}`),payload);
  } else {
    saved=await api('POST',papi('/maintenance'),payload);
  }
  if(!saved) return;
  await loadMaintenanceList();
  closeModal('modal-maintenance');
  toast('🗓️ Manutenção salva!','success');
}

async function deleteMaintenance(id){
  if(!confirm('Remover este agendamento?')) return;
  await api('DELETE',papi(`/maintenance/${id}`));
  await loadMaintenanceList();
  toast('🗓️ Manutenção removida','success');
}

// ═══════════════════════════════════════════════════════
// EXPORT
