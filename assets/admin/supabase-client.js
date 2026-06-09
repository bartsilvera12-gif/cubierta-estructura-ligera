/* ============================================================
   Inicializa el cliente Supabase si las claves están puestas.
   Si no, deja window.ncgSb = null y los módulos lo manejan.
   Carga el SDK desde CDN (UMD), no requiere build.
   ============================================================ */
(function(){
  if (!window.NCG_IS_CONFIGURED || !window.NCG_IS_CONFIGURED()){
    window.ncgSb = null;
    return;
  }
  // window.supabase viene del bundle UMD cargado en la página.
  if (!window.supabase || !window.supabase.createClient){
    console.warn('[NCG] Supabase SDK no cargado. Comprueba el <script> del UMD.');
    window.ncgSb = null;
    return;
  }
  window.ncgSb = window.supabase.createClient(
    window.NCG_CONFIG.SUPABASE_URL,
    window.NCG_CONFIG.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
})();
