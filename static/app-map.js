// GEO MAP INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function initGeoMap(){
  if(geoMap) return;
  geoMap=L.map('geo-map',{center:[-16.8225,-49.245],zoom:13,zoomControl:true,attributionControl:true});
  tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'Â© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom:19,
  }).addTo(geoMap);

  // Map click handler
  geoMap.on('click',handleMapClick);
  geoMap.on('mousemove',handleMapMouseMove);
  geoMap.on('contextmenu',e=>{e.originalEvent.preventDefault();});

  setTimeout(()=>geoMap.invalidateSize(),300);
}

function changeMapLayer(val){
  if(tileLayer) geoMap.removeLayer(tileLayer);
  if(val==='satellite'){
    tileLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {attribution:'Â© Esri',maxZoom:19}).addTo(geoMap);
  } else if(val==='dark'){
    tileLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {attribution:'Â© Esri',maxZoom:16}).addTo(geoMap);
  } else {
    tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {attribution:'Â© OpenStreetMap',maxZoom:19}).addTo(geoMap);
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAP MARKERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function createMarkerIcon(el, selected=false){
  const tc=TYPE_CONFIG[el.tipo]||{color:'#888'};
  const color=tc.color;
  const statusColor=el.status==='offline'?'#ff3d57':el.status==='alerta'?'#ff9100':color;
  const bg=el.status==='offline'?'rgba(255,61,87,.18)':el.status==='alerta'?'rgba(255,145,0,.18)':color+'22';
  const selRing=selected?`box-shadow:0 0 0 3px rgba(255,255,255,0.5);`:'';
  const iconSvg=ICONS[el.tipo]||'';
  const html=`<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:2.5px solid ${statusColor};display:flex;align-items:center;justify-content:center;cursor:pointer;${selRing}transition:transform .15s;color:${color};position:relative">
    ${iconSvg}
    <div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:${statusColor};border:2px solid #080c14"></div>
  </div>
  <div style="position:absolute;top:38px;left:50%;transform:translateX(-50%);background:rgba(8,12,20,.9);color:#e8edf5;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;font-family:sans-serif;pointer-events:none;border:1px solid rgba(255,255,255,.1)">${el.nome}</div>`;
  return L.divIcon({html,className:'map-node-marker',iconSize:[36,36],iconAnchor:[18,18],popupAnchor:[0,-24]});
}

function addOrUpdateMarker(el) {
  const pos = el.lat && el.lng ? [el.lat, el.lng] : null;
  if (!pos) {
    if (mapMarkers[el.id]) {
      geoMap.removeLayer(mapMarkers[el.id]);
      delete mapMarkers[el.id];
    }
    return;
  }
  if (mapMarkers[el.id]) {
    mapMarkers[el.id].setLatLng(pos);
    mapMarkers[el.id].setIcon(createMarkerIcon(el, selectedNodeId === el.id));
  } else {
    const m = L.marker(pos, {
      icon: createMarkerIcon(el, selectedNodeId === el.id),
      draggable: false
    }).addTo(geoMap);
    m.elementId = el.id;
    m.on('click', e => {
      L.DomEvent.stopPropagation(e);
      handleMarkerClick(el.id, e);
    });
    m.on('dblclick', e => {
      L.DomEvent.stopPropagation(e);
      openEditModal(el.id);
    });
    m.on('contextmenu', e => {
      L.DomEvent.stopPropagation(e);
      ctxTargetId = el.id;
      ctxTargetType = null;   // linha adicionada
      showCtxMenu(e.originalEvent.clientX, e.originalEvent.clientY);
    });
    mapMarkers[el.id] = m;
  }
}

function removeMarker(id){
  if(mapMarkers[id]){geoMap.removeLayer(mapMarkers[id]);delete mapMarkers[id];}
}

