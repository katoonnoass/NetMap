// MODALS
// ═══════════════════════════════════════════════════════
let _lastFocusedElement=null;
let _focusTrapHandler=null;
function openModal(id){
  _lastFocusedElement=document.activeElement;
  const modal=document.getElementById(id);
  modal.classList.add('open');
  _modalStack.push(id);
  _installFocusTrap(modal);
  setTimeout(()=>{const focusable=modal.querySelector('input:not([type=hidden]),select,textarea,button.btn-primary');if(focusable)focusable.focus();},50);
}
function closeModal(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('open');
  _removeFocusTrap();
  _modalStack=_modalStack.filter(m=>m!==id);
  if(_lastFocusedElement&&document.body.contains(_lastFocusedElement)){try{_lastFocusedElement.focus();}catch(e){}}
  else{document.body.focus();}
  _lastFocusedElement=null;
}
function closeTopModal(){
  if(!_modalStack.length) return;
  closeModal(_modalStack[_modalStack.length-1]);
}
function _installFocusTrap(modal){
  _removeFocusTrap();
  _focusTrapHandler=function(e){
    if(e.key!=='Tab') return;
    const focusable=modal.querySelectorAll('input:not([type=hidden]),select,textarea,button,[tabindex]:not([tabindex="-1"])');
    if(!focusable.length) return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
    else{if(document.activeElement===last){e.preventDefault();first.focus();}}
  };
  modal.addEventListener('keydown',_focusTrapHandler);
}
function _removeFocusTrap(){
  if(_focusTrapHandler){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.removeEventListener('keydown',_focusTrapHandler));
    _focusTrapHandler=null;
  }
}

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
  if(!selectedAddType){toast('⚠️ Selecione o tipo','error');return;}
  
  const lat=parseFloat(document.getElementById('add-lat').value)||null;
  const lng=parseFloat(document.getElementById('add-lng').value)||null;
  
  // Nome opcional: gera automático se vazio
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
   capacity: capacity,
   draft: draftMode || undefined,
 });
  
  if(!created||!created.id) return;
  DB.elements.push(created);
  closeModal('modal-add');
  addOrUpdateMarker(created);
  if(nodesDS) nodesDS.add({id:created.id,label:created.nome,shape:'dot',color:{background:TYPE_CONFIG[created.tipo]?.color+'22',border:TYPE_CONFIG[created.tipo]?.color||'#888'},font:{color:'#e8edf5',size:12},size:18});
  updateStats();renderSidebar();renderTable();
  if(!lat||!lng){
    toast(`✅ Adicionado! Use 📍 Posicionar para colocar no mapa`,'success');
    placeTargetId=created.id;
    setMapMode('place');
    switchTab('geomap');
  } else {
    toast('✅ Elemento adicionado!','success');
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
  document.getElementById('edit-draft').checked=!!el.draft;
  const posteFields=document.getElementById('poste-fields');
  if(posteFields) posteFields.style.display=el.tipo==='poste'?'block':'none';
  document.getElementById('edit-altura').value=el.altura||'';
  document.getElementById('edit-material').value=el.material||'';
  document.getElementById('edit-proprietario').value=el.proprietario||'';
  document.getElementById('edit-ultima-inspecao').value=el.ultima_inspecao||'';
  document.getElementById('edit-delete-btn').onclick=()=>deleteElement(id);
  loadElementPhotos(id);
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
    draft: document.getElementById('edit-draft').checked || false,
    altura: parseFloat(document.getElementById('edit-altura').value) || null,
    material: document.getElementById('edit-material').value || null,
    proprietario: document.getElementById('edit-proprietario').value.trim() || null,
    ultima_inspecao: document.getElementById('edit-ultima-inspecao').value || null,
  };
  await api('PUT',papi(`/elements/${id}`),updated);
  const idx=DB.elements.findIndex(e=>e.id===id);
  const oldNome = idx>=0 ? DB.elements[idx].nome : '';
  if(idx>=0) DB.elements[idx]={...DB.elements[idx],...updated,id};
  closeModal('modal-edit');
  addOrUpdateMarker(DB.elements.find(e=>e.id===id));
  refreshAllCables();
  if(nodesDS) nodesDS.update({id,label:updated.nome,color:{background:(TYPE_CONFIG[updated.tipo]?.color||'#888')+'22',border:TYPE_CONFIG[updated.tipo]?.color||'#888'}});
  if(selectedNodeId===id) showPanel(id);
  updateStats();renderSidebar();renderTable();
  if (updated.tipo === 'dio') {
    const dio = DB.dios.find(d => d.name === oldNome);
    if (dio) dio.name = updated.nome;
    renderDioPanels();
  }
  toast('💾 Atualizado!','success');
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
  toast('🗑️ Removido','success');
}

