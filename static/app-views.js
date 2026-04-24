// TABLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderTable(){
  const q=document.getElementById('table-search').value.toLowerCase();
  const rows=DB.elements.filter(e=>elementMatchesFilters(e) && (!q||e.nome.toLowerCase().includes(q)||e.tipo.includes(q)||String(e.id).includes(q)));
  document.getElementById('inv-tbody').innerHTML=rows.map(el=>{
    const tc=TYPE_CONFIG[el.tipo]||{};
    const sc=el.status==='ativo'?'var(--green)':el.status==='offline'?'var(--red)':'var(--orange)';
    const hasCords=el.lat&&el.lng;
    return `<tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
      <td style="padding:9px 14px;font-family:'Courier New',monospace;color:var(--text3);font-size:10px">#${el.id}</td>
      <td style="padding:9px 14px;font-weight:600;font-size:12px"><span style="color:${tc.color}">${ICONS[el.tipo]||''}</span> ${el.nome}</td>
      <td style="padding:9px 14px"><span style="background:${tc.color}22;color:${tc.color};padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700">${tc.label||el.tipo}</span></td>
      <td style="padding:9px 14px;color:${sc};font-size:11px;font-weight:700">â— ${el.status}</td>
      <td style="padding:9px 14px;font-family:'Courier New',monospace;font-size:10px;color:var(--text3)">${hasCords?el.lat?.toFixed(4)+', '+el.lng?.toFixed(4):'â€”'}</td>
      <td style="padding:9px 14px;display:flex;gap:5px">
        <button class="btn-ghost" style="padding:3px 9px;font-size:10px" onclick="openEditModal(${el.id})">âœï¸</button>
        <button class="btn-ghost" style="padding:3px 9px;font-size:10px" onclick="focusNode(${el.id})">ðŸŽ¯</button>
        ${!hasCords?`<button class="btn-warn" style="padding:3px 9px;font-size:10px" onclick="startPlaceMode(${el.id})">ðŸ“</button>`:''}
      </td>
    </tr>`;
  }).join('');
}
function filterTable(){renderTable();}

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
  document.getElementById('dash-offline-elements').textContent = `${summary.status_counts.offline || 0} offline Â· ${summary.totals.open_incidents || 0} incidentes`;
  document.getElementById('dash-total-ctos').textContent = summary.totals.ctos || 0;
  document.getElementById('dash-saturated-ctos').textContent = `${(summary.alerts.saturated_ctos || []).length} CTOs acima de 80%`;

  const pills = [
    {label:`${summary.status_counts.ativo || 0} ativos`, cls:'ok'},
    {label:`${summary.status_counts.alerta || 0} em alerta`, cls:(summary.status_counts.alerta||0)?'warn':'ok'},
    {label:`${summary.status_counts.offline || 0} offline`, cls:(summary.status_counts.offline||0)?'danger':'ok'},
    {label:`${summary.totals.unpositioned_elements || 0} sem posiÃ§Ã£o`, cls:(summary.totals.unpositioned_elements||0)?'warn':'ok'},
  ];
  document.getElementById('dashboard-health-pills').innerHTML = pills.map(p=>`<span class="health-pill ${p.cls}">${p.label}</span>`).join('');

  const alerts = [];
  (summary.alerts.saturated_ctos || []).slice(0,4).forEach(cto=>{
    alerts.push(`<div class="list-card"><div class="list-title">${cto.nome}</div><div class="list-meta">ocupaÃ§Ã£o em ${cto.occupancy}% (${cto.used}/${cto.total})</div></div>`);
  });
  (summary.alerts.broken_connections || []).slice(0,4).forEach(conn=>{
    alerts.push(`<div class="list-card"><div class="list-title">Cabo #${conn.id}</div><div class="list-meta">${conn.fibra || 'ConexÃ£o'} entre ${conn.from} e ${conn.to}</div></div>`);
  });
  (summary.alerts.offline_elements || []).slice(0,4).forEach(name=>{
    alerts.push(`<div class="list-card"><div class="list-title">${name}</div><div class="list-meta">elemento marcado como offline</div></div>`);
  });
  document.getElementById('dashboard-alert-list').innerHTML = alerts.length ? alerts.join('') : '<div class="muted-empty">Nenhum alerta crÃ­tico no momento.</div>';

  document.getElementById('dashboard-activity-list').innerHTML = projectAudit.length ? projectAudit.slice(0,8).map(event=>`
    <div class="list-card">
      <div class="list-title">${event.message || event.action}</div>
      <div class="list-meta">${event.timestamp || 'agora'} Â· ${event.username || 'system'}</div>
    </div>
  `).join('') : '<div class="muted-empty">Sem atividade recente registrada.</div>';

  document.getElementById('dashboard-capacity-list').innerHTML = (summary.top_cto_occupancy || []).length ? summary.top_cto_occupancy.map(cto=>`
    <div class="list-card">
      <div class="list-title">${cto.nome}</div>
      <div class="list-meta">${cto.used}/${cto.total} portas ocupadas Â· ${cto.occupancy}%</div>
      <div class="capacity-bar"><div class="capacity-fill" style="width:${Math.min(100, cto.occupancy || 0)}%"></div></div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhuma CTO com dados de porta carregados.</div>';
}

function renderCables(){
  const q=(document.getElementById('cable-search')?.value||'').toLowerCase();
  const rows=(DB.cables||[]).filter(cable=>{
    const haystack=[cable.fibra,cable.from_name,cable.to_name,cable.porta,cable.cor,cable.status,cable.obs]
      .map(v=>String(v||'').toLowerCase()).join(' ');
    return !q || haystack.includes(q);
  });
  document.getElementById('cable-list').innerHTML = rows.length ? rows.map(cable=>`
    <div class="cable-card">
      <div class="list-title">${cable.fibra || `Cabo #${cable.id}`}</div>
      <div class="list-meta">${cable.from_name} â†’ ${cable.to_name}</div>
      <div class="cable-meta">
        <span class="incident-badge ${cable.status==='rompido'?'status-open':'status-closed'}">${cable.status}</span>
        <span class="incident-badge">${cable.cor || 'sem cor'}</span>
        <span class="incident-badge">${cable.length ? `${cable.length} m` : 'sem metragem'}</span>
        <span class="incident-badge">${cable.has_route ? `${cable.waypoints} pontos` : 'rota simples'}</span>
      </div>
      <div class="list-meta">${cable.porta || 'Sem porta informada'} ${cable.obs ? `Â· ${cable.obs}` : ''}</div>
      <div class="card-actions">
        ${cable.from_id ? `<button class="btn-ghost" onclick="focusNode(${cable.from_id})">Origem</button>` : ''}
        ${cable.to_id ? `<button class="btn-ghost" onclick="focusNode(${cable.to_id})">Destino</button>` : ''}
      </div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhum cabo encontrado.</div>';
}