function refreshAllMarkers(){
  // Remove markers for deleted elements
  Object.keys(mapMarkers).forEach(id=>{
    if(!DB.elements.find(e=>e.id==id)) removeMarker(id);
  });
  DB.elements.forEach(el=>addOrUpdateMarker(el));
  applyVisibilityFilters();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CABLE POLYLINES ON MAP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function drawCableOnMap(conn){
  // Remove existing
  removeCableFromMap(conn.id);
  const waypoints=conn.waypoints||[];
  const fromEl=DB.elements.find(e=>e.id===conn.from);
  const toEl=DB.elements.find(e=>e.id===conn.to);
  if(!fromEl?.lat||!toEl?.lat) return;

  const pts=[[fromEl.lat,fromEl.lng],...waypoints.map(w=>[w.lat,w.lng]),[toEl.lat,toEl.lng]];
  const isBroken = conn.broken === true;
  const baseColor = FIBER_COLORS[conn.cor] || '#2196f3';
  const color = isBroken ? '#ff3d57' : baseColor;
  const dashArray = isBroken ? '8,6' : (conn.fibra?.includes('Drop') ? '6,4' : null);
  const weight = isBroken ? 3 : (conn.fibra?.includes('36FO') ? 5 : (conn.fibra?.includes('12FO') ? 3.5 : 2.5));
  
  const poly = L.polyline(pts, {
    color: color,
    weight: weight,
    opacity: 0.85,
    dashArray: dashArray,
    smoothFactor: 1.5,
  }).addTo(geoMap);

  // Tooltip
  let tooltipText = `<b>${fromEl.nome}</b> â†’ <b>${toEl.nome}</b><br><span style="color:${color}">â– </span> ${conn.fibra||'Cabo'} (${conn.cor||'â€”'})`;
  if (conn.length) tooltipText += `<br>ðŸ“ ${conn.length}m`;
  if (isBroken) tooltipText += `<br><span style="color:var(--red)">ðŸ’” ROMPIDO</span>`;
  poly.bindTooltip(tooltipText, {sticky:true, className:'leaflet-tooltip-cable'});

  poly.on('click', e=>{L.DomEvent.stopPropagation(e); showCablePanel(conn.id);});
  poly.on('contextmenu', e=>{
    L.DomEvent.stopPropagation(e);
    // Mostrar menu de contexto especÃ­fico para cabos
    ctxTargetId = conn.id;
    ctxTargetType = 'cable';
    showCtxMenu(e.originalEvent.clientX, e.originalEvent.clientY);
  });

  cableLayers.push({id:conn.id, layer:poly});
}

function removeCableFromMap(id){
  const idx=cableLayers.findIndex(c=>c.id===id);
  if(idx>=0){geoMap.removeLayer(cableLayers[idx].layer);cableLayers.splice(idx,1);}
}

function refreshAllCables(){
  cableLayers.forEach(c=>geoMap.removeLayer(c.layer));
  cableLayers=[];
  DB.connections.forEach(c=>drawCableOnMap(c));
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAP MODE & CABLE DRAWING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function setMapMode(mode){
  mapMode=mode;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active','cable-active'));
  const btn=document.getElementById('mode-'+mode);
  if(btn) btn.classList.add(mode==='cable'?'cable-active':'active');
  document.getElementById('btn-cable').classList.toggle('btn-warn',mode==='cable');
  geoMap.getContainer().style.cursor=mode==='place'?'crosshair':mode==='cable'?'cell':'grab';

  const hint=document.getElementById('cable-waypoint-hint');
  if(mode==='cable'){
    hint.style.display='block';
    if(!cableState){
      hint.textContent='Clique em um elemento para iniciar o cabo';
    }
  } else {
    hint.style.display='none';
    if(mode!=='cable'&&cableState) clearCablePreview();
    cableState=null;
  }
}

// New function: open cable type selection modal before starting cable mode

function startCableModeWithSelection() {
  // Preencher select de tipos de cabo
  const sel = document.getElementById('pre-cable-tipo');
  if (sel) {
    const grupos = {};
    CABLE_TYPES.forEach(ct => {
      if (!grupos[ct.grupo]) grupos[ct.grupo] = [];
      grupos[ct.grupo].push(ct);
    });
    sel.innerHTML = Object.entries(grupos).map(([g, items]) =>
      `<optgroup label="â”€â”€ ${g} â”€â”€">${items.map(ct => `<option value="${ct.label}" data-fo="${ct.fo}">${ct.label}${ct.fo>0?' ('+ct.fo+'FO)':''}</option>`).join('')}</optgroup>`
    ).join('');
  }
  // Preencher grid de cores
  buildFiberColorGrid('pre-cable-color-grid', 'pendingCableColor');
  // Limpar campos
  document.getElementById('pre-cable-porta').value = '';
  document.getElementById('pre-cable-obs').value = '';
  openModal('modal-select-cable');
}

function pickPendingCableColor(name, containerId) {
  pendingCableColor = name;
  buildFiberColorGrid(containerId, 'pendingCableColor');
}

function confirmCableTypeAndStart() {
  pendingCableType = document.getElementById('pre-cable-tipo').value;
  pendingCableColor = window.pendingCableColor || 'Azul';
  pendingCablePorta = document.getElementById('pre-cable-porta').value.trim();
  pendingCableObs = document.getElementById('pre-cable-obs').value.trim();
  closeModal('modal-select-cable');
  // Inicia o modo cabo com os dados prÃ©-definidos
  startCableModeWithPreset(pendingCableType, pendingCableColor, pendingCablePorta, pendingCableObs);
}

function startCableModeWithPreset(tipo, cor, porta, obs) {
  window.presetCableData = { tipo, cor, porta, obs };
  setMapMode('cable');
}

function handleMapClick(e){
  if(mapMode==='place'&&placeTargetId){
    placeElement(placeTargetId,e.latlng.lat,e.latlng.lng);
    return;
  }
  if(mapMode==='cable'){
    if(!cableState){
      // Need to click on a marker â€” handled by marker click
      return;
    }
    // Add waypoint
    const wp={lat:e.latlng.lat,lng:e.latlng.lng};
    cableState.waypoints.push(wp);
    updateCablePreview();
    return;
  }
  // Select mode â€” deselect
  if(mapMode==='select'){
    selectedNodeId=null;closePanel();
    refreshAllMarkers();
  }
}

function handleMapMouseMove(e){
  if(mapMode==='cable'&&cableState&&!cableState.complete){
    // Update live preview line end
    updateCablePreviewLive(e.latlng);
  }
}

let previewLiveLine=null;
function updateCablePreviewLive(latlng){
  if(!cableState) return;
  const pts=cableState.waypoints.length>0
    ? cableState.waypoints.map(w=>[w.lat,w.lng])
    : [];
  const fromEl=DB.elements.find(e=>e.id===cableState.fromId);
  if(!fromEl?.lat) return;
  const all=[[fromEl.lat,fromEl.lng],...pts,[latlng.lat,latlng.lng]];
  if(previewLiveLine) geoMap.removeLayer(previewLiveLine);
  previewLiveLine=L.polyline(all,{color:'#ff9100',weight:2,opacity:0.7,dashArray:'8,5'}).addTo(geoMap);
}

function updateCablePreview(){
  if(!cableState) return;
  if(previewLiveLine){geoMap.removeLayer(previewLiveLine);previewLiveLine=null;}
  // Draw committed waypoints
  if(cableState.previewLine) geoMap.removeLayer(cableState.previewLine);
  const fromEl=DB.elements.find(e=>e.id===cableState.fromId);
  if(!fromEl?.lat) return;
  const pts=[[fromEl.lat,fromEl.lng],...cableState.waypoints.map(w=>[w.lat,w.lng])];
  if(pts.length>1){
    cableState.previewLine=L.polyline(pts,{color:'#ff9100',weight:2,opacity:0.8,dashArray:'6,4'}).addTo(geoMap);
  }
  updateCableHint();
}

function updateCableHint(){
  const hint=document.getElementById('cable-waypoint-hint');
  if(!cableState){hint.textContent='Clique em um elemento para iniciar o cabo';return;}
  if(!cableState.toId){
    hint.textContent=`Origem: ${DB.elements.find(e=>e.id===cableState.fromId)?.nome||'?'} Â· ${cableState.waypoints.length} pontos Â· Clique para adicionar pontos no caminho Â· Clique em outro elemento para finalizar`;
  }
}

function handleMarkerClick(id,e){
  if(mapMode==='cable'){
    if(!cableState){
      // Start cable from this element
      const el=DB.elements.find(e2=>e2.id===id);
      if(!el?.lat){toast('âš ï¸ Elemento sem coordenadas no mapa','error');return;}
      cableState={fromId:id,toId:null,waypoints:[],previewLine:null,complete:false};
      // Aplicar dados prÃ©-selecionados
      if(window.presetCableData){
        cableState.presetTipo = window.presetCableData.tipo;
        cableState.presetCor = window.presetCableData.cor;
        cableState.presetPorta = window.presetCableData.porta;
        cableState.presetObs = window.presetCableData.obs;
        window.presetCableData = null;
      }
      updateCableHint();
      return;
    }
    if(cableState.fromId===id) return; // same element
    if(!cableState.toId){
      // End cable at this element
      cableState.toId=id;
      cableState.complete=true;
      if(previewLiveLine){geoMap.removeLayer(previewLiveLine);previewLiveLine=null;}
      openCableModal();
    }
    return;
  }
  // Select mode
  selectedNodeId=id;
  showPanel(id);
  refreshAllMarkers();
}

function clearCablePreview(){
  if(cableState?.previewLine) geoMap.removeLayer(cableState.previewLine);
  if(previewLiveLine){geoMap.removeLayer(previewLiveLine);previewLiveLine=null;}
}

async function placeElement(id,lat,lng){
  const el=DB.elements.find(e=>e.id===id);
  if(!el) return;
  el.lat=lat; el.lng=lng;
  await api('PUT',papi(`/elements/${id}`),el);
  addOrUpdateMarker(el);
  refreshAllCables();
  toast(`ðŸ“ ${el.nome} posicionado`,'success');
  placeTargetId=null;
  setMapMode('select');
}

function fitMapToBounds(){
  const pts=DB.elements.filter(e=>e.lat&&e.lng).map(e=>[e.lat,e.lng]);
  if(pts.length>0) geoMap.fitBounds(pts,{padding:[40,40]});
  else geoMap.setView([-16.8225,-49.245],13);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADDRESS / CEP SEARCH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function searchAddress(){
  const q=document.getElementById('addr-search-input').value.trim();
  if(!q) return;
  // Try ViaCEP if it looks like a CEP
  const cep=q.replace(/\D/g,'');
  if(cep.length===8){
    try{
      const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d=await r.json();
      if(!d.erro){
        const addr=`${d.logradouro||''}, ${d.bairro||''}, ${d.localidade} - ${d.uf}`;
        const nom=await nominatimSearch(addr);
        if(nom){showAddrResults([{display:addr,...nom}]);return;}
      }
    }catch(e){}
  }
  // Nominatim geocode
  const results=await nominatimSearchMulti(q);
  showAddrResults(results);
}

async function nominatimSearch(q){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=br`,{headers:{'Accept-Language':'pt-BR'}});
    const d=await r.json();
    if(d.length>0) return {lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon),display:d[0].display_name};
  }catch(e){}
  return null;
}

async function nominatimSearchMulti(q){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=br`,{headers:{'Accept-Language':'pt-BR'}});
    const d=await r.json();
    return d.map(x=>({lat:parseFloat(x.lat),lng:parseFloat(x.lon),display:x.display_name}));
  }catch(e){}
  return [];
}

function showAddrResults(results){
  const box=document.getElementById('addr-results');
  if(!results||results.length===0){
    box.innerHTML='<div style="padding:12px;font-size:12px;color:var(--text3)">Nenhum resultado encontrado.</div>';
    box.style.display='block';
    setTimeout(()=>box.style.display='none',3000);
    return;
  }
  box.innerHTML=results.map((r,i)=>`
    <div onclick="goToAddr(${r.lat},${r.lng})" style="padding:9px 13px;cursor:pointer;font-size:11px;border-bottom:1px solid var(--border);transition:background .1s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <div style="font-weight:600;color:var(--text)">ðŸ“ ${r.display.split(',').slice(0,3).join(',')}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px">${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</div>
    </div>`).join('');
  box.style.display='block';
}

function goToAddr(lat,lng){
  geoMap.setView([lat,lng],17,{animate:true});
  // Drop a temporary pin
  const pin=L.marker([lat,lng],{icon:L.divIcon({
    html:`<div style="width:28px;height:28px;border-radius:50%;background:rgba(0,200,255,.25);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;animation:pulse 1s infinite">ðŸ“</div>`,
    className:'',iconSize:[28,28],iconAnchor:[14,14]
  })}).addTo(geoMap);
  setTimeout(()=>geoMap.removeLayer(pin),5000);
  document.getElementById('addr-results').style.display='none';
  document.getElementById('addr-search-input').value='';
}

// Close addr results on outside click
document.addEventListener('click',e=>{
  if(!e.target.closest('#addr-search-bar')&&!e.target.closest('#addr-results'))
    document.getElementById('addr-results').style.display='none';
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REPOSITION ELEMENT (drag after placement)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let repositionTargetId=null;
function startRepositionMode(id){
  repositionTargetId=id;
  const el=DB.elements.find(e=>e.id===id);
  // Make marker draggable
  const m=mapMarkers[id];
  if(m){
    m.dragging.enable();
    m.on('dragend',async evt=>{
      const ll=evt.target.getLatLng();
      await placeElement(id,ll.lat,ll.lng);
      m.dragging.disable();
      repositionTargetId=null;
      toast('ðŸ“ Reposicionado!','success');
    });
    toast(`â†• Arraste o marcador de "${el?.nome}" para nova posiÃ§Ã£o`,'success');
  } else {
    // Element has no marker yet â€” use place mode
    startPlaceMode(id);
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CEO FUSION MAP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FUSION MAP â€” CEO + CTO
// fusionState.data[connId].fibers[i] = {n, fusedTo:{connId,fiberN}|null, sangria:bool, splitter:bool, obs}
let fusionState={nodeId:null, nodeType:null, data:{}}; // nodeId = CEO or CTO id

function getFiberCount(tipoLabel){
  if(!tipoLabel) return 1;
  const ct=CABLE_TYPES.find(c=>c.label===tipoLabel);
  if(ct) return ct.fo||1;
  const m=tipoLabel.match(/(\d+)FO/);
  return m?parseInt(m[1]):1;
}

function saveFusionState(nodeId){
  try{localStorage.setItem('fusion_'+nodeId, JSON.stringify(fusionState.data));}catch(e){}
}
function loadFusionState(nodeId){
  try{const d=localStorage.getItem('fusion_'+nodeId);return d?JSON.parse(d):{};}catch(e){return {};}
}

function openFusionMap(nodeId){
  const el=DB.elements.find(e=>e.id===nodeId);
  if(!el) return;
  fusionState.nodeId=nodeId;
  fusionState.nodeType=el.tipo;
  fusionState.data=loadFusionState(nodeId);

  const connsIn=DB.connections.filter(c=>c.to===nodeId);
  const connsOut=DB.connections.filter(c=>c.from===nodeId);
  const allConns=[...connsIn,...connsOut];

  const isCTO=el.tipo==='cto';
  const totalFibers=allConns.reduce((s,c)=>s+getFiberCount(c.fibra),0);
  const totalFused=Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.fusedTo).length,0);
  const totalSangria=Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.sangria).length,0);
  const totalSplitter=isCTO?Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.splitter).length,0):0;

  document.getElementById('fusion-title').textContent=`ðŸ”€ Mapa de FusÃ£o â€” ${el.nome}`;
  const body=document.getElementById('fusion-body');

  if(allConns.length===0){
    body.innerHTML=`
      <div style="text-align:center;padding:40px;color:var(--text3)">
        <div style="font-size:32px;margin-bottom:12px">ðŸ”Œ</div>
        <div style="font-size:14px;font-weight:600">Nenhum cabo conectado a este ${isCTO?'CTO':'CEO'}</div>
        <div style="font-size:11px;margin-top:6px">Trace cabos para configurar as fusÃµes.</div>
      </div>`;
    openModal('modal-fusion');
    return;
  }

  const typeLabel=isCTO?'CTO':'CEO';
  body.innerHTML=`
    <!-- Top stats bar -->
    <div style="display:flex;gap:1px;background:var(--border);border-radius:8px;overflow:hidden;margin-bottom:14px">
      <div style="flex:2;background:var(--surface2);padding:9px 14px">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">${typeLabel}</div>
        <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${el.nome}</div>
        <div style="font-size:10px;color:var(--text2)">${el.endereco||'â€”'}</div>
      </div>
      <div style="flex:1;background:var(--surface2);padding:9px 14px;text-align:center">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Cabos</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent);line-height:1.1">${allConns.length}</div>
      </div>
      <div style="flex:1;background:var(--surface2);padding:9px 14px;text-align:center">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Total FO</div>
        <div style="font-size:22px;font-weight:800;color:var(--green);line-height:1.1">${totalFibers}</div>
      </div>
      <div style="flex:1;background:var(--surface2);padding:9px 14px;text-align:center">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Fundidas</div>
        <div style="font-size:22px;font-weight:800;color:var(--yellow);line-height:1.1" id="stat-fused">${totalFused}</div>
      </div>
      <div style="flex:1;background:var(--surface2);padding:9px 14px;text-align:center">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Sangria</div>
        <div style="font-size:22px;font-weight:800;color:var(--purple);line-height:1.1" id="stat-sangria">${totalSangria}</div>
      </div>
      ${isCTO?`
      <div style="flex:1;background:var(--surface2);padding:9px 14px;text-align:center">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Splitter</div>
        <div style="font-size:22px;font-weight:800;color:var(--orange);line-height:1.1" id="stat-splitter">${totalSplitter}</div>
      </div>`:''}
    </div>

    <!-- Instruction hint -->
    <div id="fusion-hint" style="display:flex;align-items:center;gap:8px;background:rgba(0,200,255,.06);border:1px solid rgba(0,200,255,.18);border-radius:7px;padding:8px 12px;font-size:11px;color:var(--text2);margin-bottom:12px">
      <span style="font-size:16px">ðŸ‘†</span>
      <span>
        <strong style="color:var(--yellow)">Clique esquerdo</strong> em fibra livre â†’ seleciona para fundir com outra.
        <strong style="color:var(--purple)">BotÃ£o [S]</strong> â†’ marcar como <em>sangria</em> (cabo passa pelo elemento).
        ${isCTO?`<strong style="color:var(--orange)">BotÃ£o [SP]</strong> â†’ vai ao <em>splitter da CTO</em>.`:''}
        <strong style="color:var(--red)">Clique direito</strong> em fibra marcada â†’ remover.
      </span>
    </div>

    <!-- Cable list -->
    <div id="fusion-cables-container">
      ${allConns.map(c=>renderCableBlock(c,nodeId)).join('')}
    </div>
  `;

  openModal('modal-fusion');
}

