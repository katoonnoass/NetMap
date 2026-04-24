// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function exportData(){
  const data=await api('GET',papi('/export'));
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentProjectId}.json`;a.click();
  toast('ðŸ“¥ Exportado!','success');
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
    toast('ðŸ”’ Sem permissao para importar geodados','error');
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
    toast('âŒ Use um arquivo .kml ou .kmz','error');
    event.target.value='';
    return;
  }
  const formData=new FormData();
  formData.append('file',file);
  try{
    const response=await fetch(papi('/import-geodata'),{method:'POST',body:formData});
    if(response.status===401){window.location.href='/login';return;}
    const payload=await response.json().catch(()=>({error:`HTTP ${response.status}`}));
    if(!response.ok){toast('âŒ '+(payload.error||'Falha ao importar'),'error');return;}
    await loadAll();
    await loadProjectInsights();
    updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderOrders();renderCables();renderValidation();renderReports();renderDashboard();
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
    toast('âŒ Erro ao importar arquivo geoespacial','error');
  }finally{
    event.target.value='';
  }
}

function exportProjectSummary(){
  const data = dashboardSummary || {};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentProjectId}_relatorio.json`;a.click();
  toast('ðŸ“„ RelatÃ³rio exportado','success');
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('collapsed');}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TOAST
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function toast(msg,type='success'){
  clearTimeout(toastTimer);
  const el=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  el.className=`show ${type}`;
  toastTimer=setTimeout(()=>el.className='',3500);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// KEYBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
document.addEventListener('keydown',async e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    hideCtxMenu();
    if(mapMode==='cable'||mapMode==='place'){setMapMode('select');toast('Modo cancelado','success');}
    return;
  }
  if(e.key==='Delete'||e.key==='Backspace'){
    const tag=document.activeElement?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
    if(!selectedNodeId) return;
    const el=DB.elements.find(x=>x.id===selectedNodeId);if(!el) return;
    if(!confirm(`Remover "${el.nome}"?`)) return;
    await deleteElement(selectedNodeId);
    selectedNodeId=null;
  }
});

registerPublicApi('shell', {
  exportData,
  downloadProjectAsset,
  exportKml,
  exportKmz,
  triggerGeoImport,
  handleGeoImport,
  exportProjectSummary,
  toggleSidebar,
  toast,
}, [
  'exportData',
  'exportKml',
  'exportKmz',
  'exportProjectSummary',
  'toggleSidebar',
  'triggerGeoImport',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUTH & PERMISSIONS
