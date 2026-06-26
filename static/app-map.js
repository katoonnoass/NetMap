// GEO MAP INIT
// ═══════════════════════════════════════════════════════
let markerClusterGroup = null;
let mapResizeObserver = null;
let mapResizeFrame = null;
let mapResizeTimer = null;

function refreshMapRendering(){
  mapResizeFrame=null;
  const geoContainer=document.getElementById('geo-map-container');
  if(geoMap&&geoContainer&&geoContainer.offsetWidth>0&&geoContainer.offsetHeight>0){
    geoMap.invalidateSize({pan:false,debounceMoveend:true});
  }
  const topologyContainer=document.getElementById('network-canvas');
  if(network&&topologyContainer&&topologyContainer.offsetWidth>0&&topologyContainer.offsetHeight>0){
    network.setSize('100%','100%');
    network.redraw();
  }
}

function scheduleMapRender(){
  if(mapResizeFrame!==null) cancelAnimationFrame(mapResizeFrame);
  mapResizeFrame=requestAnimationFrame(refreshMapRendering);
  clearTimeout(mapResizeTimer);
  mapResizeTimer=setTimeout(()=>{
    if(mapResizeFrame!==null) cancelAnimationFrame(mapResizeFrame);
    mapResizeFrame=requestAnimationFrame(refreshMapRendering);
  },260);
}

function initGeoMap(){
  if(geoMap) return;
  geoMap=L.map('geo-map',{
    center:[-16.8225,-49.245],
    zoom:13,
    zoomControl:false,
    attributionControl:true,
    fadeAnimation:false,
    zoomAnimation:!L.Browser.gecko,
    markerZoomAnimation:!L.Browser.gecko,
    inertia:!L.Browser.gecko,
  });
  L.control.zoom({position:'bottomright'}).addTo(geoMap);
  tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom:19,
    keepBuffer:8,
    updateWhenIdle:false,
    updateWhenZooming:true,
    updateInterval:50,
    opacity:1,
  }).addTo(geoMap);

  markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 18,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      const size = count < 10 ? 28 : count < 50 ? 36 : 44;
      return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--accent);border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.3)">${count}</div>`,
        className: 'map-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    }
  });
  geoMap.addLayer(markerClusterGroup);

  // Map click handler
  geoMap.on('click',handleMapClick);
  geoMap.on('dblclick',handleMeasureDblClick);
  geoMap.on('mousemove',handleMapMouseMove);
  geoMap.on('contextmenu',e=>{
    e.originalEvent.preventDefault();
    if(mapMode!=='select') return;
    showCategoryMenu(e.latlng.lat,e.latlng.lng,e.originalEvent.clientX,e.originalEvent.clientY);
  });

  if(typeof ResizeObserver!=='undefined'){
    mapResizeObserver=new ResizeObserver(scheduleMapRender);
    mapResizeObserver.observe(document.getElementById('center'));
  }
  setTimeout(scheduleMapRender,300);
  window.addEventListener('resize',scheduleMapRender,{passive:true});
  populateMapLegend();
}

function changeMapLayer(val){
  if(tileLayer) geoMap.removeLayer(tileLayer);
  if(val==='satellite'){
    tileLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {attribution:'© Esri',maxZoom:19,keepBuffer:8,updateWhenIdle:false,updateWhenZooming:true,updateInterval:50,opacity:1});
    document.documentElement.style.setProperty('--map-bg','#1a1a1a');
  } else if(val==='dark'){
    tileLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {attribution:'© Esri',maxZoom:16,keepBuffer:8,updateWhenIdle:false,updateWhenZooming:true,updateInterval:50,opacity:1});
    document.documentElement.style.setProperty('--map-bg','#1a2a3a');
  } else {
    tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {attribution:'© OpenStreetMap',maxZoom:19,keepBuffer:8,updateWhenIdle:false,updateWhenZooming:true,updateInterval:50,opacity:1});
    document.documentElement.style.removeProperty('--map-bg');
  }
  tileLayer.addTo(geoMap);
  scheduleMapRender();
}

// ═══════════════════════════════════════════════════════
// MAP MARKERS
// ═══════════════════════════════════════════════════════
function createMarkerIcon(el, selected=false){
  const tc=TYPE_CONFIG[el.tipo]||{color:'#888'};
  const color=tc.color;
  const statusColor=el.status==='offline'?'#ff3d57':el.status==='alerta'?'#ff9100':color;
  const iconSvg=(ICONS[el.tipo]||'').replace('width="16"','width="14"').replace('height="16"','height="14"');
  const selShadow=selected?'box-shadow:0 0 0 3px var(--accent-glow),0 4px 12px rgba(0,0,0,.3);':'box-shadow:0 2px 6px rgba(0,0,0,.2);';
  const selBorder=selected?'3px':'2px';
  const draftStyle=el.draft?'opacity:0.5;border-style:dashed;':'';
  const draftBadge=el.draft?'<span style="position:absolute;top:-6px;right:-6px;background:var(--yellow);color:#000;font-size:7px;font-weight:800;padding:1px 3px;border-radius:3px;line-height:1">R</span>':'';
  const label=selected?`<div style="position:absolute;top:32px;left:50%;transform:translateX(-50%);background:rgba(8,12,20,.85);color:#e8edf5;font-size:9px;font-weight:600;padding:2px 7px;border-radius:4px;white-space:nowrap;pointer-events:none;border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(4px)">${esc(el.nome)}</div>`:'';
  const html=`<div style="width:28px;height:28px;border-radius:6px;background:${statusColor};border:${selBorder} ${el.draft?'dashed':'solid'} ${selected?'rgba(255,255,255,.9)':statusColor};display:flex;align-items:center;justify-content:center;cursor:pointer;${selShadow}${draftStyle}transition:all .15s;color:#fff;position:relative">
    ${iconSvg}${draftBadge}
  </div>${label}`;
  return L.divIcon({html,className:'map-node-marker',iconSize:[selected?40:28,selected?48:32],iconAnchor:[selected?20:14,selected?24:16]});
}

function addOrUpdateMarker(el) {
  if(!_draftVisible && el.draft){
    if(mapMarkers[el.id]){
      if(markerClusterGroup) markerClusterGroup.removeLayer(mapMarkers[el.id]);
      else geoMap.removeLayer(mapMarkers[el.id]);
      delete mapMarkers[el.id];
    }
    return;
  }
  const pos = el.lat && el.lng ? [el.lat, el.lng] : null;
  if (!pos) {
    if (mapMarkers[el.id]) {
      if (markerClusterGroup) markerClusterGroup.removeLayer(mapMarkers[el.id]);
      else geoMap.removeLayer(mapMarkers[el.id]);
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
    });
    if (markerClusterGroup) markerClusterGroup.addLayer(m);
    else m.addTo(geoMap);
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
      ctxTargetType = null;
      showCtxMenu(e.originalEvent.clientX, e.originalEvent.clientY);
    });
    mapMarkers[el.id] = m;
  }
}

function removeMarker(id){
  if(mapMarkers[id]){
    if(markerClusterGroup) markerClusterGroup.removeLayer(mapMarkers[id]);
    else geoMap.removeLayer(mapMarkers[id]);
    delete mapMarkers[id];
  }
}

function refreshAllMarkers(){
  // Clear cluster group and rebuild
  if(markerClusterGroup){
    markerClusterGroup.clearLayers();
    mapMarkers = {};
  } else {
    Object.keys(mapMarkers).forEach(id=>{
      if(!DB.elements.find(e=>e.id==id)) removeMarker(id);
    });
  }
  DB.elements.forEach(el=>addOrUpdateMarker(el));
  applyVisibilityFilters();
}

