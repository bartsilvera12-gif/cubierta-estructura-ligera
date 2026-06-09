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

})();
