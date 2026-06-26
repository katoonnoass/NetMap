// Theme toggle module
(function() {
  const STORAGE_KEY = 'netmap-theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try{localStorage.setItem(STORAGE_KEY, theme);}catch(e){toast('⚠️ Não foi possível salvar preferência de tema','warn');}
  }

  function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    updateToggleIcon(next);
  }

  function updateToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }

  function applyTheme() {
    const theme = getTheme();
    setTheme(theme);
    updateToggleIcon(theme);
  }

  applyTheme();

  window.App = window.App || {};
  window.App.theme = { toggleTheme, setTheme, getTheme, applyTheme };
  window.toggleTheme = toggleTheme;
})();
