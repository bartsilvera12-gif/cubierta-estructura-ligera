/* ============================================================
   Mensajes: list + filtros estado + detalle + cambio de estado.
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  const sb = window.ncgSb;
  await window.ncgProfile();

  const ESTADOS = ['nuevo','contactado','presupuesto_enviado','cerrado','descartado'];
  const LABEL = { nuevo:'Nuevo', contactado:'Contactado', presupuesto_enviado:'Presupuesto', cerrado:'Cerrado', descartado:'Descartado' };

  const root = document.querySelector('.main-inner');
  const emptyEl = root.querySelector('#msgEmpty');
  const tableWrap = root.querySelector('#msgTable');
  const tbody = root.querySelector('#msgRows');
  const toolbar = root.querySelector('.toolbar');
  const searchInput = toolbar.querySelector('.search input');
  const chipsEls = Array.from(toolbar.querySelectorAll('.chip'));

  let all = [];
  let filterEstado = null;
  let searchQ = '';
  let whatsappBase = null;

  async function loadConfig(){
    const { data } = await sb.from('ncg_configuracion').select('clave,valor').eq('clave','telefono_whatsapp').maybeSingle();
    whatsappBase = data && data.valor;
  }

  async function load(){
    await loadConfig();
    const { data, error } = await sb.from('ncg_mensajes_contacto')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    all = data || [];
    render();
  }

  function render(){
    let items = all.slice();
    if (filterEstado) items = items.filter(m => m.estado === filterEstado);
    if (searchQ){
      const q = norm(searchQ);
      items = items.filter(m => norm(m.nombre).includes(q) || norm(m.telefono||'').includes(q) || norm(m.servicio_requerido||'').includes(q));
    }
    if (!items.length){
      emptyEl.hidden = false; tableWrap.style.display = 'none';
      return;
    }
    emptyEl.hidden = true;
    tableWrap.style.display = '';
    tbody.innerHTML = items.map(rowHtml).join('');

    tbody.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => openDetail(b.dataset.view)));
    tbody.querySelectorAll('[data-wa]').forEach(b => b.addEventListener('click', () => waOpen(b.dataset.wa)));
    tbody.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => { navigator.clipboard.writeText(b.dataset.copy); window.ncgToast && window.ncgToast('Teléfono copiado.', 'ok'); }));
    tbody.querySelectorAll('[data-estado]').forEach(sel => sel.addEventListener('change', () => changeEstado(sel.dataset.estado, sel.value)));
  }

  function rowHtml(m){
    return `
      <tr>
        <td>
          <b>${escapeHtml(m.nombre)}</b>
          <div class="muted" style="margin-top:2px">${escapeHtml(m.telefono || '')}${m.email ? ' · '+escapeHtml(m.email) : ''}</div>
        </td>
        <td class="muted">${escapeHtml(m.servicio_requerido || '—')}</td>
        <td class="muted">${escapeHtml(m.zona_ciudad || '—')}</td>
        <td>
          <select data-estado="${m.id}" class="badge ${m.estado}" style="background:rgba(255,255,255,.05);border:1px solid var(--line);padding:5px 8px;border-radius:99px;color:inherit;font-weight:700;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase">
            ${ESTADOS.map(e => `<option value="${e}" ${e===m.estado?'selected':''}>${LABEL[e]}</option>`).join('')}
          </select>
        </td>
        <td class="muted">${fmtDate(m.created_at)}</td>
        <td>
          <div class="row-actions">
            <button class="btn ghost sm" data-view="${m.id}">Ver</button>
            ${m.telefono ? `<button class="btn subtle sm" data-copy="${escapeAttr(m.telefono)}" title="Copiar teléfono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>` : ''}
            ${m.telefono ? `<button class="btn subtle sm" data-wa="${m.id}" title="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  chipsEls.forEach(c => c.addEventListener('click', () => {
    chipsEls.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const t = c.textContent.trim().toLowerCase();
    filterEstado = t.startsWith('todos') ? null
      : t.startsWith('nuevo') ? 'nuevo'
      : t.startsWith('contact') ? 'contactado'
      : t.startsWith('presup') ? 'presupuesto_enviado'
      : t.startsWith('cerr') ? 'cerrado'
      : t.startsWith('desc') ? 'descartado' : null;
    render();
  }));
  searchInput.addEventListener('input', () => { searchQ = searchInput.value; render(); });

  async function changeEstado(id, estado){
    const { error } = await sb.from('ncg_mensajes_contacto').update({ estado }).eq('id', id);
    if (error){ window.ncgToast && window.ncgToast('Error: ' + error.message, 'err'); load(); return; }
    const it = all.find(m => m.id === id); if (it) it.estado = estado;
    window.ncgToast && window.ncgToast('Estado actualizado.', 'ok');
    render();
  }

  function waOpen(id){
    const m = all.find(x => x.id === id); if (!m || !m.telefono) return;
    const num = String(m.telefono).replace(/\D/g,'');
    const txt = encodeURIComponent(`Hola ${m.nombre}, soy de Constructora NCG. Te escribo por tu solicitud de presupuesto sobre "${m.servicio_requerido || 'tu consulta'}". ¿Cómo te ayudo?`);
    window.open(`https://wa.me/${num}?text=${txt}`, '_blank');
  }

  function openDetail(id){
    const m = all.find(x => x.id === id); if (!m) return;
    const html = `
      <div class="dialog is-open" id="msgDlg">
        <div class="dialog-card" style="width:min(560px,100%)">
          <h3>Mensaje de ${escapeHtml(m.nombre)}</h3>
          <p style="color:var(--text-mute);font-size:.82rem;text-transform:uppercase;letter-spacing:.16em;margin-bottom:14px">${fmtDate(m.created_at)}</p>
          <div style="display:grid;gap:10px;color:var(--text-soft);font-size:.95rem">
            ${m.telefono ? `<div><b style="color:var(--text)">Teléfono:</b> ${escapeHtml(m.telefono)}</div>` : ''}
            ${m.email ? `<div><b style="color:var(--text)">Email:</b> ${escapeHtml(m.email)}</div>` : ''}
            ${m.servicio_requerido ? `<div><b style="color:var(--text)">Servicio:</b> ${escapeHtml(m.servicio_requerido)}</div>` : ''}
            ${m.zona_ciudad ? `<div><b style="color:var(--text)">Zona:</b> ${escapeHtml(m.zona_ciudad)}</div>` : ''}
            ${m.mensaje ? `<div><b style="color:var(--text)">Mensaje:</b><div style="margin-top:6px;padding:12px;background:var(--bg-1);border:1px solid var(--line);border-radius:10px;white-space:pre-wrap">${escapeHtml(m.mensaje)}</div></div>` : ''}
          </div>
          <div class="dialog-actions">
            <button class="btn ghost" data-cancel>Cerrar</button>
          </div>
        </div>
      </div>`;
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const dlg = tmp.firstElementChild; document.body.appendChild(dlg);
    const close = () => dlg.remove();
    dlg.querySelector('[data-cancel]').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  }

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function fmtDate(s){ if (!s) return ''; return new Date(s).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

  load();
})();