function renderValidation(){
  const health = topologyHealth || {score:0,severity_counts:{high:0,medium:0,low:0},issues:[]};
  document.getElementById('validation-score').textContent = health.score ?? 0;
  document.getElementById('validation-score-caption').textContent =
    health.score >= 90 ? 'Topologia bem estruturada' :
    health.score >= 70 ? 'Existem ajustes recomendados' :
    'Ha pendencias tecnicas importantes';
  document.getElementById('validation-high-pill').textContent = `Alta: ${health.severity_counts?.high || 0}`;
  document.getElementById('validation-medium-pill').textContent = `Media: ${health.severity_counts?.medium || 0}`;
  document.getElementById('validation-low-pill').textContent = `Baixa: ${health.severity_counts?.low || 0}`;
  document.getElementById('validation-issues').innerHTML = (health.issues||[]).length ? health.issues.map(issue=>`
    <div class="issue-item ${issue.severity}">
      <div class="list-title">${issue.message}</div>
      <div class="list-meta">${issue.code || 'issue'} Â· ${issue.entity_type || 'entidade'} ${issue.entity_id ? `#${issue.entity_id}` : ''}</div>
    </div>
  `).join('') : '<div class="muted-empty">Nenhuma pendencia encontrada.</div>';
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
      <div><strong>${ixcLastTest.ok ? 'Conexao validada' : 'Conexao nao validada'}</strong></div>
      <div style="margin-top:6px">${ixcLastTest.result?.message || ixcLastTest.attempts?.slice(-1)[0]?.message || 'Sem detalhes.'}</div>
      <div style="margin-top:6px;color:var(--text2)">Recurso: ${ixcLastTest.resource_name || 'n/a'} ${ixcLastTest.selected_mode ? `Â· modo ${ixcLastTest.selected_mode}` : ''}</div>
    `;
  }
  if(ixcLastSync){
    document.getElementById('ixc-sync-result').innerHTML = `
      <div><strong>Sincronizacao concluida</strong></div>
      <div style="margin-top:6px">${ixcLastSync.imported_total || 0} registros lidos Â· ${ixcLastSync.created || 0} criados Â· ${ixcLastSync.updated || 0} atualizados Â· ${ixcLastSync.skipped || 0} ignorados</div>
      <div style="margin-top:6px;color:var(--text2)">Fonte ${ixcLastSync.logical_resource || 'n/a'} Â· tipo ${ixcLastSync.target_type || 'n/a'} Â· modo ${ixcLastSync.auth_mode_used || 'n/a'}</div>
    `;
  }
  if(ixcLastViability){
    const records = Array.isArray(ixcLastViability.records) ? ixcLastViability.records : [];
    document.getElementById('ixc-viability-result').innerHTML = `
      <div><strong>Consulta executada</strong></div>
      <div style="margin-top:6px">${records.length} registro(s) retornado(s) pelo recurso ${ixcLastViability.resource_name || 'viabilidade_tecnica'}.</div>
      <div style="margin-top:6px;color:var(--text2)">${records.length ? Object.entries(records[0]).slice(0,6).map(([k,v])=>`${k}: ${v}`).join(' Â· ') : 'Sem detalhes retornados.'}</div>
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
  toast('Configuracao IXC salva','success');
}

async function testIxcConnectionUI(){
  const payload = readIxcFormPayload();
  payload.logical_resource = document.getElementById('ixc-sync-resource').value;
  const res = await api('POST','/api/integrations/ixc/test',payload);
  if(!res) return;
  ixcLastTest = res;
  renderIxcSettings();
  toast(res.ok ? 'Conexao IXC validada' : 'Teste IXC executado com pendencias','success');
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
  toast('Sincronizacao IXC concluida','success');
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

async function openTraceModal(startId){
  const res = await api('GET',papi(`/trace/${startId}`));
  if(!res) return;
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
          <div class="list-title">${node.nome}</div>
          <div class="list-meta">${node.tipo || 'elemento'} Â· status ${node.status || 'ativo'}</div>
        </div>
      </div>
    `);
    const connection = connections[index];
    if(connection){
      parts.push(`
        <div class="trace-link">
          ${connection.fibra || `Conexao #${connection.id}`} ${connection.length ? `Â· ${connection.length} m` : ''} ${connection.broken ? 'Â· rompido' : ''}
        </div>
      `);
    }
  });
  document.getElementById('trace-path-list').innerHTML = parts.length ? parts.join('') : '<div class="muted-empty">Nenhuma rota encontrada.</div>';
  openModal('modal-trace');
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
}, [
  'renderValidation',
  'lookupIxcViabilityUI',
  'saveIxcConfigUI',
  'syncIxcProjectUI',
  'testIxcConnectionUI',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TABS
