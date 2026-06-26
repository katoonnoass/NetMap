// ═══════════════════════════════════════════════════════
async function exportData(){
  const data=await api('GET',papi('/export'));
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentProjectId}.json`;a.click();
  toast('📥 Exportado!','success');
}

function downloadProjectAsset(path){
  const a=document.createElement('a');
  a.href=`/api/projects/${currentProjectId}${path}`;
  a.rel='noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function exportKml(){
  downloadProjectAsset('/export/kml');
  toast('KML em download','success');
}

function exportKmz(){
  downloadProjectAsset('/export/kmz');
  toast('KMZ em download','success');
}

function triggerGeoImport(){
  if(!canDo('edit_elements')){
    toast('🔒 Sem permissão para importar geodados','error');
    return;
  }
  const input=document.getElementById('geo-import-input');
  input.value='';
  input.click();
}

async function handleGeoImport(event){
  const file=event.target.files?.[0];
  if(!file) return;
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(!['kml','kmz'].includes(ext)){
    toast('❌ Use um arquivo .kml ou .kmz','error');
    event.target.value='';
    return;
  }
    const formData=new FormData();
  formData.append('file',file);
  try{
    const headers={};
    if(_csrfToken) headers['X-CSRFToken']=_csrfToken;
    const response=await fetch(papi('/import-geodata'),{method:'POST',headers,body:formData,credentials:'same-origin'});
    if(response.status===401){window.location.href='/login';return;}
    const payload=await response.json().catch(()=>({error:`HTTP ${response.status}`}));
    if(!response.ok){toast('❌ '+(payload.error||'Falha ao importar'),'error');return;}
    await loadAll();
    await loadProjectInsights();
    showProjectAlerts();
    updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderCables();renderValidation();renderReports();renderDashboard();
    Object.values(mapMarkers).forEach(m=>geoMap.removeLayer(m));
    mapMarkers={};
    cableLayers.forEach(c=>geoMap.removeLayer(c.layer));
    cableLayers=[];
    refreshAllMarkers();
    refreshAllCables();
    if(network){
      const data=buildVisData();
      nodesDS.clear();edgesDS.clear();
      nodesDS.add(data.nodes);edgesDS.add(data.edges);
      Object.entries(DB.positions).forEach(([id,pos])=>{
        const nid=parseInt(id);
        if(nodesDS.get(nid)) nodesDS.update({id:nid,x:pos.x,y:pos.y});
      });
    }
    toast(`Importado: ${payload.imported_elements||0} elementos e ${payload.imported_connections||0} cabos`,'success');
  }catch(e){
    toast('❌ Erro ao importar arquivo geoespacial','error');
  }finally{
    event.target.value='';
  }
}

let _pendingImportFile=null;
function triggerJsonImport(){
  if(!canDo('edit_elements')){
    toast('🔒 Sem permissão para importar','error');
    return;
  }
  const input=document.getElementById('json-import-input');
  input.value='';
  input.click();
}

async function handleJsonImport(event){
  const file=event.target.files?.[0];
  if(!file) return;
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(ext!=='json'){
    toast('❌ Use um arquivo .json','error');
    event.target.value='';
    return;
  }
  _pendingImportFile=file;
  openModal('modal-import-mode');
}

async function confirmImportMode(mode){
  closeModal('modal-import-mode');
  const file=_pendingImportFile;
  _pendingImportFile=null;
  if(!file) return;
  const fd=new FormData();
  fd.append('file',file);
  fd.append('mode',mode);
  try{
    await apiUpload('POST',papi('/import-json'),fd);
    await loadAll();
    await loadProjectInsights();
    showProjectAlerts();
    updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderCables();renderValidation();renderReports();renderDashboard();
    Object.values(mapMarkers).forEach(m=>geoMap.removeLayer(m));
    mapMarkers={};
    cableLayers.forEach(c=>geoMap.removeLayer(c.layer));
    cableLayers=[];
    refreshAllMarkers();
    refreshAllCables();
    if(network){
      const data=buildVisData();
      nodesDS.clear();edgesDS.clear();
      nodesDS.add(data.nodes);edgesDS.add(data.edges);
      Object.entries(DB.positions).forEach(([id,pos])=>{
        const nid=parseInt(id);
        if(nodesDS.get(nid)) nodesDS.update({id:nid,x:pos.x,y:pos.y});
      });
    }
    toast('📥 JSON importado com sucesso!','success');
  }catch(e){
    toast('❌ Erro ao importar JSON','error');
  }finally{
    event.target.value='';
  }
}

function exportProjectSummary(){
  const data = dashboardSummary || {};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentProjectId}_relatorio.json`;a.click();
  toast('📄 Relatório JSON exportado','success');
}

