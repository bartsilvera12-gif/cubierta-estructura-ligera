/* ============================================================
   Carga el usuario autenticado + su perfil ncg_profiles.
   Expone ncgProfile() (Promise) y window.NCG_HEADER_REFRESH().
   ============================================================ */
(function(){
  let _cache = null;

  window.ncgProfile = async function(){
    if (_cache) return _cache;
    if (!window.ncgSb) return null;
    const { data: { user }, error: ue } = await window.ncgSb.auth.getUser();
    if (ue || !user) return null;
    const { data, error } = await window.ncgSb
      .from('ncg_profiles')
      .select('id, store_id, email, role')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) {
      console.warn('[NCG] No se pudo cargar el perfil:', error && error.message);
      _cache = { id: user.id, store_id: null, email: user.email, role: 'admin' };
      return _cache;
    }
    _cache = data;
    return _cache;
  };

  // Pinta email + avatar (iniciales) en el header
  window.NCG_HEADER_REFRESH = async function(){
    const p = await window.ncgProfile();
    if (!p) return;
    const emailEl  = document.querySelector('.hd-user .info b');
    const roleEl   = document.querySelector('.hd-user .info span');
    const avatarEl = document.querySelector('.hd-user .avatar');
    if (emailEl && p.email)   emailEl.textContent = p.email;
    if (roleEl  && p.role)    roleEl.textContent  = p.role === 'admin' ? 'Administrador' : p.role;
    if (avatarEl && p.email){
      const ini = p.email.trim().slice(0,2).toUpperCase();
      avatarEl.textContent = ini;
    }
  };

  document.addEventListener('DOMContentLoaded', function(){
    if (window.NCG_IS_CONFIGURED && window.NCG_IS_CONFIGURED()){
      window.NCG_HEADER_REFRESH();
    }
  });
})();
