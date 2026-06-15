/* ============================================================
   NCG — interacciones y efectos
   ============================================================ */
(function(){
  "use strict";

  /* ---- Header al hacer scroll ---- */
  var header = document.querySelector('.header');
  var sp = document.getElementById('sp');
  function onScroll(){
    if(window.scrollY > 30) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    if(sp){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      sp.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- Menú móvil ---- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if(toggle){
    toggle.addEventListener('click', function(){ nav.classList.toggle('open'); });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('open'); });
    });
  }

  /* ---- Reveal al hacer scroll ---- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('in');
        if(e.target.dataset.count !== undefined) runCounter(e.target);
        io.unobserve(e.target);
      }
    });
  }, {threshold:.16, rootMargin:'0px 0px -8% 0px'});
  var revealEls = document.querySelectorAll('.reveal,.reveal-l,.reveal-r,[data-count]');
  revealEls.forEach(function(el){ io.observe(el); });

  /* Fallback: revela de inmediato lo que ya está en pantalla al cargar */
  function revealInView(){
    revealEls.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < (window.innerHeight || document.documentElement.clientHeight) * .92 && r.bottom > 0){
        el.classList.add('in','shown');
        if(el.dataset.count !== undefined) runCounter(el);
        io.unobserve(el);
      }
    });
  }
  revealInView();
  window.addEventListener('load', revealInView);

  /* ---- Contadores ---- */
  function runCounter(el){
    var target = parseFloat(el.dataset.count);
    var dur = 1500, start = null;
    var prefix = el.dataset.prefix || '';
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      var val = Math.round(target * eased);
      el.textContent = prefix + val;
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target;
    }
    requestAnimationFrame(step);
  }

  /* ---- Parallax suave en hero ---- */
  var heroPhoto = document.querySelector('.hero-photo');
  var beams = document.querySelector('.beams');
  if(!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y < window.innerHeight){
        if(heroPhoto) heroPhoto.style.transform = 'translateY('+(y*0.18)+'px) scale(1.05)';
        if(beams) beams.style.transform = 'translateY('+(y*0.06)+'px)';
      }
    }, {passive:true});
  }

  /* ---- Formulario ---- */
  var WA = '34638769281';
  var form = document.getElementById('cf');
  if(form){
    var fields = ['nombre','telefono','servicio','mensaje'];
    function setErr(name, on, txt){
      var inp = form.elements[name];
      var msg = form.querySelector('[data-msg="'+name+'"]');
      if(!inp) return;
      inp.classList.toggle('err', on);
      if(msg){ msg.classList.toggle('show', on); if(txt) msg.textContent = txt; }
    }
    form.querySelectorAll('input,select,textarea').forEach(function(el){
      el.addEventListener('input', function(){ el.classList.remove('err'); var m=form.querySelector('[data-msg="'+el.name+'"]'); if(m)m.classList.remove('show'); });
    });
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var ok = true;
      var n = form.elements.nombre.value.trim();
      var t = form.elements.telefono.value.trim();
      var s = form.elements.servicio.value;
      var m = form.elements.mensaje.value.trim();
      if(n.length < 2){ setErr('nombre', true, 'Indica tu nombre'); ok=false; } else setErr('nombre', false);
      if(!/^[0-9+\s()-]{7,}$/.test(t)){ setErr('telefono', true, 'Teléfono no válido'); ok=false; } else setErr('telefono', false);
      if(!s){ setErr('servicio', true, 'Elige un servicio'); ok=false; } else setErr('servicio', false);
      if(m.length < 5){ setErr('mensaje', true, 'Cuéntanos brevemente'); ok=false; } else setErr('mensaje', false);
      if(!ok){
        var first = form.querySelector('.err');
        if(first) first.focus();
        return;
      }
      var zona = form.elements.zona ? form.elements.zona.value.trim() : '';
      var txt = '¡Hola NCG! Quiero solicitar un presupuesto.%0A%0A'
        + '*Nombre:* '+encodeURIComponent(n)+'%0A'
        + '*Teléfono:* '+encodeURIComponent(t)+'%0A'
        + '*Servicio:* '+encodeURIComponent(s)+'%0A'
        + (zona ? '*Zona:* '+encodeURIComponent(zona)+'%0A' : '')
        + '*Mensaje:* '+encodeURIComponent(m);
      window.open('https://wa.me/'+WA+'?text='+txt, '_blank');
      form.style.display = 'none';
      document.querySelector('.form-ok').classList.add('show');
    });
  }

  /* ---- Año footer ---- */
  var yr = document.getElementById('yr');
  if(yr) yr.textContent = new Date().getFullYear();

  /* ---- Búsqueda en la web ---- */
  var sBtn   = document.getElementById('searchBtn');
  var sOver  = document.getElementById('searchOverlay');
  var sInput = document.getElementById('searchInput');
  var sList  = document.getElementById('searchResults');
  var sEmpty = document.getElementById('searchEmpty');
  var sHint  = document.getElementById('searchHint');
  var sClose = document.getElementById('searchClose');

  if (sBtn && sOver && sInput && sList){
    var SVG_SECTION = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>';
    var SVG_SERVICE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';
    var SVG_CONTACT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>';

    /* Índice estático: títulos + palabras clave + destino */
    var INDEX = [
      { tag:'Sección',  title:'Servicios',                target:'#servicios', icon:SVG_SECTION, kw:'servicios catalogo' },
      { tag:'Sección',  title:'Garantías y respaldo',     target:'#garantias', icon:SVG_SECTION, kw:'garantia certificados 10 años 20 años materiales' },
      { tag:'Sección',  title:'Galería de trabajos',      target:'#galeria',   icon:SVG_SECTION, kw:'galeria fotos proyectos obras realizados' },
      { tag:'Sección',  title:'Sobre la empresa',         target:'#sobre',     icon:SVG_SECTION, kw:'sobre empresa equipo nosotros' },
      { tag:'Sección',  title:'Contacto y presupuesto',   target:'#contacto',  icon:SVG_CONTACT, kw:'contacto presupuesto telefono whatsapp email' },
      { tag:'Contacto', title:'Pedir presupuesto gratis', target:'#contacto',  icon:SVG_CONTACT, kw:'presupuesto gratis cotizacion' },
      { tag:'Contacto', title:'WhatsApp · 638 769 281',   target:'#contacto',  icon:SVG_CONTACT, kw:'whatsapp telefono llamar mensaje' },
    ];

    /* Añadir todos los servicios del grid */
    var cards = document.querySelectorAll('.serv-card');
    cards.forEach(function(c, i){
      var h = c.querySelector('h3');
      var p = c.querySelector('p');
      if (!h) return;
      // Damos un id por si quieres saltar a la tarjeta concreta más adelante.
      if (!c.id) c.id = 'serv-' + (i+1);
      INDEX.push({
        tag:   'Servicio',
        title: h.textContent.trim(),
        target:'#' + c.id,
        icon:  SVG_SERVICE,
        kw:    (p ? p.textContent : '').trim()
      });
    });

    function norm(s){
      return (s || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g,'');
    }
    function escHtml(s){
      return s.replace(/[&<>"']/g, function(c){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
      });
    }
    function highlight(text, q){
      if (!q) return escHtml(text);
      var nText = norm(text), nQ = norm(q);
      var i = nText.indexOf(nQ);
      if (i < 0) return escHtml(text);
      return escHtml(text.slice(0,i)) + '<mark>' + escHtml(text.slice(i, i+q.length)) + '</mark>' + escHtml(text.slice(i+q.length));
    }

    var active = -1;
    function render(q){
      sList.innerHTML = '';
      active = -1;
      var nQ = norm(q);
      var matches = nQ
        ? INDEX.filter(function(it){
            return norm(it.title).indexOf(nQ) >= 0 || norm(it.kw).indexOf(nQ) >= 0 || norm(it.tag).indexOf(nQ) >= 0;
          })
        : INDEX.slice(0, 6);
      matches.slice(0, 12).forEach(function(it, idx){
        var li = document.createElement('li');
        li.setAttribute('role','option');
        li.dataset.target = it.target;
        li.innerHTML =
          '<div class="sr-ic">' + it.icon + '</div>' +
          '<div class="sr-body">' +
            '<div class="sr-title">' + highlight(it.title, q) + '</div>' +
            '<div class="sr-tag">' + escHtml(it.tag) + '</div>' +
          '</div>';
        li.addEventListener('click', function(){ go(it.target); });
        li.addEventListener('mouseenter', function(){ setActive(idx); });
        sList.appendChild(li);
      });
      var none = nQ && matches.length === 0;
      sEmpty.hidden = !none;
      sHint.hidden  = !!nQ;
      if (matches.length) setActive(0);
    }
    function setActive(i){
      var items = sList.querySelectorAll('li');
      if (!items.length) { active = -1; return; }
      active = Math.max(0, Math.min(items.length - 1, i));
      items.forEach(function(li, idx){ li.classList.toggle('is-active', idx === active); });
      var cur = items[active];
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block:'nearest' });
    }
    function go(target){
      close();
      // Pequeño delay para que el lock se libere antes del scroll suave.
      setTimeout(function(){
        var el = document.querySelector(target);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'start' });
      }, 30);
    }
    function open(){
      sOver.hidden = false;
      document.body.classList.add('search-locked');
      void sOver.offsetWidth;
      sOver.classList.add('is-open');
      sInput.value = '';
      render('');
      setTimeout(function(){ sInput.focus(); }, 60);
    }
    function close(){
      sOver.classList.remove('is-open');
      document.body.classList.remove('search-locked');
      setTimeout(function(){ sOver.hidden = true; }, 220);
    }

    sBtn.addEventListener('click', open);
    sClose.addEventListener('click', close);
    sOver.addEventListener('click', function(ev){
      if (ev.target.matches('[data-close]')) close();
    });
    sInput.addEventListener('input', function(){ render(sInput.value); });
    sInput.addEventListener('keydown', function(ev){
      var items = sList.querySelectorAll('li');
      if (ev.key === 'ArrowDown'){ ev.preventDefault(); setActive(active + 1); }
      else if (ev.key === 'ArrowUp'){ ev.preventDefault(); setActive(active - 1); }
      else if (ev.key === 'Enter'){
        ev.preventDefault();
        var cur = items[active];
        if (cur) go(cur.dataset.target);
      }
    });
    document.addEventListener('keydown', function(ev){
      if (!sOver.hidden && ev.key === 'Escape') close();
      // Ctrl+K / Cmd+K abre la búsqueda
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K')){
        ev.preventDefault();
        if (sOver.hidden) open(); else close();
      }
    });
  }

})();

