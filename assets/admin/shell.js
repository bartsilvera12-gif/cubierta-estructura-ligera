/* ============================================================
   Shell del panel: sidebar móvil, página activa, logout, toast,
   diálogo de confirmación.
   Incluido en todas las páginas del panel salvo login.
   ============================================================ */
(function(){
  /* ---- Marcar enlace activo en sidebar ---- */
  document.addEventListener('DOMContentLoaded', function(){
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.sb-link').forEach(function(a){
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href.endsWith(page)) a.classList.add('is-active');
    });
  });

  /* ---- Sidebar: achicar logo al scrollear ---- */
  document.addEventListener('DOMContentLoaded', function(){
    var sb = document.querySelector('.sidebar');
    if (!sb) return;
    var onScroll = function(){
      sb.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  });

  /* ---- Sidebar móvil ---- */
  document.addEventListener('DOMContentLoaded', function(){
    var toggle = document.querySelector('.hd-toggle');
    var sb     = document.querySelector('.sidebar');
    if (!toggle || !sb) return;

    // Backdrop hermano de la sidebar para cerrar al hacer click fuera
    var bd = document.createElement('div');
    bd.className = 'sidebar-backdrop';
    sb.parentNode.insertBefore(bd, sb.nextSibling);

    function open(){ sb.classList.add('is-open');  document.body.style.overflow='hidden'; }
    function close(){ sb.classList.remove('is-open'); document.body.style.overflow=''; }
    toggle.addEventListener('click', function(){
      sb.classList.contains('is-open') ? close() : open();
    });
    bd.addEventListener('click', close);
    sb.querySelectorAll('.sb-link').forEach(function(a){ a.addEventListener('click', close); });
    document.addEventListener('keydown', function(ev){
      if (ev.key === 'Escape' && sb.classList.contains('is-open')) close();
    });
  });

  /* ---- Logout ---- */
  document.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-logout]');
    if (!b) return;
    ev.preventDefault();
    if (window.ncgSb && window.ncgSb.auth){
      window.ncgSb.auth.signOut().then(function(){ location.href = 'login.html'; });
    } else {
      // Modo preview: solo vuelve al login (no hay sesión que cerrar)
      location.href = 'login.html';
    }
  });

  /* ---- Toast ---- */
  window.ncgToast = function(msg, kind){
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? (' ' + kind) : '');
    t.innerHTML = '<span class="dot"></span><span>' + String(msg) + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ t.remove(); }, 300);
    }, 2600);
  };

  /* ---- Diálogo de confirmación ---- */
  window.ncgConfirm = function(opts){
    return new Promise(function(resolve){
      opts = opts || {};
      var d = document.createElement('div');
      d.className = 'dialog';
      d.innerHTML =
        '<div class="dialog-card">' +
        '  <h3>' + (opts.title || '¿Confirmar?') + '</h3>' +
        '  <p>' + (opts.message || '') + '</p>' +
        '  <div class="dialog-actions">' +
        '    <button class="btn ghost" data-act="cancel">' + (opts.cancelText || 'Cancelar') + '</button>' +
        '    <button class="btn ' + (opts.danger ? 'danger' : '') + '" data-act="ok">' + (opts.okText || 'Aceptar') + '</button>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(d);
      requestAnimationFrame(function(){ d.classList.add('is-open'); });
      function close(val){
        d.classList.remove('is-open');
        setTimeout(function(){ d.remove(); resolve(val); }, 200);
      }
      d.addEventListener('click', function(ev){
        if (ev.target === d) close(false);
        var a = ev.target.closest && ev.target.closest('[data-act]');
        if (!a) return;
        close(a.dataset.act === 'ok');
      });
      var onKey = function(ev){
        if (ev.key === 'Escape'){ document.removeEventListener('keydown', onKey); close(false); }
        if (ev.key === 'Enter') { document.removeEventListener('keydown', onKey); close(true); }
      };
      document.addEventListener('keydown', onKey);
    });
  };
})();

/* ---- Banner del modo preview ---- */
(function(){
  var s = document.createElement('style');
  s.textContent =
    '.preview-banner{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:90;' +
    '  background:rgba(240,180,41,.08);border:1px solid rgba(240,180,41,.32);color:#ffd76b;' +
    '  padding:10px 16px;border-radius:99px;display:flex;align-items:center;gap:10px;' +
    '  font-size:.84rem;backdrop-filter:blur(10px);max-width:min(560px,calc(100% - 24px))}' +
    '.preview-banner svg{width:18px;height:18px;flex:0 0 auto}' +
    '.preview-banner code{background:rgba(255,255,255,.07);padding:1px 6px;border-radius:5px;font-size:.78em;color:#fff}';
  document.head.appendChild(s);
})();