function renderCableBlock(c, nodeId){
  const isCTO=fusionState.nodeType==='cto';
  const isIn=c.to===nodeId;
  const otherEl=isIn?DB.elements.find(e=>e.id===c.from):DB.elements.find(e=>e.id===c.to);
  const tc=TYPE_CONFIG[otherEl?.tipo]||{color:'#888'};
  const fc=FIBER_COLORS[c.cor]||'#555';
  const fo=getFiberCount(c.fibra);
  const cd=fusionState.data[c.id]||{fibers:[]};
  const fusedCount=(cd.fibers||[]).filter(f=>f&&f.fusedTo).length;
  const sangriaCount=(cd.fibers||[]).filter(f=>f&&f.sangria).length;
  const splitterCount=isCTO?(cd.fibers||[]).filter(f=>f&&f.splitter).length:0;
  const usedCount=fusedCount+sangriaCount+splitterCount;
  const dir=isIn?'â†™ Entrada':'SaÃ­da â†—';
  const pct=fo>0?Math.round(usedCount/fo*100):0;
  const barColor=pct===100?'var(--green)':pct>0?'var(--yellow)':'var(--border2)';

  return `<div class="fusion-cable-block" data-conn-id="${c.id}" style="border:1px solid ${fc}44;border-radius:10px;margin-bottom:10px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${fc}0e;cursor:pointer;border-bottom:1px solid ${fc}33" onclick="toggleFusionBlock(${c.id})">
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <div style="width:14px;height:14px;border-radius:50%;background:${fc};box-shadow:0 0 6px ${fc}88"></div>
        <span style="font-size:9px;font-weight:700;color:${fc};font-family:'Courier New',monospace">${c.cor||'â€”'}</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;color:${tc.color||'var(--text)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          <span style="font-size:10px;color:var(--text3);font-weight:400">${dir}</span>  ${otherEl?.nome||'Sem conexÃ£o'}
        </div>
        <div style="font-size:9px;color:var(--text3);margin-top:1px;font-family:'Courier New',monospace">${c.fibra||'â€”'}${c.porta&&c.porta!=='â€”'?' Â· porta '+c.porta:''}</div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:11px;font-weight:700;color:${fc}" id="fo-count-${c.id}">${usedCount}<span style="color:var(--text3);font-weight:400">/${fo}</span> FO</div>
        <div style="width:80px;height:4px;background:var(--border2);border-radius:2px;margin-top:4px;overflow:hidden">
          <div id="fo-bar-${c.id}" style="width:${pct}%;height:100%;background:${barColor};border-radius:2px;transition:width .3s"></div>
        </div>
      </div>
      <span style="font-size:12px;color:var(--text3);flex-shrink:0" id="fusion-toggle-${c.id}">â–¼</span>
    </div>
    <div id="fusion-fibers-${c.id}">
      ${renderFiberRows(c.id, fo, cd)}
    </div>
  </div>`;
}