async function loadElementPhotos(eid){
  const gallery=document.getElementById('edit-photos-gallery');
  if(!gallery) return;
  const photos=await api('GET',papi('/elements/'+eid+'/photos'));
  if(!photos||!photos.length){gallery.innerHTML='<span style="font-size:10px;color:var(--text3)">Nenhuma foto.</span>';return;}
  gallery.innerHTML=photos.map(p=>`
    <div class="photo-thumb-wrap">
      <a href="${p.url}" target="_blank"><img src="${p.url}" class="photo-thumb" loading="lazy"></a>
      <button class="photo-delete-btn" onclick="deletePhoto(${eid},'${p.filename}')" title="Excluir foto">×</button>
    </div>`).join('');
}

async function uploadPhotos(){
  const input=document.getElementById('edit-photo-input');
  const eid=parseInt(document.getElementById('edit-id').value);
  if(!input||!input.files.length||!eid) return;
  for(const file of input.files){
    const fd=new FormData();fd.append('file',file);
    await apiUpload('POST',papi('/elements/'+eid+'/photos'),fd);
  }
  input.value='';
  loadElementPhotos(eid);
  toast('📷 Foto(s) enviada(s)!','success');
}

async function deletePhoto(eid,filename){
  if(!confirm('Excluir esta foto?')) return;
  await api('DELETE',papi('/elements/'+eid+'/photos/'+filename));
  loadElementPhotos(eid);
}

// ─── DIO ───
function openAddDioModal(){
  document.getElementById('dio-edit-id').value='';
  document.getElementById('dio-id').value='';
  document.getElementById('dio-id').disabled=false;
  document.getElementById('dio-name').value='';
  document.getElementById('dio-loc').value='';
  document.getElementById('dio-cap').value='24';
  document.getElementById('dio-modal-title').textContent='Novo DIO';
  document.getElementById('dio-save-btn-text').textContent='Criar DIO';
  openModal('modal-dio');
}
function editDio(dioId){
  const dio=DB.dios.find(d=>d.id===dioId);if(!dio) return;
  document.getElementById('dio-edit-id').value=dio.id;
  document.getElementById('dio-id').value=dio.id;
  document.getElementById('dio-id').disabled=true;
  document.getElementById('dio-name').value=dio.name;
  document.getElementById('dio-loc').value=dio.location||'';
  document.getElementById('dio-cap').value=dio.capacity||24;
  document.getElementById('dio-modal-title').textContent='Editar DIO';
  document.getElementById('dio-save-btn-text').textContent='Salvar';
  openModal('modal-dio');
}
async function deleteDio(dioId){
  if(!confirm('Excluir DIO e todas as portas?')) return;
  const res=await api('DELETE',papi('/dios/'+dioId));
  if(!res) return;
  DB.dios=DB.dios.filter(d=>d.id!==dioId);
  renderDioPanels();
  toast('🗑️ DIO removido','success');
}
async function saveDio(){
  const editId=document.getElementById('dio-edit-id').value;
  const id=document.getElementById('dio-id').value.trim();
  const name=document.getElementById('dio-name').value.trim();
  if(!id||!name){toast('⚠️ Preencha ID e Nome','error');return;}
  const cap=parseInt(document.getElementById('dio-cap').value)||24;
  if(editId){
    await api('PUT',papi('/dios/'+editId),{name,location:document.getElementById('dio-loc').value.trim(),capacity:cap});
  }else{
    await api('POST',papi('/dios'),{id,name,location:document.getElementById('dio-loc').value.trim(),capacity:cap,ports:Array.from({length:cap},(_,i)=>({num:i+1,status:'livre',client:'',color:'N/A'}))});
  }
  closeModal('modal-dio');
  document.getElementById('dio-edit-id').value='';
  document.getElementById('dio-id').disabled=false;
  document.getElementById('dio-modal-title').textContent='Novo DIO';
  document.getElementById('dio-save-btn-text').textContent='Criar DIO';
  DB.dios=await api('GET',papi('/dios'));
  renderDioPanels();
  toast(editId?'💾 DIO atualizado!':'📦 DIO criado!','success');
}

