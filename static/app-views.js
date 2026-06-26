// TABLE
// ═══════════════════════════════════════════════════════
let selectedIds = new Set();

function renderTable(){
  const q=document.getElementById('table-search').value.toLowerCase();
  const rows=DB.elements.filter(e=>elementMatchesFilters(e) && (!q||e.nome.toLowerCase().includes(q)||e.tipo.includes(q)||String(e.id).includes(q)));
  const visible=rows.slice(0,_tableShown);
  document.getElementById('inv-tbody').innerHTML=visible.map(el=>{
    const tc=TYPE_CONFIG[el.tipo]||{};
    const sc=el.status==='ativo'?'var(--green)':el.status==='offline'?'var(--red)':'var(--orange)';
    const hasCords=el.lat&&el.lng;
    const checked=selectedIds.has(el.id)?'checked':'';
    return `<tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
      <td style="padding:9px 8px"><input type="checkbox" ${checked} onchange="toggleRowSelection(${el.id},this.checked)" style="cursor:pointer" aria-label="Selecionar elemento ${el.id}"></td>
      <td style="padding:9px 14px;font-family:'Courier New',monospace;color:var(--text3);font-size:10px">#${el.id}</td>
      <td style="padding:9px 14px;font-weight:600;font-size:12px"><span style="color:${tc.color}">${ICONS[el.tipo]||''}</span> ${esc(el.nome)}</td>
      <td style="padding:9px 14px"><span style="background:${tc.color}22;color:${tc.color};padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700">${esc(tc.label||el.tipo)}</span></td>
      <td style="padding:9px 14px;color:${sc};font-size:11px;font-weight:700">● ${esc(el.status)}</td>
      <td style="padding:9px 14px;font-family:'Courier New',monospace;font-size:10px;color:var(--text3)">${hasCords?el.lat?.toFixed(4)+', '+el.lng?.toFixed(4):'—'}</td>
      <td style="padding:9px 14px;display:flex;gap:5px">
        <button class="btn-ghost" title="Editar ${esc(el.nome)}" style="padding:3px 9px;font-size:10px" onclick="openEditModal(${el.id})">✏️</button>
        <button class="btn-ghost" title="Centralizar no mapa" style="padding:3px 9px;font-size:10px" onclick="focusNode(${el.id})">🎯</button>
        ${!hasCords?`<button class="btn-warn" title="Posicionar no mapa" style="padding:3px 9px;font-size:10px" onclick="startPlaceMode(${el.id})">📍</button>`:''}
      </td>
    </tr>`;
  }).join('');
  const pager=document.getElementById('table-pager');
  if(pager){
    if(rows.length>_tableShown){
      pager.style.display='block';
      pager.innerHTML=`<span style="font-size:10px;color:var(--text3)">Exibindo ${visible.length} de ${rows.length}</span> <button class="btn-ghost" style="font-size:11px;padding:4px 10px;margin-left:8px" onclick="this.disabled=true;this.textContent='Carregando…';_tableShown+=50;renderTable()">Carregar mais</button>`;
    } else {
      pager.style.display='none';
    }
  }
  _updateBulkBar();
}
function filterTable(){renderTable();}
function toggleRowSelection(id,checked){ checked?selectedIds.add(id):selectedIds.delete(id); _updateBulkBar(); }
function toggleSelectAll(checked){
  const q=document.getElementById('table-search').value.toLowerCase();
  const rows=DB.elements.filter(e=>elementMatchesFilters(e) && (!q||e.nome.toLowerCase().includes(q)||e.tipo.includes(q)||String(e.id).includes(q)));
  rows.forEach(el=>checked?selectedIds.add(el.id):selectedIds.delete(el.id));
  renderTable();
}
function clearBulkSelection(){ selectedIds.clear(); renderTable(); }
function _updateBulkBar(){
  const bar=document.getElementById('bulk-bar');
  document.getElementById('bulk-count').textContent=`${selectedIds.size} selecionados`;
  bar.style.display=selectedIds.size>0?'flex':'none';
}
async function bulkChangeStatus(){
  const status=document.getElementById('bulk-status').value;
  if(!status||!selectedIds.size) return;
  const res=await api('POST',papi('/elements/bulk-update'),{ids:[...selectedIds],changes:{status}});
  if(!res) return;
  toast(`✅ ${res.updated} elementos atualizados`,'success');
  selectedIds.clear();
  await loadAll();
  renderTable();
  renderSidebar();
}
async function bulkDeleteElements(){
  if(!selectedIds.size||!confirm(`Excluir ${selectedIds.size} elemento(s)? Esta ação não pode ser desfeita.`)) return;
  const res=await api('POST',papi('/elements/bulk-delete'),{ids:[...selectedIds]});
  if(!res) return;
  toast(`🗑️ ${res.deleted} elemento(s) removido(s)`,'success');
  selectedIds.clear();
  await loadAll();
  renderTable();renderSidebar();updateStats();
}
function exportCSV(){
  window.open(papi('/elements/export.csv'),'_blank');
}

