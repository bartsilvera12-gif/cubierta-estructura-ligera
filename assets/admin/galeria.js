/* ============================================================
   Galería: grid de miniaturas + filtros + CRUD.
   ============================================================ */
(async function(){
  if (!window.ncgSb) return;
  const sb = window.ncgSb;
  const profile = await window.ncgProfile();

  const CATS = ['Tejados de madera','Cubiertas','Claraboyas','Impermeabilización','Paneles modernos','Canalones','Antes y después'];

  const root = document.querySelector('.main-inner');
  const emptyEl = root.querySelector('.empty');
  const toolbar = root.querySelector('.toolbar');
  const searchInput = toolbar.querySelector('.search input');
  const chipsEls = Array.from(toolbar.querySelectorAll('.chip'));

  let all = [];
  let filterCat = null;
  let searchQ = '';
  let trabajos = [];

  async function load(){
    const [g, t] = await Promise.all([
      sb.from('ncg_galeria').select('*').order('orden').order('created_at', { ascending: false }),
      sb.from('ncg_trabajos').select('id, titulo'),
    ]);
    if (g.error) return window.ncgToast && window.ncgToast('Error: ' + g.error.message, 'err');
    all = g.data || [];
    trabajos = t.data || [];
    render();
  }

  function render(){
    let items = all.slice();
    if (filterCat) items = items.filter(it => (it.categoria||'').toLowerCase() === filterCat.toLowerCase());
    if (searchQ){
      const q = norm(searchQ);
      items = items.filter(it => norm(it.titulo||'').includes(q) || norm(it.descripcion||'').includes(q));
    }
    const old = root.querySelector('#galWrap'); if (old) old.remove();
    if (!items.length){ emptyEl.style.display = ''; return; }
    emptyEl.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.id = 'galWrap';
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px';
    wrap.innerHTML = items.map(itemHtml).join('');
    root.appendChild(wrap);

    wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => toggleActivo(b.dataset.toggle)));
    wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeOne(b.dataset.del)));
  }

  function itemHtml(g){
    return `
      <div class="card" style="padding:0;overflow:hidden;border-radius:14px;background:var(--bg-2);border:1px solid var(--line);position:relative">
        <div style="position:relative;aspect-ratio:4/3;background:var(--bg-3);overflow:hidden">
          ${g.imagen_url ? `<img src="${escapeAttr(g.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : ''}
          ${!g.activo ? '<span class="badge inactivo" style="position:absolute;top:10px;left:10px"><span class="dot"></span>Inactivo</span>' : ''}
        </div>
        <div style="padding:12px 14px">
          <div style="font-family:'Archivo',sans-serif;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(g.titulo || 'Sin título')}</div>
          <div class="muted" style="margin-top:2px;font-size:.78rem;text-transform:uppercase;letter-spacing:.12em">${escapeHtml(g.categoria || '—')}</div>
          <div style="display:flex;gap:6px;margin-top:10px;justify-content:flex-end">
            <button class="btn ghost sm" data-edit="${g.id}">Editar</button>
            <button class="btn subtle sm" data-toggle="${g.id}" title="${g.activo?'Desactivar':'Activar'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">${g.activo?'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>':'<polyline points="20 6 9 17 4 12"/>'}</svg>
            </button>
            <button class="btn ghost sm" data-del="${g.id}" style="border-color:transparent;color:#fb8588">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  chipsEls.forEach(c => c.addEventListener('click', () => {
    chipsEls.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const t = c.textContent.trim();
    filterCat = (t.toLowerCase().startsWith('todas')) ? null : t;
    render();
  }));
  searchInput.addEventListener('input', () => { searchQ = searchInput.value; render(); });

  function openForm(id){
    const it = id ? all.find(g => g.id === id) : null;
    const html = `
      <div class="dialog is-open" id="galDlg">
        <div class="dialog-card" style="width:min(560px,100%)">
          <h3>${it ? 'Editar imagen' : 'Subir imagen'}</h3>
          <p>Datos de la imagen para la galería.</p>
          <form id="galForm">
            <div class="form-grid">
              <div class="field full">
                ${window.ncgImageFieldHtml({ name:'archivo', label:'Imagen', required:true, currentUrl: it?.imagen_url || '' })}
              </div>
              <div class="field full">
                <label>Título</label>
                <input name="titulo" type="text" value="${escapeAttr(it?.titulo||'')}">
              </div>
              <div class="field full">
                <label>Descripción</label>
                <textarea name="descripcion">${escapeHtml(it?.descripcion||'')}</textarea>
              </div>
              <div class="field">
                <label>Categoría</label>
                <select name="categoria">
                  <option value="">—</option>
                  ${CATS.map(c => `<option ${it?.categoria===c?'selected':''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Trabajo asociado</label>
                <select name="trabajo_id">
                  <option value="">— Ninguno —</option>
                  ${trabajos.map(t => `<option value="${t.id}" ${it?.trabajo_id===t.id?'selected':''}>${escapeHtml(t.titulo)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Orden</label>
                <input name="orden" type="number" value="${it?.orden ?? all.length+1}" min="0">
              </div>
              <div class="field">
                <label class="toggle"><input type="checkbox" name="activo" ${it?.activo!==false?'checked':''}><span>Activa</span></label>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn ghost" data-cancel>Cancelar</button>
              <button type="submit" class="btn">${it?'Guardar cambios':'Subir imagen'}</button>
            </div>
          </form>
        </div>
      </div>`;
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const dlg = tmp.firstElementChild; document.body.appendChild(dlg);
    const close = () => dlg.remove();
    dlg.querySelector('[data-cancel]').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

    window.ncgWireImageField(dlg, 'archivo');
    const fileInput = dlg.querySelector('input[name="archivo"]');

    dlg.querySelector('#galForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const file = fileInput.files[0];

      if (!it && !file) {
        return window.ncgToast && window.ncgToast('Elegí una imagen.', 'err');
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = file ? 'Subiendo…' : 'Guardando…';

      let imagen_url = it?.imagen_url || null;
      let storage_path = it?.storage_path || null;

      if (file) {
        const up = await window.ncgUploadImage(file, profile.store_id);
        if (up.error) {
          submitBtn.disabled = false; submitBtn.textContent = originalLabel;
          return window.ncgToast && window.ncgToast('Error subiendo imagen: ' + up.error, 'err');
        }
        if (storage_path) window.ncgDeleteImage(storage_path);
        imagen_url = up.url;
        storage_path = up.path;
      }

      const payload = {
        imagen_url,
        storage_path,
        titulo:      f.titulo.value.trim() || null,
        descripcion: f.descripcion.value.trim() || null,
        categoria:   f.categoria.value || null,
        trabajo_id:  f.trabajo_id.value || null,
        orden:       parseInt(f.orden.value, 10) || 0,
        activo:      f.activo.checked,
        store_id:    profile.store_id,
      };
      const res = it
        ? await sb.from('ncg_galeria').update(payload).eq('id', it.id).select().single()
        : await sb.from('ncg_galeria').insert(payload).select().single();
      if (res.error) {
        submitBtn.disabled = false; submitBtn.textContent = originalLabel;
        return window.ncgToast && window.ncgToast('Error: ' + res.error.message, 'err');
      }
      window.ncgToast && window.ncgToast(it?'Imagen actualizada.':'Imagen subida.', 'ok');
      close(); load();
    });
  }

  async function toggleActivo(id){
    const it = all.find(g => g.id === id); if (!it) return;
    const { error } = await sb.from('ncg_galeria').update({ activo: !it.activo }).eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    load();
  }
  async function removeOne(id){
    const it = all.find(g => g.id === id); if (!it) return;
    const ok = await window.ncgConfirm({ title:'Eliminar imagen', message:'¿Borrar esta imagen de la galería?', okText:'Eliminar', danger:true });
    if (!ok) return;
    const { error } = await sb.from('ncg_galeria').delete().eq('id', id);
    if (error) return window.ncgToast && window.ncgToast('Error: ' + error.message, 'err');
    if (it.storage_path) window.ncgDeleteImage(it.storage_path);
    load();
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-action-new]')) openForm(null);
  });

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

  load();
})();