function openHtmlReport(){
  window.open(papi('/report'),'_blank');
}

let _jsPdfLoaded = false;
async function _loadJsPdf(){
  if(_jsPdfLoaded) return true;
  if(typeof window.jspdf!=='undefined'){_jsPdfLoaded=true;return true;}
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src='/static/vendor/jspdf.umd.min.js';
    s.onload=()=>{_jsPdfLoaded=true;resolve(true);};
    s.onerror=()=>{toast('❌ Erro ao carregar jsPDF','error');resolve(false);};
    document.head.appendChild(s);
  });
}

async function printMap(){
  if(typeof leafletImage!=='function'){
    toast('❌ leaflet-image nao carregado','error');return;
  }
  toast('🖨️ Gerando imagem do mapa...','success');
  leafletImage(geoMap,function(err,canvas){
    if(err||!canvas){toast('❌ Erro ao capturar mapa','error');return;}
    const imgData=canvas.toDataURL('image/png');
    const w=window.open('','_blank');
    if(!w){toast('❌ Bloqueado pelo navegador','error');return;}
    const projectName=esc(dashboardSummary?.project_name||currentProjectId||'NetMap');
    w.document.write(`<!DOCTYPE html><html><head><title>Mapa — ${projectName}</title><style>@media print{body{margin:0}@page{size:landscape;margin:5mm}}body{margin:0;display:flex;flex-direction:column;align-items:center;font-family:sans-serif}h1{font-size:14px;margin:8px 0 4px;color:#1a1a2e}p{font-size:10px;color:#666;margin:0 0 6px}img{max-width:100%;max-height:85vh;border:1px solid #e0e0e0;border-radius:4px}</style></head><body><h1>Mapa: ${projectName}</h1><p>Gerado em ${new Date().toLocaleString('pt-BR')}</p><img src="${imgData}"><script>setTimeout(()=>{window.print();},500);<\/script></body></html>`);
    w.document.close();
  });
}

function toggleSidebar(){const sb=document.getElementById('sidebar');sb.classList.toggle('collapsed');const collapsed=sb.classList.contains('collapsed');const btn=document.getElementById('sidebar-toggle-btn');if(btn){btn.innerHTML=collapsed?'▸ Expandir':'◂ Recolher';btn.title=collapsed?'Expandir barra lateral':'Recolher barra lateral';}scheduleMapRender();}

// ═══════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════
function toast(msg,type='success'){
  clearTimeout(toastTimer);
  const el=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  el.className=`show ${type}`;
  toastTimer=setTimeout(()=>el.className='',3500);
}

async function checkHealth(){
  try{
    const r=await fetch('/api/health',{credentials:'same-origin'});
    const data=await r.json();
    const dot=document.getElementById('health-dot');
    const txt=document.getElementById('health-text');
    const badge=document.getElementById('health-badge');
    if(!dot||!txt) return;
    if(data.status==='ok'&&data.database_ok!==false){
      dot.style.background='var(--green)';txt.textContent='OK';
      badge.style.borderColor='var(--green)';badge.style.color='var(--green)';
      badge.title='Sistema operacional';
    }else{
      dot.style.background='var(--orange)';txt.textContent='Degradado';
      badge.style.borderColor='var(--orange)';badge.style.color='var(--orange)';
      badge.title='Sistema degradado — banco pode estar indisponível';
    }
  }catch(e){
    const dot=document.getElementById('health-dot');
    const txt=document.getElementById('health-text');
    const badge=document.getElementById('health-badge');
    if(dot){dot.style.background='var(--red)';}
    if(txt){txt.textContent='Erro';}
    if(badge){badge.style.borderColor='var(--red)';badge.style.color='var(--red)';badge.title='Sem resposta do servidor';}
  }
}
setInterval(checkHealth,60000);
setTimeout(checkHealth,3000);

