/* ============================================================
   Trabajos: list + filtros por tipo + buscar + CRUD.
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  const sb = window.ncgSb;
  const profile = await window.ncgProfile();

  const TIPOS = ['Tejado','Cubierta','Impermeabilización','Velux','Panel sándwich','Canalones','Madera','Rehabilitación'];

  const root = document.querySelector('.main-inner');
  const emptyEl = root.querySelector('.empty');
  const toolbar = root.querySelector('.toolbar');
  const searchInput = toolbar.querySelector('.search input');
  const chipsEls = Array.from(toolbar.querySelectorAll('.chip'));

  let all = [];
  let filterTipo = null;
  let searchQ = '';

  async function load(){
    const { data, error } = await sb.from('ncg_trabajos').select('*').order('orden').order('created_at', { ascending: false });
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    all = data || [];
    render();
  }

  function render(){
    let items = all.slice();
    if (filterTipo) items = items.filter(t => (t.tipo_trabajo||'').toLowerCase() === filterTipo.toLowerCase());
    if (searchQ){
      const q = norm(searchQ);
      items = items.filter(t => norm(t.titulo).includes(q) || norm(t.ubicacion||'').includes(q));
    }

    const old = root.querySelector('#trabListWrap'); if (old) old.remove();

    if (!items.length){ emptyEl.style.display = ''; return; }
    emptyEl.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.id = 'trabListWrap';
    wrap.className = 'table-wrap';
    wrap.innerHTML = `
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:80px"></th>
            <th>Trabajo</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th style="text-align:right">Acciones</th>
          </tr>
        </thead>
        <tbody>${items.map(rowHtml).join('')}</tbody>
      </table>`;
    root.appendChild(wrap);

    wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => toggleActivo(b.dataset.toggle)));
    wrap.querySelectorAll('[data-destacar]').forEach(b => b.addEventListener('click', () => toggleDestacado(b.dataset.destacar)));
    wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeOne(b.dataset.del)));
  }

  function rowHtml(t){
    return `
      <tr>
        <td>${t.imagen_principal_url
          ? `<img class="row-thumb" src="${escapeAttr(t.imagen_principal_url)}" alt="">`
          : '<span class="row-thumb" style="display:inline-flex;align-items:center;justify-content:center;color:var(--text-mute)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></span>'}</td>
        <td><b>${escapeHtml(t.titulo)}</b>${t.destacado?' <span class="badge destacado" style="margin-left:6px"><span class="dot"></span>Destacado</span>':''}</td>
        <td class="muted">${escapeHtml(t.tipo_trabajo || '—')}</td>
        <td class="muted">${escapeHtml(t.ubicacion || '—')}</td>
        <td class="muted">${t.fecha_trabajo || '—'}</td>
        <td>${t.activo
          ? '<span class="badge activo"><span class="dot"></span>Activo</span>'
          : '<span class="badge inactivo"><span class="dot"></span>Inactivo</span>'}</td>
        <td>
          <div class="row-actions">
            <button class="btn ghost sm" data-edit="${t.id}">Editar</button>
            <button class="btn subtle sm" data-destacar="${t.id}" title="${t.destacado?'Quitar':'Destacar'}">
              <svg viewBox="0 0 24 24" fill="${t.destacado?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3 6 6 .9-4.5 4.3L18 20l-6-3-6 3 1.5-6.8L3 8.9 9 8z"/></svg>
            </button>
            <button class="btn subtle sm" data-toggle="${t.id}" title="${t.activo?'Desactivar':'Activar'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${t.activo?'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>':'<polyline points="20 6 9 17 4 12"/>'}</svg>
            </button>
            <button class="btn ghost sm" data-del="${t.id}" style="border-color:transparent;color:#fb8588">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  chipsEls.forEach(c => c.addEventListener('click', () => {
    chipsEls.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const t = c.textContent.trim();
    filterTipo = (t.toLowerCase() === 'todos') ? null : t;
    render();
  }));
  searchInput.addEventListener('input', () => { searchQ = searchInput.value; render(); });

  function openForm(id){
    const it = id ? all.find(t => t.id === id) : null;
    const html = `
      <div class="dialog is-open" id="trbDlg">
        <div class="dialog-card" style="width:min(720px,100%);max-height:90vh;overflow-y:auto">
          <h3>${it ? 'Editar trabajo' : 'Nuevo trabajo'}</h3>
          <p>Datos de la obra que aparecerá en la galería de trabajos.</p>
          <form id="trbForm">
            <div class="form-grid">
              <div class="field full">
                <label>Título <span class="req">*</span></label>
                <input name="titulo" type="text" value="${escapeAttr(it?.titulo||'')}" required>
              </div>
              <div class="field">
                <label>Slug</label>
                <input name="slug" type="text" value="${escapeAttr(it?.slug||'')}">
              </div>
              <div class="field">
                <label>Tipo</label>
                <select name="tipo_trabajo">
                  <option value="">—</option>
                  ${TIPOS.map(t => `<option ${it?.tipo_trabajo===t?'selected':''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Ubicación</label>
                <input name="ubicacion" type="text" value="${escapeAttr(it?.ubicacion||'')}">
              </div>
              <div class="field">
                <label>Fecha</label>
                <input name="fecha_trabajo" type="date" value="${it?.fecha_trabajo||''}">
              </div>
              <div class="field full">
                <label>Descripción</label>
                <textarea name="descripcion">${escapeHtml(it?.descripcion||'')}</textarea>
              </div>
              <div class="field full">
                ${window.ncgImageFieldHtml({ name:'imagen_principal', label:'Imagen principal', currentUrl: it?.imagen_principal_url || '' })}
              </div>
              <div class="field full">
                ${window.ncgImageFieldHtml({ name:'antes', label:'Antes', currentUrl: it?.antes_url || '' })}
              </div>
              <div class="field full">
                ${window.ncgImageFieldHtml({ name:'despues', label:'Después', currentUrl: it?.despues_url || '' })}
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
              <button type="submit" class="btn">${it?'Guardar cambios':'Crear trabajo'}</button>
            </div>
          </form>
        </div>
      </div>`;
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const dlg = tmp.firstElementChild; document.body.appendChild(dlg);
    const close = () => dlg.remove();
    dlg.querySelector('[data-cancel]').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    window.ncgWireImageField(dlg, 'imagen_principal');
    window.ncgWireImageField(dlg, 'antes');
    window.ncgWireImageField(dlg, 'despues');

    const FIELDS = [
      { input: 'imagen_principal', urlCol: 'imagen_principal_url',          pathCol: 'imagen_principal_storage_path' },
      { input: 'antes',            urlCol: 'antes_url',                     pathCol: 'antes_storage_path' },
      { input: 'despues',          urlCol: 'despues_url',                   pathCol: 'despues_storage_path' },
    ];

    dlg.querySelector('#trbForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const titulo = f.titulo.value.trim();
      let slug = f.slug.value.trim() || slugify(titulo);

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;

      const imgs = {};
      for (const cfg of FIELDS) {
        imgs[cfg.urlCol]  = it?.[cfg.urlCol]  || null;
        imgs[cfg.pathCol] = it?.[cfg.pathCol] || null;
        const file = f[cfg.input].files[0];
        if (!file) continue;
        submitBtn.textContent = 'Subiendo…';
        const up = await window.ncgUploadImage(file, profile.store_id);
        if (up.error) {
          submitBtn.disabled = false; submitBtn.textContent = originalLabel;
          return window.ncgToast && window.ncgToast('Error subiendo '+cfg.input+': ' + up.error, 'err');
        }
        if (imgs[cfg.pathCol]) window.ncgDeleteImage(imgs[cfg.pathCol]);
        imgs[cfg.urlCol]  = up.url;
        imgs[cfg.pathCol] = up.path;
      }

      submitBtn.textContent = 'Guardando…';
      const payload = {
        titulo, slug,
        tipo_trabajo: f.tipo_trabajo.value || null,
        ubicacion:    f.ubicacion.value.trim() || null,
        fecha_trabajo: f.fecha_trabajo.value || null,
        descripcion:  f.descripcion.value.trim() || null,
        ...imgs,
        activo:       f.activo.checked,
        destacado:    f.destacado.checked,
        store_id:     profile.store_id,
      };
      const res = it
        ? await sb.from('ncg_trabajos').update(payload).eq('id', it.id).select().single()
        : await sb.from('ncg_trabajos').insert(payload).select().single();
      if (res.error) {
        submitBtn.disabled = false; submitBtn.textContent = originalLabel;
        return window.ncgToast && window.ncgToast('Error: ' + res.error.message, 'err');
      }
      window.ncgToast && window.ncgToast(it?'Trabajo actualizado.':'Trabajo creado.', 'ok');
      close(); load();
    });
  }

  async function toggleActivo(id){
    const it = all.find(t => t.id === id); if (!it) return;
    const { error } = await sb.from('ncg_trabajos').update({ activo: !it.activo }).eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    load();
  }
  async function toggleDestacado(id){
    const it = all.find(t => t.id === id); if (!it) return;
    const { error } = await sb.from('ncg_trabajos').update({ destacado: !it.destacado }).eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    load();
  }
  async function removeOne(id){
    const it = all.find(t => t.id === id); if (!it) return;
    const ok = await window.ncgConfirm({ title:'Eliminar trabajo', message:`¿Borrar "${it.titulo}"?`, okText:'Eliminar', danger:true });
    if (!ok) return;
    const { error } = await sb.from('ncg_trabajos').delete().eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    [it.imagen_principal_storage_path, it.antes_storage_path, it.despues_storage_path]
      .filter(Boolean).forEach(p => window.ncgDeleteImage(p));
    load();
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-action-new]')) openForm(null);
  });

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function slugify(s){ return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80); }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

  load();
})();
