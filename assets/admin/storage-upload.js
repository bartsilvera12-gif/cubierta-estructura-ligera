/* ============================================================
   Helper de subida de imágenes al bucket `galeria-ncg`.
   Lo usan galeria.js, servicios.js y trabajos.js.
   ============================================================ */
(function(){
  const BUCKET = 'galeria-ncg';
  const MAX_MB = 8;

  window.NCG_BUCKET = BUCKET;
  window.NCG_MAX_MB = MAX_MB;

  // Sube un archivo y devuelve { url, path } o { error }.
  window.ncgUploadImage = async function(file, storeId){
    if (!window.ncgSb) return { error: 'Supabase no inicializado.' };
    if (!file) return { error: 'Sin archivo.' };
    if (file.size > MAX_MB * 1024 * 1024) return { error: 'La imagen pesa más de ' + MAX_MB + ' MB.' };

    const sb = window.ncgSb;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${storeId}/${Date.now()}-${rand}.${ext}`;
    const up = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (up.error) return { error: up.error.message };
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, path };
  };

  // Borrado “fire-and-forget” del archivo del bucket.
  window.ncgDeleteImage = function(path){
    if (!path || !window.ncgSb) return;
    return window.ncgSb.storage.from(BUCKET).remove([path]);
  };

  // HTML para un campo de imagen tipo drop-zone con preview.
  // opts = { name, label, required, currentUrl, hint }
  window.ncgImageFieldHtml = function(opts){
    const escape = s => String(s==null?'':s).replace(/"/g,'&quot;');
    const isNew = !opts.currentUrl;
    const req = opts.required && isNew ? 'required' : '';
    const star = opts.required && isNew ? ' <span class="req">*</span>' : '';
    const hasFile = !!opts.currentUrl;
    const previewSrc = opts.currentUrl ? `src="${escape(opts.currentUrl)}"` : '';
    const hint = isNew
      ? (opts.hint || `JPG, PNG o WEBP · máx. ${MAX_MB} MB`)
      : 'Hacé click para reemplazar (o dejá la actual)';
    return `
      <label>${opts.label}${star}</label>
      <label class="upload-zone${hasFile?' has-file':''}" data-upload="${opts.name}">
        <input name="${opts.name}" type="file" accept="image/*" ${req} hidden>
        <div class="upload-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <b>Hacé click para elegir una imagen</b>
          <span>${hint}</span>
        </div>
        <img class="upload-preview" data-img-preview="${opts.name}" ${previewSrc} alt="">
        <span class="upload-change">Cambiar</span>
      </label>
    `;
  };

  // Engancha el evento change → preview en vivo + validación de tamaño.
  window.ncgWireImageField = function(dlg, name){
    const input = dlg.querySelector(`input[name="${name}"]`);
    const zone = dlg.querySelector(`label.upload-zone[data-upload="${name}"]`);
    const preview = dlg.querySelector(`img[data-img-preview="${name}"]`);
    if (!input || !zone || !preview) return;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file){
        zone.classList.remove('has-file');
        preview.removeAttribute('src');
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        window.ncgToast && window.ncgToast('La imagen pesa más de ' + MAX_MB + ' MB.', 'err');
        input.value = ''; return;
      }
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; zone.classList.add('has-file'); };
      reader.readAsDataURL(file);
    });
    // Drag & drop
    ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault(); zone.classList.add('is-drag');
    }));
    ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault(); zone.classList.remove('is-drag');
    }));
    zone.addEventListener('drop', e => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      const dt = new DataTransfer(); dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    });
  };
})();