// ═══════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown',async e=>{
  if(e.key==='Escape'){
    const ctxMenu=document.getElementById('ctx-menu');
    if(ctxMenu&&ctxMenu.classList.contains('open')){hideCtxMenu();return;}
    const quickAdd=document.getElementById('quick-add-popup');
    if(quickAdd&&quickAdd.classList.contains('open')){hideQuickAddPopup();return;}
    if(_modalStack.length){closeTopModal();return;}
    if(document.getElementById('right-panel')&&!document.getElementById('right-panel').classList.contains('hidden')){closePanel();return;}
    if(mapMode==='cable'||mapMode==='place'){
      if(mapMode==='cable'&&cableState&&cableState.waypoints.length>0){
        if(!confirm('Cancelar traçado de cabo? Os pontos serão perdidos.')) return;
      }
      const wasRedraw=_redrawCableId;
      setMapMode('select');toast('Modo cancelado','success');
      if(wasRedraw){const cid=wasRedraw;_redrawCableId=null;openEditCableModal(cid);}
      return;
    }
    return;
  }
  if(e.key==='Delete'||e.key==='Backspace'){
    const tag=document.activeElement?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
    if(!selectedNodeId) return;
    if(typeof canDo==='function'&&!canDo('edit_elements')) return;
    const el=DB.elements.find(x=>x.id===selectedNodeId);if(!el) return;
    const connected=DB.connections.filter(c=>c.from===el.id||c.to===el.id).length;
    let msg=`Remover "${el.nome}"?`;
    if(connected) msg+=`\n\n⚠️ ${connected} cabo(s) conectado(s) também será(ão) removido(s).`;
    msg+='\nEsta ação não pode ser desfeita.';
    if(!confirm(msg)) return;
    await deleteElement(selectedNodeId);
    selectedNodeId=null;
  }
});

function exportBackup(){
  const a=document.createElement('a');
  a.href=papi('/backup');
  a.rel='noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('💾 Backup em download!','success');
}

function triggerBackupRestore(){
  if(!canDo('manage_projects')){
    toast('🔒 Sem permissão para restaurar backup','error');
    return;
  }
  const input=document.getElementById('backup-restore-input');
  input.value='';
  input.click();
}

async function handleBackupRestore(event){
  const file=event.target.files?.[0];
  if(!file) return;
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(ext!=='zip'){
    toast('❌ Use um arquivo .zip','error');
    event.target.value='';
    return;
  }
  if(!confirm('Restaurar backup? Os dados atuais do projeto serão substituídos.')){
    event.target.value='';
    return;
  }
  const formData=new FormData();
  formData.append('file',file);
  try{
    const result=await apiUpload('POST',papi('/restore-backup'),formData);
    if(!result) return;
    await loadAll();
    await loadProjectInsights();
    showProjectAlerts();
    updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderCables();renderValidation();renderReports();renderDashboard();
    refreshAllMarkers();
    refreshAllCables();
    toast('📂 Backup restaurado! '+String(result.photos_restored||0)+' foto(s)','success');
  }catch(e){
    toast('❌ Erro ao restaurar backup','error');
  }finally{
    event.target.value='';
  }
}

registerPublicApi('shell', {
  exportData,
  downloadProjectAsset,
  exportKml,
  exportKmz,
  triggerGeoImport,
  handleGeoImport,
  triggerJsonImport,
  handleJsonImport,
  confirmImportMode,
  exportProjectSummary,
  openHtmlReport,
  toggleSidebar,
  toast,
  exportBackup,
  triggerBackupRestore,
  handleBackupRestore,
  printMap,
}, [
  'exportData',
  'exportKml',
  'exportKmz',
  'exportProjectSummary',
  'openHtmlReport',
  'toggleSidebar',
  'triggerGeoImport',
  'triggerJsonImport',
  'exportBackup',
  'triggerBackupRestore',
  'printMap',
]);

// ═══════════════════════════════════════════════════════
// AUTH & PERMISSIONS
