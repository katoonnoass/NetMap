// MODALS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

function buildTypeSelector(){
  document.getElementById('type-selector').innerHTML=Object.entries(TYPE_CONFIG).map(([tipo,tc])=>
    `<div class="type-opt" data-type="${tipo}" onclick="selectType('${tipo}')" style="color:${tc.color}">
      <div style="width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:${tc.color}22">${ICONS[tipo]||''}</div>
      <span style="font-size:9px;color:var(--text2)">${tc.label}</span>
    </div>`).join('');
}
function selectType(t){
  selectedAddType=t;
  document.querySelectorAll('.type-opt').forEach(o=>o.classList.toggle('selected',o.dataset.type===t));
  // Mostra campo de capacidade apenas para CTO
  const ctoCapacityDiv = document.getElementById('cto-capacity-container');
  if(ctoCapacityDiv) {
    ctoCapacityDiv.style.display = (t === 'cto') ? 'block' : 'none';
  }
}

function openAddModal(){
  selectedAddType=null;
  buildTypeSelector();
  ['add-nome','add-modelo','add-endereco','add-detalhes'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('add-status').value='ativo';
  document.getElementById('add-lat').value='';
  document.getElementById('add-lng').value='';
  openModal('modal-add');
}

async function saveElement(){
  if(!selectedAddType){toast('âš ï¸ Selecione o tipo','error');return;}
  
  const lat=parseFloat(document.getElementById('add-lat').value)||null;
  const lng=parseFloat(document.getElementById('add-lng').value)||null;
  
  // Nome opcional: gera automÃ¡tico se vazio
  const tc=TYPE_CONFIG[selectedAddType]||{label:selectedAddType};
  const autoNome=`${tc.label} ${DB.elements.filter(e=>e.tipo===selectedAddType).length+1}`;
  const nome=document.getElementById('add-nome').value.trim()||autoNome;
  
  // Captura capacidade APENAS se for CTO (e depois de validar selectedAddType)
  let capacity = null;
  if(selectedAddType === 'cto') {
    capacity = parseInt(document.getElementById('add-cto-capacity').value);
  }
  
 const created = await api('POST', papi('/elements'), {
  nome, tipo: selectedAddType, status: document.getElementById('add-status').value,
  modelo: document.getElementById('add-modelo').value.trim(),
  endereco: document.getElementById('add-endereco').value.trim(),
  detalhes: document.getElementById('add-detalhes').value.trim(),
  lat, lng,
  capacity: capacity   // <--- adicione esta linha
});
  
  if(!created||!created.id) return;
  DB.elements.push(created);
  closeModal('modal-add');
  addOrUpdateMarker(created);
  if(nodesDS) nodesDS.add({id:created.id,label:created.nome,shape:'dot',color:{background:TYPE_CONFIG[created.tipo]?.color+'22',border:TYPE_CONFIG[created.tipo]?.color||'#888'},font:{color:'#e8edf5',size:12},size:18});
  updateStats();renderSidebar();renderTable();
  if(!lat||!lng){
    toast(`âœ… Adicionado! Use ðŸ“ Posicionar para colocar no mapa`,'success');
    placeTargetId=created.id;
    setMapMode('place');
    switchTab('geomap');
  } else {
    toast('âœ… Elemento adicionado!','success');
  }
}

function openEditModal(id){
  if(!id) return;
  const el=DB.elements.find(e=>e.id===id);if(!el) return;
  document.getElementById('edit-id').value=id;
  document.getElementById('edit-nome').value=el.nome;
  document.getElementById('edit-tipo').value=el.tipo;
  document.getElementById('edit-status').value=el.status;
  document.getElementById('edit-endereco').value=el.endereco||'';
  document.getElementById('edit-detalhes').value=el.detalhes||'';
  document.getElementById('edit-modelo').value=el.modelo||'';
  document.getElementById('edit-lat').value=el.lat||'';
  document.getElementById('edit-lng').value=el.lng||'';
  document.getElementById('edit-delete-btn').onclick=()=>deleteElement(id);
  openModal('modal-edit');
}

async function updateElement(){
  const id=parseInt(document.getElementById('edit-id').value);
  const lat=parseFloat(document.getElementById('edit-lat').value)||null;
  const lng=parseFloat(document.getElementById('edit-lng').value)||null;
  const updated={
    nome:document.getElementById('edit-nome').value.trim(),
    tipo:document.getElementById('edit-tipo').value,
    status:document.getElementById('edit-status').value,
    modelo:document.getElementById('edit-modelo').value.trim(),
    endereco:document.getElementById('edit-endereco').value.trim(),
    detalhes:document.getElementById('edit-detalhes').value.trim(),
    lat, lng,
  };
  await api('PUT',papi(`/elements/${id}`),updated);
  const idx=DB.elements.findIndex(e=>e.id===id);
  if(idx>=0) DB.elements[idx]={...DB.elements[idx],...updated,id};
  closeModal('modal-edit');
  addOrUpdateMarker(DB.elements.find(e=>e.id===id));
  refreshAllCables();
  if(nodesDS) nodesDS.update({id,label:updated.nome,color:{background:(TYPE_CONFIG[updated.tipo]?.color||'#888')+'22',border:TYPE_CONFIG[updated.tipo]?.color||'#888'}});
  if(selectedNodeId===id) showPanel(id);
  updateStats();renderSidebar();renderTable();
  toast('ðŸ’¾ Atualizado!','success');
}

async function deleteElement(id){
  if(!confirm('Remover elemento e todos os cabos conectados?')) return;
  await api('DELETE',papi(`/elements/${id}`));
  DB.elements=DB.elements.filter(e=>e.id!==id);
  DB.connections=DB.connections.filter(c=>c.from!==id&&c.to!==id);
  removeMarker(id);
  refreshAllCables();
  if(nodesDS) nodesDS.remove(id);
  closeModal('modal-edit');closePanel();
  updateStats();renderSidebar();renderTable();
  toast('ðŸ—‘ï¸ Removido','success');
}

// â”€â”€â”€ DIO â”€â”€â”€
function openAddDioModal(){openModal('modal-dio');}
async function saveDio(){
  const id=document.getElementById('dio-id').value.trim();
  const name=document.getElementById('dio-name').value.trim();
  if(!id||!name){toast('âš ï¸ Preencha ID e Nome','error');return;}
  const cap=parseInt(document.getElementById('dio-cap').value)||24;
  await api('POST',papi('/dios'),{id,name,location:document.getElementById('dio-loc').value.trim(),capacity:cap,
    ports:Array.from({length:cap},(_,i)=>({num:i+1,status:'livre',client:'',color:'N/A'}))});
  closeModal('modal-dio');
  DB.dios=await api('GET',papi('/dios'));
  renderDioPanels();toast('ðŸ“¦ DIO criado!','success');
}

function openPortModal(dioId,portNum){
  const dio=DB.dios.find(d=>d.id===dioId);if(!dio) return;
  const port=dio.ports.find(p=>p.num===portNum);if(!port) return;
  document.getElementById('port-modal-title').textContent=`Porta ${portNum} â€” ${dioId}`;
  document.getElementById('port-dio-id').value=dioId;
  document.getElementById('port-num').value=portNum;
  document.getElementById('port-status').value=port.status;
  document.getElementById('port-client').value=port.client||'';
  selectedPortFiberColor=port.color||'Azul';
  buildFiberColorGrid('port-fiber-grid','selectedPortFiberColor');
  openModal('modal-port');
}
async function savePort(){
  const dioId=document.getElementById('port-dio-id').value;
  const portNum=parseInt(document.getElementById('port-num').value);
  await api('PUT',papi(`/dios/${dioId}/ports/${portNum}`),{status:document.getElementById('port-status').value,client:document.getElementById('port-client').value.trim(),color:selectedPortFiberColor});
  closeModal('modal-port');
  DB.dios=await api('GET',papi('/dios'));
  renderDioPanels();toast('ðŸ”Œ Porta atualizada!','success');
}

function buildCableTipoSelect(){
  const sel=document.getElementById('cable-tipo');
  if(!sel) return;
  const grupos={};
  CABLE_TYPES.forEach(ct=>{
    if(!grupos[ct.grupo]) grupos[ct.grupo]=[];
    grupos[ct.grupo].push(ct);
  });
  sel.innerHTML=Object.entries(grupos).map(([g,items])=>
    `<optgroup label="â”€â”€ ${g} â”€â”€">${items.map(ct=>`<option value="${ct.label}" data-fo="${ct.fo}">${ct.label}${ct.fo>0?' ('+ct.fo+'FO)':''}</option>`).join('')}</optgroup>`
  ).join('');
}

function updateCableFOCount(){
  // could update UI hints if needed
}

function getCableFOCount(tipoLabel){
  const ct=CABLE_TYPES.find(c=>c.label===tipoLabel);
  return ct?ct.fo:0;
}


function buildFiberColorGrid(containerId,varName){
  const cur=varName==='selectedFiberColor'?selectedFiberColor:selectedPortFiberColor;
  const container=document.getElementById(containerId);
  if(!container) return;
  container.innerHTML=Object.entries(FIBER_COLORS).map(([name,hex])=>
    `<div class="fcolor-btn ${cur===name?'active':''}" onclick="pickFiberColor('${varName}','${name}','${containerId}')">
      <span class="fiber-chip" style="background:${hex}"></span>${name}
    </div>`).join('');
}
function pickFiberColor(varName,name,cid){
  if(varName==='selectedFiberColor') selectedFiberColor=name;
  else selectedPortFiberColor=name;
  buildFiberColorGrid(cid,varName);
}

// â”€â”€â”€ PROJECTS â”€â”€â”€
async function openProjectsModal(){
  const projects=await api('GET','/api/projects');
  renderProjectList(projects);
  openModal('modal-projects');
}
function renderProjectList(projects){
  const colors=['#ff6b6b','#ff9100','#0080ff','#00e676','#c77dff','#ffe066'];
  document.getElementById('project-list').innerHTML=projects.map((p,i)=>{
    const color=colors[i%colors.length];
    const isActive=p.id===currentProjectId;
    return `<div class="project-card ${isActive?'active':''}" onclick="switchProject('${p.id}')">
      <div class="proj-icon" style="background:${color}22;color:${color}">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M2 9h18" stroke="currentColor" stroke-width="1.3"/></svg>
      </div>
      <div class="proj-info">
        <div class="proj-title">${p.name}</div>
        ${p.description?`<div class="proj-desc">${p.description}</div>`:''}
        <div class="proj-meta">${p.elements} elem Â· ${p.connections} cabos Â· ${p.created_at||'â€”'}</div>
      </div>
      <div class="proj-actions">
        ${isActive?`<span style="font-size:10px;color:var(--accent);font-weight:700;padding:4px 7px">â— Ativo</span>`:''}
        <button class="proj-btn" onclick="event.stopPropagation();duplicateProject('${p.id}')" title="Duplicar">âŽ˜</button>
        ${!isActive?`<button class="proj-btn danger" onclick="event.stopPropagation();deleteProject('${p.id}')" title="Excluir">ðŸ—‘</button>`:''}
      </div>
    </div>`;
  }).join('');
}
async function switchProject(pid){
  if(pid===currentProjectId){closeModal('modal-projects');return;}
  currentProjectId=pid;
  cableState=null;
  clearCablePreview();
  await loadAll();
  await loadProjectInsights();
  // Clear map
  Object.values(mapMarkers).forEach(m=>geoMap.removeLayer(m));
  mapMarkers={};
  cableLayers.forEach(c=>geoMap.removeLayer(c.layer));
  cableLayers=[];
  refreshAllMarkers();
  refreshAllCables();
  if(network){network.destroy();network=null;}
  if(document.getElementById('view-topology').classList.contains('active')) initTopology();
  updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderOrders();renderCables();renderValidation();renderReports();renderIxcSettings();
  const projects=await api('GET','/api/projects');
  const p=projects.find(x=>x.id===pid);
  document.getElementById('topbar-project-name').textContent=p?.name||pid;
  closeModal('modal-projects');
  selectedNodeId=null;closePanel();
  toast(`ðŸ“‚ ${p?.name||pid}`,'success');
}
async function createProject(){
  const name=document.getElementById('new-proj-name').value.trim();
  if(!name){toast('âš ï¸ Informe o nome','error');return;}
  await api('POST','/api/projects',{name,description:document.getElementById('new-proj-desc').value.trim()});
  document.getElementById('new-proj-name').value='';
  document.getElementById('new-proj-desc').value='';
  toast(`âœ… Projeto "${name}" criado!`,'success');
  renderProjectList(await api('GET','/api/projects'));
}
async function duplicateProject(pid){
  const r=await api('POST',`/api/projects/${pid}/duplicate`);
  toast(`ðŸ“‹ ${r.name}`,'success');
  renderProjectList(await api('GET','/api/projects'));
}
async function deleteProject(pid){
  if(!confirm('Excluir projeto?')) return;
  await api('DELETE',`/api/projects/${pid}`);
  renderProjectList(await api('GET','/api/projects'));
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DIO RENDER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderDioPanels(){
  const container=document.getElementById('dio-panels-container');
  if(!DB.dios.length){container.innerHTML='<div style="color:var(--text3);padding:16px">Nenhum DIO cadastrado.</div>';return;}
  container.innerHTML=DB.dios.map(dio=>{
    const occ=dio.ports.filter(p=>p.status==='ocupada').length;
    const cols=Math.min(12,dio.capacity);
    return `<div class="dio-rack">
      <div class="dio-rack-header">
        <div><div class="dio-rack-name">${dio.id} â€” ${dio.name}</div><div style="font-size:10px;color:var(--text2)">${dio.location||''}</div></div>
        <div class="dio-rack-info">${occ}/${dio.capacity} ocup.</div>
      </div>
      <div class="dio-ports-grid" style="grid-template-columns:repeat(${cols},1fr)">
        ${dio.ports.map(p=>`<div class="port-cell ${p.status}" onclick="openPortModal('${dio.id}',${p.num})" title="${p.num}${p.client?': '+p.client:''}">
          <span class="port-num">${p.num}</span>
          ${p.color&&p.color!=='N/A'?`<span style="width:7px;height:7px;border-radius:50%;background:${FIBER_COLORS[p.color]||'#666'};margin:1px 0"></span>`:''}
          <span class="port-label">${p.client||''}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CTO PORTS (com splitter)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function openCtoPorts(ctoId) {
  const cto = DB.elements.find(e => e.id === ctoId && e.tipo === 'cto');
  if (!cto) return;
  document.getElementById('cto-ports-title').innerHTML = `ðŸ“¦ Portas CTO â€” ${cto.nome}`;
  const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
  if (!ports) return;
  renderCtoPorts(ctoId, ports);
  openModal('modal-cto-ports');
}

function renderCtoPorts(ctoId, ports) {
  // Separa portas raiz (sem parent) e subportas
  const rootPorts = ports.filter(p => !p.parent_port);
  const subPortsByParent = {};
  ports.forEach(p => {
    if (p.parent_port) {
      if (!subPortsByParent[p.parent_port]) subPortsByParent[p.parent_port] = [];
      subPortsByParent[p.parent_port].push(p);
    }
  });
  // Ordena subportas por Ã­ndice
  for (const parent in subPortsByParent) {
    subPortsByParent[parent].sort((a, b) => (a.subport_index || 0) - (b.subport_index || 0));
  }

  const cols = 5; // MantÃ©m 5 colunas para cards mais largos
  let html = `
    <div style="margin-bottom:12px; display:flex; gap:16px; flex-wrap:wrap; font-size:11px">
      <span><span style="background:rgba(0,230,118,.2);padding:2px 8px;border-radius:12px;">ðŸŸ¢ Ocupada</span></span>
      <span><span style="background:rgba(255,255,255,.05);padding:2px 8px;border-radius:12px;">âšª Livre</span></span>
      <span><span style="background:rgba(255,61,87,.2);padding:2px 8px;border-radius:12px;">ðŸ”´ ManutenÃ§Ã£o</span></span>
      <span><span style="background:rgba(255,145,0,.2);padding:2px 8px;border-radius:12px;">ðŸ”€ Splitter</span></span>
    </div>
    <div style="display:grid; grid-template-columns:repeat(${cols},1fr); gap:8px">
  `;

  for (const port of rootPorts) {
    const hasSplitter = port.splitter_type && port.splitter_type !== null;
    const splitterCount = hasSplitter ? (port.splitter_type === '1:2' ? 2 : 4) : 1;

    // Card com padding reduzido verticalmente e largura controlada pelo grid
    html += `<div class="port-cell" style="background:rgba(255,255,255,.05); border:1px solid var(--border); padding:6px 4px; border-radius:8px; text-align:center; position:relative;">`;
    html += `<div style="font-weight:700; font-size:13px; margin-bottom:2px;">Porta ${port.num}</div>`;

    if (!hasSplitter) {
      let statusIcon = 'âšª';
      let bgColor = 'rgba(255,255,255,.05)';
      if (port.status === 'ocupada') { bgColor = 'rgba(0,230,118,.15)'; statusIcon = 'ðŸŸ¢'; }
      else if (port.status === 'manutencao') { bgColor = 'rgba(255,61,87,.15)'; statusIcon = 'ðŸ”´'; }
      html += `<div style="background:${bgColor}; border-radius:6px; padding:4px; cursor:pointer" onclick="openCtoAssignModal(${ctoId}, ${port.num})">
        <div style="font-size:12px;">${statusIcon} ${port.status === 'ocupada' ? (port.client_nome || 'Cliente') : 'Livre'}</div>
        ${port.obs ? `<div style="font-size:9px; color:var(--text3); margin-top:2px">${port.obs}</div>` : ''}
      </div>`;
      html += `<button class="btn-ghost" style="margin-top:4px; padding:2px 4px; font-size:9px" onclick="event.stopPropagation(); openSplitPortModal(${ctoId}, ${port.num})">ðŸ”€ Splitter</button>`;
    } else {
      const subPorts = subPortsByParent[port.num] || [];
      subPorts.sort((a,b) => (a.subport_index || 0) - (b.subport_index || 0));
      const firstSub = subPorts[0];
      const firstSubNum = firstSub ? firstSub.num : null;
      
      // Container do splitter com margens reduzidas
      html += `<div style="position:relative; margin:2px 0 0 0; cursor:pointer" onclick="if(${firstSubNum}) openCtoAssignModal(${ctoId}, ${firstSubNum}); else toast('Nenhuma subporta disponÃ­vel', 'error')">`;
      html += `<div style="height:2px; background:var(--border2); margin:4px 0;"></div>`;
      html += `<div style="display:flex; justify-content:space-around; margin-top:2px;">`;
      
      for (let i = 0; i < splitterCount; i++) {
        const sub = subPorts[i];
        const subNum = sub ? sub.num : null;
        const clientName = sub && sub.client_nome ? sub.client_nome : 'Livre';
        const isOccupied = sub && sub.status === 'ocupada';
        const bolhaClass = isOccupied ? 'ocupada' : 'livre';
        html += `<div style="text-align:center; cursor:pointer" onclick="event.stopPropagation(); if(${subNum}) openCtoAssignModal(${ctoId}, ${subNum}); else toast('Subporta nÃ£o encontrada', 'error')">
          <div class="splitter-bolha ${bolhaClass}" style="width:18px; height:18px; margin:0 auto;"></div>
          <div class="splitter-label" style="font-size:7px; margin-top:1px;">${clientName.substring(0,4)}</div>
        </div>`;
      }
      html += `</div></div>`;
      html += `<button class="btn-danger" style="margin-top:4px; padding:2px 4px; font-size:8px" onclick="event.stopPropagation(); removeSplitter(${ctoId}, ${port.num})">ðŸ—‘ï¸ Remover Splitter</button>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  document.getElementById('cto-ports-body').innerHTML = html;
}

async function openCtoAssignModal(ctoId, portNum) {
  document.getElementById('assign-cto-id').value = ctoId;
  document.getElementById('assign-port-num').value = portNum;
  // Carregar lista de clientes/ONUs disponÃ­veis
  const clientes = DB.elements.filter(e => e.tipo === 'cliente' || e.tipo === 'onu');
  const select = document.getElementById('assign-client-select');
  select.innerHTML = '<option value="">â€” Nenhum (desassociar) â€”</option>' +
    clientes.map(c => `<option value="${c.id}">${c.nome} (${c.tipo})</option>`).join('');
  // Carregar dados atuais da porta
  const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
  const port = ports.find(p => p.num === portNum);
  if(port) {
    if(port.client_id) select.value = port.client_id;
    document.getElementById('assign-obs').value = port.obs || '';
  } else {
    document.getElementById('assign-obs').value = '';
  }
  openModal('modal-cto-assign');
}

async function saveCtoPortAssignment() {
  const ctoId = parseInt(document.getElementById('assign-cto-id').value);
  const portNum = parseInt(document.getElementById('assign-port-num').value);
  const clientId = document.getElementById('assign-client-select').value;
  const obs = document.getElementById('assign-obs').value;
  const clientEl = DB.elements.find(e => e.id == clientId);
  const payload = {
    client_id: clientId ? parseInt(clientId) : null,
    client_nome: clientEl ? clientEl.nome : '',
    status: clientId ? 'ocupada' : 'livre',
    obs: obs
  };
  const res = await api('PUT', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports/${portNum}`, payload);
  if(res) {
    closeModal('modal-cto-assign');
    // Recarregar e re-renderizar
    const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
    renderCtoPorts(ctoId, ports);
    toast(`Porta ${portNum} atualizada`, 'success');
  }
}

// ========== FUNÃ‡Ã•ES DO SPLITTER POR PORTA ==========

function openSplitPortModal(ctoId, portNum) {
  currentSplitCtoId = ctoId;
  currentSplitPortNum = portNum;
  openModal('modal-cto-split');
}

async function confirmSplitPort(type) {
  if (!currentSplitCtoId || !currentSplitPortNum) return;
  closeModal('modal-cto-split');
  toast(`â³ Aplicando splitter ${type} na porta ${currentSplitPortNum}...`, 'success');
  try {
    const res = await api('POST', `/api/projects/${currentProjectId}/ctos/${currentSplitCtoId}/ports/${currentSplitPortNum}/split`, { type: type });
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${currentSplitCtoId}/ports`);
      renderCtoPorts(currentSplitCtoId, ports);
      toast(`âœ… Porta ${currentSplitPortNum} expandida para ${type === '1:2' ? '2' : '4'} subportas.`, 'success');
    } else if (res && res.error) {
      toast(`âŒ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('âŒ Erro ao aplicar splitter', 'error');
  }
  currentSplitCtoId = null;
  currentSplitPortNum = null;
}

async function removeSplitter(ctoId, portNum) {
  if (!confirm(`Remover splitter da porta ${portNum}? Todas as subportas serÃ£o excluÃ­das.`)) return;
  try {
    const res = await api('DELETE', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports/${portNum}/split`);
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
      renderCtoPorts(ctoId, ports);
      toast(`âœ… Splitter removido da porta ${portNum}.`, 'success');
    } else if (res && res.error) {
      toast(`âŒ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('âŒ Erro ao remover splitter', 'error');
  }
}

function ctxCtoPorts() {
  if(ctxTargetId) openCtoPorts(ctxTargetId);
  hideCtxMenu();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SPLITTER CTO (NOVO)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openSplitCtoModal(ctoId) {
  currentCtoIdForSplit = ctoId;
  openModal('modal-cto-split');
}

async function confirmSplitCto(type) {
  if (!currentCtoIdForSplit) return;
  closeModal('modal-cto-split');
  toast(`â³ Expandindo CTO com splitter ${type}...`, 'success');
  try {
    const res = await api('POST', `/api/projects/${currentProjectId}/ctos/${currentCtoIdForSplit}/split`, { type: type });
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${currentCtoIdForSplit}/ports`);
      renderCtoPorts(currentCtoIdForSplit, ports);
      toast(`âœ… CTO expandido! Agora com ${ports.length} portas.`, 'success');
    } else if (res && res.error) {
      toast(`âŒ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('âŒ Erro ao expandir CTO', 'error');
  }
  currentCtoIdForSplit = null;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SIDEBAR & STATS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderSidebar(){
  const counts={};
  DB.elements.forEach(e=>{counts[e.tipo]=(counts[e.tipo]||0)+1;});
  document.getElementById('type-filter-list').innerHTML=
    [`<div class="elem-type-item ${!activeFilter?'active':''}" onclick="setFilter(null)">
      <div class="type-dot" style="background:var(--accent)"></div><span>Todos</span>
      <span style="margin-left:auto;font-size:10px;color:var(--text3)">${DB.elements.length}</span>
    </div>`].concat(
      Object.entries(TYPE_CONFIG).filter(([t])=>counts[t]).map(([tipo,tc])=>
        `<div class="elem-type-item ${activeFilter===tipo?'active':''}" onclick="setFilter('${tipo}')">
          <div class="type-dot" style="background:${tc.color}"></div><span>${tc.label}</span>
          <span style="margin-left:auto;font-size:10px;color:var(--text3)">${counts[tipo]||0}</span>
        </div>`)
    ).join('');
  const filtered=DB.elements.filter(elementMatchesFilters);
  document.getElementById('node-list').innerHTML=filtered.map(el=>{
    const tc=TYPE_CONFIG[el.tipo]||{};
    return `<div class="node-list-item ${selectedNodeId===el.id?'selected':''}" onclick="focusNode(${el.id})">
      <div class="node-status status-${el.status}"></div>
      <span style="color:${tc.color}">${ICONS[el.tipo]||''}</span>
      <span class="node-name">${el.nome}</span>
    </div>`;
  }).join('');
}

function setFilter(tipo){
  activeFilter=tipo;
  applyVisibilityFilters();
  renderSidebar();
}

function focusNode(id){
  selectedNodeId=id;
  const el=DB.elements.find(e=>e.id===id);
  if(el?.lat&&el?.lng){
    switchTab('geomap');
    geoMap.setView([el.lat,el.lng],16,{animate:true});
  } else {
    switchTab('topology');
    if(network) network.focus(id,{animation:{duration:500,easingFunction:'easeInOutCubic'},scale:1.2});
  }
  showPanel(id);renderSidebar();
}

function updateStats(){
  const a=DB.elements.filter(e=>e.status==='ativo').length;
  const o=DB.elements.filter(e=>e.status==='offline').length;
  const al=DB.elements.filter(e=>e.status==='alerta').length;
  document.getElementById('stat-ativos').textContent=a+' ativos';
  document.getElementById('stat-offline').textContent=o+' offline';
  document.getElementById('stat-alerta').textContent=al+' alerta';
  document.getElementById('ov-total').textContent=DB.elements.length;
  document.getElementById('ov-conn').textContent=DB.connections.length;
  document.getElementById('ov-clientes').textContent=DB.elements.filter(e=>e.tipo==='cliente').length;
  document.getElementById('ov-cto').textContent=DB.elements.filter(e=>e.tipo==='cto').length;
  document.getElementById('ov-olt').textContent=DB.elements.filter(e=>e.tipo==='olt').length;
  renderDashboard();
}

registerPublicApi('management', {
  openModal,
  closeModal,
  buildTypeSelector,
  selectType,
  openAddModal,
  saveElement,
  openEditModal,
  updateElement,
  deleteElement,
  openAddDioModal,
  saveDio,
  openPortModal,
  savePort,
  buildCableTipoSelect,
  updateCableFOCount,
  getCableFOCount,
  buildFiberColorGrid,
  pickFiberColor,
  openProjectsModal,
  renderProjectList,
  switchProject,
  createProject,
  duplicateProject,
  deleteProject,
  renderDioPanels,
  openCtoPorts,
  renderCtoPorts,
  openCtoAssignModal,
  saveCtoPortAssignment,
  openSplitPortModal,
  confirmSplitPort,
  removeSplitter,
  ctxCtoPorts,
  openSplitCtoModal,
  confirmSplitCto,
  renderSidebar,
  setFilter,
  focusNode,
  updateStats,
}, [
  'closeModal',
  'openAddDioModal',
  'openAddModal',
  'openEditModal',
  'saveDio',
  'saveElement',
  'savePort',
  'saveCtoPortAssignment',
  'createProject',
  'ctxCtoPorts',
  'updateElement',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

