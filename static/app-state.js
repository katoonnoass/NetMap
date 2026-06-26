// Shared utilities, catalogs, and global state
const _PAGE_SIZE=20;
let _incidentsShown=_PAGE_SIZE;
let _customersShown=_PAGE_SIZE;
let _cablesShown=_PAGE_SIZE;
let _tableShown=50;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dphi / 2) * Math.sin(dphi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dlambda / 2) * Math.sin(dlambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateRouteDistance(waypoints) {
  if (!waypoints || waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversineDistance(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng
    );
  }
  return total;
}

const ICONS = {
  bgp:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><ellipse cx="9" cy="9" rx="3" ry="7.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 9h15M2.5 5.5h13M2.5 12.5h13" stroke="currentColor" stroke-width="1.2"/></svg>`,
  core:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="7" width="2" height="4" rx=".5" fill="currentColor" opacity=".7"/><rect x="8" y="7" width="2" height="4" rx=".5" fill="currentColor" opacity=".5"/><rect x="11" y="7" width="2" height="4" rx=".5" fill="currentColor" opacity=".3"/></svg>`,
  dio:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="7" r="1" fill="currentColor"/><circle cx="7.5" cy="7" r="1" fill="currentColor"/><circle cx="10.5" cy="7" r="1" fill="currentColor"/><circle cx="13.5" cy="7" r="1" fill="currentColor"/><circle cx="4.5" cy="11" r="1" fill="currentColor"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10.5" cy="11" r="1" fill="currentColor"/><circle cx="13.5" cy="11" r="1" fill="currentColor"/></svg>`,
  olt:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="9" r="1" fill="currentColor"/></svg>`,
  onu:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="5" y="4" width="8" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="8.5" r="1.2" fill="currentColor"/></svg>`,
  ceo:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2L16 7V16H2V7L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="11" r="2" stroke="currentColor" stroke-width="1.3"/></svg>`,
  cto:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="5.5" width="13" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 8.5h13" stroke="currentColor" stroke-width="1.2"/></svg>`,
  splitter:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="3.5" cy="9" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="14.5" cy="5" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="14.5" cy="9" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="14.5" cy="13" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 9L9 9M9 9L12.9 5M9 9L12.9 9M9 9L12.9 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  switch:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="5.5" width="15" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="3.5" y="8" width="2" height="2" rx=".4" fill="currentColor"/><rect x="7" y="8" width="2" height="2" rx=".4" fill="currentColor"/><rect x="10.5" y="8" width="2" height="2" rx=".4" fill="currentColor"/></svg>`,
  roteador:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M9 6V3M9 15v-3M6 9H3M15 9h-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  poste:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5.5" cy="9.2" r="1" fill="currentColor"/><circle cx="12.5" cy="9.2" r="1" fill="currentColor"/></svg>`,
  cliente:`<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

const TYPE_CONFIG = {
  bgp:     {label:'BGP/Upstream',color:'#ff6b6b', cat:'core'},
  core:    {label:'Core/DC',     color:'#ff9100', cat:'core'},
  dio:     {label:'DIO',         color:'#c77dff', cat:'core'},
  olt:     {label:'OLT',         color:'#0080ff', cat:'core'},
  onu:     {label:'ONU/ONT',     color:'#40c4ff', cat:'rua'},
  ceo:     {label:'CEO',         color:'#ffe066', cat:'rua'},
  cto:     {label:'CTO',         color:'#00e676', cat:'rua'},
  splitter:{label:'Splitter',    color:'#00c8ff', cat:'core'},
  switch:  {label:'Switch',      color:'#ff80ab', cat:'core'},
  roteador:{label:'Roteador',    color:'#69f0ae', cat:'core'},
  poste:   {label:'Poste',       color:'#a1887f', cat:'rua'},
  cliente: {label:'Cliente',     color:'#a0f0c0', cat:'rua'},
};

const FIBER_COLORS = {
  'Azul':'#1565C0','Laranja':'#E65100','Verde':'#2E7D32','Marrom':'#4E342E',
  'Cinza':'#757575','Branco':'#EEEEEE','Vermelho':'#C62828','Preto':'#212121',
  'Amarelo':'#F9A825','Violeta':'#6A1B9A','Rosa':'#AD1457','Aqua':'#00838F',
  'Turquesa':'#00695C','Lima':'#558B2F','Salmão':'#BF360C','Bege':'#A1887F',
};

const CABLE_TYPES = [
  {label:'Cabo Tronco 288FO',fo:288,grupo:'Tronco'},
  {label:'Cabo Tronco 216FO',fo:216,grupo:'Tronco'},
  {label:'Cabo Tronco 144FO',fo:144,grupo:'Tronco'},
  {label:'Cabo Tronco 96FO',fo:96,grupo:'Tronco'},
  {label:'Cabo Tronco 72FO',fo:72,grupo:'Tronco'},
  {label:'Cabo Tronco 48FO',fo:48,grupo:'Tronco'},
  {label:'Cabo Tronco 36FO',fo:36,grupo:'Tronco'},
  {label:'Cabo Tronco 24FO',fo:24,grupo:'Tronco'},
  {label:'Cabo Tronco 18FO',fo:18,grupo:'Tronco'},
  {label:'Cabo Tronco 12FO',fo:12,grupo:'Tronco'},
  {label:'Cabo Distribuição 24FO',fo:24,grupo:'Distribuição'},
  {label:'Cabo Distribuição 12FO',fo:12,grupo:'Distribuição'},
  {label:'Cabo Distribuição 8FO',fo:8,grupo:'Distribuição'},
  {label:'Cabo Distribuição 6FO',fo:6,grupo:'Distribuição'},
  {label:'Cabo Distribuição 4FO',fo:4,grupo:'Distribuição'},
  {label:'Cabo Derivação 12FO',fo:12,grupo:'Derivação'},
  {label:'Cabo Derivação 6FO',fo:6,grupo:'Derivação'},
  {label:'Cabo Derivação 4FO',fo:4,grupo:'Derivação'},
  {label:'Drop 1FO Flat',fo:1,grupo:'Drop'},
  {label:'Drop 2FO Flat',fo:2,grupo:'Drop'},
  {label:'Drop 4FO Flat',fo:4,grupo:'Drop'},
  {label:'Drop 1FO Redondo',fo:1,grupo:'Drop'},
  {label:'Drop 2FO Redondo',fo:2,grupo:'Drop'},
  {label:'Cordão Simplex 1FO',fo:1,grupo:'Indoor'},
  {label:'Cordão Duplex 2FO',fo:2,grupo:'Indoor'},
  {label:'Cabo Indoor 4FO',fo:4,grupo:'Indoor'},
  {label:'Cabo Indoor 6FO',fo:6,grupo:'Indoor'},
  {label:'Cabo Indoor 12FO',fo:12,grupo:'Indoor'},
  {label:'Cabo UTP Cat5e',fo:0,grupo:'Elétrico'},
  {label:'Cabo UTP Cat6',fo:0,grupo:'Elétrico'},
  {label:'Cabo UTP Cat6A',fo:0,grupo:'Elétrico'},
  {label:'Cabo 10G SFP+',fo:0,grupo:'Elétrico'},
  {label:'Cabo 40G QSFP+',fo:0,grupo:'Elétrico'},
  {label:'Cabo Metálico Par Trançado',fo:0,grupo:'Elétrico'},
  {label:'Cabo Coaxial RG6',fo:0,grupo:'Elétrico'},
];

const FIBER_INDIVIDUAL_COLORS = [
  {n:1,nome:'Azul',hex:'#1565C0'},{n:2,nome:'Laranja',hex:'#E65100'},
  {n:3,nome:'Verde',hex:'#2E7D32'},{n:4,nome:'Marrom',hex:'#4E342E'},
  {n:5,nome:'Cinza',hex:'#757575'},{n:6,nome:'Branco',hex:'#EEEEEE'},
  {n:7,nome:'Vermelho',hex:'#C62828'},{n:8,nome:'Preto',hex:'#212121'},
  {n:9,nome:'Amarelo',hex:'#F9A825'},{n:10,nome:'Violeta',hex:'#6A1B9A'},
  {n:11,nome:'Rosa',hex:'#AD1457'},{n:12,nome:'Aqua',hex:'#00838F'},
  {n:13,nome:'Azul/Anilha',hex:'#1565C0'},{n:14,nome:'Laranja/Anilha',hex:'#E65100'},
  {n:15,nome:'Verde/Anilha',hex:'#2E7D32'},{n:16,nome:'Marrom/Anilha',hex:'#4E342E'},
  {n:17,nome:'Cinza/Anilha',hex:'#757575'},{n:18,nome:'Branco/Anilha',hex:'#EEEEEE'},
  {n:19,nome:'Vermelho/Anilha',hex:'#C62828'},{n:20,nome:'Preto/Anilha',hex:'#212121'},
  {n:21,nome:'Amarelo/Anilha',hex:'#F9A825'},{n:22,nome:'Violeta/Anilha',hex:'#6A1B9A'},
  {n:23,nome:'Rosa/Anilha',hex:'#AD1457'},{n:24,nome:'Aqua/Anilha',hex:'#00838F'},
];

const FIBERS_PER_TUBE = 12;

function getFibersPerTube(cable) {
  const val = Number(
    (cable && cable.fibers_per_tube) ||
    (cable && cable.fibras_por_tubo) ||
    (cable && cable.tube_size) ||
    FIBERS_PER_TUBE
  );
  return (val > 0) ? val : FIBERS_PER_TUBE;
}

const TUBE_COLORS = [
  '#1A73E8', // Azul
  '#FF9800', // Laranja
  '#4CAF50', // Verde
  '#795548', // Marrom
  '#9E9E9E', // Cinza
  '#ECEFF1', // Branco
  '#F44336', // Vermelho
  '#212121', // Preto
  '#FFEB3B', // Amarelo
  '#9C27B0', // Violeta
  '#E91E63', // Rosa
  '#00BCD4', // Aqua
];

let DB = {elements:[],connections:[],dios:[],positions:{},incidents:[],customers:[],cables:[]};
let currentProjectId = null;
let selectedNodeId = null;
let ctxTargetId = null;
let ctxTargetType = null;
let selectedAddType = null;
let activeFilter = null;
let globalSearchTerm = '';
let activeStatusFilter = 'all';
let showOnlyUnpositioned = false;
let selectedFiberColor = 'Azul';
let selectedPortFiberColor = 'Azul';
let currentPropsId = null;
let draftMode = false;
let dashboardSummary = null;
let projectAudit = [];
let topologyHealth = null;
let ixcConfig = null;
let ixcLastTest = null;
let ixcLastSync = null;
let ixcLastViability = null;

let geoMap = null;
let tileLayer = null;
let mapMarkers = {};
let cablePolylines = [];
let cableLayers = [];

let mapMode = 'select';
let cableState = null;
let placeTargetId = null;
let measureState = {points:[], polyline:null, markers:[], tooltip:null, finished:false};

let network = null;
let nodesDS = null;
let edgesDS = null;
const NODE_CANVAS_ICONS = {};

let pendingCableType = null;
let pendingCableColor = 'Azul';
let pendingCablePorta = '';
let pendingCableObs = '';

let currentSplitCtoId = null;
let currentSplitPortNum = null;
let currentCtoIdForSplit = null;
let _currentCtoId = null;

let toastTimer = null;
let currentSession = {username:'', nome:'', role:'viewer', permissions:{}};
const ROLE_LABELS = {admin:'Admin', editor:'Editor', viewer:'Viewer'};
const ROLE_COLORS = {admin:'var(--orange)', editor:'var(--accent)', viewer:'var(--text2)'};
const PERM_LABELS = {
  view:'Visualizar',
  edit_elements:'Editar elementos',
  edit_cables:'Editar cabos',
  edit_dio:'Editar DIO',
  manage_projects:'Gerenciar projetos',
  manage_users:'Gerenciar usuários',
};

// Route configuration for hash-based navigation
const ROUTES = {
  'dashboard': {path:'/dashboard', label:'Dashboard', tab:'dashboard'},
  'geomap':    {path:'/mapa', label:'Mapa', tab:'geomap'},
  'topology':  {path:'/topologia', label:'Topologia', tab:'topology'},
  'dio':       {path:'/dio', label:'DIO', tab:'dio'},
  'table':     {path:'/inventario', label:'Inventário', tab:'table'},
  'cables':    {path:'/cabos', label:'Cabos', tab:'cables'},
  'validation':{path:'/validacao', label:'Validação', tab:'validation'},
  'customers': {path:'/clientes', label:'Clientes', tab:'customers'},
  'incidents': {path:'/incidentes', label:'Incidentes', tab:'incidents'},
  'reports':   {path:'/relatorios', label:'Relatórios', tab:'reports'},
  'ixc':       {path:'/ixc', label:'IXC', tab:'ixc'},
  'audit':     {path:'/auditoria', label:'Auditoria', tab:'audit'},
};

function getRouteFromHash(){
  const hash = window.location.hash.replace('#','');
  for(const [key,route] of Object.entries(ROUTES)){
    if(route.path === hash) return key;
  }
  return 'geomap'; // default
}

const App = window.App || (window.App = {});
App.modules = App.modules || {};

function registerPublicApi(namespace, api, aliases = []) {
  App[namespace] = Object.assign(App[namespace] || {}, api);
  App.modules[namespace] = Object.keys(App[namespace]);
  aliases.forEach(name => {
    if (api[name]) {
      window[name] = api[name];
    }
  });
  return App[namespace];
}

App.state = {
  get DB(){ return DB; },
  get currentProjectId(){ return currentProjectId; },
  get selectedNodeId(){ return selectedNodeId; },
  get dashboardSummary(){ return dashboardSummary; },
  get currentSession(){ return currentSession; },
};