function renderFiberRows(connId, fo, cd){
  if(fo===0) return `<div style="padding:12px;font-size:11px;color:var(--text3)">Cabo elÃ©trico â€” sem fibras Ã³pticas.</div>`;
  const isCTO=fusionState.nodeType==='cto';
  const fibers=cd.fibers||[];
  let rows='';

  // headers
  const cols=isCTO?'32px 90px 1fr 60px 60px 24px':'32px 90px 1fr 60px 24px';
  rows+=`<div style="display:grid;grid-template-columns:${cols};gap:0;padding:4px 14px;background:var(--surface3);border-bottom:1px solid var(--border)">
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">#</div>
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Fibra</div>
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">FusÃ£o / Destino</div>
    <div style="font-size:9px;color:var(--purple);text-transform:uppercase;letter-spacing:.5px;text-align:center">Sangria</div>
    ${isCTO?`<div style="font-size:9px;color:var(--orange);text-transform:uppercase;letter-spacing:.5px;text-align:center">Splitter</div>`:''}
    <div></div>
  </div>`;

  for(let i=1;i<=fo;i++){
    const fdata=fibers.find(f=>f&&f.n===i)||{n:i,fusedTo:null,sangria:false,splitter:false,obs:''};
    const fc=FIBER_INDIVIDUAL_COLORS[(i-1)%12];
    const isAnilha=i>12;
    const isFused=!!fdata.fusedTo;
    const isSangria=!!fdata.sangria;
    const isSplitter=isCTO&&!!fdata.splitter;
    const isUsed=isFused||isSangria||isSplitter;

    let fusionLabel='â€”';
    let fusionColor='var(--text3)';
    if(isFused){
      const destConn=DB.connections.find(c=>c.id===fdata.fusedTo.connId);
      const destEl=destConn?DB.elements.find(e=>e.id===(destConn.to===fusionState.nodeId?destConn.from:destConn.to)):null;
      const destFc=FIBER_INDIVIDUAL_COLORS[(fdata.fusedTo.fiberN-1)%12];
      fusionLabel=`F${fdata.fusedTo.fiberN} Â· ${destEl?.nome||'?'}`;
      fusionColor=destFc.hex;
    } else if(isSangria){
      fusionLabel='Sangria â†’';
      fusionColor='var(--purple)';
    } else if(isSplitter){
      fusionLabel='â†’ Splitter CTO';
      fusionColor='var(--orange)';
    }

    const isEven=i%2===0;
    const bgColor=isSplitter?'rgba(255,145,0,.08)':isSangria?'rgba(199,125,255,.08)':isFused?fc.hex+'0d':isEven?'rgba(255,255,255,.015)':'transparent';
    const borderLeft=isSplitter?'var(--orange)':isSangria?'var(--purple)':isFused?fc.hex:'transparent';

    rows+=`<div class="fiber-row ${isUsed?'fr-fused':''}"
      data-conn="${connId}" data-fiber="${i}"
      onclick="fiberCellClick(${connId},${i})"
      oncontextmenu="fiberCellCtx(event,${connId},${i})"
      style="display:grid;grid-template-columns:${cols};align-items:center;gap:0;padding:5px 14px;
        background:${bgColor};border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;
        border-left:3px solid ${borderLeft};"
      onmouseover="this.style.background='rgba(255,255,255,.05)'"
      onmouseout="this.style.background='${bgColor}'">

      <div style="font-size:10px;font-family:'Courier New',monospace;color:var(--text3);font-weight:700">${i}${isAnilha?'*':''}</div>

      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:${fc.hex};flex-shrink:0;${isAnilha?'outline:2px dashed '+fc.hex+'66;outline-offset:1px':''}"></div>
        <span style="font-size:10px;color:${isUsed?fc.hex:'var(--text2)'};font-weight:${isUsed?700:400}">${fc.nome}</span>
      </div>

      <div style="font-size:10px;color:${fusionColor};font-weight:${isUsed?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px">
        ${isUsed
          ?`<span style="background:${fusionColor}18;border:1px solid ${fusionColor}44;border-radius:4px;padding:1px 6px">âŸ¶ ${fusionLabel}</span>`
          :`<span style="font-style:italic;opacity:.5">livre</span>`}
      </div>

      <!-- Sangria toggle -->
      <div style="text-align:center">
        <button onclick="event.stopPropagation();toggleSangria(${connId},${i})"
          style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;cursor:pointer;border:1px solid ${isSangria?'var(--purple)':'var(--border2)'};
          background:${isSangria?'rgba(199,125,255,.25)':'transparent'};color:${isSangria?'var(--purple)':'var(--text3)'};transition:all .1s"
          title="Marcar como sangria (passa pelo elemento)">S</button>
      </div>

      ${isCTO?`
      <!-- Splitter toggle -->
      <div style="text-align:center">
        <button onclick="event.stopPropagation();toggleSplitter(${connId},${i})"
          style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;cursor:pointer;border:1px solid ${isSplitter?'var(--orange)':'var(--border2)'};
          background:${isSplitter?'rgba(255,145,0,.25)':'transparent'};color:${isSplitter?'var(--orange)':'var(--text3)'};transition:all .1s"
          title="Fibra vai ao splitter desta CTO">SP</button>
      </div>`:''}

      <div style="text-align:center">
        ${isUsed?`<span style="font-size:11px;color:var(--red);opacity:.5;cursor:pointer" onclick="event.stopPropagation();fiberCellCtx(event,${connId},${i})" title="Remover">âœ•</span>`:''}
      </div>
    </div>`;
  }

  if(fo>12) rows+=`<div style="padding:4px 14px;font-size:9px;color:var(--text3);font-style:italic">* fibras com anilha (repetiÃ§Ã£o de cor)</div>`;
  return rows;
}

