/* ============================================================
   Auth guard del panel.
   - Si NO hay claves de Supabase, deja navegar libremente
     (modo "preview" para que diseñes el panel sin estar logueado).
   - Si SÍ hay claves, exige sesión activa o redirige a /admin/login.html
   ============================================================ */
(function(){
  var here = location.pathname.replace(/\\/g,'/');
  var isLogin = /\/admin\/login\.html$/.test(here);

  function go(url){ location.replace(url); }

  if (!window.NCG_IS_CONFIGURED || !window.NCG_IS_CONFIGURED()){
    // Modo preview: no bloquear. Mostrar un banner discreto.
    if (!document.body) return;
    document.body.classList.add('ncg-preview-mode');
    var b = document.createElement('div');
    b.className = 'preview-banner';
    b.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>' +
      '<span><b>Modo preview.</b> Supabase aún no está conectado. ' +
      'Cuando completes <code>supabase/INSTRUCCIONES.md</code> el panel se activará.</span>';
    document.addEventListener('DOMContentLoaded', function(){
      document.body.appendChild(b);
    });
    return;
  }

  // Hay claves: comprobar sesión
  if (!window.ncgSb){
    if (!isLogin) go('login.html');
    return;
  }
  window.ncgSb.auth.getSession().then(function(res){
    var hasSession = !!(res && res.data && res.data.session);
    if (!hasSession && !isLogin) go('login.html');
    if (hasSession && isLogin) go('index.html');
  });
})();
