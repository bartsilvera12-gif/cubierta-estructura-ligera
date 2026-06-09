/* ============================================================
   Configuración: lee/edita ncg_configuracion (clave/valor).
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  const sb = window.ncgSb;
  const profile = await window.ncgProfile();

  const form = document.getElementById('cfgForm');
  if (!form) return;

  let dataMap = {};

  async function load(){
    const { data, error } = await sb.from('ncg_configuracion').select('clave,valor,tipo');
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    dataMap = {};
    (data || []).forEach(r => { dataMap[r.clave] = r.valor; });
    Object.keys(dataMap).forEach(clave => {
      const el = form.querySelector(`[name="${clave}"]`);
      if (el && dataMap[clave] != null) el.value = dataMap[clave];
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const rows = Array.from(form.querySelectorAll('[name]'))
      .map(el => ({ clave: el.name, valor: (el.value ?? '').trim(), store_id: profile.store_id }))
      .filter(r => r.clave);

    if (!profile?.store_id){
      return window.ncgToast && window.ncgToast('No tienes store asignada en el perfil.', 'err');
    }

    const { error } = await sb.from('ncg_configuracion').upsert(rows, { onConflict: 'store_id,clave' });
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    window.ncgToast && window.ncgToast('Configuración guardada.', 'ok');
  });

  // Restablecer = recargar lo que hay en BD
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('.form-actions .btn.ghost');
    if (b) { ev.preventDefault(); load(); window.ncgToast && window.ncgToast('Cambios descartados.', 'info'); }
  });

  load();
})();