function renderDashboard(){
  const summary = dashboardSummary || {
    totals: {
      elements: DB.elements.length,
      connections: DB.connections.length,
      clients: DB.elements.filter(e=>e.tipo==='cliente').length,
      ctos: DB.elements.filter(e=>e.tipo==='cto').length,
      broken_connections: DB.connections.filter(c=>c.broken).length,
      unpositioned_elements: DB.elements.filter(e=>!(e.lat&&e.lng)).length,
    },
    status_counts: {
      ativo: DB.elements.filter(e=>e.status==='ativo').length,
      alerta: DB.elements.filter(e=>e.status==='alerta').length,
      offline: DB.elements.filter(e=>e.status==='offline').length,
    },
    alerts: {offline_elements: [], broken_connections: [], saturated_ctos: []},
    top_cto_occupancy: [],
  };

  document.getElementById('dash-total-elements').textContent = summary.totals.elements || 0;
  document.getElementById('dash-unpositioned').textContent = `${summary.totals.unpositioned_elements || 0} sem coordenadas`;
  document.getElementById('dash-total-connections').textContent = summary.totals.connections || 0;
  document.getElementById('dash-broken-connections').textContent = `${summary.totals.broken_connections || 0} cabos rompidos`;
  document.getElementById('dash-total-clients').textContent = summary.totals.clients || 0;
  document.getElementById('dash-offline-elements').textContent = `${summary.status_counts.offline || 0} offline · ${summary.totals.open_incidents || 0} incidentes`;
  document.getElementById('dash-total-ctos').textContent = summary.totals.ctos || 0;
  document.getElementById('dash-saturated-ctos').textContent = `${(summary.alerts.saturated_ctos || []).length} CTOs acima de 80%`;

  const pills = [
    {label:`${summary.status_counts.ativo || 0} ativos`, cls:'ok'},
    {label:`${summary.status_counts.alerta || 0} em alerta`, cls:(summary.status_counts.alerta||0)?'warn':'ok'},
    {label:`${summary.status_counts.offline || 0} offline`, cls:(summary.status_counts.offline||0)?'danger':'ok'},
    {label:`${summary.totals.unpositioned_elements || 0} sem posição`, cls:(summary.totals.unpositioned_elements||0)?'warn':'ok'},
  ];
  document.getElementById('dashboard-health-pills').innerHTML = pills.map(p=>`<span class="health-pill ${p.cls}">${p.label}</span>`).join('');

  const alerts = [];
  (summary.alerts.saturated_ctos || []).slice(0,4).forEach(cto=>{
    alerts.push(`<div class="list-card"><div class="list-title">${esc(cto.nome)}</div><div class="list-meta">ocupação em ${cto.occupancy}% (${cto.used}/${cto.total})</div></div>`);
  });
  (summary.alerts.broken_connections || []).slice(0,4).forEach(conn=>{
    alerts.push(`<div class="list-card"><div class="list-title">Cabo #${conn.id}</div><div class="list-meta">${esc(conn.fibra || 'Conexão')} entre ${esc(conn.from)} e ${esc(conn.to)}</div></div>`);
  });
  (summary.alerts.offline_elements || []).slice(0,4).forEach(name=>{
    alerts.push(`<div class="list-card"><div class="list-title">${esc(name)}</div><div class="list-meta">elemento marcado como offline</div></div>`);
  });
  document.getElementById('dashboard-alert-list').innerHTML = alerts.length ? alerts.join('') : '<div class="muted-empty">Nenhum alerta crítico no momento.</div>';

  document.getElementById('dashboard-activity-list').innerHTML = projectAudit.length ? projectAudit.slice(0,8).map(event=>`
    <div class="list-card">
      <div class="list-title">${esc(event.message || event.action)}</div>
      <div class="list-meta">${esc(event.timestamp || 'agora')} · ${esc(event.username || 'system')}</div>
    </div>
  `).join('') : '<div class="muted-empty">Sem atividade recente registrada.</div>';

  document.getElementById('dashboard-capacity-list').innerHTML = (summary.top_cto_occupancy || []).length ? summary.top_cto_occupancy.map(cto=>`
    <div class="list-card">
      <div class="list-title">${esc(cto.nome)}</div>
      <div class="list-meta">${cto.used}/${cto.total} portas ocupadas · ${cto.occupancy}%</div>
      <div class="capacity-bar"><div class="capacity-fill" style="width:${Math.min(100, cto.occupancy || 0)}%"></div></div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhuma CTO com dados de porta carregados.</div>';

  _drawTypeChart(summary);
}

function _drawTypeChart(summary) {
  const canvas = document.getElementById('dash-type-chart');
  if (!canvas) return;
  const types = summary.type_counts || {};
  const entries = Object.entries(types).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { canvas.style.display = 'none'; return; }
  canvas.style.display = '';
  const ctx = canvas.getContext('2d');
  const total = entries.reduce((s, [, n]) => s + n, 0);
  const colors = ['#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#8b5cf6', '#00BCD4', '#FF9800', '#607D8B'];
  let angle = -Math.PI / 2;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const _slices = [];
  entries.forEach(([label, count], i) => {
    const slice = (count / total) * 2 * Math.PI;
    _slices.push({label, count, color: colors[i % colors.length], startAngle: angle, endAngle: angle + slice});
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    const midAngle = angle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(midAngle);
    const ly = cy + (r * 0.65) * Math.sin(midAngle);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${count}`, lx, ly);
    angle += slice;
  });
  canvas._chartSlices = _slices;
  if(!canvas._tooltipWired){
    canvas._tooltipWired = true;
    canvas.addEventListener('mousemove', function(ev){
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      const cx2 = canvas.width/2, cy2 = canvas.height/2, r2 = Math.min(cx2,cy2)-4;
      const dx = mx-cx2, dy = my-cy2;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const tip = document.getElementById('chart-tooltip');
      if(dist > r2 || !canvas._chartSlices){tip.style.display='none';return;}
      let a = Math.atan2(dy, dx);
      if(a < -Math.PI/2) a += 2*Math.PI;
      const slice = canvas._chartSlices.find(s => a >= s.startAngle && a < s.endAngle);
      if(slice){
        tip.textContent = `${TYPE_CONFIG[slice.label]?.label || slice.label}: ${slice.count} (${((slice.count/total)*100).toFixed(1)}%)`;
        tip.style.display = 'block';
        tip.style.left = (ev.pageX+10)+'px';
        tip.style.top = (ev.pageY-20)+'px';
      } else {
        tip.style.display = 'none';
      }
    });
    canvas.addEventListener('mouseleave', function(){
      const tip = document.getElementById('chart-tooltip');
      if(tip) tip.style.display='none';
    });
  }
  const existingLegend = canvas.nextElementSibling;
  if(existingLegend && existingLegend.classList.contains('chart-legend-wrap')) existingLegend.remove();
  let legendHTML = '<div class="chart-legend-wrap" style="margin-top:8px;font-size:10px;text-align:center">';
  entries.forEach(([label, count], i) => {
    legendHTML += `<span style="display:inline-block;margin:2px 6px;cursor:pointer" onclick="filterTypeFromChart('${esc(label)}')" title="Filtrar ${esc(label)} no mapa"><span style="display:inline-block;width:10px;height:10px;background:${colors[i % colors.length]};border-radius:2px;vertical-align:middle;margin-right:3px"></span>${esc(label)} (${count})</span>`;
  });
  legendHTML += '</div>';
  canvas.insertAdjacentHTML('afterend', legendHTML);
}

