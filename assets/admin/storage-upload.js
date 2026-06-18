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

  // HTML para un campo de imagen con preview.
  // opts = { name, label, required, currentUrl, hint }
  window.ncgImageFieldHtml = function(opts){
    const escape = s => String(s==null?'':s).replace(/"/g,'&quot;');
    const isNew = !opts.currentUrl;
    const req = opts.required && isNew ? 'required' : '';
    const star = opts.required && isNew ? ' <span class="req">*</span>' : '';
    const previewSrc = opts.currentUrl ? `src="${escape(opts.currentUrl)}"` : '';
    const previewDisplay = opts.currentUrl ? 'block' : 'none';
    const hint = isNew
      ? (opts.hint || `JPG, PNG o WEBP · máx. ${MAX_MB} MB.`)
      : 'Dejá el archivo vacío para mantener la imagen actual.';
    return `
      <label>${opts.label}${star}</label>
      <input name="${opts.name}" type="file" accept="image/*" ${req} data-img-field>
      <div style="margin-top:10px">
        <img data-img-preview="${opts.name}" ${previewSrc} alt=""
             style="max-width:220px;border-radius:10px;border:1px solid var(--line);display:${previewDisplay}">
      </div>
      <small class="muted" style="display:block;margin-top:6px">${hint}</small>
    `;
  };

  // Engancha el evento change → preview en vivo + validación de tamaño.
  window.ncgWireImageField = function(dlg, name){
    const input = dlg.querySelector(`input[name="${name}"]`);
    const preview = dlg.querySelector(`img[data-img-preview="${name}"]`);
    if (!input || !preview) return;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file){ preview.removeAttribute('src'); preview.style.display = 'none'; return; }
      if (file.size > MAX_MB * 1024 * 1024) {
        window.ncgToast && window.ncgToast('La imagen pesa más de ' + MAX_MB + ' MB.', 'err');
        input.value = ''; return;
      }
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    });
  };
})();
