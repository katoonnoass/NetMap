// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function loadSession(){
  try{
    const me = await api('GET','/api/auth/me');
    if(!me) { window.location.href='/login'; return false; }
    currentSession = me;
    applyPermissionsToUI();
    renderUserChip();
    if(me.password_needs_rotation){
      toast('ðŸ” Altere a senha padrÃ£o do administrador assim que possÃ­vel','error');
    }
    return true;
  } catch(e){
    window.location.href='/login'; return false;
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
  // Hide edit buttons if no permission
  const readOnly = !p.edit_elements;
  const ixcTab = document.getElementById('tab-ixc');
  document.getElementById('btn-cable').style.display = p.edit_cables ? '' : 'none';
  document.querySelector('[onclick="openAddModal()"]').style.display = p.edit_elements ? '' : 'none';
  if(ixcTab) ixcTab.style.display = p.manage_users ? '' : 'none';
  document.getElementById('module-ixc').style.display = p.manage_users ? '' : 'none';
  if(readOnly){
    document.getElementById('readonly-hint').classList.add('show');
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
  await fetch('/api/auth/logout',{method:'POST'});
  window.location.href='/login';
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// USER MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function openUsersModal(){
  document.getElementById('user-dropdown').classList.remove('open');
  await renderUsersList();
  openModal('modal-users');
}

async function renderUsersList(){
  const users = await api('GET','/api/users');
  if(!users) return;
  const container = document.getElementById('users-list');
  if(!users.length){
    container.innerHTML='<div style="padding:20px;color:var(--text3);text-align:center">Nenhum usuÃ¡rio.</div>';
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
        <div class="user-row-name">${u.nome||u.username} ${isSelf?'<span style="font-size:9px;color:var(--accent);font-weight:400">(vocÃª)</span>':''}</div>
        <div class="user-row-meta">@${u.username} Â· criado ${u.created_at||'â€”'}</div>
      </div>
      <span class="role-badge role-${u.role}" style="margin-right:6px">${ROLE_LABELS[u.role]||u.role}</span>
      <span style="font-size:10px;padding:2px 8px;border-radius:10px;margin-right:8px;font-weight:700;${u.active?'color:var(--green);background:rgba(0,230,118,.1)':'color:var(--red);background:rgba(255,61,87,.1)'}">${u.active?'Ativo':'Inativo'}</span>
      <button class="btn-ghost" style="padding:4px 9px;font-size:11px;margin-right:4px" onclick="openEditUser('${u.username}')">âœï¸ Editar</button>
      ${!isSelf?`<button class="btn-danger" style="padding:4px 9px;font-size:11px" onclick="deleteUserUI('${u.username}','${u.nome||u.username}')">ðŸ—‘ï¸</button>`:''}
    </div>`;
  }).join('');
}

async function createUserUI(){
  const username = document.getElementById('nu-username').value.trim();
  const nome     = document.getElementById('nu-nome').value.trim();
  const password = document.getElementById('nu-password').value;
  const role     = document.getElementById('nu-role').value;
  if(!username||!password){toast('âš ï¸ Preencha username e senha','error');return;}
  const res = await api('POST','/api/users',{username,nome,password,role});
  if(!res){return;}
  document.getElementById('nu-username').value='';
  document.getElementById('nu-nome').value='';
  document.getElementById('nu-password').value='';
  document.getElementById('nu-role').value='viewer';
  await renderUsersList();
  toast('âœ… UsuÃ¡rio criado!','success');
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
    PERMS_ALL.map(p=>`<span class="perm-chip ${has.includes(p)?'perm-on':'perm-off'}">${has.includes(p)?'âœ“':'âœ—'} ${PERM_LABELS[p]||p}</span>`).join('');
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
  toast('ðŸ’¾ UsuÃ¡rio atualizado!','success');
}

async function deleteUserUI(username, nome){
  if(!confirm(`Excluir usuÃ¡rio "${nome}" (@${username})? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`)) return;
  const res = await api('DELETE',`/api/users/${username}`);
  if(!res) return;
  await renderUsersList();
  toast('ðŸ—‘ï¸ UsuÃ¡rio excluÃ­do','success');
}

registerPublicApi('auth', {
  loadSession,
  renderUserChip,
  applyPermissionsToUI,
  canDo,
  toggleUserDropdown,
  doLogout,
  openUsersModal,
  renderUsersList,
  createUserUI,
  openEditUser,
  updatePermsPreview,
  saveUserEdit,
  deleteUserUI,
}, [
  'createUserUI',
  'doLogout',
  'openUsersModal',
  'saveUserEdit',
  'toggleUserDropdown',
]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
document.addEventListener('DOMContentLoaded',async()=>{
  const ok = await loadSession();
  if(!ok) return;
  const projects=await api('GET','/api/projects');
  if(!projects?.length){toast('âŒ Nenhum projeto','error');return;}
  currentProjectId=projects[0].id;
  document.getElementById('topbar-project-name').textContent=projects[0].name;
  await loadAll();
  await loadProjectInsights();
  await loadIxcConfig();
  initGeoMap();
  refreshAllMarkers();
  refreshAllCables();
  updateStats();renderSidebar();renderTable();renderDioPanels();renderCustomers();renderIncidents();renderOrders();renderCables();renderValidation();renderReports();renderIxcSettings();
  preloadNodeIcons();
  setMapMode('select');
});

