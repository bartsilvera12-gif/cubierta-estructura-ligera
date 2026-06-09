/* ============================================================
   Dashboard: stats + últimos mensajes + últimos trabajos.
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  await window.ncgProfile();

  const sb = window.ncgSb;

  // ---------- Stats ----------
  async function count(table, filters){
    let q = sb.from(table).select('id', { count: 'exact', head: true });
    if (filters) filters.forEach(f => { q = q.eq(f[0], f[1]); });
    const { count: c } = await q;
    return c ?? 0;
  }

  async function loadStats(){
    const [
      totServ, actServ,
      totTrab, destTrab,
      totGal,  actGal,
      totMsg,  nuevoMsg
    ] = await Promise.all([
      count('ncg_servicios'),                       count('ncg_servicios', [['activo', true]]),
      count('ncg_trabajos'),                        count('ncg_trabajos', [['destacado', true]]),
      count('ncg_galeria'),                         count('ncg_galeria',  [['activo', true]]),
      count('ncg_mensajes_contacto'),               count('ncg_mensajes_contacto', [['estado','nuevo']]),
    ]);

    const set = (key, val) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = val;
    };
    set('servicios', totServ);
    set('trabajos',  totTrab);
    set('galeria',   totGal);
    set('mensajes',  totMsg);

    document.getElementById('dServicios') && (document.getElementById('dServicios').textContent = `${actServ} activos`);
    document.getElementById('dTrabajos')  && (document.getElementById('dTrabajos').textContent  = `${destTrab} destacados`);
    document.getElementById('dGaleria')   && (document.getElementById('dGaleria').textContent   = `${actGal} activas`);
    const dM = document.getElementById('dMensajes');
    if (dM){
      dM.textContent = `${nuevoMsg} nuevos sin leer`;
      dM.classList.toggle('bad', nuevoMsg > 0);
    }
  }

  // ---------- Últimos mensajes ----------
  function fmtDate(s){
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }

  async function loadUltimosMensajes(){
    const wrap = document.getElementById('emptyMensajes');
    if (!wrap) return;
    const { data, error } = await sb.from('ncg_mensajes_contacto')
      .select('id, nombre, servicio_requerido, estado, created_at, telefono')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error || !data || !data.length) return;
    const html =
      '<ul style="display:flex;flex-direction:column;gap:10px;list-style:none;padding:0">' +
      data.map(m => `
        <li style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.02)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;color:var(--text)">${escapeHtml(m.nombre || 'Sin nombre')}</div>
            <div style="color:var(--text-mute);font-size:.82rem">${escapeHtml(m.servicio_requerido || '—')} · ${fmtDate(m.created_at)}</div>
          </div>
          <span class="badge ${m.estado}"><span class="dot"></span>${labelEstado(m.estado)}</span>
        </li>`).join('') +
      '</ul>';
    wrap.outerHTML = html;
  }

  async function loadUltimosTrabajos(){
    const wrap = document.getElementById('emptyTrabajos');
    if (!wrap) return;
    const { data, error } = await sb.from('ncg_trabajos')
      .select('id, titulo, tipo_trabajo, fecha_trabajo, imagen_principal_url, destacado')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error || !data || !data.length) return;
    const html =
      '<ul style="display:flex;flex-direction:column;gap:10px;list-style:none;padding:0">' +
      data.map(t => `
        <li style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.02)">
          ${t.imagen_principal_url
            ? `<img class="row-thumb" src="${escapeAttr(t.imagen_principal_url)}" alt="">`
            : `<span style="width:48px;height:36px;border-radius:7px;background:var(--bg-3);display:inline-flex;align-items:center;justify-content:center;color:var(--text-mute)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></span>`}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.titulo || 'Sin título')}</div>
            <div style="color:var(--text-mute);font-size:.82rem">${escapeHtml(t.tipo_trabajo || '—')} · ${t.fecha_trabajo || ''}</div>
          </div>
          ${t.destacado ? '<span class="badge destacado"><span class="dot"></span>Destacado</span>' : ''}
        </li>`).join('') +
      '</ul>';
    wrap.outerHTML = html;
  }

  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g, '&quot;'); }
  function labelEstado(e){
    return ({nuevo:'Nuevo', contactado:'Contactado', presupuesto_enviado:'Presupuesto', cerrado:'Cerrado', descartado:'Descartado'})[e] || e;
  }

  try {
    await Promise.all([loadStats(), loadUltimosMensajes(), loadUltimosTrabajos()]);
  } catch(err){
    console.warn('[NCG] Dashboard:', err);
  }
})();
