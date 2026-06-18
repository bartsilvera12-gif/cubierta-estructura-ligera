/* ============================================================
   Servicios: list + buscar + filtrar + crear + editar + borrar
   + activar/desactivar + destacar.
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  const sb = window.ncgSb;
  const profile = await window.ncgProfile();
  if (!profile || !profile.store_id) {
    console.warn('[NCG] Sin store_id. Revisa que ncg_profiles tenga al usuario.');
  }

  const root = document.querySelector('.main-inner');
  const emptyEl = root.querySelector('.empty');
  const toolbar = root.querySelector('.toolbar');
  const searchInput = toolbar.querySelector('.search input');
  const chipsEls = Array.from(toolbar.querySelectorAll('.chip'));

  let all = [];
  let filterMode = 'todos';
  let searchQ = '';

  /* ---------- Render ---------- */
  function render(){
    let items = all.slice();
    if (filterMode === 'activos')    items = items.filter(s => s.activo);
    if (filterMode === 'inactivos')  items = items.filter(s => !s.activo);
    if (filterMode === 'destacados') items = items.filter(s => s.destacado);
    if (searchQ){
      const q = norm(searchQ);
      items = items.filter(s =>
        norm(s.titulo).includes(q) || norm(s.descripcion || '').includes(q));
    }

    // Quita lista previa
    const old = root.querySelector('#servListWrap'); if (old) old.remove();

    if (!items.length){
      emptyEl.style.display = '';
      return;
    }
    emptyEl.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.id = 'servListWrap';
    wrap.className = 'table-wrap';
    wrap.innerHTML = `
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:60px">#</th>
            <th>Servicio</th>
            <th>Slug</th>
            <th>Estado</th>
            <th style="text-align:right">Acciones</th>
          </tr>
        </thead>
        <tbody>${items.map(rowHtml).join('')}</tbody>
      </table>
    `;
    root.appendChild(wrap);

    // Wire row buttons
    wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => toggleActivo(b.dataset.toggle)));
    wrap.querySelectorAll('[data-destacar]').forEach(b => b.addEventListener('click', () => toggleDestacado(b.dataset.destacar)));
    wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeOne(b.dataset.del)));
  }

  function rowHtml(s){
    return `
      <tr>
        <td><b>${s.orden ?? '–'}</b></td>
        <td>
          <b>${escapeHtml(s.titulo)}</b>
          ${s.destacado ? '<span class="badge destacado" style="margin-left:6px"><span class="dot"></span>Destacado</span>' : ''}
          <div class="muted" style="margin-top:2px">${escapeHtml(s.descripcion || '')}</div>
        </td>
        <td class="muted">${escapeHtml(s.slug)}</td>
        <td>
          ${s.activo
            ? '<span class="badge activo"><span class="dot"></span>Activo</span>'
            : '<span class="badge inactivo"><span class="dot"></span>Inactivo</span>'}
        </td>
        <td>
          <div class="row-actions">
            <button class="btn ghost sm" data-edit="${s.id}">Editar</button>
            <button class="btn subtle sm" data-destacar="${s.id}" title="${s.destacado?'Quitar destacado':'Marcar destacado'}">
              <svg viewBox="0 0 24 24" fill="${s.destacado?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 6 .9-4.5 4.3L18 20l-6-3-6 3 1.5-6.8L3 8.9 9 8z"/></svg>
            </button>
            <button class="btn subtle sm" data-toggle="${s.id}" title="${s.activo?'Desactivar':'Activar'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.activo?'<path d="M18.36 6.64A9 9 0 0120.77 15"/><path d="M6.16 6.16a9 9 0 1011.68 11.68"/><line x1="12" y1="2" x2="12" y2="12"/>':'<polyline points="20 6 9 17 4 12"/>'}</svg>
            </button>
            <button class="btn ghost sm" data-del="${s.id}" style="border-color:transparent;color:#fb8588">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  /* ---------- Carga ---------- */
  async function load(){
    const { data, error } = await sb.from('ncg_servicios')
      .select('*')
      .order('orden', { ascending: true });
    if (error){
      window.ncgToast && window.ncgToast('Error cargando servicios: ' + error.message, 'err');
      return;
    }
    all = data || [];
    render();
  }

  /* ---------- Filtros / búsqueda ---------- */
  chipsEls.forEach(c => c.addEventListener('click', () => {
    chipsEls.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const t = c.textContent.trim().toLowerCase();
    filterMode = (t.indexOf('todos') >= 0) ? 'todos'
      : (t.indexOf('inact') >= 0) ? 'inactivos'
      : (t.indexOf('dest')  >= 0) ? 'destacados'
      : 'activos';
    render();
  }));
  searchInput.addEventListener('input', () => { searchQ = searchInput.value; render(); });

  /* ---------- Crear/Editar (modal) ---------- */
  function openForm(id){
    const it = id ? all.find(s => s.id === id) : null;
    const html = `
      <div class="dialog is-open" id="srvDlg">
        <div class="dialog-card" style="width:min(640px,100%);position:relative">
          <button type="button" class="dlg-close" data-cancel aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <h3>${it ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <p>Datos del servicio que aparece en la web pública.</p>
          <form id="srvForm">
            <div class="form-grid">
              <div class="field full">
                <label>Título <span class="req">*</span></label>
                <input name="titulo" type="text" value="${escapeAttr(it?.titulo||'')}" required>
              </div>
              <div class="field">
                <label>Slug (URL) <span class="req">*</span></label>
                <input name="slug" type="text" value="${escapeAttr(it?.slug||'')}" required>
                <span class="help">Se genera del título si lo dejas vacío al crear.</span>
              </div>
              <div class="field">
                <label>Orden</label>
                <input name="orden" type="number" value="${it?.orden ?? all.length+1}" min="0">
              </div>
              <div class="field full">
                <label>Descripción corta</label>
                <textarea name="descripcion">${escapeHtml(it?.descripcion||'')}</textarea>
              </div>
              <div class="field full">
                ${window.ncgImageFieldHtml({ name:'imagen', label:'Imagen', currentUrl: it?.imagen_url || '' })}
              </div>
              <div class="field">
                <label class="toggle"><input type="checkbox" name="activo" ${it?.activo!==false?'checked':''}><span>Activo</span></label>
              </div>
              <div class="field">
                <label class="toggle"><input type="checkbox" name="destacado" ${it?.destacado?'checked':''}><span>Destacado</span></label>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn ghost" data-cancel>Cancelar</button>
              <button type="submit" class="btn">${it?'Guardar cambios':'Crear servicio'}</button>
            </div>
          </form>
        </div>
      </div>`;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const dlg = tmp.firstElementChild;
    document.body.appendChild(dlg);

    const close = () => dlg.remove();
    dlg.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', close));
    window.ncgWireImageField(dlg, 'imagen');

    dlg.querySelector('#srvForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const titulo = f.titulo.value.trim();
      let slug = f.slug.value.trim() || slugify(titulo);

      const file = f.imagen.files[0];
      let imagen_url          = it?.imagen_url          || null;
      let imagen_storage_path = it?.imagen_storage_path || null;

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;

      if (file) {
        submitBtn.textContent = 'Subiendo…';
        const up = await window.ncgUploadImage(file, profile.store_id);
        if (up.error) {
          submitBtn.disabled = false; submitBtn.textContent = originalLabel;
          return window.ncgToast && window.ncgToast('Error subiendo imagen: ' + up.error, 'err');
        }
        if (imagen_storage_path) window.ncgDeleteImage(imagen_storage_path);
        imagen_url = up.url;
        imagen_storage_path = up.path;
      }

      submitBtn.textContent = 'Guardando…';
      const payload = {
        titulo,
        slug,
        descripcion: f.descripcion.value.trim() || null,
        imagen_url,
        imagen_storage_path,
        orden:       parseInt(f.orden.value, 10) || 0,
        activo:      f.activo.checked,
        destacado:   f.destacado.checked,
        store_id:    profile.store_id,
      };
      let res;
      if (it) {
        res = await sb.from('ncg_servicios').update(payload).eq('id', it.id).select().single();
      } else {
        res = await sb.from('ncg_servicios').insert(payload).select().single();
      }
      if (res.error){
        submitBtn.disabled = false; submitBtn.textContent = originalLabel;
        window.ncgToast && window.ncgToast('Error guardando: ' + res.error.message, 'err');
        return;
      }
      window.ncgToast && window.ncgToast(it ? 'Servicio actualizado.' : 'Servicio creado.', 'ok');
      close();
      load();
    });
  }

  async function toggleActivo(id){
    const it = all.find(s => s.id === id); if (!it) return;
    const { error } = await sb.from('ncg_servicios').update({ activo: !it.activo }).eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    window.ncgToast && window.ncgToast(it.activo ? 'Desactivado.' : 'Activado.', 'ok');
    load();
  }
  async function toggleDestacado(id){
    const it = all.find(s => s.id === id); if (!it) return;
    const { error } = await sb.from('ncg_servicios').update({ destacado: !it.destacado }).eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    load();
  }
  async function removeOne(id){
    const it = all.find(s => s.id === id); if (!it) return;
    const ok = await window.ncgConfirm({
      title: 'Eliminar servicio',
      message: `¿Borrar "${it.titulo}"? Esta acción no se puede deshacer.`,
      okText: 'Eliminar', danger: true
    });
    if (!ok) return;
    const { error } = await sb.from('ncg_servicios').delete().eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    if (it.imagen_storage_path) window.ncgDeleteImage(it.imagen_storage_path);
    window.ncgToast && window.ncgToast('Servicio eliminado.', 'ok');
    load();
  }

  /* ---------- Botones "nuevo" ---------- */
  document.addEventListener('click', (ev) => {
    if (ev.target.closest('#newBtn,#newBtn2')) openForm(null);
  });

  /* ---------- Utils ---------- */
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function slugify(s){
    return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

  load();
})();