/* ============================================================
   GALERÍA OVERLAY
   ============================================================ */
(() => {
  const goTop = document.getElementById('goTop');
  if (goTop) goTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const openBtn = document.getElementById('openGallery');
  const overlay = document.getElementById('galleryOverlay');
  const closeBtn = document.getElementById('closeGallery');
  const grid = document.getElementById('govGrid');
  if (!openBtn || !overlay || !grid) return;

  const TOTAL = 28;
  const imgUrl = (i) => `uploads/NCG%20trabajos%20realizados%20${i}.jpeg`;

  // Catálogo de trabajos. category ∈ techos|madera|policarbonato|estructuras|finalizados
  const CATEGORIES = {
    techos:        { label:'Techos',        desc:'Reparación, retejado y mantenimiento de cubiertas.' },
    madera:        { label:'Madera',        desc:'Estructura y vigas de madera tratada de primera calidad.' },
    policarbonato: { label:'Policarbonato', desc:'Claraboyas y cubiertas translúcidas con paso de luz.' },
    estructuras:   { label:'Estructuras',   desc:'Estructura metálica ligera, cálculo y montaje a medida.' },
    finalizados:   { label:'Finalizados',   desc:'Obras entregadas con acabados de detalle y garantía.' },
  };
  const GALLERY = [
    { i:1,  cat:'madera',        title:'Tejado de madera vista' },
    { i:2,  cat:'techos',        title:'Retejado completo' },
    { i:3,  cat:'techos',        title:'Sustitución de tejas' },
    { i:4,  cat:'policarbonato', title:'Claraboya curva de policarbonato' },
    { i:5,  cat:'techos',        title:'Cubierta de teja curva' },
    { i:6,  cat:'techos',        title:'Mantenimiento de cubierta' },
    { i:7,  cat:'techos',        title:'Cumbrera y remates' },
    { i:8,  cat:'estructuras',   title:'Estructura metálica ligera' },
    { i:9,  cat:'estructuras',   title:'Montaje de cerchas' },
    { i:10, cat:'finalizados',   title:'Obra entregada' },
    { i:11, cat:'finalizados',   title:'Cubierta terminada' },
    { i:12, cat:'madera',        title:'Vigas de madera laminada' },
    { i:13, cat:'techos',        title:'Tejado restaurado' },
    { i:14, cat:'techos',        title:'Cubierta rehabilitada' },
    { i:15, cat:'policarbonato', title:'Cubierta translúcida' },
    { i:16, cat:'estructuras',   title:'Pórticos metálicos' },
    { i:17, cat:'estructuras',   title:'Estructura en obra' },
    { i:18, cat:'techos',        title:'Trabajo en cubierta' },
    { i:19, cat:'techos',        title:'Cubierta mixta' },
    { i:20, cat:'finalizados',   title:'Proyecto finalizado' },
    { i:21, cat:'madera',        title:'Detalle de madera' },
    { i:22, cat:'techos',        title:'Tejado intervenido' },
    { i:23, cat:'techos',        title:'Acabado de teja' },
    { i:24, cat:'techos',        title:'Cubierta tradicional' },
    { i:25, cat:'finalizados',   title:'Entrega final' },
    { i:26, cat:'estructuras',   title:'Estructura ligera montada' },
    { i:27, cat:'estructuras',   title:'Cubierta sobre estructura' },
    { i:28, cat:'finalizados',   title:'Resultado final' },
  ];
  const waLink = (title) =>
    `https://wa.me/34638769281?text=${encodeURIComponent('Hola NCG, quiero cotizar un trabajo similar a: ' + title)}`;

  // Render del masonry con overlay
  const frag = document.createDocumentFragment();
  GALLERY.forEach((item, idx) => {
    const meta = CATEGORIES[item.cat] || { label:item.cat, desc:'' };
    const fig = document.createElement('figure');
    fig.dataset.cat = item.cat;
    fig.dataset.idx = idx;
    fig.innerHTML = `
      <img src="${imgUrl(item.i)}" alt="${item.title}" loading="lazy">
      <figcaption class="fig-overlay">
        <span class="fig-cat">${meta.label}</span>
        <h4 class="fig-title">${item.title}</h4>
        <p class="fig-desc">${meta.desc}</p>
        <span class="fig-link">Ver proyecto</span>
      </figcaption>`;
    frag.appendChild(fig);
  });
  grid.appendChild(frag);

  // Fade-in al cargar (con IntersectionObserver para revelar al scroll del overlay)
  const figs = grid.querySelectorAll('figure');
  const revealAll = () => requestAnimationFrame(() => figs.forEach((f, k) => {
    setTimeout(() => f.classList.add('in'), Math.min(k * 35, 600));
  }));

  // ---- Filtros ----
  const filtersBox = document.getElementById('govFilters');
  const emptyEl = document.getElementById('govEmpty');
  let currentFilter = 'todos';
  const applyFilter = (cat) => {
    currentFilter = cat;
    let visibles = 0;
    figs.forEach(f => {
      const match = (cat === 'todos') || (f.dataset.cat === cat);
      f.classList.toggle('is-hidden', !match);
      if (match) visibles++;
    });
    if (emptyEl) emptyEl.hidden = visibles > 0;
  };
  if (filtersBox){
    filtersBox.addEventListener('click', (e) => {
      const btn = e.target.closest('.gov-chip');
      if (!btn) return;
      filtersBox.querySelectorAll('.gov-chip').forEach(b => b.classList.toggle('is-active', b === btn));
      applyFilter(btn.dataset.filter);
    });
  }

  /* ---- Carrusel de tarjetas (sección Trabajos) ---- */
  const track = document.getElementById('carTrack');
  const dotsBox = document.getElementById('carDots');
  const prevBtn = document.getElementById('carPrev');
  const nextBtn = document.getElementById('carNext');
  if (track && dotsBox && prevBtn && nextBtn){
    const tFrag = document.createDocumentFragment();
    for (let i = 1; i <= TOTAL; i++){
      const s = document.createElement('div');
      s.className = 'car-slide';
      s.dataset.idx = i - 1;
      s.innerHTML = `<img src="${imgUrl(i)}" alt="Trabajo NCG ${i}" loading="lazy">`;
      tFrag.appendChild(s);
    }
    track.appendChild(tFrag);

    let pos = 0;
    const slides = track.querySelectorAll('.car-slide');
    const update = () => {
      slides.forEach((s, i) => s.classList.toggle('active', i === pos));
    };
    const go = (delta) => {
      pos = (pos + delta + TOTAL) % TOTAL;
      update(); restart();
    };
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));

    let timer = null;
    const start = () => { stop(); timer = setInterval(() => go(1), 1300); };
    const stop  = () => { if (timer){ clearInterval(timer); timer = null; } };
    const restart = () => { if (timer){ start(); } };
    const car = document.getElementById('galCarousel');
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);

    track.addEventListener('click', (e) => {
      const s = e.target.closest('.car-slide');
      if (s && s.classList.contains('active')) openLb(parseInt(s.dataset.idx, 10));
    });

    update(); start();
  }

  const open = (e) => {
    if (e) e.preventDefault();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('gallery-locked');
    // Reset fade-in para que se vuelva a animar al reabrir
    figs.forEach(f => f.classList.remove('in'));
    revealAll();
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('gallery-locked');
  };

  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const openSectionBtn = document.getElementById('openGalleryFromSection');
  if (openSectionBtn) openSectionBtn.addEventListener('click', open);

  /* ---- Lightbox ---- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const lbCounter = document.getElementById('lbCounter');
  const lbCat = document.getElementById('lbCat');
  const lbTitle = document.getElementById('lbTitle');
  const lbDesc = document.getElementById('lbDesc');
  const lbWa = document.getElementById('lbWa');
  let lbIndex = 0;

  const showLb = (i) => {
    lbIndex = (i + GALLERY.length) % GALLERY.length;
    const item = GALLERY[lbIndex];
    const meta = CATEGORIES[item.cat] || { label:item.cat, desc:'' };
    lbImg.src = imgUrl(item.i);
    lbImg.alt = item.title;
    if (lbCat)     lbCat.textContent = meta.label;
    if (lbTitle)   lbTitle.textContent = item.title;
    if (lbDesc)    lbDesc.textContent = meta.desc;
    if (lbWa)      lbWa.href = waLink(item.title);
    if (lbCounter) lbCounter.textContent = `${lbIndex + 1} / ${GALLERY.length}`;
  };
  const openLb = (i) => {
    showLb(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden','false');
    document.body.classList.add('gallery-locked');
  };
  const closeLb = () => {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden','true');
    if (!overlay.classList.contains('open')) document.body.classList.remove('gallery-locked');
  };

  grid.addEventListener('click', (e) => {
    const fig = e.target.closest('figure');
    if (!fig) return;
    const i = parseInt(fig.dataset.idx, 10);
    if (Number.isFinite(i)) openLb(i);
  });
  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => showLb(lbIndex - 1));
  lbNext.addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('open')){
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      else if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    } else if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();