function openPortModal(dioId,portNum){
  const dio=DB.dios.find(d=>d.id===dioId);if(!dio) return;
  const port=dio.ports.find(p=>p.num===portNum);if(!port) return;
  document.getElementById('port-modal-title').textContent=`Porta ${portNum} — ${dioId}`;
  document.getElementById('port-dio-id').value=dioId;
  document.getElementById('port-num').value=portNum;
  document.getElementById('port-status').value=port.status;
  document.getElementById('port-client').value=port.client||'';
  document.getElementById('port-fibra').value=port.fibra||'';
  document.getElementById('port-nome').value=port.nome||'';
  selectedPortFiberColor=port.color||'Azul';
  buildFiberColorGrid('port-fiber-grid','selectedPortFiberColor');
  openModal('modal-port');
}
async function savePort(){
  const dioId=document.getElementById('port-dio-id').value;
  const portNum=parseInt(document.getElementById('port-num').value);
  await api('PUT',papi(`/dios/${dioId}/ports/${portNum}`),{status:document.getElementById('port-status').value,client:document.getElementById('port-client').value.trim(),color:selectedPortFiberColor,fibra:document.getElementById('port-fibra').value.trim(),nome:document.getElementById('port-nome').value.trim()});
  closeModal('modal-port');
  DB.dios=await api('GET',papi('/dios'));
  renderDioPanels();toast('🔌 Porta atualizada!','success');
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
    `<optgroup label="── ${g} ──">${items.map(ct=>`<option value="${ct.label}" data-fo="${ct.fo}">${ct.label}${ct.fo>0?' ('+ct.fo+'FO)':''}</option>`).join('')}</optgroup>`
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

// ─── PROJECTS ───
async function openProjectsModal(){
  const projects=await api('GET','/api/projects');
  renderProjectList(projects);
  openModal('modal-projects');
}
let _lastProjectList=[];
function renderProjectList(projects){
  _lastProjectList=projects||[];
  const colors=['#ff6b6b','#ff9100','#0080ff','#00e676','#c77dff','#ffe066'];
  document.getElementById('project-list').innerHTML=projects.map((p,i)=>{
    const color=colors[i%colors.length];
    const isActive=p.id===currentProjectId;
    return `<div class="project-card ${isActive?'active':''}" onclick="switchProject('${p.id}')">
      <div class="proj-icon" style="background:${color}22;color:${color}">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M2 9h18" stroke="currentColor" stroke-width="1.3"/></svg>
      </div>
      <div class="proj-info">
        <div class="proj-title">${esc(p.name)}</div>
        ${p.description?`<div class="proj-desc">${esc(p.description)}</div>`:''}
        <div class="proj-meta">${p.elements} elem · ${p.connections} cabos · ${p.created_at||'—'}</div>
      </div>
      <div class="proj-actions">
        ${isActive?`<span style="font-size:10px;color:var(--accent);font-weight:700;padding:4px 7px">● Ativo</span>`:''}
        <button class="proj-btn" aria-label="Editar projeto" onclick="event.stopPropagation();editProject('${p.id}')" title="Editar">✏️</button>
        <button class="proj-btn" aria-label="Duplicar projeto" onclick="event.stopPropagation();duplicateProject('${p.id}')" title="Duplicar">⎘</button>
        ${!isActive?`<button class="proj-btn danger" aria-label="Excluir projeto" onclick="event.stopPropagation();deleteProject('${p.id}')" title="Excluir">🗑</button>`:''}
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
  showProjectAlerts();
  // Clear map
  Object.values(mapMarkers).forEach(m=>geoMap.removeLayer(m));
  mapMarkers={};
  cableLayers.forEach(c=>geoMap.removeLayer(c.layer));
  cableLayers=[];
  refreshAllMarkers();
  refreshAllCables();
  if(network){network.destroy();network=null;}
  if(document.getElementById('view-topology').classList.contains('active')) initTopology();
  updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderCables();renderValidation();renderReports();renderIxcSettings();
  const projects=await api('GET','/api/projects');
  const p=projects.find(x=>x.id===pid);
  document.getElementById('topbar-project-name').textContent=p?.name||pid;
  closeModal('modal-projects');
  selectedNodeId=null;closePanel();
  toast(`📂 ${esc(p?.name||pid)}`,'success');
}
async function createProject(){
  const name=document.getElementById('new-proj-name').value.trim();
  if(!name){toast('⚠️ Informe o nome','error');return;}
  await api('POST','/api/projects',{name,description:document.getElementById('new-proj-desc').value.trim()});
  document.getElementById('new-proj-name').value='';
  document.getElementById('new-proj-desc').value='';
  toast(`✅ Projeto "${esc(name)}" criado!`,'success');
  renderProjectList(await api('GET','/api/projects'));
}
async function duplicateProject(pid){
  const r=await api('POST',`/api/projects/${pid}/duplicate`);
  toast(`📋 ${esc(r.name)}`,'success');
  renderProjectList(await api('GET','/api/projects'));
}
async function deleteProject(pid){
  if(!confirm('Excluir projeto?')) return;
  await api('DELETE',`/api/projects/${pid}`);
  renderProjectList(await api('GET','/api/projects'));
}

function editProject(pid){
  const p=_lastProjectList.find(x=>x.id===pid);
  document.getElementById('proj-edit-id').value=pid;
  document.getElementById('proj-edit-name').value=p?p.name:'';
  document.getElementById('proj-edit-desc').value=p?p.description||'':'';
  openModal('modal-project-edit');
}
async function saveProjectEdit(){
  const pid=document.getElementById('proj-edit-id').value;
  const newName=document.getElementById('proj-edit-name').value.trim();
  const newDesc=document.getElementById('proj-edit-desc').value.trim();
  if(!newName){toast('⚠️ Nome obrigatório','error');return;}
  await api('PUT',`/api/projects/${pid}`,{name:newName,description:newDesc});
  if(pid===currentProjectId){
    const projName=document.getElementById('topbar-project-name');
    if(projName) projName.textContent=newName;
  }
  closeModal('modal-project-edit');
  renderProjectList(await api('GET','/api/projects'));
  toast('💾 Projeto atualizado','success');
}

// ═══════════════════════════════════════════════════════
// DIO RENDER
// ═══════════════════════════════════════════════════════
function renderDioPanels(){
  const container=document.getElementById('dio-panels-container');
  if(!DB.dios.length){container.innerHTML='<div style="color:var(--text3);padding:16px">Nenhum DIO cadastrado.</div>';return;}
  container.innerHTML=DB.dios.map(dio=>{
    const occ=dio.ports.filter(p=>p.status==='ocupada').length;
    const cols=Math.min(12,dio.capacity);
    return `<div class="dio-rack">
      <div class="dio-rack-header" style="cursor:pointer">
        <div style="flex:1" onclick="focusDioElement('${dio.id.replace(/'/g, "\\'")}')"><div class="dio-rack-name">${esc(dio.id)} — ${esc(dio.name)}</div><div style="font-size:10px;color:var(--text2)">${esc(dio.location||'')}</div></div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
          <div class="dio-rack-info">${occ}/${dio.capacity} ocup.</div>
          <button class="btn-ghost" aria-label="Editar DIO" title="Editar DIO" onclick="event.stopPropagation();editDio('${dio.id.replace(/'/g, "\\'")}')" style="padding:2px 6px;font-size:11px;border-radius:5px;line-height:1">✏️</button>
          <button class="btn-ghost" aria-label="Excluir DIO" title="Excluir DIO" onclick="event.stopPropagation();deleteDio('${dio.id.replace(/'/g, "\\'")}')" style="padding:2px 6px;font-size:11px;border-radius:5px;line-height:1;color:var(--red)">🗑️</button>
          <button class="btn-ghost" aria-label="Localizar no mapa" title="Localizar no mapa" onclick="event.stopPropagation();focusDioElement('${dio.id.replace(/'/g, "\\'")}')" style="padding:2px 6px;font-size:11px;border-radius:5px;line-height:1">📍</button>
        </div>
      </div>
      <div class="dio-ports-grid" style="grid-template-columns:repeat(${cols},1fr)">
        ${dio.ports.map(p=>`<div class="port-cell ${p.status}" onclick="openPortModal('${dio.id}',${p.num})" title="${p.num}${p.client?': '+esc(p.client):''}">
          <span class="port-num">${p.num}</span>
          ${p.color&&p.color!=='N/A'?`<span style="width:14px;height:14px;border-radius:50%;background:${FIBER_COLORS[p.color]||'#666'};margin:2px 0;flex-shrink:0"></span>`:''}
          <span class="port-label">${esc(p.client||'')}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function focusDioElement(dioId){
  const dioRec=DB.dios.find(d=>d.id===dioId);
  const dioName=dioRec?dioRec.name:dioId;
  let el = DB.elements.find(e => e.tipo === 'dio' && e.nome === dioName);
  if (!el) el = DB.elements.find(e => e.tipo === 'dio' && dioName.includes(e.nome));
  if (!el) el = DB.elements.find(e => e.tipo === 'dio' && e.nome.includes(dioName));
  if (!el) { toast('⚠️ DIO sem elemento no mapa. Crie pelo clique direito no mapa','error'); return; }
  if(el.lat&&el.lng){
    switchTab('geomap');
    geoMap.setView([el.lat,el.lng],18,{animate:true});
    setTimeout(()=>handleMarkerClick(el.id),400);
  } else {
    toast('⚠️ DIO sem coordenadas. Posicione no mapa primeiro','error');
  }
}

// ═══════════════════════════════════════════════════════
// CTO PORTS (com splitter)
// ═══════════════════════════════════════════════════════
async function openCtoPorts(ctoId) {
  const cto = DB.elements.find(e => e.id === ctoId && e.tipo === 'cto');
  if (!cto) return;
  document.getElementById('cto-ports-title').innerHTML = `📦 Portas CTO — ${esc(cto.nome)}`;
  _currentCtoId = ctoId;
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
  // Ordena subportas por índice
  for (const parent in subPortsByParent) {
    subPortsByParent[parent].sort((a, b) => (a.subport_index || 0) - (b.subport_index || 0));
  }

  const cols = 5; // Mantém 5 colunas para cards mais largos
  let html = `
    <div style="margin-bottom:12px; display:flex; gap:16px; flex-wrap:wrap; font-size:11px">
      <label style="cursor:pointer"><input type="checkbox" id="cto-select-all" onchange="ctoToggleAll(this.checked)" style="margin-right:4px"> Todos</label>
      <span><span style="background:rgba(0,230,118,.2);padding:2px 8px;border-radius:12px;">🟢 Ocupada</span></span>
      <span><span style="background:rgba(255,255,255,.05);padding:2px 8px;border-radius:12px;">⚪ Livre</span></span>
      <span><span style="background:rgba(255,61,87,.2);padding:2px 8px;border-radius:12px;">🔴 Manutenção</span></span>
      <span><span style="background:rgba(255,145,0,.2);padding:2px 8px;border-radius:12px;">🔀 Splitter</span></span>
    </div>
    <div style="display:grid; grid-template-columns:repeat(${cols},1fr); gap:8px">
  `;

  for (const port of rootPorts) {
    const hasSplitter = port.splitter_type && port.splitter_type !== null;
    const splitterCount = hasSplitter ? (port.splitter_type === '1:2' ? 2 : 4) : 1;

    html += `<div class="port-cell" style="background:rgba(255,255,255,.05); border:1px solid var(--border); padding:6px 4px; border-radius:8px; text-align:center; position:relative;">`;
    html += `<div style="font-weight:700; font-size:13px; margin-bottom:2px;"><label style="cursor:pointer"><input type="checkbox" class="cto-port-check" value="${port.num}" onchange="ctoBulkBarRefresh()" style="margin-right:4px">Porta ${port.num}</label></div>`;

    if (!hasSplitter) {
      let statusIcon = '⚪';
      let bgColor = 'rgba(255,255,255,.05)';
      if (port.status === 'ocupada') { bgColor = 'rgba(0,230,118,.15)'; statusIcon = '🟢'; }
      else if (port.status === 'manutencao') { bgColor = 'rgba(255,61,87,.15)'; statusIcon = '🔴'; }
      html += `<div style="background:${bgColor}; border-radius:6px; padding:4px; cursor:pointer" onclick="openCtoAssignModal(${ctoId}, ${port.num})">
        <div style="font-size:12px;">${statusIcon} ${port.status === 'ocupada' ? esc(port.client_nome || 'Cliente') : 'Livre'}</div>
        ${port.obs ? `<div style="font-size:9px; color:var(--text3); margin-top:2px">${esc(port.obs)}</div>` : ''}
      </div>`;
      html += `<button class="btn-ghost" style="margin-top:4px; padding:2px 4px; font-size:9px" onclick="event.stopPropagation(); openSplitPortModal(${ctoId}, ${port.num})">🔀 Splitter</button>`;
    } else {
      const subPorts = subPortsByParent[port.num] || [];
      subPorts.sort((a,b) => (a.subport_index || 0) - (b.subport_index || 0));
      const firstSub = subPorts[0];
      const firstSubNum = firstSub ? firstSub.num : null;
      
      // Container do splitter com margens reduzidas
      html += `<div style="position:relative; margin:2px 0 0 0; cursor:pointer" onclick="if(${firstSubNum}) openCtoAssignModal(${ctoId}, ${firstSubNum}); else toast('Nenhuma subporta disponível', 'error')">`;
      html += `<div style="height:2px; background:var(--border2); margin:4px 0;"></div>`;
      html += `<div style="display:flex; justify-content:space-around; margin-top:2px;">`;
      
      for (let i = 0; i < splitterCount; i++) {
        const sub = subPorts[i];
        const subNum = sub ? sub.num : null;
        const clientName = sub && sub.client_nome ? sub.client_nome : 'Livre';
        const isOccupied = sub && sub.status === 'ocupada';
        const bolhaClass = isOccupied ? 'ocupada' : 'livre';
        html += `<div style="text-align:center; cursor:pointer" onclick="event.stopPropagation(); if(${subNum}) openCtoAssignModal(${ctoId}, ${subNum}); else toast('Subporta não encontrada', 'error')">
          <div class="splitter-bolha ${bolhaClass}" style="width:18px; height:18px; margin:0 auto;"></div>
          <div class="splitter-label" style="font-size:7px; margin-top:1px;">${esc(clientName.substring(0,4))}</div>
        </div>`;
      }
      html += `</div></div>`;
      html += `<button class="btn-danger" style="margin-top:4px; padding:2px 4px; font-size:8px" onclick="event.stopPropagation(); removeSplitter(${ctoId}, ${port.num})">🗑️ Remover Splitter</button>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  document.getElementById('cto-ports-body').innerHTML = html;
}

async function openCtoAssignModal(ctoId, portNum) {
  document.getElementById('assign-cto-id').value = ctoId;
  document.getElementById('assign-port-num').value = portNum;
  // Carregar lista de clientes/ONUs disponíveis
  const clientes = DB.elements.filter(e => e.tipo === 'cliente' || e.tipo === 'onu');
  const select = document.getElementById('assign-client-select');
  select.innerHTML = '<option value="">— Nenhum (desassociar) —</option>' +
    clientes.map(c => `<option value="${c.id}">${esc(c.nome)} (${c.tipo})</option>`).join('');
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

// ========== FUNÇÕES DO SPLITTER POR PORTA ==========

function openSplitPortModal(ctoId, portNum) {
  currentSplitCtoId = ctoId;
  currentSplitPortNum = portNum;
  openModal('modal-cto-split');
}

async function confirmSplitPort(type) {
  if (!currentSplitCtoId || !currentSplitPortNum) return;
  closeModal('modal-cto-split');
  toast(`⏳ Aplicando splitter ${type} na porta ${currentSplitPortNum}...`, 'success');
  try {
    const res = await api('POST', `/api/projects/${currentProjectId}/ctos/${currentSplitCtoId}/ports/${currentSplitPortNum}/split`, { type: type });
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${currentSplitCtoId}/ports`);
      renderCtoPorts(currentSplitCtoId, ports);
      toast(`✅ Porta ${currentSplitPortNum} expandida para ${type === '1:2' ? '2' : '4'} subportas.`, 'success');
    } else if (res && res.error) {
      toast(`❌ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('❌ Erro ao aplicar splitter', 'error');
  }
  currentSplitCtoId = null;
  currentSplitPortNum = null;
}

async function removeSplitter(ctoId, portNum) {
  if (!confirm(`Remover splitter da porta ${portNum}? Todas as subportas serão excluídas.`)) return;
  try {
    const res = await api('DELETE', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports/${portNum}/split`);
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
      renderCtoPorts(ctoId, ports);
      toast(`✅ Splitter removido da porta ${portNum}.`, 'success');
    } else if (res && res.error) {
      toast(`❌ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('❌ Erro ao remover splitter', 'error');
  }
}

function ctxCtoPorts() {
  if(ctxTargetId) openCtoPorts(ctxTargetId);
  hideCtxMenu();
}

function ctoToggleAll(checked) {
  document.querySelectorAll('.cto-port-check').forEach(cb => { cb.checked = checked; });
  ctoBulkBarRefresh();
}

function ctoBulkSelectNone() {
  document.querySelectorAll('.cto-port-check').forEach(cb => { cb.checked = false; });
  ctoBulkBarRefresh();
}

function ctoBulkBarRefresh() {
  const checked = document.querySelectorAll('.cto-port-check:checked');
  const bar = document.getElementById('cto-bulk-bar');
  const count = document.getElementById('cto-bulk-count');
  if (checked.length > 0) {
    bar.style.display = 'flex';
    count.textContent = checked.length + ' porta(s) selecionada(s)';
  } else {
    bar.style.display = 'none';
  }
}

async function bulkUpdateCtoPorts() {
  const checked = document.querySelectorAll('.cto-port-check:checked');
  if (!checked.length) { toast('Selecione ao menos uma porta', 'error'); return; }
  const port_nums = Array.from(checked).map(cb => parseInt(cb.value));
  const changes = {};
  const status = document.getElementById('cto-bulk-status').value;
  const obs = document.getElementById('cto-bulk-obs').value.trim();
  if (status) changes.status = status;
  if (obs) changes.obs = obs;
  if (!Object.keys(changes).length) { toast('Informe status ou observação', 'error'); return; }

  const ctoId = _currentCtoId;
  if (!ctoId) return;

  const res = await api('POST', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports/bulk-update`, { port_nums, changes });
  if (res && !res.error) {
    toast(`${res.updated} porta(s) atualizada(s)`, 'success');
    const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${ctoId}/ports`);
    renderCtoPorts(ctoId, ports);
    document.getElementById('cto-bulk-status').value = '';
    document.getElementById('cto-bulk-obs').value = '';
    ctoBulkBarRefresh();
  } else if (res && res.error) {
    toast(res.error, 'error');
  }
}

// ═══════════════════════════════════════════════════════
// SPLITTER CTO (NOVO)
// ═══════════════════════════════════════════════════════

function openSplitCtoModal(ctoId) {
  currentCtoIdForSplit = ctoId;
  openModal('modal-cto-split');
}

async function confirmSplitCto(type) {
  if (!currentCtoIdForSplit) return;
  closeModal('modal-cto-split');
  toast(`⏳ Expandindo CTO com splitter ${type}...`, 'success');
  try {
    const res = await api('POST', `/api/projects/${currentProjectId}/ctos/${currentCtoIdForSplit}/split`, { type: type });
    if (res && !res.error) {
      const ports = await api('GET', `/api/projects/${currentProjectId}/ctos/${currentCtoIdForSplit}/ports`);
      renderCtoPorts(currentCtoIdForSplit, ports);
      toast(`✅ CTO expandido! Agora com ${ports.length} portas.`, 'success');
    } else if (res && res.error) {
      toast(`❌ ${res.error}`, 'error');
    }
  } catch (e) {
    toast('❌ Erro ao expandir CTO', 'error');
  }
  currentCtoIdForSplit = null;
}

// ═══════════════════════════════════════════════════════
// SIDEBAR & STATS
// ═══════════════════════════════════════════════════════
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
      <span class="node-name">${esc(el.nome)}</span>
    </div>`;
  }).join('');
}

function setFilter(tipo){
  showOnlyUnpositioned=false;
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
  refreshAllMarkers();
}

function updateStats(){
  const a=DB.elements.filter(e=>e.status==='ativo').length;
  const o=DB.elements.filter(e=>e.status==='offline').length;
  const al=DB.elements.filter(e=>e.status==='alerta').length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-ativos', a+' ativos');
  set('stat-offline', o+' offline');
  set('stat-alerta', al+' alerta');
  renderDashboard();
}

registerPublicApi('management', {
  openModal,
  closeModal,
  closeTopModal,
  buildTypeSelector,
  selectType,
  openAddModal,
  saveElement,
  openEditModal,
  updateElement,
  deleteElement,
  loadElementPhotos,
  uploadPhotos,
  deletePhoto,
  openAddDioModal,
  saveDio,
  editDio,
  deleteDio,
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
  editProject,
  saveProjectEdit,
  renderDioPanels,
  focusDioElement,
  openCtoPorts,
  renderCtoPorts,
  openCtoAssignModal,
  saveCtoPortAssignment,
  openSplitPortModal,
  confirmSplitPort,
  removeSplitter,
  ctxCtoPorts,
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
  'selectType',
  'focusDioElement',
  'editDio',
  'deleteDio',
  'uploadPhotos',
  'deletePhoto',
  'editProject',
  'saveProjectEdit',
]);

// ═══════════════════════════════════════════════════════