// Fusion interaction state
let fusionSelected=null; // {connId, fiberN, el}

function fiberCellClick(connId,fiberN){
  const cd=fusionState.data[connId]||{fibers:[]};
  const fdata=(cd.fibers||[]).find(f=>f&&f.n===fiberN);
  // If already used (fused/sangria/splitter), just show info
  if(fdata?.fusedTo){
    const destConn=DB.connections.find(c=>c.id===fdata.fusedTo.connId);
    const destEl=destConn?DB.elements.find(e=>e.id===(destConn.to===fusionState.nodeId?destConn.from:destConn.to)):null;
    toast(`ðŸ”— F${fiberN} â†’ F${fdata.fusedTo.fiberN} em "${destEl?.nome||'?'}" Â· clique direito para remover`,'success');
    return;
  }
  if(fdata?.sangria){toast(`ðŸ”€ Fibra ${fiberN} marcada como Sangria Â· clique direito para remover`,'success');return;}
  if(fdata?.splitter){toast(`ðŸ”€ Fibra ${fiberN} vai ao Splitter Â· clique direito para remover`,'success');return;}

  const cellEl=document.querySelector(`.fiber-row[data-conn="${connId}"][data-fiber="${fiberN}"]`);

  if(!fusionSelected){
    document.querySelectorAll('.fiber-row.selecting').forEach(e=>{e.classList.remove('selecting');e.style.outline='';});
    if(cellEl){cellEl.classList.add('selecting');cellEl.style.outline='2px solid var(--yellow)';cellEl.style.outlineOffset='-2px';}
    fusionSelected={connId,fiberN,el:cellEl};
    const fc=FIBER_INDIVIDUAL_COLORS[(fiberN-1)%12];
    toast(`âš¡ Fibra ${fiberN} (${fc.nome}) selecionada â€” clique em outra fibra para fundir`,'success');
  } else {
    if(fusionSelected.connId===connId){toast('âš ï¸ Selecione uma fibra de outro cabo','error');return;}
    setFusion(fusionSelected.connId, fusionSelected.fiberN, connId, fiberN, null);
    setFusion(connId, fiberN, fusionSelected.connId, fusionSelected.fiberN, null);
    if(fusionSelected.el){fusionSelected.el.style.outline='';fusionSelected.el.classList.remove('selecting');}
    fusionSelected=null;
    saveFusionState(fusionState.nodeId);
    refreshFusionCells();
    toast('âœ… FusÃ£o criada!','success');
  }
}

function toggleSangria(connId,fiberN){
  if(!fusionState.data[connId]) fusionState.data[connId]={fibers:[]};
  const fibers=fusionState.data[connId].fibers;
  let idx=fibers.findIndex(f=>f.n===fiberN);
  if(idx<0){fibers.push({n:fiberN,fusedTo:null,sangria:false,splitter:false,obs:''});idx=fibers.length-1;}
  const cur=fibers[idx];
  // toggle sangria; if turning ON, clear conflicting states
  if(!cur.sangria){
    cur.fusedTo=null;cur.splitter=false;cur.sangria=true;
    toast(`ðŸ”€ Fibra ${fiberN} marcada como Sangria`,'success');
  } else {
    cur.sangria=false;
    toast(`Sangria removida da fibra ${fiberN}`,'success');
  }
  saveFusionState(fusionState.nodeId);
  refreshFusionCells();
}

function toggleSplitter(connId,fiberN){
  if(fusionState.nodeType!=='cto') return;
  if(!fusionState.data[connId]) fusionState.data[connId]={fibers:[]};
  const fibers=fusionState.data[connId].fibers;
  let idx=fibers.findIndex(f=>f.n===fiberN);
  if(idx<0){fibers.push({n:fiberN,fusedTo:null,sangria:false,splitter:false,obs:''});idx=fibers.length-1;}
  const cur=fibers[idx];
  if(!cur.splitter){
    cur.fusedTo=null;cur.sangria=false;cur.splitter=true;
    toast(`ðŸ”€ Fibra ${fiberN} vai ao Splitter da CTO`,'success');
  } else {
    cur.splitter=false;
    toast(`Splitter removido da fibra ${fiberN}`,'success');
  }
  saveFusionState(fusionState.nodeId);
  refreshFusionCells();
}

function fiberCellCtx(e,connId,fiberN){
  e.preventDefault();e.stopPropagation();
  const cd=fusionState.data[connId]||{fibers:[]};
  const fdata=(cd.fibers||[]).find(f=>f&&f.n===fiberN);
  if(fdata?.fusedTo){
    const pairConnId=fdata.fusedTo.connId;const pairFiberN=fdata.fusedTo.fiberN;
    if(confirm(`Remover fusÃ£o da fibra ${fiberN}?`)){
      removeFusion(connId,fiberN);removeFusion(pairConnId,pairFiberN);
      saveFusionState(fusionState.nodeId);refreshFusionCells();toast('ðŸ—‘ï¸ FusÃ£o removida','success');
    }
  } else if(fdata?.sangria){
    if(confirm(`Remover sangria da fibra ${fiberN}?`)){
      fdata.sangria=false;saveFusionState(fusionState.nodeId);refreshFusionCells();toast('ðŸ—‘ï¸ Sangria removida','success');
    }
  } else if(fdata?.splitter){
    if(confirm(`Remover splitter da fibra ${fiberN}?`)){
      fdata.splitter=false;saveFusionState(fusionState.nodeId);refreshFusionCells();toast('ðŸ—‘ï¸ Splitter removido','success');
    }
  } else {
    if(fusionSelected&&fusionSelected.connId===connId&&fusionSelected.fiberN===fiberN){
      if(fusionSelected.el){fusionSelected.el.style.outline='';fusionSelected.el.classList.remove('selecting');}
      fusionSelected=null;toast('SeleÃ§Ã£o cancelada','success');
    }
  }
}

function setFusion(connId,fiberN,toConnId,toFiberN,obs){
  if(!fusionState.data[connId]) fusionState.data[connId]={fibers:[]};
  const fibers=fusionState.data[connId].fibers;
  const idx=fibers.findIndex(f=>f.n===fiberN);
  const obj={n:fiberN,fusedTo:{connId:toConnId,fiberN:toFiberN},sangria:false,splitter:false,obs:obs||''};
  if(idx>=0) fibers[idx]=obj; else fibers.push(obj);
}

function removeFusion(connId,fiberN){
  if(!fusionState.data[connId]) return;
  const fibers=fusionState.data[connId].fibers;
  const idx=fibers.findIndex(f=>f.n===fiberN);
  if(idx>=0){fibers[idx]={n:fiberN,fusedTo:null,sangria:false,splitter:false,obs:''};}
}

function refreshFusionCells(){
  const nodeId=fusionState.nodeId;
  const isCTO=fusionState.nodeType==='cto';
  const allConns=[
    ...DB.connections.filter(c=>c.to===nodeId),
    ...DB.connections.filter(c=>c.from===nodeId)
  ];
  allConns.forEach(c=>{
    const fo=getFiberCount(c.fibra);
    const cd=fusionState.data[c.id]||{fibers:[]};
    const container=document.getElementById(`fusion-fibers-${c.id}`);
    if(container) container.innerHTML=renderFiberRows(c.id,fo,cd);
    const fusedCount=(cd.fibers||[]).filter(f=>f&&f.fusedTo).length;
    const sangriaCount=(cd.fibers||[]).filter(f=>f&&f.sangria).length;
    const splitterCount=isCTO?(cd.fibers||[]).filter(f=>f&&f.splitter).length:0;
    const usedCount=fusedCount+sangriaCount+splitterCount;
    const pct=fo>0?Math.round(usedCount/fo*100):0;
    const bar=document.getElementById(`fo-bar-${c.id}`);
    const foEl=document.getElementById(`fo-count-${c.id}`);
    if(bar){
      const barColor=pct===100?'var(--green)':pct>0?'var(--yellow)':'var(--border2)';
      bar.style.width=pct+'%';bar.style.background=barColor;
    }
    if(foEl) foEl.innerHTML=`${usedCount}<span style="color:var(--text3);font-weight:400">/${fo}</span> FO`;
  });
  // Update summary stats
  const totalFused=Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.fusedTo).length,0);
  const totalSangria=Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.sangria).length,0);
  const totalSplitter=isCTO?Object.values(fusionState.data).reduce((s,cd)=>s+(cd.fibers||[]).filter(f=>f&&f.splitter).length,0):0;
  const elF=document.getElementById('stat-fused');
  const elS=document.getElementById('stat-sangria');
  const elSP=document.getElementById('stat-splitter');
  if(elF) elF.textContent=totalFused;
  if(elS) elS.textContent=totalSangria;
  if(elSP) elSP.textContent=totalSplitter;
}

function toggleFusionBlock(connId){
  const container=document.getElementById(`fusion-fibers-${connId}`);
  const tog=document.getElementById(`fusion-toggle-${connId}`);
  if(!container) return;
  const hidden=container.style.display==='none';
  container.style.display=hidden?'':'none';
  if(tog) tog.textContent=hidden?'â–¼':'â–¶';
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CABLE MODAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openCableModal() {
  if(!cableState||!cableState.fromId||!cableState.toId) return;
  const fromEl=DB.elements.find(e=>e.id===cableState.fromId);
  const toEl=DB.elements.find(e=>e.id===cableState.toId);
  document.getElementById('cable-from-name').textContent=fromEl?.nome||'?';
  document.getElementById('cable-to-name').textContent=toEl?.nome||'?';
  document.getElementById('cable-waypoints-count').textContent=`${cableState.waypoints.length} ponto(s) intermediÃ¡rio(s) no trajeto`;
  
  // List waypoints
  const list=document.getElementById('cable-waypoints-list');
  list.innerHTML=`<div style="font-size:10px;color:var(--text3);margin-bottom:6px;font-family:'Courier New',monospace">ROTA DO CABO</div>
  <div class="waypoint-item"><span class="waypoint-num">S</span><span>InÃ­cio: ${fromEl?.nome||'?'} (${fromEl?.lat?.toFixed(5)}, ${fromEl?.lng?.toFixed(5)})</span></div>
  ${cableState.waypoints.map((w,i)=>`<div class="waypoint-item"><span class="waypoint-num">${i+1}</span><span>Ponto: ${w.lat.toFixed(5)}, ${w.lng.toFixed(5)}</span><button onclick="removeWaypoint(${i})" style="margin-left:auto;background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">Ã—</button></div>`).join('')}
  <div class="waypoint-item"><span class="waypoint-num">E</span><span>Fim: ${toEl?.nome||'?'} (${toEl?.lat?.toFixed(5)}, ${toEl?.lng?.toFixed(5)})</span></div>`;

  // ========== CÃLCULO AUTOMÃTICO DA METRAGEM ==========
  let totalDistance = 0;
  const points = [];
  // Adiciona ponto inicial
  if (fromEl?.lat && fromEl?.lng) points.push({lat: fromEl.lat, lng: fromEl.lng});
  // Adiciona waypoints
  cableState.waypoints.forEach(wp => points.push({lat: wp.lat, lng: wp.lng}));
  // Adiciona ponto final
  if (toEl?.lat && toEl?.lng) points.push({lat: toEl.lat, lng: toEl.lng});

  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += haversineDistance(points[i].lat, points[i].lng, points[i+1].lat, points[i+1].lng);
  }
  
  // Arredonda para 2 casas decimais
  const distanceMeters = Math.round(totalDistance * 100) / 100;
  // ====================================================

  // Preencher campos com os presets se existirem (metragem calculada sobrescreve preset)
  document.getElementById('cable-porta').value = cableState.presetPorta || '';
  document.getElementById('cable-obs').value = cableState.presetObs || '';
  document.getElementById('cable-length').value = distanceMeters; // <-- aqui vai o valor calculado
  document.getElementById('cable-broken').value = cableState.presetBroken ? 'true' : 'false';
  selectedFiberColor = cableState.presetCor || 'Azul';
  buildCableTipoSelect();
  if(cableState.presetTipo) document.getElementById('cable-tipo').value = cableState.presetTipo;
  buildFiberColorGrid('cable-color-grid','selectedFiberColor');
  openModal('modal-cable');
}

function removeWaypoint(idx){
  if(!cableState) return;
  cableState.waypoints.splice(idx,1);
  updateCablePreview();
  openCableModal();
}

async function toggleCableBroken(id) {
  const conn = DB.connections.find(c => c.id === id);
  if (!conn) return;
  const newBroken = !conn.broken;
  const res = await api('PUT', papi(`/connections/${id}`), { broken: newBroken });
  if (res) {
    conn.broken = newBroken;
    // Atualizar no mapa
    removeCableFromMap(id);
    drawCableOnMap(conn);
    // Se o painel de detalhes estiver aberto para este cabo, atualizar
    if (document.getElementById('right-panel').classList.contains('hidden') === false) {
      // Verifica se o tÃ­tulo Ã© 'Cabo' e se o id Ã© o mesmo
      const panelTitle = document.getElementById('panel-title').textContent;
      if (panelTitle === 'ðŸ”Œ Cabo') {
        showCablePanel(id);
      }
    }
    toast(newBroken ? 'ðŸ’” Cabo marcado como rompido' : 'ðŸ”§ Cabo reparado', 'success');
  }
}

async function saveCable(){
  if(!cableState||!cableState.fromId||!cableState.toId){toast('âš ï¸ Rota incompleta','error');return;}
  const conn={
  from:cableState.fromId, to:cableState.toId,
  waypoints:cableState.waypoints,
  porta: cableState.presetPorta || document.getElementById('cable-porta').value.trim() || 'â€”',
  fibra: cableState.presetTipo || document.getElementById('cable-tipo').value,
  cor: cableState.presetCor || selectedFiberColor,
  obs: cableState.presetObs || document.getElementById('cable-obs').value.trim(),
  length: parseFloat(document.getElementById('cable-length').value) || null,
  broken: document.getElementById('cable-broken').value === 'true',
};
  const saved=await api('POST',papi('/connections'),conn);
  if(!saved) return;
  DB.connections.push(saved);
  clearCablePreview();
  cableState=null;
  drawCableOnMap(saved);
  closeModal('modal-cable');
  setMapMode('select');
  updateStats();renderSidebar();renderTable();
  toast('ðŸ”Œ Cabo traÃ§ado!','success');
}

function cancelCableMode(){
  clearCablePreview();
  cableState=null;
  setMapMode('select');
  closeModal('modal-cable');
}

async function deleteCable(id){
  await api('DELETE',papi(`/connections/${id}`));
  DB.connections=DB.connections.filter(c=>c.id!==id);
  removeCableFromMap(id);
  if(selectedNodeId) showPanel(selectedNodeId);
  updateStats();renderSidebar();
  toast('ðŸ—‘ï¸ Cabo removido','success');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function showPanel(id){
  const el=DB.elements.find(e=>e.id===id);if(!el) return;
  const tc=TYPE_CONFIG[el.tipo]||{};
  document.getElementById('right-panel').classList.remove('hidden');
  document.getElementById('panel-title').innerHTML=`<span style="color:${tc.color}">${ICONS[el.tipo]||''}</span>&nbsp;${el.nome}`;
  const connsOut=DB.connections.filter(c=>c.from===id);
  const connsIn=DB.connections.filter(c=>c.to===id);
  const allConns=[...connsIn.map(c=>({...c,dir:'â†'})),...connsOut.map(c=>({...c,dir:'â†’'}))];
  const sc=el.status==='ativo'?'var(--green)':el.status==='offline'?'var(--red)':'var(--orange)';
  const hasCords=el.lat&&el.lng;
  document.getElementById('panel-body').innerHTML=`
    <div class="detail-section">
      <div class="detail-label">InformaÃ§Ãµes</div>
      <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${tc.label||el.tipo}</span></div>
      <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="badge badge-${el.status}">â— ${el.status}</span></span></div>
      ${el.modelo?`<div class="detail-row"><span class="detail-key">Modelo</span><span class="detail-val">${el.modelo}</span></div>`:''}
      ${el.endereco?`<div class="detail-row"><span class="detail-key">EndereÃ§o</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${el.endereco}</span></div>`:''}
      ${hasCords?`<div class="detail-row"><span class="detail-key">Coords</span><span class="detail-val">${el.lat?.toFixed(5)}, ${el.lng?.toFixed(5)}</span></div>`:''}
      ${el.detalhes?`<div class="detail-row"><span class="detail-key">Detalhes</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${el.detalhes}</span></div>`:''}
      <div class="detail-row"><span class="detail-key">ID</span><span class="detail-val">#${el.id}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Cabos (${allConns.length})</div>
      ${allConns.length===0?'<div style="font-size:11px;color:var(--text3)">Sem conexÃµes</div>':
        allConns.map(c=>{
          const otherId=c.dir==='â†’'?c.to:c.from;
          const other=DB.elements.find(e=>e.id===otherId);
          const fc=FIBER_COLORS[c.cor]||'#666';
          return `<div class="conn-item">
            <div style="color:${TYPE_CONFIG[other?.tipo]?.color||'#888'}">${ICONS[other?.tipo]||''}</div>
            <div class="conn-info">
              <div class="conn-name">${c.dir} ${other?.nome||'?'}</div>
              <div class="conn-fiber"><span class="fiber-chip" style="background:${fc}"></span>${c.fibra||'â€”'}</div>
            </div>
            <button class="btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteCable(${c.id})">âœ•</button>
          </div>`;
        }).join('')}
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn-primary" style="justify-content:center" onclick="openEditModal(${el.id})">âœï¸ Editar</button>
      ${!hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startPlaceMode(${el.id})">ðŸ“ Posicionar no Mapa</button>`:''}
      ${hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startRepositionMode(${el.id})">â†• Reposicionar</button>`:''}
      ${(el.tipo==='ceo'||el.tipo==='cto')?`<button class="btn-ghost" style="justify-content:center;color:var(--yellow);border-color:var(--yellow)" onclick="openFusionMap(${el.id})">ðŸ”€ Mapa de FusÃ£o</button>`:''}
      ${el.tipo==='cto'?`<button class="btn-ghost" style="justify-content:center;color:var(--green);border-color:var(--green)" onclick="openCtoPorts(${el.id})">ðŸ“¡ Portas CTO</button>`:''}
      <button class="btn-ghost" style="justify-content:center" onclick="beginCableFrom(${el.id})">ðŸ”Œ TraÃ§ar Cabo Aqui</button>
    </div>`;
}

function showCablePanel(id){
  const conn=DB.connections.find(c=>c.id===id); if(!conn) return;
  document.getElementById('right-panel').classList.remove('hidden');
  const fromEl=DB.elements.find(e=>e.id===conn.from);
  const toEl=DB.elements.find(e=>e.id===conn.to);
  const fc=FIBER_COLORS[conn.cor]||'#666';
  const isBroken = conn.broken === true;
  const brokenText = isBroken ? 'ðŸ’” Rompido' : 'âœ… Ãntegro';
  const brokenColor = isBroken ? 'var(--red)' : 'var(--green)';
  document.getElementById('panel-title').innerHTML = 'ðŸ”Œ Cabo';
  document.getElementById('panel-body').innerHTML=`
    <div class="detail-section">
      <div class="detail-label">Rota</div>
      <div class="detail-row"><span class="detail-key">De</span><span class="detail-val">${fromEl?.nome||'?'}</span></div>
      <div class="detail-row"><span class="detail-key">Para</span><span class="detail-val">${toEl?.nome||'?'}</span></div>
      <div class="detail-row"><span class="detail-key">Pontos</span><span class="detail-val">${(conn.waypoints||[]).length} waypoints</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Cabo</div>
      <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${conn.fibra||'â€”'}</span></div>
      <div class="detail-row"><span class="detail-key">Cor</span><span class="detail-val"><span class="fiber-chip" style="background:${fc}"></span>${conn.cor||'â€”'}</span></div>
      <div class="detail-row"><span class="detail-key">Porta</span><span class="detail-val">${conn.porta||'â€”'}</span></div>
      ${conn.length ? `<div class="detail-row"><span class="detail-key">Metragem</span><span class="detail-val">${conn.length} m</span></div>` : ''}
      <div class="detail-row"><span class="detail-key">Estado</span><span class="detail-val" style="color:${brokenColor}">${brokenText}</span></div>
      ${conn.obs ? `<div class="detail-row"><span class="detail-key">Obs</span><span class="detail-val">${conn.obs}</span></div>` : ''}
    </div>
    ${canDo('edit_cables') ? `
    <button class="btn-warn" style="width:100%; justify-content:center; margin-bottom:8px" onclick="toggleCableBroken(${id})">
      ${isBroken ? 'ðŸ”§ Reparar Cabo' : 'âš ï¸ Marcar como Rompido'}
    </button>
    ` : ''}
    <button class="btn-danger" style="width:100%; justify-content:center" onclick="deleteCable(${id})">ðŸ—‘ï¸ Remover Cabo</button>
  `;
}

function closePanel(){document.getElementById('right-panel').classList.add('hidden');}

function startPlaceMode(id){
  placeTargetId=id;
  setMapMode('place');
  switchTab('geomap');
  toast('ðŸ“ Clique no mapa para posicionar o elemento','success');
  closePanel();
}
function beginCableFrom(id){
  const el=DB.elements.find(e=>e.id===id);
  if(!el?.lat){toast('âš ï¸ Posicione o elemento no mapa primeiro','error');return;}
  cableState={fromId:id,toId:null,waypoints:[],previewLine:null,complete:false};
  setMapMode('cable');
  switchTab('geomap');
  toast('ðŸ”Œ Clique para adicionar pontos, clique em outro elemento para finalizar','success');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VIS NETWORK (TOPOLOGY TAB)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function preloadNodeIcons(){
  Object.entries(TYPE_CONFIG).forEach(([tipo,tc])=>{
    const c=document.createElement('canvas');c.width=60;c.height=60;
    const ctx=c.getContext('2d');
    ctx.beginPath();ctx.arc(30,30,28,0,Math.PI*2);
    ctx.fillStyle=tc.color+'33';ctx.fill();
    ctx.strokeStyle=tc.color;ctx.lineWidth=2.5;ctx.stroke();
    const svgStr=(ICONS[tipo]||'').replace(/currentColor/g,tc.color)
      .replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"')
      .replace('width="16" height="16"','width="28" height="28"');
    const img=new Image();
    img.onload=()=>{
      const c2=document.createElement('canvas');c2.width=60;c2.height=60;
      const cx=c2.getContext('2d');
      cx.beginPath();cx.arc(30,30,28,0,Math.PI*2);cx.fillStyle=tc.color+'33';cx.fill();
      cx.strokeStyle=tc.color;cx.lineWidth=2.5;cx.stroke();
      cx.drawImage(img,16,16,28,28);
      NODE_CANVAS_ICONS[tipo]=c2.toDataURL();
      if(network) refreshVisNodes();
    };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr);
  });
}
let iconRefreshScheduled=false;
function refreshVisNodes(){
  if(iconRefreshScheduled) return;
  iconRefreshScheduled=true;
  setTimeout(()=>{
    iconRefreshScheduled=false;
    if(!network||!nodesDS) return;
    DB.elements.forEach(el=>{
      if(NODE_CANVAS_ICONS[el.tipo]) nodesDS.update({id:el.id,shape:'circularImage',image:NODE_CANVAS_ICONS[el.tipo]});
    });
  },200);
}

function buildVisData(){
  const nodes=DB.elements.map(el=>{
    const tc=TYPE_CONFIG[el.tipo]||{color:'#888'};
    const sc=el.status==='offline'?'#ff3d57':el.status==='alerta'?'#ff9100':tc.color;
    const pos=DB.positions[String(el.id)]||{};
    return {
      id:el.id,label:el.nome,
      title:`<b>${el.nome}</b><br>${tc.label}<br>${el.status}${el.endereco?'<br>'+el.endereco:''}`,
      color:{background:sc+'22',border:sc,highlight:{background:sc+'44',border:'#fff'}},
      font:{color:'#e8edf5',size:12},
      shape:NODE_CANVAS_ICONS[el.tipo]?'circularImage':'dot',
      image:NODE_CANVAS_ICONS[el.tipo],
      size:el.tipo==='bgp'?28:el.tipo==='core'?24:18,
      borderWidth:2,
      ...(pos.x!==undefined?{x:pos.x,y:pos.y,fixed:false}:{}),
    };
  });
  const edges=DB.connections.map(c=>{
    const fc=FIBER_COLORS[c.cor]||'#6b7280';
    return {id:c.id,from:c.from,to:c.to,label:c.fibra,
      color:{color:fc+'99',highlight:fc},font:{color:'#4a6a8a',size:9,background:'rgba(8,12,20,.8)'},
      width:1.5,arrows:{to:{enabled:true,scaleFactor:0.4}},
      smooth:{type:'curvedCW',roundness:0.1}};
  });
  return {nodes,edges};
}

function initTopology(){
  if(typeof vis==='undefined') return;
  const data=buildVisData();
  nodesDS=new vis.DataSet(data.nodes);
  edgesDS=new vis.DataSet(data.edges);
  network=new vis.Network(document.getElementById('network-canvas'),{nodes:nodesDS,edges:edgesDS},{
    nodes:{borderWidth:2,shadow:{enabled:true,color:'rgba(0,0,0,.5)',size:8}},
    physics:{enabled:true,barnesHut:{gravitationalConstant:-4000,springLength:180,damping:.15},
      stabilization:{enabled:true,iterations:120,fit:true}},
    interaction:{hover:true,tooltipDelay:300,dragNodes:true},
    layout:{improvedLayout:true},
  });
  network.on('stabilizationIterationsDone',()=>{
    network.setOptions({physics:{enabled:false}});saveVisPositions();
  });
  network.on('dragEnd',p=>{
    if(p.nodes.length>0){p.nodes.forEach(id=>{DB.positions[String(id)]=network.getPosition(id);});saveVisPositions();}
  });
  network.on('click',p=>{
    if(p.nodes.length>0){selectedNodeId=p.nodes[0];showPanel(selectedNodeId);}
    else if(p.edges.length>0) showCablePanel(p.edges[0]);
    else{closePanel();selectedNodeId=null;}
  });
  network.on('doubleClick',p=>{if(p.nodes.length>0)openEditModal(p.nodes[0]);});
  network.on('oncontext',p=>{
    p.event.preventDefault();
    if(p.nodes.length>0){ctxTargetId=p.nodes[0];showCtxMenu(p.event.clientX,p.event.clientY);}
  });
  preloadNodeIcons();
}

async function saveVisPositions(){
  nodesDS?.getIds().forEach(id=>{DB.positions[String(id)]=network.getPosition(id);});
  await api('POST',papi('/positions'),DB.positions);
}

async function refreshTopology(){
  await loadAll();
  await loadProjectInsights();
  if(!network){initTopology();return;}
  const data=buildVisData();
  nodesDS.clear();edgesDS.clear();
  nodesDS.add(data.nodes);edgesDS.add(data.edges);
  Object.entries(DB.positions).forEach(([id,pos])=>{
    const nid=parseInt(id);
    if(nodesDS.get(nid)) nodesDS.update({id:nid,x:pos.x,y:pos.y});
  });
}

registerPublicApi('map', {
  initGeoMap,
  changeMapLayer,
  createMarkerIcon,
  addOrUpdateMarker,
  removeMarker,
  refreshAllMarkers,
  drawCableOnMap,
  removeCableFromMap,
  refreshAllCables,
  setMapMode,
  startCableModeWithSelection,
  pickPendingCableColor,
  confirmCableTypeAndStart,
  startCableModeWithPreset,
  handleMapClick,
  handleMapMouseMove,
  updateCablePreviewLive,
  updateCablePreview,
  updateCableHint,
  handleMarkerClick,
  clearCablePreview,
  placeElement,
  fitMapToBounds,
  searchAddress,
  nominatimSearch,
  nominatimSearchMulti,
  showAddrResults,
  goToAddr,
  startRepositionMode,
  getFiberCount,
  saveFusionState,
  loadFusionState,
  openFusionMap,
  renderCableBlock,
  renderFiberRows,
  fiberCellClick,
  toggleSangria,
  toggleSplitter,
  fiberCellCtx,
  setFusion,
  removeFusion,
  refreshFusionCells,
  toggleFusionBlock,
  openCableModal,
  removeWaypoint,
  toggleCableBroken,
  saveCable,
  cancelCableMode,
  deleteCable,
  showPanel,
  showCablePanel,
  closePanel,
  startPlaceMode,
  beginCableFrom,
  preloadNodeIcons,
  refreshVisNodes,
  buildVisData,
  initTopology,
  saveVisPositions,
  refreshTopology,
}, [
  'fitMapToBounds',
  'setMapMode',
  'startCableModeWithSelection',
  'cancelCableMode',
  'saveCable',
  'searchAddress',
  'closePanel',
  'beginCableFrom',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