// ═══════════════════════════════════════════════════════
// CABLE POLYLINES ON MAP
// ═══════════════════════════════════════════════════════
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
  const dashArray = isBroken ? '8,6' : (conn.draft ? '4,4' : (conn.fibra?.includes('Drop') ? '6,4' : null));
  const weight = isBroken ? 3 : (conn.fibra?.includes('36FO') ? 5 : (conn.fibra?.includes('12FO') ? 3.5 : 2.5));
  const opacity = conn.draft ? 0.45 : 0.85;
  
  const poly = L.polyline(pts, {
    color: color,
    weight: weight,
    opacity: 0.85,
    dashArray: dashArray,
    smoothFactor: 1.5,
  }).addTo(geoMap);

  // Tooltip
  let tooltipText = `<b>${esc(fromEl.nome)}</b> → <b>${esc(toEl.nome)}</b><br><span style="color:${color}">■</span> ${esc(conn.fibra||'Cabo')} (${esc(conn.cor||'—')})`;
  if (conn.length) tooltipText += `<br>📏 ${conn.length}m`;
  if (isBroken) tooltipText += `<br><span style="color:var(--red)">💔 ROMPIDO</span>`;
  if (conn.draft) tooltipText += `<br><span style="color:var(--yellow)">📐 RASCUNHO</span>`;
  poly.bindTooltip(tooltipText, {sticky:true, className:'leaflet-tooltip-cable'});

  poly.on('click', e=>{L.DomEvent.stopPropagation(e); showCablePanel(conn.id);});
  poly.on('contextmenu', e=>{
    L.DomEvent.stopPropagation(e);
    // Mostrar menu de contexto específico para cabos
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
  DB.connections.filter(c=>_draftVisible||!c.draft).forEach(c=>drawCableOnMap(c));
}

// ═══════════════════════════════════════════════════════
// MAP MODE & CABLE DRAWING
// ═══════════════════════════════════════════════════════
function setMapMode(mode){
  // Clear measure state when switching away from measure mode
  if(mapMode==='measure' && mode!=='measure'){
    clearMeasure();
  }
  if(mapMode==='radius' && mode!=='radius'){
    clearRadiusSearch();
  }
  if(mapMode==='fence' && mode!=='fence'){
    cancelFenceMode();
  }
  mapMode=mode;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active','cable-active'));
  const btn=document.getElementById('mode-'+mode);
  if(btn) btn.classList.add(mode==='cable'?'cable-active':'active');
  document.getElementById('btn-cable').classList.toggle('btn-warn',mode==='cable');
  if(mode==='measure'){
    geoMap.getContainer().style.cursor='crosshair';
  } else if(mode==='radius'){
    geoMap.getContainer().style.cursor='crosshair';
    document.getElementById('radius-display').style.display='flex';
    _radiusState={circle:null,center:null,latlng:null};
  } else if(mode==='fence'){
    geoMap.getContainer().style.cursor='crosshair';
    _fenceState={points:[], layer:null, markers:[]};
    toast('Clique no mapa para definir os vértices da geocerca. Duplo-clique para finalizar.','warn');
  } else {
    geoMap.getContainer().style.cursor=mode==='place'?'crosshair':mode==='cable'?'cell':'grab';
  }

  const hint=document.getElementById('cable-waypoint-hint');
  const measureDisp=document.getElementById('measure-display');
  const floatBar=document.getElementById('cable-float-bar');
  if(mode==='cable'){
    hint.style.display='block';
    if(floatBar) floatBar.style.display=cableState?'flex':'none';
    if(measureDisp) measureDisp.style.display='none';
    if(!cableState){
      hint.textContent='Clique em um elemento para iniciar o cabo';
    }
  } else if(mode==='measure'){
    hint.style.display='none';
    if(floatBar) floatBar.style.display='none';
    if(measureDisp) measureDisp.style.display='block';
    measureState={points:[], polyline:null, markers:[], tooltip:null, finished:false};
    document.getElementById('measure-distance').textContent='0 m';
  } else {
    hint.style.display='none';
    if(floatBar) floatBar.style.display='none';
    if(measureDisp) measureDisp.style.display='none';
    const radiusDisp=document.getElementById('radius-display');
    if(radiusDisp&&mode!=='radius') radiusDisp.style.display='none';
    if(mode!=='cable'&&cableState) clearCablePreview();
    cableState=null;
    if(mode!=='fence') cancelFenceMode();
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
      `<optgroup label="── ${g} ──">${items.map(ct => `<option value="${ct.label}" data-fo="${ct.fo}">${ct.label}${ct.fo>0?' ('+ct.fo+'FO)':''}</option>`).join('')}</optgroup>`
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
  // Inicia o modo cabo com os dados pré-definidos
  startCableModeWithPreset(pendingCableType, pendingCableColor, pendingCablePorta, pendingCableObs);
}

function startCableModeWithPreset(tipo, cor, porta, obs) {
  window.presetCableData = { tipo, cor, porta, obs };
  setMapMode('cable');
}

// ═══════════════════════════════════════════════════════
// QUICK-ADD FROM MAP
// ═══════════════════════════════════════════════════════
let quickAddPopupTimer = null;

function hideQuickAddPopup() {
  const popup = document.getElementById('quick-add-popup');
  if (popup) popup.remove();
  if (quickAddPopupTimer) { clearTimeout(quickAddPopupTimer); quickAddPopupTimer = null; }
}

function showQuickAddPopup(lat, lng, x, y) {
  hideQuickAddPopup();

  const popup = document.createElement('div');
  popup.id = 'quick-add-popup';
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  L.DomEvent.disableClickPropagation(popup);

  const types = [
    {tipo:'cliente', label:'Cliente'},
    {tipo:'cto', label:'CTO'},
    {tipo:'poste', label:'Poste'},
    {tipo:'ceo', label:'CEO'},
    {tipo:'splitter', label:'Splitter'},
  ];

  types.forEach(t => {
    const tc = TYPE_CONFIG[t.tipo] || {color:'#888', label:t.label};
    const btn = document.createElement('button');
    btn.className = 'quick-add-btn';
    btn.style.borderColor = tc.color + '44';
    btn.style.color = tc.color;
    btn.innerHTML = (ICONS[t.tipo] || '') + '<span>' + tc.label + '</span>';
    btn.onmouseenter = () => { btn.style.background = tc.color + '22'; btn.style.borderColor = tc.color; };
    btn.onmouseleave = () => { btn.style.background = 'transparent'; btn.style.borderColor = tc.color + '44'; };
    btn.onclick = () => quickAddElement(t.tipo, lat, lng);
    popup.appendChild(btn);
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'quick-add-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = (ev) => { ev.stopPropagation(); hideQuickAddPopup(); };
  popup.appendChild(closeBtn);

  geoMap.getContainer().appendChild(popup);
  quickAddPopupTimer = setTimeout(hideQuickAddPopup, 5000);
}

async function quickAddElement(tipo, lat, lng) {
  hideQuickAddPopup();

  const tc = TYPE_CONFIG[tipo] || {label:tipo};
  const count = DB.elements.filter(e => e.tipo === tipo).length + 1;
  const nome = tc.label + ' ' + count;

  const created = await api('POST', papi('/elements'), {
    nome, tipo, lat, lng, status: 'ativo'
  });

  if (!created || !created.id) return;

  DB.elements.push(created);

  if (tipo === 'dio') {
    const dioId = 'DIO-' + count;
    const cap = 24;
    const dioPayload = {
      id: dioId,
      name: nome,
      location: lat.toFixed(5) + ', ' + lng.toFixed(5),
      capacity: cap,
      ports: Array.from({length: cap}, (_, i) => ({num: i+1, status: 'livre', client: '', color: 'N/A'}))
    };
    const dioCreated = await api('POST', papi('/dios'), dioPayload);
    if (dioCreated && !dioCreated.error) {
      DB.dios = await api('GET', papi('/dios'));
    }
  }

  addOrUpdateMarker(created);
  if (nodesDS) {
    nodesDS.add({
      id: created.id,
      label: created.nome,
      shape: 'dot',
      color: {
        background: (TYPE_CONFIG[created.tipo]?.color || '#888') + '22',
        border: TYPE_CONFIG[created.tipo]?.color || '#888'
      },
      font: {color: '#e8edf5', size: 12},
      size: 18
    });
  }
  updateStats();
  renderSidebar();
  renderTable();
  if (tipo === 'dio') renderDioPanels();
  toast('✅ ' + created.nome + ' adicionado no mapa!', 'success');
}

function handleMapClick(e){
  hideCtxMenu();
  hideQuickAddPopup();
  if(mapMode==='place'&&placeTargetId){
    placeElement(placeTargetId,e.latlng.lat,e.latlng.lng);
    return;
  }
  if(mapMode==='measure'){
    handleMeasureClick(e);
    return;
  }
  if(mapMode==='radius'){
    handleRadiusClick(e);
    return;
  }
  if(mapMode==='cable'){
    if(!cableState){
      return;
    }
    const wp={lat:e.latlng.lat,lng:e.latlng.lng};
    cableState.waypoints.push(wp);
    updateCablePreview();
    return;
  }
  if(mapMode==='fence'){
    handleFenceClick(e);
    return;
  }
  // Select mode — deselect only
  if(mapMode==='select'){
    selectedNodeId=null;closePanel();
    refreshAllMarkers();
  }
}

// ═══════════════════════════════════════════════════════
// RIGHT-CLICK CATEGORY MENU
// ═══════════════════════════════════════════════════════
function showCategoryMenu(lat,lng,cx,cy){
  hideQuickAddPopup();
  hideCtxMenu();
  const popup=document.createElement('div');
  popup.id='quick-add-popup';
  // Calculate position with offset, clamp to screen edges
  let x = cx + 12, y = cy + 12;
  const maxX = window.innerWidth - 200;
  const maxY = window.innerHeight - 300;
  if (x > maxX) x = cx - 200;
  if (y > maxY) y = cy - 300;
  popup.style.left=x+'px';popup.style.top=y+'px';
  popup.style.flexDirection='column';popup.style.gap='4px';
  popup.style.padding='6px';popup.style.minWidth='160px';
  L.DomEvent.disableClickPropagation(popup);

  const cats=[
    {label:'Cabos',color:'#ff9100',items:[
      {label:'Iniciar Cabo...',icon:'🔌',action:()=>{hideQuickAddPopup();startCableModeWithSelection();}}
    ]},
    {label:'Rua',color:'#00e676',items:[]},
    {label:'Core',color:'#0080ff',items:[]},
  ];

  Object.entries(TYPE_CONFIG).filter(([k,v])=>v.cat==='rua').forEach(([tipo,tc])=>{
    cats[1].items.push({label:tc.label,icon:ICONS[tipo]||'',action:()=>quickAddElement(tipo,lat,lng)});
  });
  Object.entries(TYPE_CONFIG).filter(([k,v])=>v.cat==='core').forEach(([tipo,tc])=>{
    cats[2].items.push({label:tc.label,icon:ICONS[tipo]||'',action:()=>quickAddElement(tipo,lat,lng)});
  });

  cats.forEach((cat,i)=>{
    const row=document.createElement('div');
    row.style.cssText='position:relative;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;color:'+cat.color+';transition:background .1s';
    row.innerHTML='<span style="flex:1;text-transform:uppercase;letter-spacing:1px;font-size:10px">'+cat.label+'</span><span style="font-size:9px;opacity:.5">▶</span>';

    const sub=document.createElement('div');
    sub.style.cssText='position:absolute;left:100%;top:-4px;background:rgba(8,12,20,.96);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:5px;display:none;min-width:150px;z-index:1001;backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.4)';
    
    cat.items.forEach(item=>{
      const btn=document.createElement('button');
      btn.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;border:none;background:transparent;color:var(--text);cursor:pointer;font-size:11px;font-weight:600;transition:background .1s;width:100%;text-align:left;font-family:inherit;white-space:nowrap';
      btn.innerHTML=item.icon+'<span>'+item.label+'</span>';
      btn.onmouseenter=()=>btn.style.background=cat.color+'18';
      btn.onmouseleave=()=>btn.style.background='transparent';
      btn.onclick=(ev)=>{ev.stopPropagation();item.action();};
      sub.appendChild(btn);
    });

    // Show submenu on hover
    row.onmouseenter=()=>{sub.style.display='block';row.style.background=cat.color+'12';};
    row.onmouseleave=(e)=>{setTimeout(()=>{if(!sub.matches(':hover')){sub.style.display='none';row.style.background='transparent';}},100);};
    sub.onmouseenter=()=>sub.style.display='block';
    sub.onmouseleave=()=>{sub.style.display='none';row.style.background='transparent';};

    row.appendChild(sub);
    popup.appendChild(row);
  });

  const close=document.createElement('button');
  close.style.cssText='display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 10px;border-radius:6px;border:none;background:var(--surface3);color:var(--text3);cursor:pointer;font-size:10px;margin-top:4px;transition:background .1s;width:100%;font-family:inherit';
  close.textContent='✕ Fechar';
  close.onmouseenter=()=>close.style.background='var(--red)';close.style.color='#fff';
  close.onmouseleave=()=>close.style.background='var(--surface3)';close.style.color='var(--text3)';
  close.onclick=()=>hideQuickAddPopup();
  popup.appendChild(close);

  geoMap.getContainer().appendChild(popup);
}

function _catHeader(text,color){
  const h=document.createElement('div');
  h.textContent=text;
  h.style.cssText='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:6px 8px 2px;color:'+color+';opacity:.8;pointer-events:none';
  return h;
}

function _catItem(text,color){
  const b=document.createElement('button');
  b.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;border:none;background:transparent;color:var(--text);cursor:pointer;font-size:11px;font-weight:600;transition:all .1s;width:100%;text-align:left;font-family:inherit';
  b.onmouseenter=()=>{b.background=b.style.background;b.style.background=color+'18'};
  b.onmouseleave=()=>{b.style.background=b.background||'transparent'};
  b.innerHTML='<span style="flex:1">'+text+'</span>';
  return b;
}

function handleMapMouseMove(e){
  if(mapMode==='cable'&&cableState&&!cableState.complete){
    // Update live preview line end
    updateCablePreviewLive(e.latlng);
  }
}

// ═══════════════════════════════════════════════════════
// MEASURE DISTANCE TOOL
// ═══════════════════════════════════════════════════════
function handleMeasureClick(e){
  if(measureState.finished) return;
  L.DomEvent.stopPropagation(e);
  const pt=e.latlng;
  measureState.points.push(pt);

  const marker=L.circleMarker(pt,{radius:4,color:'#ff9100',fillColor:'#ff9100',fillOpacity:0.8,weight:2}).addTo(geoMap);
  measureState.markers.push(marker);

  if(measureState.points.length>=2){
    if(measureState.polyline) geoMap.removeLayer(measureState.polyline);
    const pts=measureState.points.map(p=>[p.lat,p.lng]);
    measureState.polyline=L.polyline(pts,{color:'#ff9100',weight:3,opacity:0.85,dashArray:'8,6'}).addTo(geoMap);
  }

  let totalDist=0;
  for(let i=0;i<measureState.points.length-1;i++){
    totalDist+=haversineDistance(
      measureState.points[i].lat,measureState.points[i].lng,
      measureState.points[i+1].lat,measureState.points[i+1].lng
    );
  }
  const distText=totalDist>=1000
    ?(totalDist/1000).toFixed(2)+' km'
    :Math.round(totalDist)+' m';
  document.getElementById('measure-distance').textContent=distText;

  if(measureState.tooltip) geoMap.closeTooltip(measureState.tooltip);
  if(measureState.markers.length>0){
    const lastMarker=measureState.markers[measureState.markers.length-1];
    measureState.tooltip=lastMarker.bindTooltip(distText,{permanent:true,direction:'top',offset:[0,-8],className:'measure-tooltip'}).openTooltip();
  }
}

function clearMeasure(){
  measureState.points.forEach((p,i)=>{
    if(measureState.markers[i]) geoMap.removeLayer(measureState.markers[i]);
  });
  if(measureState.polyline) geoMap.removeLayer(measureState.polyline);
  if(measureState.tooltip) geoMap.closeTooltip(measureState.tooltip);
  measureState={points:[],polyline:null,markers:[],tooltip:null,finished:false};
  document.getElementById('measure-distance').textContent='0 m';
}

function finishMeasure(){
  measureState.finished=true;
  const display=document.getElementById('measure-display');
  if(display) display.style.opacity='0.85';
  toast('📏 Medição concluída! Distância total: '+document.getElementById('measure-distance').textContent,'success');
}

let _radiusState = {circle:null, center:null, latlng:null};

function handleRadiusClick(e){
  if(!_radiusState.latlng){
    _radiusState.latlng=e.latlng;
    _radiusState.center=L.circleMarker(e.latlng,{radius:5,color:'var(--accent)',fillColor:'var(--accent)',fillOpacity:1,weight:2}).addTo(geoMap);
    const radius=parseInt(document.getElementById('radius-value').value)||500;
    _radiusState.circle=L.circle(e.latlng,{radius:radius,color:'#1A73E8',fillColor:'#1A73E8',fillOpacity:0.08,weight:2,dashArray:'6,4'}).addTo(geoMap);
    updateRadiusSearch();
    geoMap.getContainer().style.cursor='default';
  }else{
    const r=parseInt(document.getElementById('radius-value').value)||500;
    _radiusState.circle.setLatLng(e.latlng);
    _radiusState.center.setLatLng(e.latlng);
    _radiusState.latlng=e.latlng;
    updateRadiusSearch();
  }
}

function updateRadiusSearch(){
  if(!_radiusState.circle||!_radiusState.latlng) return;
  const radius=parseInt(document.getElementById('radius-value').value)||500;
  _radiusState.circle.setRadius(radius);
  document.getElementById('radius-label').textContent=radius>=1000?(radius/1000).toFixed(1)+' km':radius+' m';
  const clat=_radiusState.latlng.lat, clng=_radiusState.latlng.lng;
  let count=0;
  DB.elements.forEach(el=>{
    if(!el.lat||!el.lng) return;
    const d=haversineDistance(clat,clng,el.lat,el.lng);
    const marker=mapMarkers[el.id];
    if(d<=radius){
      count++;
      if(marker) marker.setOpacity(1);
    }else{
      if(marker) marker.setOpacity(0.15);
    }
  });
  document.getElementById('radius-count').textContent=count+' elemento'+(count!==1?'s':'');
}

function clearRadiusSearch(){
  if(_radiusState.circle){geoMap.removeLayer(_radiusState.circle);_radiusState.circle=null;}
  if(_radiusState.center){geoMap.removeLayer(_radiusState.center);_radiusState.center=null;}
  _radiusState.latlng=null;
  document.getElementById('radius-display').style.display='none';
  Object.values(mapMarkers).forEach(m=>{try{m.setOpacity(1);}catch(e){}});
  setMapMode('select');
}

let _fenceState={points:[], layer:null, markers:[], preview:null};
let _fenceLayers=[];

function handleFenceClick(e){
  if(!_fenceState) _fenceState={points:[], layer:null, markers:[]};
  const latlng=e.latlng;
  _fenceState.points.push({lat:latlng.lat,lng:latlng.lng});
  const marker=L.circleMarker(latlng,{radius:5,color:'#FF9800',fillColor:'#FF9800',fillOpacity:0.8,weight:2});
  marker.addTo(geoMap);
  _fenceState.markers.push(marker);
  if(_fenceState.preview){geoMap.removeLayer(_fenceState.preview);_fenceState.preview=null;}
  if(_fenceState.points.length>=2){
    const pts=_fenceState.points.map(p=>[p.lat,p.lng]);
    if(_fenceState.points.length>=3){
      _fenceState.preview=L.polygon(pts,{color:'#FF9800',fillColor:'#FF9800',fillOpacity:0.1,weight:2,dashArray:'6,4'}).addTo(geoMap);
    } else {
      _fenceState.preview=L.polyline(pts,{color:'#FF9800',weight:2,dashArray:'6,4'}).addTo(geoMap);
    }
  }
  if(_fenceState.points.length>=3){
    toast(`${_fenceState.points.length} pontos — duplo-clique para finalizar`,'warn');
  }
}

async function finishFenceMode(){
  if(!_fenceState||_fenceState.points.length<3){toast('Mínimo 3 pontos para fechar a geocerca','error');return;}
  const nome=prompt('Nome da geocerca:','Geocerca '+(DB.geofences?.length||0)+1);
  if(!nome&&nome!==''){cancelFenceMode();return;}
  const colors=['#1A73E8','#34A853','#EA4335','#FF9800','#8b5cf6','#00BCD4'];
  const color=colors[(DB.geofences?.length||0)%colors.length];
  const fence=await api('POST',papi('/fences'),{nome:nome||'Geocerca',color,coordinates:_fenceState.points});
  if(!fence){cancelFenceMode();return;}
  if(!DB.geofences) DB.geofences=[];
  DB.geofences.push(fence);
  drawFenceOnMap(fence);
  cancelFenceMode();
  setMapMode('select');
  toast('🛡️ Geocerca criada!','success');
}

function cancelFenceMode(){
  if(!_fenceState) return;
  _fenceState.markers.forEach(m=>{try{geoMap.removeLayer(m);}catch(e){}});
  if(_fenceState.preview){try{geoMap.removeLayer(_fenceState.preview);}catch(e){}}
  _fenceState={points:[], layer:null, markers:[], preview:null};
  geoMap.getContainer().style.cursor='grab';
}

function drawFenceOnMap(fence){
  removeFenceFromMap(fence.id);
  const coords=fence.coordinates||[];
  if(coords.length<3) return;
  const polygon=L.polygon(coords.map(c=>[c.lat,c.lng]),{
    color:fence.color||'#1A73E8',
    fillColor:fence.color||'#1A73E8',
    fillOpacity:0.08,
    weight:2,
    dashArray:'6,4',
  }).addTo(geoMap);
  let tooltip=`<b>${esc(fence.nome||'Geocerca')}</b>`;
  if(fence.type) tooltip+=`<br>Tipo: ${esc(fence.type)}`;
  polygon.bindTooltip(tooltip,{sticky:true,className:'leaflet-tooltip-cable'});
  polygon.on('click',e=>{L.DomEvent.stopPropagation(e);showFencePanel(fence.id);});
  _fenceLayers.push({id:fence.id,layer:polygon});
}

function removeFenceFromMap(id){
  const idx=_fenceLayers.findIndex(f=>f.id===id);
  if(idx>=0){geoMap.removeLayer(_fenceLayers[idx].layer);_fenceLayers.splice(idx,1);}
}

function refreshAllFences(){
  _fenceLayers.forEach(f=>geoMap.removeLayer(f.layer));
  _fenceLayers=[];
  (DB.geofences||[]).forEach(f=>drawFenceOnMap(f));
}

function showFencePanel(id){
  const fence=(DB.geofences||[]).find(f=>f.id===id);
  if(!fence) return;
  document.getElementById('right-panel').classList.remove('hidden');
  scheduleMapRender();
  document.getElementById('panel-title').innerHTML=`🛡️ ${esc(fence.nome||'Geocerca')}`;
  document.getElementById('panel-body').innerHTML=`
    <div class="detail-section">
      <div class="detail-label">Geocerca</div>
      <div class="detail-row"><span class="detail-key">Nome</span><span class="detail-val">${esc(fence.nome)}</span></div>
      <div class="detail-row"><span class="detail-key">Cor</span><span class="detail-val"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${fence.color||'#1A73E8'};vertical-align:middle"></span></span></div>
      <div class="detail-row"><span class="detail-key">Vértices</span><span class="detail-val">${(fence.coordinates||[]).length} pontos</span></div>
      <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${esc(fence.type||'aviso')}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-label" onclick="loadFenceElements(${fence.id})" style="cursor:pointer" title="Clique para carregar">Elementos dentro</div>
      <div id="fence-elements-list" style="font-size:10px;color:var(--text3)">Clique para carregar</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn-ghost" style="justify-content:center;color:var(--yellow);border-color:var(--yellow)" onclick="zoomToFence(${fence.id})">🔍 Zoom</button>
      <button class="btn-danger" style="justify-content:center" onclick="deleteFence(${fence.id})">🗑️ Remover</button>
    </div>`;
}

async function loadFenceElements(fenceId){
  const data=await api('GET',papi(`/fences/${fenceId}/elements`));
  const el=document.getElementById('fence-elements-list');
  if(!el) return;
  if(!data||!data.items||!data.items.length){el.innerHTML='<span style="font-size:10px;color:var(--text3)">Nenhum elemento dentro da geocerca</span>';return;}
  el.innerHTML=data.items.map(e=>`<div style="padding:2px 0"><span style="color:${TYPE_CONFIG[e.tipo]?.color||'#888'}">${ICONS[e.tipo]||''}</span> <a href="#" onclick="locateElement(${e.id});return false" style="color:var(--accent);font-weight:600">${esc(e.nome)}</a> <span style="color:var(--text3)">${esc(e.tipo)}</span></div>`).join('');
}

function zoomToFence(id){
  const fence=(DB.geofences||[]).find(f=>f.id===id);
  if(!fence||!fence.coordinates||fence.coordinates.length<3) return;
  const polygon=L.polygon(fence.coordinates.map(c=>[c.lat,c.lng]));
  geoMap.fitBounds(polygon.getBounds().pad(0.2));
}

async function deleteFence(id){
  if(!confirm('Remover esta geocerca?')) return;
  await api('DELETE',papi(`/fences/${id}`));
  DB.geofences=(DB.geofences||[]).filter(f=>f.id!==id);
  removeFenceFromMap(id);
  closePanel();
  toast('🛡️ Geocerca removida','success');
}

function loadFencesFromDB(){
  if(!DB.geofences) DB.geofences=[];
  DB.geofences.forEach(f=>drawFenceOnMap(f));
}

let _heatLayer=null;

function toggleHeatmap(enabled){
  const sel=document.getElementById('heatmap-source');
  if(sel) sel.style.display=enabled?'block':'none';
  if(enabled){
    updateHeatmap();
  }else{
    removeHeatmap();
  }
}

function updateHeatmap(){
  if(!document.getElementById('heatmap-toggle')?.checked){removeHeatmap();return;}
  if(typeof L.heatLayer!=='function'){toast('leaflet-heat nao carregado','error');return;}
  removeHeatmap();
  const source=document.getElementById('heatmap-source')?.value||'all';
  let points=[];
  if(source==='incidents'){
    DB.incidents.forEach(inc=>{
      const el=DB.elements.find(e=>e.id===inc.element_id);
      if(el?.lat&&el?.lng) points.push([el.lat,el.lng,0.8]);
    });
  }else{
    const targetType=source==='all'?null:source;
    DB.elements.forEach(el=>{
      if(!el.lat||!el.lng) return;
      if(targetType&&el.tipo!==targetType) return;
      points.push([el.lat,el.lng,0.6]);
    });
  }
  if(!points.length){toast('Sem pontos para mapa de calor','warn');return;}
  _heatLayer=L.heatLayer(points,{radius:25,blur:15,maxZoom:17,gradient:{0.2:'#00c8ff',0.4:'#00e676',0.6:'#ffe066',0.8:'#ff9100',1.0:'#ff3d57'}}).addTo(geoMap);
}

function removeHeatmap(){
  if(_heatLayer){geoMap.removeLayer(_heatLayer);_heatLayer=null;}
}

function handleMeasureDblClick(e){
  if(mapMode==='measure'&&!measureState.finished){
    L.DomEvent.stopPropagation(e);
    finishMeasure();
  }
  if(mapMode==='fence'&&_fenceState&&_fenceState.points.length>=3){
    L.DomEvent.stopPropagation(e);
    finishFenceMode();
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
  const bar=document.getElementById('cable-float-bar');
  if(!cableState){hint.textContent='Clique em um elemento para iniciar o cabo';if(bar)bar.style.display='none';return;}
  const fromEl=DB.elements.find(e=>e.id===cableState.fromId);
  const dist=cableState.waypoints.length>1?calculateRouteDistance(cableState.waypoints):0;
  const distStr=dist>0?` · ${(dist/1000).toFixed(2)} km`:'';
  if(bar){
    bar.style.display='flex';
    const info=bar.querySelector('#cable-float-info');
    if(info) info.textContent=`${esc(fromEl?.nome||'?')} · ${cableState.waypoints.length} pontos${distStr}`;
  }
  if(!cableState.toId){
    hint.textContent=`Origem: ${fromEl?.nome||'?'} · ${cableState.waypoints.length} pontos · Clique para adicionar pontos no caminho · Clique em outro elemento para finalizar`;
  }
}

function handleMarkerClick(id,e){
  if(mapMode==='measure'){
    return;
  }
  if(mapMode==='cable'){
    if(!cableState){
      // Start cable from this element
      const el=DB.elements.find(e2=>e2.id===id);
      if(!el?.lat){toast('⚠️ Elemento sem coordenadas no mapa','error');return;}
      cableState={fromId:id,toId:null,waypoints:[],previewLine:null,complete:false};
      // Aplicar dados pré-selecionados
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
      if(_redrawCableId){
        awaitFinishRedraw();
      } else {
        openCableModal();
      }
    }
    return;
  }
  // Select mode
  selectedNodeId=id;
  showElementPopup(id);
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
  toast(`📍 ${el.nome} posicionado`,'success');
  placeTargetId=null;
  setMapMode('select');
}

function fitMapToBounds(){
  const pts=DB.elements.filter(e=>e.lat&&e.lng).map(e=>[e.lat,e.lng]);
  if(pts.length>0) geoMap.fitBounds(pts,{padding:[40,40]});
  else geoMap.setView([-16.8225,-49.245],13);
}

// ═══════════════════════════════════════════════════════
// MAP STATUS FILTERS
// ═══════════════════════════════════════════════════════
function filterMapByStatus(){
  const checkboxes = document.querySelectorAll('#map-status-filters input[type="checkbox"]');
  const activeStatuses = Array.from(checkboxes).filter(cb=>cb.checked).map(cb=>cb.dataset.status);
  Object.entries(mapMarkers).forEach(([id, marker])=>{
    const el=DB.elements.find(item=>String(item.id)===String(id));
    if(!el || !marker?.setOpacity) return;
    const visible = activeStatuses.includes(el.status);
    marker.setOpacity(visible?1:0);
    if(visible){
      if(markerClusterGroup && !markerClusterGroup.hasLayer(marker)) markerClusterGroup.addLayer(marker);
    } else {
      if(markerClusterGroup && markerClusterGroup.hasLayer(marker)) markerClusterGroup.removeLayer(marker);
    }
  });
}

// ═══════════════════════════════════════════════════════
// MAP LEGEND
// ═══════════════════════════════════════════════════════
function populateMapLegend(){
  const container=document.getElementById('map-legend-content');
  if(!container) return;
  container.innerHTML=Object.entries(TYPE_CONFIG).map(([tipo,tc])=>`
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
      <div style="width:10px;height:10px;border-radius:2px;background:${tc.color};flex-shrink:0"></div>
      <span style="color:var(--text2)">${tc.label}</span>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════
// MAP LAYER TOGGLE
// ═══════════════════════════════════════════════════════
function toggleMapLayer(){
  const select=document.getElementById('map-layer-select');
  if(!select) return;
  const current=select.value;
  const next=current==='osm'?'satellite':'osm';
  select.value=next;
  changeMapLayer(next);
  const btn=document.getElementById('map-layer-toggle');
  if(btn) btn.textContent=next==='satellite'?'🗺️ Mapa':'🛰️ Satélite';
}

// ═══════════════════════════════════════════════════════
// GLOBAL SEARCH DROPDOWN + CENTER MAP
// ═══════════════════════════════════════════════════════
let searchDropdownTimer=null;

function handleGlobalSearchInput(value){
  handleGlobalSearch(value);
  const box=document.getElementById('global-search-results');
  if(!box) return;
  if(!value || value.trim().length<2){
    box.style.display='none';
    return;
  }
  const term=normalizeText(value);
  const matches=DB.elements.filter(el=>{
    const haystack=[el.nome,el.tipo,el.status,el.modelo,el.endereco,el.detalhes,el.id].map(normalizeText).join(' ');
    return haystack.includes(term);
  }).slice(0,8);
  if(matches.length===0){
    box.style.display='none';
    return;
  }
  box.innerHTML=matches.map(el=>{
    const tc=TYPE_CONFIG[el.tipo]||{};
    const hasCoords=el.lat&&el.lng;
    return `<div onclick="focusSearchResult(${el.id})" style="padding:8px 12px;cursor:pointer;font-size:11px;border-bottom:1px solid var(--border);transition:background .1s;display:flex;align-items:center;gap:8px" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <span style="color:${tc.color||'var(--text3)'}">${ICONS[el.tipo]||''}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(el.nome)}</div>
        <div style="font-size:10px;color:var(--text3)">${tc.label||esc(el.tipo)} · ${esc(el.status)}${hasCoords?' · 📍 '+el.lat.toFixed(5)+', '+el.lng.toFixed(5):''}</div>
      </div>
    </div>`;
  }).join('');
  box.style.display='block';
  if(searchDropdownTimer) clearTimeout(searchDropdownTimer);
  searchDropdownTimer=setTimeout(()=>{box.style.display='none';},8000);
}

function focusSearchResult(id){
  const box=document.getElementById('global-search-results');
  if(box) box.style.display='none';
  const el=DB.elements.find(e=>e.id===id);
  if(!el) return;
  selectedNodeId=id;
  if(el.lat&&el.lng){
    switchTab('geomap');
    geoMap.setView([el.lat,el.lng],16,{animate:true});
    refreshAllMarkers();
    highlightMarkerTemporarily(id);
  } else {
    switchTab('topology');
    if(network) network.focus(id,{animation:{duration:500,easingFunction:'easeInOutCubic'},scale:1.2});
    refreshAllMarkers();
  }
}

function highlightMarkerTemporarily(id){
  const marker=mapMarkers[id];
  if(!marker) return;
  const el=DB.elements.find(e=>e.id===id);
  if(!el) return;
  const originalIcon=marker.getIcon();
  const pulseHtml=`<div style="width:36px;height:36px;border-radius:50%;background:rgba(30,167,215,.25);border:3px solid var(--accent);display:flex;align-items:center;justify-content:center;animation:pulse 1s infinite;color:#fff;position:relative">
    ${(ICONS[el.tipo]||'').replace('width="16"','width="14"').replace('height="16"','height="14"')}
  </div>`;
  marker.setIcon(L.divIcon({html:pulseHtml,className:'map-node-marker',iconSize:[36,36],iconAnchor:[18,18]}));
  setTimeout(()=>{
    if(mapMarkers[id]) marker.setIcon(originalIcon);
  },3000);
}

function locateElement(id){
  const el=DB.elements.find(e=>e.id===id);
  if(!el||!el.lat||!el.lng){toast('Elemento sem coordenadas','error');return;}
  switchTab('geomap');
  geoMap.setView([el.lat,el.lng],17);
  selectedNodeId=id;
  refreshAllMarkers();
  highlightMarkerTemporarily(id);
  showPanel(id);
}

function toggleDraftMode(){
  draftMode=!draftMode;
  const btn=document.getElementById('draft-toggle-btn');
  if(btn){
    btn.classList.toggle('cable-active',draftMode);
    btn.style.border=draftMode?'2px solid var(--yellow)':'';
    btn.style.color=draftMode?'var(--yellow)':'';
  }
  toast(draftMode?'📐 Modo Rascunho ativo — novos elementos/cabos serão marcados como rascunho':'📐 Modo Rascunho desativado',draftMode?'warn':'success');
  refreshAllMarkers();
  refreshAllCables();
}

async function promoteToReal(id, type){

async function registerInspection(id){
  const el=DB.elements.find(e=>e.id===id);
  if(!el) return;
  const today=new Date().toISOString().slice(0,10);
  const saved=await api('PUT',papi(`/elements/${id}`),{ultima_inspecao:today});
  if(!saved) return;
  el.ultima_inspecao=today;
  addOrUpdateMarker(el);
  showPanel(id);
  toast('🔍 Inspeção registrada para '+today,'success');
}
  if(type==='element'){
    const el=DB.elements.find(e=>e.id===id);
    if(!el||!el.draft) return;
    const saved=await api('PUT',papi(`/elements/${id}`),{draft:false});
    if(!saved) return;
    el.draft=false;
    addOrUpdateMarker(el);
    showPanel(id);
    toast('✅ Elemento promovido para real!','success');
  } else if(type==='cable'){
    const conn=DB.connections.find(c=>c.id===id);
    if(!conn||!conn.draft) return;
    const saved=await api('PUT',papi(`/connections/${id}`),{draft:false});
    if(!saved) return;
    conn.draft=false;
    drawCableOnMap(conn);
    showCablePanel(id);
    toast('✅ Cabo promovido para real!','success');
  }
}

let _draftVisible=true;
function toggleDraftVisibility(show){
  _draftVisible=show;
  refreshAllMarkers();
  refreshAllCables();
}
}

let traceHighlightLayer = null;
let traceHighlightTimers = [];

function highlightPathOnMap(pathData){
  if(!pathData || !pathData.nodes) return;
  switchTab('geomap');
  if(traceHighlightLayer){
    geoMap.removeLayer(traceHighlightLayer);
    traceHighlightLayer = null;
  }
  traceHighlightTimers.forEach(t=>clearTimeout(t));
  traceHighlightTimers = [];

  const nodes = pathData.nodes;
  const coords = [];
  nodes.forEach(node=>{
    const el = DB.elements.find(e=>String(e.id)===String(node.id));
    if(el && el.lat && el.lng) coords.push([el.lat, el.lng]);
  });

  if(coords.length > 1){
    traceHighlightLayer = L.polyline(coords, {
      color: 'var(--accent)',
      weight: 4,
      opacity: 0.9,
      dashArray: '10,8',
      lineCap: 'round',
  }).addTo(geoMap);

  L.GridLayer.prototype._updateOpacity = function(){
    var t;
    for(t in this._tiles){
      var s=this._tiles[t];
      if(s.current&&s.loaded){s.active=true;L.DomUtil.setOpacity(s.el,1);}
    }
  };
  L.GridLayer.prototype._onOpaqueTile=L.Util.falseFn;


    geoMap.fitBounds(traceHighlightLayer.getBounds(), {padding:[60,60], animate:true});
  }

  nodes.forEach((node, idx)=>{
    const timer = setTimeout(()=>{
      highlightMarkerTemporarily(node.id);
    }, idx * 400);
    traceHighlightTimers.push(timer);
  });

  const resetTimer = setTimeout(()=>{
    if(traceHighlightLayer){
      geoMap.removeLayer(traceHighlightLayer);
      traceHighlightLayer = null;
    }
    traceHighlightTimers = [];
  }, 10000);
  traceHighlightTimers.push(resetTimer);
}

function ctxCreateIncident(){
  if(!ctxTargetId) return;
  hideCtxMenu();
  openIncidentModal(null, ctxTargetId);
}

// Close search dropdown on outside click
document.addEventListener('click',e=>{
  if(!e.target.closest('.topbar-search'))
    document.getElementById('global-search-results').style.display='none';
});

// ═══════════════════════════════════════════════════════
// ADDRESS / CEP SEARCH
// ═══════════════════════════════════════════════════════

let searchTimer = null;

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const input = document.getElementById('addr-search-input');
    const q = input.value.trim();
    if (q.length < 3) {
      document.getElementById('addr-results').style.display = 'none';
      return;
    }
    searchAddress();
  }, 500);
}

async function searchAddress(){
  const q=document.getElementById('addr-search-input').value.trim();
  if(!q) return;
  const cep=q.replace(/\D/g,'');
  if(cep.length===8){
    try{
      const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d=await r.json();
      if(d.erro){showAddrResults([],'CEP nao encontrado');return;}

      // Build address
      const addr=`${d.logradouro||''}, ${d.bairro||''}, ${d.localidade} - ${d.uf}`;

      // Check cache first
      const cached = await api('POST','/api/address-cache/lookup',{
        cep, logradouro: d.logradouro||''
      });
      if(cached && cached.latitude && cached.longitude){
        showAddrResults([{display:addr,lat:cached.latitude,lng:cached.longitude,precision:'MANUAL'}]);
        return;
      }

      // Try Nominatim full address
      const nom=await nominatimSearch(addr);
      if(nom){
        showAddrResults([{display:addr,...nom,precision:'EXACT'}]);
        return;
      }

      // Try neighborhood + city
      const bairro=await nominatimSearch(`${d.bairro}, ${d.localidade} - ${d.uf}`);
      if(bairro){
        showAddrResults([{display:addr,...bairro,precision:'APPROXIMATE'}]);
        return;
      }

      // City center fallback - show as APPROXIMATE
      const cidade=await nominatimSearch(`${d.localidade}, ${d.uf}`);
      if(cidade){
        showAddrResults([{display:addr,...cidade,precision:'APPROXIMATE'}]);
        return;
      }

      // Nothing found - allow manual placement
      _pendingCepData = {cep, logradouro:d.logradouro||'', bairro:d.bairro||'', localidade:d.localidade, uf:d.uf};
      showAddrResults([{display:addr,lat:null,lng:null,precision:'NOT_FOUND'}]);
    }catch(e){showAddrResults([],'Erro ao consultar CEP');}
    return;
  }
  if(cep.length>0&&cep.length<8){
    showAddrResults([],'CEP invalido. Digite 8 digitos');
    return;
  }
  const results=await nominatimSearchMulti(q);
  showAddrResults(results);
}

let _nominatimLastCall=0;
async function nominatimSearch(q){
  const now=Date.now();const gap=1100-(now-_nominatimLastCall);
  if(gap>0) await new Promise(r=>setTimeout(r,gap));
  _nominatimLastCall=Date.now();
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=br`,{headers:{'User-Agent':'NetMapPro/1.0','Accept-Language':'pt-BR'}});
    if(r.status===429){toast('⚠️ Limite de requisições Nominatim. Tente em 1 min.','warn');return null;}
    const d=await r.json();
    if(d.length>0) return {lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon),display:d[0].display_name};
  }catch(e){}
  return null;
}

async function nominatimSearchMulti(q){
  const now=Date.now();const gap=1100-(now-_nominatimLastCall);
  if(gap>0) await new Promise(r=>setTimeout(r,gap));
  _nominatimLastCall=Date.now();
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=br`,{headers:{'User-Agent':'NetMapPro/1.0','Accept-Language':'pt-BR'}});
    if(r.status===429){toast('⚠️ Limite de requisições Nominatim. Tente em 1 min.','warn');return[];}
    const d=await r.json();
    return d.map(x=>({lat:parseFloat(x.lat),lng:parseFloat(x.lon),display:x.display_name}));
  }catch(e){}
  return [];
}

function showAddrResults(results, msg){
  const box=document.getElementById('addr-results');
  if(!results||results.length===0){
    box.innerHTML='<div style="padding:12px;font-size:12px;color:var(--text3)">'+(msg||'Nenhum resultado encontrado.')+'</div>';
    box.style.display='block';
    setTimeout(()=>box.style.display='none',3000);
    return;
  }
  box.innerHTML=results.map((r,i)=>{
    const precision=r.precision||'';
    const colors={'EXACT':'var(--green)','APPROXIMATE':'var(--orange)','MANUAL':'#8b5cf6','NOT_FOUND':'var(--text3)'};
    const labels={'EXACT':'✅ Coordenada exata','APPROXIMATE':'⚠️ Localização aproximada','MANUAL':'📌 Coordenada manual salva','NOT_FOUND':'📍 Endereço sem coordenadas'};
    const label=labels[precision]||'';
    const badge=label?`<span style="font-size:9px;color:${colors[precision]||'var(--text3)'};display:block;margin-top:2px">${label}</span>`:'';
    const coords=r.lat?`${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`:'';
    const manualBtn=!r.lat?`<button class="btn-warn" style="margin-top:6px;padding:3px 8px;font-size:10px;width:100%;border-radius:5px" onclick="startCepManualPlace()">\ud83d\udccd Clicar no mapa para posicionar</button>`:'';
    return `<div onclick="${r.lat?'goToAddr('+r.lat+','+r.lng+')':'javascript:void(0)'}" style="padding:9px 13px;cursor:${r.lat?'pointer':'default'};font-size:11px;border-bottom:1px solid var(--border);transition:background .1s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <div style="font-weight:600;color:var(--text)">\ud83d\udccd ${esc(r.display.split(',').slice(0,3).join(','))}</div>
      ${badge}
      <div style="font-size:10px;color:var(--text3);margin-top:2px">${coords}</div>
      ${manualBtn}
    </div>`;
  }).join('');
  box.style.display='block';
}

let _pendingCepData = null;

function startCepManualPlace() {
  if (!_pendingCepData) return;
  const d = _pendingCepData;
  hideQuickAddPopup();
  setMapMode('select');
  toast('\ud83d\udccd Clique no mapa para posicionar este endereco','success');
  geoMap.once('click', async function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    await api('POST', '/api/address-cache/save', {
      cep: d.cep, logradouro: d.logradouro||'', bairro: d.bairro||'',
      cidade: d.localidade, uf: d.uf, lat, lng
    });
    toast('\u2705 Coordenada salva para este CEP!','success');
    goToAddr(lat, lng);
    document.getElementById('addr-results').style.display='none';
  });
}

function goToAddr(lat,lng){
  if(!lat||!lng){document.getElementById('addr-results').style.display='none';return;}
  geoMap.setView([lat,lng],17,{animate:true});
  // Drop a temporary pin
  const pin=L.marker([lat,lng],{icon:L.divIcon({
    html:`<div style="width:28px;height:28px;border-radius:50%;background:rgba(0,200,255,.25);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;animation:pulse 1s infinite">📍</div>`,
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

// ═══════════════════════════════════════════════════════
// REPOSITION ELEMENT (drag after placement)
// ═══════════════════════════════════════════════════════
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
      toast('📍 Reposicionado!','success');
    });
    toast(`↕ Arraste o marcador de "${el?.nome}" para nova posição`,'success');
  } else {
    // Element has no marker yet — use place mode
    startPlaceMode(id);
  }
}

// ═══════════════════════════════════════════════════════
// CEO FUSION MAP
// ═══════════════════════════════════════════════════════
// FUSION MAP — CEO + CTO
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

  document.getElementById('fusion-title').textContent=`🔀 Mapa de Fusão — ${el.nome}`;
  const body=document.getElementById('fusion-body');

  if(allConns.length===0){
    body.innerHTML=`
      <div style="text-align:center;padding:40px;color:var(--text3)">
        <div style="font-size:32px;margin-bottom:12px">🔌</div>
        <div style="font-size:14px;font-weight:600">Nenhum cabo conectado a este ${isCTO?'CTO':'CEO'}</div>
        <div style="font-size:11px;margin-top:6px">Trace cabos para configurar as fusões.</div>
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
        <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(el.nome)}</div>
        <div style="font-size:10px;color:var(--text2)">${esc(el.endereco||'—')}</div>
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
      <span style="font-size:16px">👆</span>
      <span>
        <strong style="color:var(--yellow)">Clique esquerdo</strong> em fibra livre → seleciona para fundir com outra.
        <strong style="color:var(--purple)">Botão [S]</strong> → marcar como <em>sangria</em> (cabo passa pelo elemento).
        ${isCTO?`<strong style="color:var(--orange)">Botão [SP]</strong> → vai ao <em>splitter da CTO</em>.`:''}
        <strong style="color:var(--red)">Clique direito</strong> em fibra marcada → remover.
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
  const dir=isIn?'↙ Entrada':'Saída ↗';
  const pct=fo>0?Math.round(usedCount/fo*100):0;
  const barColor=pct===100?'var(--green)':pct>0?'var(--yellow)':'var(--border2)';

  return `<div class="fusion-cable-block" data-conn-id="${c.id}" style="border:1px solid ${fc}44;border-radius:10px;margin-bottom:10px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${fc}0e;cursor:pointer;border-bottom:1px solid ${fc}33" onclick="toggleFusionBlock(${c.id})">
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <div style="width:14px;height:14px;border-radius:50%;background:${fc};box-shadow:0 0 6px ${fc}88"></div>
        <span style="font-size:9px;font-weight:700;color:${fc};font-family:'Courier New',monospace">${esc(c.cor||'—')}</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;color:${tc.color||'var(--text)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          <span style="font-size:10px;color:var(--text3);font-weight:400">${dir}</span>  ${esc(otherEl?.nome||'Sem conexão')}
        </div>
        <div style="font-size:9px;color:var(--text3);margin-top:1px;font-family:'Courier New',monospace">${esc(c.fibra||'—')}${c.porta&&c.porta!=='—'?' · porta '+esc(c.porta):''} · ${Math.ceil(fo/getFibersPerTube(c))} tubos × ${getFibersPerTube(c)} fibras</div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:11px;font-weight:700;color:${fc}" id="fo-count-${c.id}">${usedCount}<span style="color:var(--text3);font-weight:400">/${fo}</span> FO</div>
        <div style="width:80px;height:4px;background:var(--border2);border-radius:2px;margin-top:4px;overflow:hidden">
          <div id="fo-bar-${c.id}" style="width:${pct}%;height:100%;background:${barColor};border-radius:2px;transition:width .3s"></div>
        </div>
      </div>
      <span style="font-size:12px;color:var(--text3);flex-shrink:0" id="fusion-toggle-${c.id}">▼</span>
    </div>
    <div id="fusion-fibers-${c.id}">
      ${renderTubes(c.id, fo, cd, c)}
    </div>
  </div>`;
}

function renderTubes(connId, fo, cd, cable){
  if(fo===0) return `<div style="padding:12px;font-size:11px;color:var(--text3)">Cabo elétrico — sem fibras ópticas.</div>`;
  const isCTO=fusionState.nodeType==='cto';
  const fpt=getFibersPerTube(cable);
  const tubeCount=Math.ceil(fo/fpt);
  const fibersData=cd.fibers||[];
  let html='';
  for(let t=0;t<tubeCount;t++){
    const start=t*fpt+1;
    const end=Math.min((t+1)*fpt,fo);
    const tubeSize=end-start+1;
    const tubeColor=TUBE_COLORS[t%12];
    const tubeColorName=FIBER_INDIVIDUAL_COLORS[t%12].nome;
    const tubeFibers=fibersData.filter(f=>f&&f.n>=start&&f.n<=end);
    const fusedCount=tubeFibers.filter(f=>f.fusedTo).length;
    const sangriaCount=tubeFibers.filter(f=>f.sangria).length;
    const splitterCount=isCTO?tubeFibers.filter(f=>f.splitter).length:0;
    const usedCount=fusedCount+sangriaCount+splitterCount;
    const barPct=tubeSize>0?Math.round(usedCount/tubeSize*100):0;
    const barColor=barPct===100?'var(--green)':barPct>0?'var(--yellow)':'var(--border2)';
    const isOpen=t===0; // first tube open by default

    html+=`<div class="fusion-tube-block">
      <div class="fusion-tube-header" style="border-left:4px solid ${tubeColor}"
           onclick="toggleTube(${connId},${t+1})">
        <span class="tube-toggle" id="fusion-toggle-tube-${connId}-${t+1}">${isOpen?'▼':'▶'}</span>
        <span class="tube-color-dot" style="background:${tubeColor}"></span>
        <span class="tube-label">TUBO ${String(t+1).padStart(2,'0')} — ${tubeColorName} — ${String(start).padStart(3,'0')}-${String(end).padStart(3,'0')}</span>
        <span class="tube-badge">${usedCount}/${tubeSize}</span>
        <span style="flex:1"></span>
        <div class="tube-bar-bg"><div class="tube-bar-fill" style="width:${barPct}%;background:${barColor}"></div></div>
      </div>
      <div class="fusion-tube-fibers" id="fusion-tube-fibers-${connId}-${t+1}" style="display:${isOpen?'':'none'}">
        ${renderTubeFiberRows(connId,start,end,fibersData,isCTO)}
      </div>
    </div>`;
  }
  return html;
}

function renderTubeFiberRows(connId, fiberStart, fiberEnd, fibersData, isCTO){
  const cols=isCTO?'32px 90px 1fr 60px 60px 24px':'32px 90px 1fr 60px 24px';
  let rows=`<div style="display:grid;grid-template-columns:${cols};gap:0;padding:3px 12px;background:var(--surface3);border-bottom:1px solid var(--border)">
    <div style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">#</div>
    <div style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Fibra</div>
    <div style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Fusão / Destino</div>
    <div style="font-size:8px;color:var(--purple);text-transform:uppercase;letter-spacing:.5px;text-align:center">S</div>
    ${isCTO?`<div style="font-size:8px;color:var(--orange);text-transform:uppercase;letter-spacing:.5px;text-align:center">SP</div>`:''}
    <div></div>
  </div>`;

  for(let i=fiberStart;i<=fiberEnd;i++){
    const fdata=fibersData.find(f=>f&&f.n===i)||{n:i,fusedTo:null,sangria:false,splitter:false,obs:''};
    const fc=FIBER_INDIVIDUAL_COLORS[(i-1)%12];
    const isFused=!!fdata.fusedTo;
    const isSangria=!!fdata.sangria;
    const isSplitter=isCTO&&!!fdata.splitter;
    const isUsed=isFused||isSangria||isSplitter;

    let fusionLabel='—';
    let fusionColor='var(--text3)';
    if(isFused){
      const destConn=DB.connections.find(c=>c.id===fdata.fusedTo.connId);
      const destEl=destConn?DB.elements.find(e=>e.id===(destConn.to===fusionState.nodeId?destConn.from:destConn.to)):null;
      const destFc=FIBER_INDIVIDUAL_COLORS[(fdata.fusedTo.fiberN-1)%12];
      fusionLabel=`F${fdata.fusedTo.fiberN} · ${esc(destEl?.nome||'?')}`;
      fusionColor=destFc.hex;
    } else if(isSangria){
      fusionLabel='Sangria →';
      fusionColor='var(--purple)';
    } else if(isSplitter){
      fusionLabel='→ Splitter CTO';
      fusionColor='var(--orange)';
    }

    const isEven=(i-fiberStart)%2===0;
    const bgColor=isSplitter?'rgba(255,145,0,.08)':isSangria?'rgba(199,125,255,.08)':isFused?fc.hex+'0d':isEven?'rgba(255,255,255,.015)':'transparent';
    const borderLeft=isSplitter?'var(--orange)':isSangria?'var(--purple)':isFused?fc.hex:'transparent';

    rows+=`<div class="fiber-row ${isUsed?'fr-fused':''}"
      data-conn="${connId}" data-fiber="${i}"
      onclick="fiberCellClick(${connId},${i})"
      oncontextmenu="fiberCellCtx(event,${connId},${i})"
      style="display:grid;grid-template-columns:${cols};align-items:center;gap:0;padding:4px 12px;
        background:${bgColor};border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;
        border-left:3px solid ${borderLeft};"
      onmouseover="this.style.background='rgba(255,255,255,.05)'"
      onmouseout="this.style.background='${bgColor}'">

      <div style="font-size:10px;font-family:'Courier New',monospace;color:var(--text3);font-weight:700">${i}</div>

      <div style="display:flex;align-items:center;gap:5px">
        <div style="width:9px;height:9px;border-radius:50%;background:${fc.hex};flex-shrink:0"></div>
        <span style="font-size:9px;color:${isUsed?fc.hex:'var(--text2)'};font-weight:${isUsed?700:400}">${fc.nome}</span>
      </div>

      <div style="font-size:9px;color:${fusionColor};font-weight:${isUsed?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px">
        ${isUsed
          ?`<span style="background:${fusionColor}18;border:1px solid ${fusionColor}44;border-radius:4px;padding:1px 5px">⟶ ${fusionLabel}</span>`
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
        ${isUsed?`<span style="font-size:11px;color:var(--red);opacity:.5;cursor:pointer" onclick="event.stopPropagation();fiberCellCtx(event,${connId},${i})" title="Remover">✕</span>`:''}
      </div>
    </div>`;
  }
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
    toast(`🔗 F${fiberN} → F${fdata.fusedTo.fiberN} em "${esc(destEl?.nome||'?')}" · clique direito para remover`,'success');
    return;
  }
  if(fdata?.sangria){toast(`🔀 Fibra ${fiberN} marcada como Sangria · clique direito para remover`,'success');return;}
  if(fdata?.splitter){toast(`🔀 Fibra ${fiberN} vai ao Splitter · clique direito para remover`,'success');return;}

  const cellEl=document.querySelector(`.fiber-row[data-conn="${connId}"][data-fiber="${fiberN}"]`);

  if(!fusionSelected){
    document.querySelectorAll('.fiber-row.selecting').forEach(e=>{e.classList.remove('selecting');e.style.outline='';});
    if(cellEl){cellEl.classList.add('selecting');cellEl.style.outline='2px solid var(--yellow)';cellEl.style.outlineOffset='-2px';}
    fusionSelected={connId,fiberN,el:cellEl};
    const fc=FIBER_INDIVIDUAL_COLORS[(fiberN-1)%12];
    toast(`⚡ Fibra ${fiberN} (${fc.nome}) selecionada — clique em outra fibra para fundir`,'success');
  } else {
    if(fusionSelected.connId===connId){toast('⚠️ Selecione uma fibra de outro cabo','error');return;}
    setFusion(fusionSelected.connId, fusionSelected.fiberN, connId, fiberN, null);
    setFusion(connId, fiberN, fusionSelected.connId, fusionSelected.fiberN, null);
    if(fusionSelected.el){fusionSelected.el.style.outline='';fusionSelected.el.classList.remove('selecting');}
    fusionSelected=null;
    saveFusionState(fusionState.nodeId);
    refreshFusionCells();
    toast('✅ Fusão criada!','success');
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
    toast(`🔀 Fibra ${fiberN} marcada como Sangria`,'success');
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
    toast(`🔀 Fibra ${fiberN} vai ao Splitter da CTO`,'success');
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
    if(confirm(`Remover fusão da fibra ${fiberN}?`)){
      removeFusion(connId,fiberN);removeFusion(pairConnId,pairFiberN);
      saveFusionState(fusionState.nodeId);refreshFusionCells();toast('🗑️ Fusão removida','success');
    }
  } else if(fdata?.sangria){
    if(confirm(`Remover sangria da fibra ${fiberN}?`)){
      fdata.sangria=false;saveFusionState(fusionState.nodeId);refreshFusionCells();toast('🗑️ Sangria removida','success');
    }
  } else if(fdata?.splitter){
    if(confirm(`Remover splitter da fibra ${fiberN}?`)){
      fdata.splitter=false;saveFusionState(fusionState.nodeId);refreshFusionCells();toast('🗑️ Splitter removido','success');
    }
  } else {
    if(fusionSelected&&fusionSelected.connId===connId&&fusionSelected.fiberN===fiberN){
      if(fusionSelected.el){fusionSelected.el.style.outline='';fusionSelected.el.classList.remove('selecting');}
      fusionSelected=null;toast('Seleção cancelada','success');
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
    if(container){
      // Save tube collapse states before re-rendering
      const tubeCount=Math.ceil(fo/getFibersPerTube(c));
      const tubeStates={};
      for(let t=0;t<tubeCount;t++){
        const tubeEl=document.getElementById(`fusion-tube-fibers-${c.id}-${t+1}`);
        if(tubeEl) tubeStates[t+1]=tubeEl.style.display!=='none';
      }
      container.innerHTML=renderTubes(c.id,fo,cd,c);
      // Restore tube collapse states
      for(let t=0;t<tubeCount;t++){
        const tubeNum=t+1;
        if(tubeStates[tubeNum]!==undefined){
          const tubeEl=document.getElementById(`fusion-tube-fibers-${c.id}-${tubeNum}`);
          const toggleEl=document.getElementById(`fusion-toggle-tube-${c.id}-${tubeNum}`);
          if(tubeEl&&toggleEl){
            tubeEl.style.display=tubeStates[tubeNum]?'':'none';
            toggleEl.textContent=tubeStates[tubeNum]?'▼':'▶';
          }
        }
      }
    }
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
  if(tog) tog.textContent=hidden?'▼':'▶';
}

function toggleTube(connId,tubeNum){
  const container=document.getElementById(`fusion-tube-fibers-${connId}-${tubeNum}`);
  const toggle=document.getElementById(`fusion-toggle-tube-${connId}-${tubeNum}`);
  if(!container||!toggle) return;
  const hidden=container.style.display==='none';
  container.style.display=hidden?'':'none';
  toggle.textContent=hidden?'▼':'▶';
}


// ═══════════════════════════════════════════════════════
// CABLE MODAL
// ═══════════════════════════════════════════════════════
function openCableModal() {
  if(!cableState||!cableState.fromId||!cableState.toId) return;
  const fromEl=DB.elements.find(e=>e.id===cableState.fromId);
  const toEl=DB.elements.find(e=>e.id===cableState.toId);
  document.getElementById('cable-from-name').textContent=fromEl?.nome||'?';
  document.getElementById('cable-to-name').textContent=toEl?.nome||'?';
  document.getElementById('cable-waypoints-count').textContent=`${cableState.waypoints.length} ponto(s) intermediário(s) no trajeto`;
  
  // List waypoints
  const list=document.getElementById('cable-waypoints-list');
  list.innerHTML=`<div style="font-size:10px;color:var(--text3);margin-bottom:6px;font-family:'Courier New',monospace">ROTA DO CABO</div>
  <div class="waypoint-item"><span class="waypoint-num">S</span><span>Início: ${esc(fromEl?.nome||'?')} (${fromEl?.lat?.toFixed(5)}, ${fromEl?.lng?.toFixed(5)})</span></div>
  ${cableState.waypoints.map((w,i)=>`<div class="waypoint-item"><span class="waypoint-num">${i+1}</span><span>Ponto: ${w.lat.toFixed(5)}, ${w.lng.toFixed(5)}</span><button onclick="removeWaypoint(${i})" style="margin-left:auto;background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">×</button></div>`).join('')}
  <div class="waypoint-item"><span class="waypoint-num">E</span><span>Fim: ${esc(toEl?.nome||'?')} (${toEl?.lat?.toFixed(5)}, ${toEl?.lng?.toFixed(5)})</span></div>`;

  // ========== CÁLCULO AUTOMÁTICO DA METRAGEM ==========
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
      // Verifica se o título é 'Cabo' e se o id é o mesmo
      const panelTitle = document.getElementById('panel-title').textContent;
      if (panelTitle === '🔌 Cabo') {
        showCablePanel(id);
      }
    }
    toast(newBroken ? '💔 Cabo marcado como rompido' : '🔧 Cabo reparado', 'success');
  }
}

async function awaitFinishRedraw(){
  const cid=_redrawCableId;
  _redrawCableId=null;
  if(!cableState||!cableState.fromId||!cableState.toId) return;
  const waypoints=cableState.waypoints||[];
  const conn=DB.connections.find(c=>c.id===cid);
  if(!conn){toast('Cabo não encontrado','error');cableState=null;return;}
  const payload={from:cableState.fromId,to:cableState.toId,waypoints};
  const res=await api('PUT',papi(`/connections/${cid}`),payload);
  if(res){
    Object.assign(conn,res);
    clearCablePreview();
    cableState=null;
    setMapMode('select');
    refreshAllCables();
    if(selectedCableId===cid) showCablePanel(cid);
    toast('📍 Rota do cabo atualizada!','success');
  } else {
    toast('Erro ao atualizar rota','error');
  }
}

async function saveCable(){
  if(!cableState||!cableState.fromId||!cableState.toId){toast('⚠️ Rota incompleta','error');return;}
  const conn={
   from:cableState.fromId, to:cableState.toId,
   waypoints:cableState.waypoints,
   porta: cableState.presetPorta || document.getElementById('cable-porta').value.trim() || '—',
   fibra: cableState.presetTipo || document.getElementById('cable-tipo').value,
   cor: cableState.presetCor || selectedFiberColor,
   obs: cableState.presetObs || document.getElementById('cable-obs').value.trim(),
   length: parseFloat(document.getElementById('cable-length').value) || null,
   broken: document.getElementById('cable-broken').value === 'true',
   draft: draftMode || undefined,
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
  toast('🔌 Cabo traçado!','success');
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
  toast('🗑️ Cabo removido','success');
}

// ═══════════════════════════════════════════════════════
// PANEL
// ═══════════════════════════════════════════════════════
function showPanel(id){
  const el=DB.elements.find(e=>e.id===id);if(!el) return;
  const tc=TYPE_CONFIG[el.tipo]||{};
  document.getElementById('right-panel').classList.remove('hidden');
  scheduleMapRender();
  document.getElementById('panel-title').innerHTML=`<span style="color:${tc.color}">${ICONS[el.tipo]||''}</span>&nbsp;${esc(el.nome)}`;
  const connsOut=DB.connections.filter(c=>c.from===id);
  const connsIn=DB.connections.filter(c=>c.to===id);
  const allConns=[...connsIn.map(c=>({...c,dir:'←'})),...connsOut.map(c=>({...c,dir:'→'}))];
  const sc=el.status==='ativo'?'var(--green)':el.status==='offline'?'var(--red)':'var(--orange)';
  const hasCords=el.lat&&el.lng;
  document.getElementById('panel-body').innerHTML=`
    <div class="detail-section">
      <div class="detail-label">Informações</div>
      <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${tc.label||esc(el.tipo)}</span></div>
      <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="badge badge-${el.status}">● ${esc(el.status)}</span></span></div>
      ${el.modelo?`<div class="detail-row"><span class="detail-key">Modelo</span><span class="detail-val">${esc(el.modelo)}</span></div>`:''}
      ${el.endereco?`<div class="detail-row"><span class="detail-key">Endereço</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${esc(el.endereco)}</span></div>`:''}
      ${hasCords?`<div class="detail-row"><span class="detail-key">Coords</span><span class="detail-val">${el.lat?.toFixed(5)}, ${el.lng?.toFixed(5)}</span></div>`:''}
      ${el.detalhes?`<div class="detail-row"><span class="detail-key">Detalhes</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${esc(el.detalhes)}</span></div>`:''}
      ${el.tipo==='poste'?`
        ${el.altura?`<div class="detail-row"><span class="detail-key">Altura</span><span class="detail-val">${esc(el.altura)} m</span></div>`:''}
        ${el.material?`<div class="detail-row"><span class="detail-key">Material</span><span class="detail-val">${esc(el.material)}</span></div>`:''}
        ${el.proprietario?`<div class="detail-row"><span class="detail-key">Proprietário</span><span class="detail-val">${esc(el.proprietario)}</span></div>`:''}
        ${el.ultima_inspecao?`<div class="detail-row"><span class="detail-key">Última Inspeção</span><span class="detail-val">${esc(el.ultima_inspecao)}</span></div>`:''}
      `:''}
      <div class="detail-row"><span class="detail-key">ID</span><span class="detail-val">#${el.id}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Cabos (${allConns.length})</div>
      ${allConns.length===0?'<div style="font-size:11px;color:var(--text3)">Sem conexões</div>':
        allConns.map(c=>{
          const otherId=c.dir==='→'?c.to:c.from;
          const other=DB.elements.find(e=>e.id===otherId);
          const fc=FIBER_COLORS[c.cor]||'#666';
          return `<div class="conn-item">
            <div style="color:${TYPE_CONFIG[other?.tipo]?.color||'#888'}">${ICONS[other?.tipo]||''}</div>
            <div class="conn-info">
              <div class="conn-name">${c.dir} ${esc(other?.nome||'?')}</div>
              <div class="conn-fiber"><span class="fiber-chip" style="background:${fc}"></span>${esc(c.fibra||'—')}</div>
            </div>
            <button class="btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteCable(${c.id})">✕</button>
          </div>`;
        }).join('')}
    </div>
    <div class="detail-section" id="panel-photos-section">
      <div class="detail-label">📷 Fotos</div>
      <div id="panel-photos-gallery" style="display:flex;gap:6px;flex-wrap:wrap"><span style="font-size:10px;color:var(--text3)">Carregando...</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn-primary" style="justify-content:center" onclick="openEditModal(${el.id})" aria-label="Editar elemento">✏️ Editar</button>
      ${!hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startPlaceMode(${el.id})" aria-label="Posicionar no mapa">📍 Posicionar no Mapa</button>`:''}
      ${hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startRepositionMode(${el.id})" aria-label="Reposicionar">↕ Reposicionar</button>`:''}
      ${(el.tipo==='ceo'||el.tipo==='cto')?`<button class="btn-ghost" style="justify-content:center;color:var(--yellow);border-color:var(--yellow)" onclick="openFusionMap(${el.id})" aria-label="Mapa de fusão">🔀 Mapa de Fusão</button>`:''}
      ${el.tipo==='cto'?`<button class="btn-ghost" style="justify-content:center;color:var(--green);border-color:var(--green)" onclick="openCtoPorts(${el.id})" aria-label="Portas CTO">📡 Portas CTO</button>`:''}
      ${el.tipo==='cliente'||el.tipo==='onu'?`<button class="btn-ghost" style="justify-content:center;color:var(--yellow);border-color:var(--yellow)" onclick="openSignalModal(${el.id})" aria-label="Sinal óptico">🔦 Sinal Óptico</button>`:''}
      ${el.tipo==='poste'?`<button class="btn-ghost" style="justify-content:center;color:var(--blue);border-color:var(--blue)" onclick="registerInspection(${el.id})" aria-label="Inspeção">🔍 Registrar Inspeção</button>`:''}
      ${el.draft?`<button class="btn-ghost" style="justify-content:center;color:var(--green);border-color:var(--green)" onclick="promoteToReal(${el.id},'element')" aria-label="Promover para real">✅ Promover para Real</button>`:''}
      <button class="btn-ghost" style="justify-content:center" onclick="beginCableFrom(${el.id})" aria-label="Traçar cabo">🔌 Traçar Cabo Aqui</button>
    </div>
    <div class="detail-section" id="panel-history-section" style="margin-top:8px">
      <div class="detail-label" onclick="loadElementHistory(${el.id})" style="cursor:pointer" title="Clique para carregar histórico">📋 Histórico</div>
      <div id="panel-history-list" style="font-size:10px;color:var(--text3)">Clique para carregar</div>
    </div>`;
  (async()=>{try{const photos=await api('GET',papi('/elements/'+id+'/photos'));const c=document.getElementById('panel-photos-gallery');if(c){if(!photos||!photos.length){c.innerHTML='<span style="font-size:10px;color:var(--text3)">Nenhuma foto</span>';return;}c.innerHTML=photos.filter(p=>p.url&&p.url.startsWith('/')).map(p=>`<a href="${p.url}" target="_blank"><img src="${p.url}" class="photo-thumb" loading="lazy"></a>`).join('');}}catch(e){}})();
}

function showCablePanel(id){
  const conn=DB.connections.find(c=>c.id===id); if(!conn) return;
  document.getElementById('right-panel').classList.remove('hidden');
  scheduleMapRender();
  const fromEl=DB.elements.find(e=>e.id===conn.from);
  const toEl=DB.elements.find(e=>e.id===conn.to);
  const fc=FIBER_COLORS[conn.cor]||'#666';
  const isBroken = conn.broken === true;
  const brokenText = isBroken ? '💔 Rompido' : '✅ Íntegro';
  const brokenColor = isBroken ? 'var(--red)' : 'var(--green)';
  document.getElementById('panel-title').innerHTML = '🔌 Cabo';
  document.getElementById('panel-body').innerHTML=`
    <div class="detail-section">
      <div class="detail-label">Rota</div>
      <div class="detail-row"><span class="detail-key">De</span><span class="detail-val">${esc(fromEl?.nome||'?')}</span></div>
      <div class="detail-row"><span class="detail-key">Para</span><span class="detail-val">${esc(toEl?.nome||'?')}</span></div>
      <div class="detail-row"><span class="detail-key">Pontos</span><span class="detail-val">${(conn.waypoints||[]).length} waypoints</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Cabo</div>
      <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${esc(conn.fibra||'—')}</span></div>
      <div class="detail-row"><span class="detail-key">Cor</span><span class="detail-val"><span class="fiber-chip" style="background:${fc}"></span>${esc(conn.cor||'—')}</span></div>
      <div class="detail-row"><span class="detail-key">Porta</span><span class="detail-val">${esc(conn.porta||'—')}</span></div>
      ${conn.length ? `<div class="detail-row"><span class="detail-key">Metragem</span><span class="detail-val">${conn.length} m</span></div>` : ''}
      <div class="detail-row"><span class="detail-key">Estado</span><span class="detail-val" style="color:${brokenColor}">${brokenText}</span></div>
      ${conn.draft?`<div class="detail-row"><span class="detail-key">Modo</span><span class="detail-val" style="color:var(--yellow);font-weight:700">📐 RASCUNHO</span></div>`:''}
      ${conn.obs ? `<div class="detail-row"><span class="detail-key">Obs</span><span class="detail-val">${esc(conn.obs)}</span></div>` : ''}
    </div>
    ${canDo('edit_cables') ? `
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn-primary" style="justify-content:center" onclick="openEditCableModal(${id})">✏️ Editar Cabo</button>
      ${conn.draft?`<button class="btn-ghost" style="justify-content:center;color:var(--green);border-color:var(--green)" onclick="promoteToReal(${id},'cable')">✅ Promover para Real</button>`:''}
      <button class="btn-warn" style="justify-content:center" onclick="toggleCableBroken(${id})">
        ${isBroken ? '🔧 Reparar Cabo' : '⚠️ Marcar como Rompido'}
      </button>
    </div>
    ` : ''}
    <button class="btn-danger" style="width:100%; justify-content:center" onclick="deleteCable(${id})">🗑️ Remover Cabo</button>
  `;
}

let selectedCableEditColor='Azul';
function openEditCableModal(cid){
  const conn=DB.connections.find(c=>c.id===cid);if(!conn) return;
  document.getElementById('cable-edit-id').value=cid;
  document.getElementById('cable-edit-fibra').value=conn.fibra||'';
  document.getElementById('cable-edit-porta').value=conn.porta||'';
  document.getElementById('cable-edit-obs').value=conn.obs||'';
  document.getElementById('cable-edit-broken').value=String(!!conn.broken);
  selectedCableEditColor=conn.cor||'Azul';
  let autoLength='';
  const fromEl=DB.elements.find(e=>e.id===conn.from);
  const toEl=DB.elements.find(e=>e.id===conn.to);
  if(fromEl?.lat&&fromEl?.lng&&toEl?.lat&&toEl?.lng){
    const pts=[{lat:fromEl.lat,lng:fromEl.lng},...(conn.waypoints||[]),{lat:toEl.lat,lng:toEl.lng}];
    let dist=0;
    for(let i=0;i<pts.length-1;i++) dist+=haversineDistance(pts[i].lat,pts[i].lng,pts[i+1].lat,pts[i+1].lng);
    autoLength=Math.round(dist*100)/100;
  }
  document.getElementById('cable-edit-length').value=conn.length||autoLength||'';
  const lengthHint=document.getElementById('cable-edit-length-hint');
  if(lengthHint){
    if(autoLength){
      lengthHint.textContent=conn.length?'':'📏 Distância calculada: '+autoLength+' m';
      lengthHint.style.display=conn.length?'none':'block';
    }else{
      lengthHint.textContent='';
      lengthHint.style.display='none';
    }
  }
  if(typeof buildFiberColorGrid==='function') buildFiberColorGrid('cable-edit-fiber-grid','selectedCableEditColor');
  openModal('modal-cable-edit');
}
async function saveEditCable(){
  const cid=parseInt(document.getElementById('cable-edit-id').value);
  const payload={
    fibra:document.getElementById('cable-edit-fibra').value.trim(),
    porta:document.getElementById('cable-edit-porta').value.trim(),
    cor:selectedCableEditColor,
    length:parseFloat(document.getElementById('cable-edit-length').value)||null,
    obs:document.getElementById('cable-edit-obs').value.trim(),
    broken:document.getElementById('cable-edit-broken').value==='true',
  };
  await api('PUT',papi(`/connections/${cid}`),payload);
  Object.assign(DB.connections.find(c=>c.id===cid)||{},payload);
  closeModal('modal-cable-edit');
  refreshAllCables();
  if(selectedCableId===cid) showCablePanel(cid);
  toast('🔌 Cabo atualizado!','success');
}

function closePanel(){
  document.getElementById('right-panel').classList.add('hidden');
  scheduleMapRender();
}

async function loadElementHistory(eid){
  const container=document.getElementById('panel-history-list');
  if(!container) return;
  container.innerHTML='<span style="font-size:10px;color:var(--text3)">Carregando...</span>';
  const events=await api('GET',papi('/audit?entity_id='+eid+'&limit=30'));
  if(!events||!events.length){
    container.innerHTML='<span style="font-size:10px;color:var(--text3)">Nenhum evento registrado</span>';
    return;
  }
  const ACTION_LABELS={
    element_created:'✅ Criado',element_updated:'✏️ Editado',element_deleted:'🗑️ Removido',
    connection_created:'🔌 Cabo criado',connection_updated:'🔌 Cabo editado',connection_deleted:'🔌 Cabo removido',
    incident_created:'🚨 Incidente criado',incident_updated:'🚨 Incidente editado',incident_deleted:'🚨 Incidente removido',
    cto_port_updated:'📡 Porta CTO',cto_ports_bulk_updated:'📡 Portas CTO (lote)',cto_splitter_added:'📡 Splitter adicionado',cto_splitter_removed:'📡 Splitter removido',
    dio_port_updated:'🔧 Porta DIO',
  };
  container.innerHTML=events.map(ev=>{
    const label=ACTION_LABELS[ev.action]||esc(ev.action);
    return `<div style="padding:3px 0;border-bottom:1px solid var(--border);display:flex;gap:6px;align-items:baseline;flex-wrap:wrap">
      <span style="color:var(--text3);white-space:nowrap;min-width:90px">${esc(ev.timestamp?.slice(5)||'')}</span>
      <span style="white-space:nowrap">${label}</span>
      <span style="color:var(--text3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(ev.message||'')}">${esc(ev.message||'')}</span>
      <span style="color:var(--primary);font-size:9px">${esc(ev.username||'')}</span>
    </div>`;
  }).join('');
}

function showElementPopup(id){
  const el=DB.elements.find(e=>e.id===id);if(!el) return;
  const existing=document.getElementById('element-popup-overlay');
  if(existing) existing.remove();
  const tc=TYPE_CONFIG[el.tipo]||{};
  const connsOut=DB.connections.filter(c=>c.from===id);
  const connsIn=DB.connections.filter(c=>c.to===id);
  const allConns=[...connsIn.map(c=>({...c,dir:'←'})),...connsOut.map(c=>({...c,dir:'→'}))];
  const hasCords=el.lat&&el.lng;
  const content=`
    <div class="element-popup-overlay" id="element-popup-overlay" onclick="closeElementPopup(event)">
      <div class="element-popup" onclick="event.stopPropagation()">
        <div class="element-popup-header">
          <span style="color:${tc.color}">${ICONS[el.tipo]||''}</span>
          <span style="flex:1;font-weight:700;font-size:15px">${esc(el.nome)}</span>
          <button onclick="closeElementPopup()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:20px;padding:4px;line-height:1">×</button>
        </div>
        <div class="element-popup-body">
          <div class="detail-section">
            <div class="detail-label">Informações</div>
            <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${tc.label||esc(el.tipo)}</span></div>
      <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="badge badge-${el.status}">● ${esc(el.status)}</span>${el.draft?' <span style="color:var(--yellow);font-size:10px;font-weight:700">📐 RASCUNHO</span>':''}</span></div>
            ${el.modelo?`<div class="detail-row"><span class="detail-key">Modelo</span><span class="detail-val">${esc(el.modelo)}</span></div>`:''}
            ${el.endereco?`<div class="detail-row"><span class="detail-key">Endereço</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${esc(el.endereco)}</span></div>`:''}
            ${hasCords?`<div class="detail-row"><span class="detail-key">Coords</span><span class="detail-val">${el.lat?.toFixed(5)}, ${el.lng?.toFixed(5)}</span></div>`:''}
            ${el.detalhes?`<div class="detail-row"><span class="detail-key">Detalhes</span><span class="detail-val" style="font-size:10px;font-family:sans-serif">${esc(el.detalhes)}</span></div>`:''}
            <div class="detail-row"><span class="detail-key">ID</span><span class="detail-val">#${el.id}</span></div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Cabos (${allConns.length})</div>
            ${allConns.length===0?'<div style="font-size:11px;color:var(--text3)">Sem conexões</div>':
              allConns.map(c=>{
                const otherId=c.dir==='→'?c.to:c.from;
                const other=DB.elements.find(e=>e.id===otherId);
                const fc=FIBER_COLORS[c.cor]||'#666';
                return `<div class="conn-item">
                  <div style="color:${TYPE_CONFIG[other?.tipo]?.color||'#888'}">${ICONS[other?.tipo]||''}</div>
                  <div class="conn-info">
                    <div class="conn-name">${c.dir} ${esc(other?.nome||'?')}</div>
                    <div class="conn-fiber"><span class="fiber-chip" style="background:${fc}"></span>${esc(c.fibra||'—')}</div>
                  </div>
                  <button class="btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteCable(${c.id})">✕</button>
                </div>`;
              }).join('')}
          </div>
          <div class="detail-section">
            <div class="detail-label">📷 Fotos</div>
            <div id="popup-photos-gallery" style="display:flex;gap:6px;flex-wrap:wrap"><span style="font-size:10px;color:var(--text3)">Carregando...</span></div>
          </div>
          <div class="element-popup-actions">
            <button class="btn-primary" style="justify-content:center" onclick="openEditModal(${el.id});closeElementPopup()">✏️ Editar</button>
            ${!hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startPlaceMode(${el.id});closeElementPopup()">📍 Posicionar no Mapa</button>`:''}
            ${hasCords?`<button class="btn-warn" style="justify-content:center" onclick="startRepositionMode(${el.id});closeElementPopup()">↕ Reposicionar</button>`:''}
            ${(el.tipo==='ceo'||el.tipo==='cto')?`<button class="btn-ghost" style="justify-content:center;color:var(--yellow);border-color:var(--yellow)" onclick="openFusionMap(${el.id});closeElementPopup()">🔀 Mapa de Fusão</button>`:''}
            ${el.tipo==='cto'?`<button class="btn-ghost" style="justify-content:center;color:var(--green);border-color:var(--green)" onclick="openCtoPorts(${el.id});closeElementPopup()">📡 Portas CTO</button>`:''}
            <button class="btn-ghost" style="justify-content:center" onclick="beginCableFrom(${el.id});closeElementPopup()">🔌 Traçar Cabo Aqui</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',content);
  document.addEventListener('keydown',elementPopupKeydown);
  (async()=>{try{const photos=await api('GET',papi('/elements/'+id+'/photos'));const c=document.getElementById('popup-photos-gallery');if(c){if(!photos||!photos.length){c.innerHTML='<span style="font-size:10px;color:var(--text3)">Nenhuma foto</span>';return;}c.innerHTML=photos.filter(p=>p.url&&p.url.startsWith('/')).map(p=>`<a href="${p.url}" target="_blank"><img src="${p.url}" class="photo-thumb" loading="lazy"></a>`).join('');}}catch(e){}})();
}

function closeElementPopup(event){
  if(event && event.target!==event.currentTarget) return;
  const overlay=document.getElementById('element-popup-overlay');
  if(overlay) overlay.remove();
  document.removeEventListener('keydown',elementPopupKeydown);
}

function elementPopupKeydown(e){
  if(e.key==='Escape') closeElementPopup();
}

function startPlaceMode(id){
  placeTargetId=id;
  setMapMode('place');
  switchTab('geomap');
  toast('📍 Clique no mapa para posicionar o elemento','success');
  closePanel();
}
let _redrawCableId = null;
function redrawCableRoute(){
  const cid=parseInt(document.getElementById('cable-edit-id').value);
  const conn=DB.connections.find(c=>c.id===cid);
  if(!conn){toast('Cabo não encontrado','error');return;}
  const fromEl=DB.elements.find(e=>e.id===conn.from);
  if(!fromEl?.lat){toast('⚠️ Elemento de origem sem coordenadas','error');return;}
  _redrawCableId=cid;
  closeModal('modal-cable-edit');
  cableState={fromId:conn.from,toId:null,waypoints:[],previewLine:null,complete:false};
  setMapMode('cable');
  switchTab('geomap');
  toast('📍 Redesenhe a rota — clique em pontos intermediários e no elemento de destino','success');
}
function beginCableFrom(id){
  const el=DB.elements.find(e=>e.id===id);
  if(!el?.lat){toast('⚠️ Posicione o elemento no mapa primeiro','error');return;}
  cableState={fromId:id,toId:null,waypoints:[],previewLine:null,complete:false};
  setMapMode('cable');
  switchTab('geomap');
  toast('🔌 Clique para adicionar pontos, clique em outro elemento para finalizar','success');
}

// ═══════════════════════════════════════════════════════
// VIS NETWORK (TOPOLOGY TAB)
// ═══════════════════════════════════════════════════════
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
      title:`<b>${esc(el.nome)}</b><br>${tc.label}<br>${esc(el.status)}${el.endereco?'<br>'+esc(el.endereco):''}`,
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
  network.on('oncontext',function(p){
    p.event.preventDefault();
    const nodeId = network.getNodeAt({x: p.event.clientX, y: p.event.clientY});
    if (nodeId) {
      ctxTargetId = parseInt(nodeId);
      ctxTargetType = null;
      showCtxMenu(p.event.clientX, p.event.clientY);
    }
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
  hideQuickAddPopup,
  showQuickAddPopup,
  quickAddElement,
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
  fiberCellClick,
  toggleSangria,
  toggleSplitter,
  fiberCellCtx,
  setFusion,
  removeFusion,
  refreshFusionCells,
  toggleFusionBlock,
  toggleTube,
  openCableModal,
  removeWaypoint,
  toggleCableBroken,
  saveCable,
  cancelCableMode,
  deleteCable,
  showPanel,
  showElementPopup,
  closeElementPopup,
  showCablePanel,
  closePanel,
  openEditCableModal,
  saveEditCable,
  redrawCableRoute,
  startPlaceMode,
  beginCableFrom,
  preloadNodeIcons,
  refreshVisNodes,
  buildVisData,
  initTopology,
  saveVisPositions,
  refreshTopology,
  scheduleMapRender,
  filterMapByStatus,
  populateMapLegend,
  toggleMapLayer,
  handleGlobalSearchInput,
  focusSearchResult,
  highlightMarkerTemporarily,
  highlightPathOnMap,
  ctxCreateIncident,
  handleMeasureClick,
  handleMeasureDblClick,
  clearMeasure,
  finishMeasure,
  loadElementHistory,
  handleRadiusClick,
  updateRadiusSearch,
  clearRadiusSearch,
  locateElement,
  toggleHeatmap,
  updateHeatmap,
  removeHeatmap,
  toggleDraftMode,
  promoteToReal,
  toggleDraftVisibility,
  registerInspection,
  handleFenceClick,
  finishFenceMode,
  cancelFenceMode,
  drawFenceOnMap,
  removeFenceFromMap,
  refreshAllFences,
  showFencePanel,
  loadFenceElements,
  zoomToFence,
  deleteFence,
  loadFencesFromDB,
}, [
  'fitMapToBounds',
  'setMapMode',
  'startCableModeWithSelection',
  'cancelCableMode',
  'saveCable',
  'searchAddress',
  'closePanel',
  'beginCableFrom',
  'openEditCableModal',
  'saveEditCable',
  'redrawCableRoute',
  'startPlaceMode',
  'filterMapByStatus',
  'toggleMapLayer',
  'focusSearchResult',
  'highlightPathOnMap',
  'ctxCreateIncident',
  'clearMeasure',
  'finishMeasure',
  'loadElementHistory',
  'clearRadiusSearch',
  'updateRadiusSearch',
  'locateElement',
  'toggleHeatmap',
  'updateHeatmap',
  'toggleDraftMode',
  'promoteToReal',
  'toggleDraftVisibility',
  'finishFenceMode',
  'cancelFenceMode',
  'drawFenceOnMap',
  'refreshAllFences',
  'deleteFence',
  'loadFencesFromDB',
]);

// ═══════════════════════════════════════════════════════