function filterTypeFromChart(tipo){
  switchTab('geomap');
  activeFilter = tipo;
  renderSidebar();
  refreshAllMarkers();
  toast(`Filtro: ${TYPE_CONFIG[tipo]?.label || tipo}`, 'success');
}

function renderCables(){
  const q=(document.getElementById('cable-search')?.value||'').toLowerCase();
  const rows=(DB.cables||[]).filter(cable=>{
    const haystack=[cable.fibra,cable.from_name,cable.to_name,cable.porta,cable.cor,cable.status,cable.obs]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  const visible=rows.slice(0,_cablesShown);
  document.getElementById('cable-list').innerHTML = visible.length ? visible.map(cable=>`
    <div class="cable-card">
      <div class="list-title">${esc(cable.fibra || `Cabo #${cable.id}`)}</div>
      <div class="list-meta">${esc(cable.from_name)} → ${esc(cable.to_name)}</div>
      <div class="cable-meta">
        <span class="incident-badge ${cable.status==='rompido'?'status-open':'status-closed'}">${esc(cable.status)}</span>
        <span class="incident-badge">${esc(cable.cor || 'sem cor')}</span>
        <span class="incident-badge">${cable.length ? `${cable.length} m` : 'sem metragem'}</span>
        <span class="incident-badge">${cable.has_route ? `${cable.waypoints} pontos` : 'rota simples'}</span>
      </div>
      <div class="list-meta">${esc(cable.porta || 'Sem porta informada')} ${cable.obs ? `· ${esc(cable.obs)}` : ''}</div>
      <div class="card-actions">
        <button class="btn-ghost" onclick="openEditCableModal(${cable.id})" aria-label="Editar cabo">✏️ Editar</button>
        <button class="btn-ghost" style="color:var(--red)" onclick="deleteCable(${cable.id})" aria-label="Excluir cabo">🗑️ Excluir</button>
        ${cable.from_id ? `<button class="btn-ghost" onclick="focusNode(${cable.from_id})">Origem</button>` : ''}
        ${cable.to_id ? `<button class="btn-ghost" onclick="focusNode(${cable.to_id})">Destino</button>` : ''}
      </div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum cabo encontrado.</div>';
  if(rows.length>_cablesShown){
    document.getElementById('cable-list').insertAdjacentHTML('beforeend',`<div style="text-align:center;margin-top:12px"><span style="font-size:10px;color:var(--text3)">Exibindo ${visible.length} de ${rows.length}</span><br><button class="btn-ghost" style="margin-top:6px" onclick="this.disabled=true;this.textContent='Carregando…';_cablesShown+=${_PAGE_SIZE};renderCables()">Carregar mais (${rows.length-_cablesShown} restantes)</button></div>`);
  }
}

function renderValidation(){
  const health = topologyHealth || {score:0,severity_counts:{high:0,medium:0,low:0},issues:[]};
  const score = health.score ?? 0;
  document.getElementById('validation-score').textContent = score;
  const bar=document.getElementById('validation-score-bar');
  if(bar){
    bar.style.width=score+'%';
    bar.style.background=score>=90?'var(--green)':score>=70?'var(--orange)':'var(--red)';
  }
  document.getElementById('validation-score-caption').textContent =
    score >= 90 ? 'Topologia bem estruturada' :
    score >= 70 ? 'Existem ajustes recomendados' :
    'Há pendências técnicas importantes';
  document.getElementById('validation-high-pill').textContent = `Alta: ${health.severity_counts?.high || 0}`;
  document.getElementById('validation-medium-pill').textContent = `Média: ${health.severity_counts?.medium || 0}`;
  document.getElementById('validation-low-pill').textContent = `Baixa: ${health.severity_counts?.low || 0}`;
  document.getElementById('validation-issues').innerHTML = (health.issues||[]).length ? health.issues.map(issue=>`
    <div class="issue-item ${issue.severity}">
      <div class="list-title">${esc(issue.message)}</div>
      <div class="list-meta">${issue.code || 'issue'} · ${issue.entity_type || 'entidade'} ${issue.entity_id ? `#${issue.entity_id}` : ''}</div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhuma pendência encontrada.</div>';
}

function populateIxcForm(){
  if(!ixcConfig) return;
  document.getElementById('ixc-base-url').value = ixcConfig.base_url || '';
  document.getElementById('ixc-token').value = '';
  document.getElementById('ixc-auth-mode').value = ixcConfig.auth_mode || 'auto';
  document.getElementById('ixc-timeout').value = ixcConfig.timeout_seconds || 15;
  document.getElementById('ixc-self-signed').value = String(!!ixcConfig.self_signed);
  document.getElementById('ixc-enabled').value = String(!!ixcConfig.enabled);
  document.getElementById('ixc-token-hint').textContent =
    ixcConfig.has_token ? `Token salvo no sistema (${ixcConfig.token_masked || 'oculto'}). Deixe em branco para manter.` : 'Nenhum token salvo ainda.';
}

function renderIxcSettings(){
  populateIxcForm();
  const isAdmin = !!currentSession.permissions.manage_users;
  document.querySelectorAll('.ixc-admin-only').forEach(el=>el.style.display = isAdmin ? '' : 'none');
  ['ixc-base-url','ixc-token','ixc-auth-mode','ixc-timeout','ixc-self-signed','ixc-enabled','ixc-sync-resource','ixc-sync-target-type']
    .forEach(id=>{
      const node=document.getElementById(id);
      if(node) node.disabled = !isAdmin && id !== 'ixc-sync-resource' && id !== 'ixc-sync-target-type';
    });
  if(ixcLastTest){
    document.getElementById('ixc-test-result').innerHTML = `
      <div><strong>${ixcLastTest.ok ? 'Conexão validada' : 'Conexão não validada'}</strong></div>
      <div style="margin-top:6px">${esc(ixcLastTest.result?.message || ixcLastTest.attempts?.slice(-1)[0]?.message || 'Sem detalhes.')}</div>
      <div style="margin-top:6px;color:var(--text2)">Recurso: ${esc(ixcLastTest.resource_name || 'n/a')} ${ixcLastTest.selected_mode ? `· modo ${esc(ixcLastTest.selected_mode)}` : ''}</div>
    `;
  }
  if(ixcLastSync){
    document.getElementById('ixc-sync-result').innerHTML = `
      <div><strong>Sincronização concluída</strong></div>
      <div style="margin-top:6px">${esc(ixcLastSync.imported_total || 0)} registros lidos · ${esc(ixcLastSync.created || 0)} criados · ${esc(ixcLastSync.updated || 0)} atualizados · ${esc(ixcLastSync.skipped || 0)} ignorados</div>
      <div style="margin-top:6px;color:var(--text2)">Fonte ${esc(ixcLastSync.logical_resource || 'n/a')} · tipo ${esc(ixcLastSync.target_type || 'n/a')} · modo ${esc(ixcLastSync.auth_mode_used || 'n/a')}</div>
    `;
  }
  if(ixcLastViability){
    const records = Array.isArray(ixcLastViability.records) ? ixcLastViability.records : [];
    document.getElementById('ixc-viability-result').innerHTML = `
      <div><strong>Consulta executada</strong></div>
      <div style="margin-top:6px">${esc(records.length)} registro(s) retornado(s) pelo recurso ${esc(ixcLastViability.resource_name || 'viabilidade_tecnica')}.</div>
      <div style="margin-top:6px;color:var(--text2)">${records.length ? Object.entries(records[0]).slice(0,6).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(' · ') : 'Sem detalhes retornados.'}</div>
    `;
  }
}

function readIxcFormPayload(){
  return {
    base_url: document.getElementById('ixc-base-url').value.trim(),
    token: document.getElementById('ixc-token').value.trim(),
    auth_mode: document.getElementById('ixc-auth-mode').value,
    timeout_seconds: Number(document.getElementById('ixc-timeout').value || 15),
    self_signed: document.getElementById('ixc-self-signed').value === 'true',
    enabled: document.getElementById('ixc-enabled').value === 'true',
  };
}

async function saveIxcConfigUI(){
  const res = await api('PUT','/api/integrations/ixc/config',readIxcFormPayload());
  if(!res) return;
  await loadIxcConfig();
  renderIxcSettings();
  toast('Configuração IXC salva','success');
}

async function testIxcConnectionUI(){
  const payload = readIxcFormPayload();
  payload.logical_resource = document.getElementById('ixc-sync-resource').value;
  const res = await api('POST','/api/integrations/ixc/test',payload);
  if(!res) return;
  ixcLastTest = res;
  renderIxcSettings();
  toast(res.ok ? 'Conexão IXC validada' : 'Teste IXC executado com pendências','success');
}

async function syncIxcProjectUI(){
  const payload = {
    logical_resource: document.getElementById('ixc-sync-resource').value,
    target_type: document.getElementById('ixc-sync-target-type').value,
  };
  const res = await api('POST',papi('/integrations/ixc/sync'),payload);
  if(!res) return;
  ixcLastSync = res;
  await loadAll();
  await loadProjectInsights();
  updateStats();renderCustomers();renderCables();renderValidation();renderReports();renderDashboard();renderIxcSettings();
  toast('Sincronização IXC concluída','success');
}

async function lookupIxcViabilityUI(){
  const payload = {
    endereco: document.getElementById('ixc-viab-endereco').value.trim(),
    numero: document.getElementById('ixc-viab-numero').value.trim(),
    bairro: document.getElementById('ixc-viab-bairro').value.trim(),
    cidade: document.getElementById('ixc-viab-cidade').value.trim(),
    estado: document.getElementById('ixc-viab-estado').value.trim(),
  };
  const res = await api('POST','/api/integrations/ixc/viability',payload);
  if(!res) return;
  ixcLastViability = res;
  renderIxcSettings();
  toast('Consulta de viabilidade executada','success');
}

let lastTraceData = null;

async function openTraceModal(startId){
  const res = await api('GET',papi(`/trace/${startId}`));
  if(!res) return;
  lastTraceData = res;
  document.getElementById('trace-modal-title').textContent = `Rota de ${res.start_name || 'Elemento'}`;
  document.getElementById('trace-hop-count').textContent = res.hop_count || 0;
  document.getElementById('trace-total-length').textContent = `${res.total_length || 0} m`;
  document.getElementById('trace-broken-count').textContent = res.broken_segments || 0;
  const nodes = Array.isArray(res.nodes) ? res.nodes : [];
  const connections = Array.isArray(res.connections) ? res.connections : [];
  const parts = [];
  nodes.forEach((node, index)=>{
    parts.push(`
      <div class="trace-step">
        <div class="trace-index">${index + 1}</div>
        <div>
          <div class="list-title">${esc(node.nome)}</div>
          <div class="list-meta">${esc(node.tipo || 'elemento')} · status ${esc(node.status || 'ativo')}</div>
        </div>
      </div>
    `);
    const connection = connections[index];
    if(connection){
      parts.push(`
        <div class="trace-link">
          ${esc(connection.fibra || `Conexão #${connection.id}`)} ${connection.length ? `· ${connection.length} m` : ''} ${connection.broken ? '· rompido' : ''}
        </div>
      `);
    }
  });
  document.getElementById('trace-path-list').innerHTML = parts.length ? parts.join('') : '<div class="muted-empty">Nenhuma rota encontrada.</div>';
  const viewMapBtn = document.getElementById('trace-view-map-btn');
  if(viewMapBtn) viewMapBtn.style.display = (nodes.some(n=>n.lat && n.lng)) ? '' : 'none';
  openModal('modal-trace');
}

function viewTraceOnMap(){
  if(!lastTraceData) return;
  closeModal('modal-trace');
  highlightPathOnMap(lastTraceData);
}

let _auditPage=1;
async function loadGlobalAudit(page){
  if(page) _auditPage=page;
  const q=document.getElementById('audit-search')?.value||'';
  const ps='&page='+_auditPage+'&page_size=30';
  const data=await api('GET','/api/audit?search='+encodeURIComponent(q)+'&sort=timestamp&order=desc'+ps);
  renderGlobalAudit(data);
}
function renderGlobalAudit(data){
  const items=data.items||[];
  const el=document.getElementById('audit-list');
  if(!items.length){el.innerHTML='<div style="font-size:12px;color:var(--text3);text-align:center;padding:24px">Nenhum evento registrado.</div>';return;}
  el.innerHTML=items.map(e=>{
    const t=e.timestamp||'';
    const action=e.action||'';
    const user=e.username||'—';
    const msg=e.message||'';
    const proj=e.project_id||'';
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <span style="font-size:11px;font-weight:700;color:var(--accent)">${esc(action)}</span>
        <span style="font-size:10px;color:var(--text3)">${esc(t)}${proj?' · '+esc(proj):''}</span>
      </div>
      <div style="font-size:11px;color:var(--text2)"><strong style="color:var(--text1)">${esc(user)}</strong> — ${esc(msg)}</div>
    </div>`;
  }).join('');
  const pag=document.getElementById('audit-pagination');
  if(!pag) return;
  const total=data.total||0;const pages=Math.ceil(total/30)||1;
  if(pages<=1){pag.innerHTML='';return;}
  const btns=[];
  if(_auditPage>1) btns.push(`<button class="btn-ghost" style="padding:4px 10px;font-size:11px" onclick="loadGlobalAudit(${_auditPage-1})">← Anterior</button>`);
  btns.push(`<span style="font-size:11px;color:var(--text3)">${_auditPage}/${pages}</span>`);
  if(_auditPage<pages) btns.push(`<button class="btn-ghost" style="padding:4px 10px;font-size:11px" onclick="loadGlobalAudit(${_auditPage+1})">Próximo →</button>`);
  pag.innerHTML=btns.join('');
}
registerPublicApi('views', {
  renderTable,
  filterTable,
  renderDashboard,
  renderCables,
  renderValidation,
  populateIxcForm,
  renderIxcSettings,
  readIxcFormPayload,
  saveIxcConfigUI,
  testIxcConnectionUI,
  syncIxcProjectUI,
  lookupIxcViabilityUI,
  openTraceModal,
  viewTraceOnMap,
  exportCSV,
  toggleSelectAll,
  bulkChangeStatus,
  bulkDeleteElements,
  clearBulkSelection,
  loadGlobalAudit,
  filterTypeFromChart,
}, [
  'renderValidation',
  'lookupIxcViabilityUI',
  'saveIxcConfigUI',
  'syncIxcProjectUI',
  'testIxcConnectionUI',
  'viewTraceOnMap',
  'bulkDeleteElements',
  'loadGlobalAudit',
  'filterTypeFromChart',
]);

// ═══════════════════════════════════════════════════════
// TABS
