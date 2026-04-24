// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderIncidents(){
  const q=(document.getElementById('incident-search')?.value||'').toLowerCase();
  const rows=DB.incidents.filter(incident=>{
    const haystack=[incident.title,incident.status,incident.severity,incident.category,incident.assigned_to,incident.notes]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  document.getElementById('incident-list').innerHTML = rows.length ? rows.map(incident=>{
    const element=DB.elements.find(el=>String(el.id)===String(incident.element_id));
    return `<div class="incident-card">
      <div class="list-title">${incident.title}</div>
      <div class="list-meta">${incident.created_at || 'sem data'} ${incident.assigned_to ? `Â· ${incident.assigned_to}` : ''}</div>
      <div class="incident-meta">
        <span class="incident-badge status-${incident.status}">${incident.status}</span>
        <span class="incident-badge severity-${incident.severity}">${incident.severity}</span>
        <span class="incident-badge">${incident.category || 'geral'}</span>
      </div>
      <div class="list-meta">${element ? `Elemento: ${element.nome}` : 'Sem elemento vinculado'}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${incident.notes || 'Sem observacoes.'}</div>
      <div class="incident-actions">
        <button class="btn-ghost" onclick="openIncidentModal(${incident.id})">Editar</button>
        <button class="btn-warn" onclick="focusIncidentElement(${incident.element_id || 0})">Ir para elemento</button>
      </div>
    </div>`;
  }).join('') : '<div class="muted-empty">Nenhum incidente encontrado.</div>';
}

function renderCustomers(){
  const q=(document.getElementById('customer-search')?.value||'').toLowerCase();
  const rows=DB.customers.filter(customer=>{
    const haystack=[customer.nome,customer.status,customer.endereco,customer.detalhes]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  document.getElementById('customer-list').innerHTML = rows.length ? rows.map(customer=>`
    <div class="customer-card">
      <div class="list-title">${customer.nome}</div>
      <div class="list-meta">${customer.endereco || 'Sem endereco'} Â· status ${customer.status}</div>
      <div class="incident-meta">
        <span class="incident-badge">${customer.connected ? 'Conectado' : 'Sem rota'}</span>
        <span class="incident-badge">${customer.connection_count} conexoes</span>
        <span class="incident-badge">${customer.open_orders} OS abertas</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${customer.detalhes || 'Sem detalhes adicionais.'}</div>
      <div class="card-actions">
        <button class="btn-ghost" onclick="focusNode(${customer.id})">Abrir</button>
        <button class="btn-ghost" onclick="openTraceModal(${customer.id})">Rota</button>
        <button class="btn-primary" onclick="openOrderModal(null, ${customer.id})">Nova OS</button>
      </div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum cliente encontrado.</div>';
}

function renderOrders(){
  const q=(document.getElementById('order-search')?.value||'').toLowerCase();
  const rows=DB.service_orders.filter(order=>{
    const haystack=[order.title,order.status,order.priority,order.assigned_to,order.notes]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  document.getElementById('order-list').innerHTML = rows.length ? rows.map(order=>{
    const customer = DB.customers.find(item=>String(item.id)===String(order.customer_id));
    const element = DB.elements.find(item=>String(item.id)===String(order.element_id));
    return `<div class="order-card">
      <div class="list-title">${order.title}</div>
      <div class="list-meta">${order.created_at || 'sem data'} ${order.scheduled_for ? `Â· agenda ${order.scheduled_for}` : ''}</div>
      <div class="incident-meta">
        <span class="incident-badge status-${order.status}">${order.status}</span>
        <span class="incident-badge severity-${order.priority}">${order.priority}</span>
        <span class="incident-badge">${order.assigned_to || 'sem responsÃ¡vel'}</span>
      </div>
      <div class="list-meta">${customer ? `Cliente: ${customer.nome}` : 'Sem cliente'} ${element ? `Â· Elemento: ${element.nome}` : ''}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${order.notes || 'Sem observacoes.'}</div>
      <div class="card-actions">
        <button class="btn-ghost" onclick="openOrderModal(${order.id})">Editar</button>
        ${order.element_id ? `<button class="btn-warn" onclick="focusNode(${order.element_id})">Ir para elemento</button>` : ''}
      </div>
    </div>`;
  }).join('') : '<div class="muted-empty">Nenhuma ordem encontrada.</div>';
}

function populateOrderOptions(customerId='', elementId='', incidentId=''){
  const customerSelect=document.getElementById('order-customer');
  const elementSelect=document.getElementById('order-element');
  const incidentSelect=document.getElementById('order-incident');
  customerSelect.innerHTML=['<option value="">Sem cliente</option>'].concat(
    DB.customers.map(item=>`<option value="${item.id}" ${String(customerId)===String(item.id)?'selected':''}>#${item.id} Â· ${item.nome}</option>`)
  ).join('');
  elementSelect.innerHTML=['<option value="">Sem elemento</option>'].concat(
    DB.elements.map(item=>`<option value="${item.id}" ${String(elementId)===String(item.id)?'selected':''}>#${item.id} Â· ${item.nome}</option>`)
  ).join('');
  incidentSelect.innerHTML=['<option value="">Sem incidente</option>'].concat(
    DB.incidents.map(item=>`<option value="${item.id}" ${String(incidentId)===String(item.id)?'selected':''}>#${item.id} Â· ${item.title}</option>`)
  ).join('');
}

function openOrderModal(id=null, presetCustomerId=''){
  const order = id ? DB.service_orders.find(item=>String(item.id)===String(id)) : null;
  document.getElementById('order-modal-title').textContent = order ? 'Editar Ordem de Servico' : 'Nova Ordem de Servico';
  document.getElementById('order-id').value = order?.id || '';
  document.getElementById('order-title').value = order?.title || '';
  document.getElementById('order-status').value = order?.status || 'open';
  document.getElementById('order-priority').value = order?.priority || 'medium';
  document.getElementById('order-assigned').value = order?.assigned_to || '';
  document.getElementById('order-scheduled').value = order?.scheduled_for || '';
  document.getElementById('order-notes').value = order?.notes || '';
  populateOrderOptions(order?.customer_id || presetCustomerId, order?.element_id || '', order?.incident_id || '');
  document.getElementById('order-delete-btn').style.display = order ? '' : 'none';
  openModal('modal-order');
}

async function saveOrder(){
  const id=document.getElementById('order-id').value;
  const payload={
    title: document.getElementById('order-title').value.trim(),
    status: document.getElementById('order-status').value,
    priority: document.getElementById('order-priority').value,
    assigned_to: document.getElementById('order-assigned').value.trim(),
    scheduled_for: document.getElementById('order-scheduled').value.trim(),
    customer_id: document.getElementById('order-customer').value || null,
    element_id: document.getElementById('order-element').value || null,
    incident_id: document.getElementById('order-incident').value || null,
    notes: document.getElementById('order-notes').value.trim(),
  };
  if(!payload.title){toast('Informe o titulo da OS','error');return;}
  const method=id?'PUT':'POST';
  const path=id?papi(`/service-orders/${id}`):papi('/service-orders');
  const res=await api(method,path,payload);
  if(!res) return;
  closeModal('modal-order');
  await loadAll();
  await loadProjectInsights();
  updateStats();renderCustomers();renderOrders();renderReports();renderDashboard();
  toast('Ordem de servico salva','success');
}

async function deleteOrderUI(){
  const id=document.getElementById('order-id').value;
  if(!id || !confirm('Excluir esta ordem de servico?')) return;
  const res=await api('DELETE',papi(`/service-orders/${id}`));
  if(!res) return;
  closeModal('modal-order');
  await loadAll();
  await loadProjectInsights();
  updateStats();renderCustomers();renderOrders();renderReports();renderDashboard();
  toast('Ordem de servico removida','success');
}

function renderReports(){
  const summary = dashboardSummary || {top_cto_occupancy:[], type_counts:{}, totals:{open_incidents:0}};
  document.getElementById('reports-cto-table').innerHTML = (summary.top_cto_occupancy||[]).length ? `
    <table class="report-table">
      <thead><tr><th>CTO</th><th>Uso</th><th>Ocupacao</th></tr></thead>
      <tbody>${summary.top_cto_occupancy.map(cto=>`<tr><td>${cto.nome}</td><td>${cto.used}/${cto.total}</td><td>${cto.occupancy}%</td></tr>`).join('')}</tbody>
    </table>` : '<div class="muted-empty">Sem dados de CTO.</div>';

  document.getElementById('reports-type-table').innerHTML = Object.keys(summary.type_counts||{}).length ? `
    <table class="report-table">
      <thead><tr><th>Tipo</th><th>Quantidade</th></tr></thead>
      <tbody>${Object.entries(summary.type_counts||{}).map(([type,count])=>`<tr><td>${type}</td><td>${count}</td></tr>`).join('')}</tbody>
    </table>` : '<div class="muted-empty">Sem dados por tipo.</div>';

  const openIncidents=DB.incidents.filter(item=>item.status!=='closed');
  document.getElementById('reports-open-incidents').innerHTML = openIncidents.length ? openIncidents.map(item=>`
    <div class="list-card">
      <div class="list-title">${item.title}</div>
      <div class="list-meta">${item.severity} Â· ${item.status} Â· ${item.assigned_to || 'sem responsavel'}</div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum incidente aberto.</div>';

  document.getElementById('reports-activity').innerHTML = projectAudit.length ? projectAudit.slice(0,6).map(event=>`
    <div class="list-card">
      <div class="list-title">${event.message}</div>
      <div class="list-meta">${event.timestamp} Â· ${event.username}</div>
    </div>
  `).join('') : '<div class="muted-empty">Sem atividade recente.</div>';
}

function populateIncidentElementOptions(selectedId=''){
  const select=document.getElementById('incident-element');
  select.innerHTML = ['<option value="">Sem vinculo</option>'].concat(
    DB.elements.map(el=>`<option value="${el.id}" ${String(selectedId)===String(el.id)?'selected':''}>#${el.id} Â· ${el.nome}</option>`)
  ).join('');
}

function openIncidentModal(id=null){
  const incident = id ? DB.incidents.find(item=>String(item.id)===String(id)) : null;
  document.getElementById('incident-modal-title').textContent = incident ? 'Editar Incidente' : 'Novo Incidente';
  document.getElementById('incident-id').value = incident?.id || '';
  document.getElementById('incident-title').value = incident?.title || '';
  document.getElementById('incident-status').value = incident?.status || 'open';
  document.getElementById('incident-severity').value = incident?.severity || 'medium';
  document.getElementById('incident-category').value = incident?.category || 'rede';
  document.getElementById('incident-assigned').value = incident?.assigned_to || '';
  document.getElementById('incident-notes').value = incident?.notes || '';
  populateIncidentElementOptions(incident?.element_id || '');
  document.getElementById('incident-delete-btn').style.display = incident ? '' : 'none';
  openModal('modal-incident');
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
  if(!payload.title){toast('Informe o titulo do incidente','error');return;}
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
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.view-tab').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.module-chip').forEach(chip=>chip.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.getElementById(`view-${tab}`)?.classList.add('active');
  const moduleMap = {
    dashboard: 'module-overview',
    geomap: 'module-overview',
    topology: 'module-overview',
    dio: 'module-overview',
    table: 'module-overview',
    cables: 'module-cabos',
    customers: 'module-clientes',
    incidents: 'module-incidentes',
    orders: 'module-os',
    reports: 'module-relatorios',
    validation: 'module-overview',
    ixc: 'module-ixc',
  };
  document.getElementById(moduleMap[tab] || 'module-overview')?.classList.add('active');
  if(tab==='dashboard') renderDashboard();
  if(tab==='geomap'){setTimeout(()=>geoMap?.invalidateSize(),50);}
  if(tab==='topology'&&!network) initTopology();
  if(tab==='topology'&&network) setTimeout(()=>network.redraw(),50);
  if(tab==='dio') renderDioPanels();
  if(tab==='table') renderTable();
  if(tab==='cables') renderCables();
  if(tab==='validation') renderValidation();
  if(tab==='customers') renderCustomers();
  if(tab==='incidents') renderIncidents();
  if(tab==='orders') renderOrders();
  if(tab==='reports') renderReports();
  if(tab==='ixc') renderIxcSettings();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CTX MENU
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function showCtxMenu(x, y) {
  const m = document.getElementById('ctx-menu');
  m.style.display = 'block';
  m.style.left = x + 'px';
  m.style.top = y + 'px';

  // Mostrar opÃ§Ãµes baseadas no tipo do alvo (elemento ou cabo)
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

  // OpÃ§Ã£o de romper/reparar cabo
  document.getElementById('ctx-toggle-broken').style.display = isCable ? 'flex' : 'none';
}

function ctxToggleBroken() {
  if (ctxTargetType === 'cable' && ctxTargetId) {
    toggleCableBroken(ctxTargetId);
  }
  hideCtxMenu();
}
function hideCtxMenu(){document.getElementById('ctx-menu').style.display='none';}
document.addEventListener('click',hideCtxMenu);
function ctxEdit(){if(ctxTargetId)openEditModal(ctxTargetId);hideCtxMenu();}
function ctxCable(){if(ctxTargetId)beginCableFrom(ctxTargetId);hideCtxMenu();}
function ctxFusion(){if(ctxTargetId)openFusionMap(ctxTargetId);hideCtxMenu();}
function ctxReposition(){if(ctxTargetId)startRepositionMode(ctxTargetId);hideCtxMenu();}
function ctxLocate(){
  if(!ctxTargetId) return;
  const el=DB.elements.find(e=>e.id===ctxTargetId);
  if(el?.lat&&el?.lng){switchTab('geomap');geoMap.setView([el.lat,el.lng],16,{animate:true});}
  else toast('âš ï¸ Elemento sem coordenadas','error');
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

registerPublicApi('workflows', {
  renderIncidents,
  renderCustomers,
  renderOrders,
  populateOrderOptions,
  openOrderModal,
  saveOrder,
  deleteOrderUI,
  renderReports,
  populateIncidentElementOptions,
  openIncidentModal,
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
}, [
  'deleteIncidentUI',
  'deleteOrderUI',
  'openIncidentModal',
  'openOrderModal',
  'switchTab',
  'ctxCable',
  'ctxDelete',
  'ctxEdit',
  'ctxFusion',
  'ctxLocate',
  'ctxReposition',
  'ctxStatus',
  'ctxToggleBroken',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORT
