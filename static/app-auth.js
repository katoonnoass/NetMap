// ═══════════════════════════════════════════════════════
async function loadSession(){
  try{
    const me = await api('GET','/api/auth/me');
    if(me && me.username){
      currentSession = me;
      applyPermissionsToUI();
      renderUserChip();
      if(me.password_needs_rotation){
        setTimeout(()=>openPasswordModal(true),150);
      }
      return true;
    }
    return false;
  } catch(e){
    return false;
  }
}

function renderUserChip(){
  const u = currentSession;
  const initials = (u.nome||u.username||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const color = ROLE_COLORS[u.role]||'var(--text2)';
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-avatar').style.background = color+'22';
  document.getElementById('user-avatar').style.color = color;
  document.getElementById('user-nome').textContent = u.nome || u.username;
  const badge = document.getElementById('user-role-badge');
  badge.textContent = ROLE_LABELS[u.role]||u.role;
  badge.className = `role-badge role-${u.role}`;
  // Dropdown info
  document.getElementById('dd-nome').textContent = u.nome || u.username;
  document.getElementById('dd-username').textContent = '@'+u.username;
  document.getElementById('dd-manage-users').style.display = u.permissions.manage_users ? 'flex' : 'none';
}

function applyPermissionsToUI(){
  const p = currentSession.permissions;
  const readOnly = !p.edit_elements;
  const ixcTab = document.getElementById('tab-ixc');
  const btnCable = document.getElementById('btn-cable');
  const btnAdd = document.querySelector('[onclick="openAddModal()"]');
  if(btnCable) btnCable.style.display = p.edit_cables ? '' : 'none';
  if(btnAdd) btnAdd.style.display = p.edit_elements ? '' : 'none';
  if(ixcTab) ixcTab.style.display = p.manage_users ? '' : 'none';
  if(readOnly){
    const hint = document.getElementById('readonly-hint');
    if(hint) hint.classList.add('show');
  }
}

function canDo(perm){
  return !!currentSession.permissions[perm];
}

function toggleUserDropdown(e){
  e.stopPropagation();
  const dd = document.getElementById('user-dropdown');
  const chip = document.getElementById('user-chip');
  const rect = chip.getBoundingClientRect();
  dd.style.right = (window.innerWidth - rect.right)+'px';
  dd.style.top = (rect.bottom + 6)+'px';
  dd.classList.toggle('open');
}
document.addEventListener('click', ()=>{
  document.getElementById('user-dropdown')?.classList.remove('open');
});

async function doLogout(){
  const headers = {'Content-Type':'application/json'};
  if(_csrfToken) headers['X-CSRFToken']=_csrfToken;
  await fetch('/api/auth/logout',{method:'POST',headers,credentials:'same-origin'});
  window.location.href='/login';
}

function openPasswordModal(required=false){
  document.getElementById('user-dropdown')?.classList.remove('open');
  document.getElementById('change-current-password').value='';
  document.getElementById('change-new-password').value='';
  document.getElementById('change-confirm-password').value='';
  document.getElementById('change-password-close').style.display=required?'none':'';
  document.getElementById('change-password-cancel').style.display=required?'none':'';
  openModal('modal-change-password');
  setTimeout(()=>document.getElementById('change-current-password').focus(),50);
}

async function changeOwnPassword(){
  const current_password=document.getElementById('change-current-password').value;
  const new_password=document.getElementById('change-new-password').value;
  const confirmation=document.getElementById('change-confirm-password').value;
  if(!current_password){toast('Informe a senha atual','error');return;}
  if(new_password.length<12){toast('A nova senha precisa ter pelo menos 12 caracteres','error');return;}
  if(new_password!==confirmation){toast('A confirmação da senha não confere','error');return;}
  const result=await api('POST','/api/auth/change-password',{current_password,new_password});
  if(!result) return;
  toast('Senha atualizada. Entre novamente.','success');
  setTimeout(()=>{window.location.href='/login';},700);
}

// ═══════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════
async function openUsersModal(){
  document.getElementById('user-dropdown').classList.remove('open');
  await renderUsersList();
  await renderApiKeysList();
  openModal('modal-users');
}

async function renderUsersList(){
  const users = await api('GET','/api/users');
  if(!users) return;
  const container = document.getElementById('users-list');
  if(!users.length){
    container.innerHTML='<div style="padding:20px;color:var(--text3);text-align:center">Nenhum usuário.</div>';
    return;
  }
  const roleColors = ROLE_COLORS;
  container.innerHTML = users.map(u=>{
    const initials=(u.nome||u.username).split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const color = roleColors[u.role]||'var(--text2)';
    const isSelf = u.username === currentSession.username;
    return `<div class="user-row ${!u.active?'inactive-overlay':''}">
      <div class="user-row-avatar" style="background:${color}22;color:${color}">${initials}</div>
      <div class="user-row-info">
        <div class="user-row-name">${u.nome||u.username} ${isSelf?'<span style="font-size:9px;color:var(--accent);font-weight:400">(você)</span>':''}</div>
        <div class="user-row-meta">@${u.username} · criado ${u.created_at||'—'}</div>
      </div>
      <span class="role-badge role-${u.role}" style="margin-right:6px">${ROLE_LABELS[u.role]||u.role}</span>
      <span style="font-size:10px;padding:2px 8px;border-radius:10px;margin-right:8px;font-weight:700;${u.active?'color:var(--green);background:rgba(0,230,118,.1)':'color:var(--red);background:rgba(255,61,87,.1)'}">${u.active?'Ativo':'Inativo'}</span>
      <button class="btn-ghost" style="padding:4px 9px;font-size:11px;margin-right:4px" onclick="openEditUser('${u.username}')">✏️ Editar</button>
      ${!isSelf?`<button class="btn-danger" style="padding:4px 9px;font-size:11px" onclick="deleteUserUI('${u.username}','${u.nome||u.username}')">🗑️</button>`:''}
    </div>`;
  }).join('');
}

async function createUserUI(){
  const username = document.getElementById('nu-username').value.trim();
  const nome     = document.getElementById('nu-nome').value.trim();
  const password = document.getElementById('nu-password').value;
  const role     = document.getElementById('nu-role').value;
  if(!username||!password){toast('⚠️ Preencha username e senha','error');return;}
  const res = await api('POST','/api/users',{username,nome,password,role});
  if(!res){return;}
  document.getElementById('nu-username').value='';
  document.getElementById('nu-nome').value='';
  document.getElementById('nu-password').value='';
  document.getElementById('nu-role').value='viewer';
  await renderUsersList();
  toast('✅ Usuário criado!','success');
}

function openEditUser(username){
  api('GET','/api/users').then(users=>{
    const u = users.find(x=>x.username===username);
    if(!u) return;
    document.getElementById('eu-username').value = u.username;
    document.getElementById('eu-nome').value = u.nome||'';
    document.getElementById('eu-role').value = u.role;
    document.getElementById('eu-active').value = u.active?'1':'0';
    document.getElementById('eu-password').value = '';
    updatePermsPreview(u.role);
    document.getElementById('eu-role').onchange = ()=>updatePermsPreview(document.getElementById('eu-role').value);
    openModal('modal-edit-user');
  });
}

const PERMS_ALL = ['view','edit_elements','edit_cables','edit_dio','manage_projects','manage_users'];
const PERMS_BY_ROLE = {
  admin:  ['view','edit_elements','edit_cables','edit_dio','manage_projects','manage_users'],
  editor: ['view','edit_elements','edit_cables','edit_dio'],
  viewer: ['view'],
};
function updatePermsPreview(role){
  const has = PERMS_BY_ROLE[role]||[];
  document.getElementById('eu-perms-preview').innerHTML =
    PERMS_ALL.map(p=>`<span class="perm-chip ${has.includes(p)?'perm-on':'perm-off'}">${has.includes(p)?'✓':'✗'} ${PERM_LABELS[p]||p}</span>`).join('');
}

async function saveUserEdit(){
  const username = document.getElementById('eu-username').value;
  const data = {
    nome: document.getElementById('eu-nome').value.trim(),
    role: document.getElementById('eu-role').value,
    active: document.getElementById('eu-active').value==='1',
  };
  const pass = document.getElementById('eu-password').value;
  if(pass) data.password = pass;
  const res = await api('PUT',`/api/users/${username}`,data);
  if(!res) return;
  closeModal('modal-edit-user');
  await renderUsersList();
  toast('💾 Usuário atualizado!','success');
}

async function deleteUserUI(username, nome){
  if(!confirm(`Excluir usuário "${nome}" (@${username})? Esta ação não pode ser desfeita.`)) return;
  const res = await api('DELETE',`/api/users/${username}`);
  if(!res) return;
  await renderUsersList();
  toast('🗑️ Usuário excluído','success');
}

async function renderApiKeysList(){
  const data=await api('GET','/api/apikeys');
  const el=document.getElementById('apikeys-list');
  if(!el) return;
  if(!data||!data.items||!data.items.length){el.innerHTML='<div style="font-size:10px;color:var(--text3);text-align:center;padding:8px">Nenhuma chave API.</div>';return;}
  el.innerHTML=data.items.map(k=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
    <div>
      <span style="font-size:11px;font-weight:600">${esc(k.name)}</span>
      <code style="font-size:10px;color:var(--text3);margin-left:8px">${esc(k.key_prefix)}</code>
      <span style="font-size:9px;color:var(--text3);margin-left:6px">${esc(k.role)}${k.active?'':' · revogada'}</span>
    </div>
    <div style="display:flex;gap:4px">
      ${k.active?`<button class="btn-ghost" style="padding:2px 6px;font-size:10px;color:var(--orange)" onclick="revokeApiKeyUI(${k.id})">Revogar</button>`:''}
      <button class="btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteApiKeyUI(${k.id})">✕</button>
    </div>
  </div>`).join('');
}

async function createApiKeyUI(){
  const name=document.getElementById('new-apikey-name').value.trim();
  const role=document.getElementById('new-apikey-role').value;
  if(!name){toast('⚠️ Nome obrigatório','error');return;}
  const res=await api('POST','/api/apikeys',{name,role});
  if(!res) return;
  document.getElementById('new-apikey-name').value='';
  await renderApiKeysList();
  toast(`🔑 Chave criada: ${res.key}`,'success');
  prompt('Copie a chave API (não será mostrada novamente):',res.key);
}

async function revokeApiKeyUI(id){
  if(!confirm('Revogar esta chave API? Ela não poderá mais ser usada.')) return;
  await api('PUT',`/api/apikeys/${id}`,{action:'revoke'});
  await renderApiKeysList();
  toast('🔑 Chave revogada','success');
}

async function deleteApiKeyUI(id){
  if(!confirm('Excluir esta chave API permanentemente?')) return;
  await api('DELETE',`/api/apikeys/${id}`);
  await renderApiKeysList();
  toast('🔑 Chave excluída','success');
}

registerPublicApi('auth', {
  loadSession,
  renderUserChip,
  applyPermissionsToUI,
  canDo,
  toggleUserDropdown,
  doLogout,
  openPasswordModal,
  changeOwnPassword,
  openUsersModal,
  renderUsersList,
  createUserUI,
  openEditUser,
  updatePermsPreview,
  saveUserEdit,
  deleteUserUI,
  renderApiKeysList,
  createApiKeyUI,
  revokeApiKeyUI,
  deleteApiKeyUI,
}, [
  'createUserUI',
  'createApiKeyUI',
  'doLogout',
  'openPasswordModal',
  'changeOwnPassword',
  'openUsersModal',
  'saveUserEdit',
  'toggleUserDropdown',
]);

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',async()=>{
  if(window.matchMedia('(max-width: 768px)').matches){
    document.getElementById('sidebar')?.classList.add('collapsed');
  }
  await fetchCsrfToken();
  const ok = await loadSession();
  if(!ok) return;
  const projects=await api('GET','/api/projects');
  if(!projects?.length){toast('❌ Nenhum projeto','error');return;}
  currentProjectId=projects[0].id;
  document.getElementById('topbar-project-name').textContent=projects[0].name;
  await loadAll();
  await loadProjectInsights();
  showProjectAlerts();
  await loadIxcConfig();
  initGeoMap();
  refreshAllMarkers();
  refreshAllCables();
  loadFencesFromDB();
  loadMaintenanceList();
  startSSEListener();
  updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderCables();renderValidation();renderReports();renderIxcSettings();
  preloadNodeIcons();
  setMapMode('select');

  // Apply URL hash routing
  const hashTab = getRouteFromHash();
  switchTab(hashTab);
});

// Listen for hash changes for back/forward navigation
window.addEventListener('hashchange', () => {
  const tab = getRouteFromHash();
  switchTab(tab);
});
