/* ============================================================
   Configuración Supabase del panel admin.
   - Reemplaza los valores PLACEHOLDER cuando termines la guía
     en supabase/INSTRUCCIONES.md.
   - La anon key es PÚBLICA por diseño; no es secreto.
     La protección real está en las políticas RLS de la DB.
   ============================================================ */
window.NCG_CONFIG = {
  SUPABASE_URL:      'https://api.neura.com.py',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc0MTAxNDYxLCJleHAiOjE5MzE3ODE0NjF9.7_wAph8IolPMXtgfpezSwS5XR62IdD__qhqCywLDp3Q',
  STORE_SLUG:        'constructora-ncg',
};

window.NCG_IS_CONFIGURED = function(){
  var c = window.NCG_CONFIG || {};
  return c.SUPABASE_URL && c.SUPABASE_URL.indexOf('PLACEHOLDER') < 0
      && c.SUPABASE_ANON_KEY && c.SUPABASE_ANON_KEY.indexOf('PLACEHOLDER') < 0;
};
