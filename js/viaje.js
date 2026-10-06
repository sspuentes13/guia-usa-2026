/* JD & Santi On Tour · antes de viajar (lista con checks que se comparten), guía práctica
   (seguro, plata, transporte, internet, aduana, maleta) y botón 🆘 de emergencia que funciona sin internet. */

function chk() { return MIPLAN.chk || (MIPLAN.chk = {}); }
function marcarChk(id) {
  var c = chk(); if (c[id]) delete c[id]; else c[id] = Date.now();
  MIPLAN.modificado = Date.now(); MIPLAN.pend = 1; planGuardar();
}
function itemsPreparar() { var o = []; PREPARAR.forEach(function (g) { g.items.forEach(function (i) { o.push(i); }); }); return o; }

function renderPreparar(el) {
  if (!el || typeof PREPARAR === 'undefined') return;
  var todos = itemsPreparar(), listos = todos.filter(function (i) { return chk()[i.id]; }).length, pct = Math.round(listos / todos.length * 100);
  var enViaje = diaDeHoy() >= 1, ahora = Date.now();
  var h = '<div class="row spread"><h3 class="gh3">🧳 Antes de viajar</h3><span class="pill ' + (listos === todos.length ? 'g' : 'o') + '">' + listos + ' de ' + todos.length + '</span></div>';
  h += '<div class="prog"><i style="width:' + pct + '%"></i></div><p class="gnota">Marquen ✓ lo que ya tengan (se comparte con el otro teléfono si Gastos está conectado). Toquen cada punto para ver el detalle.</p>';
  h += '<details class="prepg"' + (enViaje ? '' : ' open') + '><summary>Ver la lista</summary>';
  PREPARAR.forEach(function (g) {
    var hechos = g.items.filter(function (i) { return chk()[i.id]; }).length;
    h += '<h4 class="gh4">' + esc(g.g) + ' <small>' + hechos + '/' + g.items.length + '</small></h4><ul class="prep">';
    g.items.forEach(function (i) {
      var ok = !!chk()[i.id], urg = !ok && i.fecha && new Date(i.fecha) - ahora < 3 * 864e5;
      h += '<li class="' + (ok ? 'ok' : urg ? 'urge' : '') + '"><button class="rchk" data-chk="' + i.id + '" aria-label="Marcar">' + (ok ? '✓' : '') + '</button><details><summary><b>' + esc(i.t) + '</b>' + (i.cuando ? '<small>' + esc(i.cuando) + '</small>' : '') + '</summary><p>' + esc(i.d) + '</p>' + (i.u ? '<a href="' + i.u + '" target="_blank" rel="noopener">Abrir ↗</a>' : '') + '</details></li>';
    });
    h += '</ul>';
  });
  h += '</details><div class="row mt"><button class="btn sm or" id="calRes">📅 Recordatorios al calendario</button><button class="btn sm" id="calTodo">📅 Todo el plan al calendario</button></div>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-chk]'), function (b) { b.onclick = function () { marcarChk(b.dataset.chk); renderPreparar(el); }; });
  document.getElementById('calRes').onclick = function () { exportarCalendario('reservas'); };
  document.getElementById('calTodo').onclick = function () { exportarCalendario('todo'); };
}

function renderGuia(el) {
  if (!el || typeof GUIA === 'undefined') return;
  var h = '<h3 class="gh3">🧭 Guía práctica</h3><p class="gnota" style="margin:0 0 8px">Lo que nadie les explica: seguro, plata, transporte, internet, maleta y aduana. Funciona sin internet.</p><div class="guia">';
  GUIA.forEach(function (s) {
    h += '<details><summary><span>' + s.e + '</span><b>' + esc(s.t) + '</b></summary><ul>' + s.p.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' + (s.u ? '<a class="btn sm" href="' + s.u + '" target="_blank" rel="noopener">' + esc(s.ut || 'Fuente oficial') + ' ↗</a>' : '') + '</details>';
  });
  el.innerHTML = h + '</div>';
}

/* ---------- 🆘 emergencia ---------- */
function seguroGuardado() { try { return JSON.parse(localStorage.getItem('guiaSeguro') || '{}'); } catch (e) { return {}; } }
function abrirSOS() {
  var s = seguroGuardado(), ca = typeof casa === 'function' ? casa() : null, dir = s.dir || (ca && ca.n && ca.n !== 'Casa' ? ca.n : '');
  var h = '<div class="sos">';
  h += '<div class="sosbig">' + EMERGENCIA.llamar.map(function (x) { return '<a class="btn ' + (x.rojo ? 'sosr' : '') + '" href="tel:' + x.n.replace(/[^\d+]/g, '') + '"><b>' + esc(x.n) + '</b><small>' + esc(x.t) + '</small></a>'; }).join('') + '</div>';
  h += '<div class="box"><h4>🩺 Su seguro médico y datos</h4>' + (s.tel ? '<a class="btn sosr" href="tel:' + esc(s.tel.replace(/[^\d+]/g, '')) + '"><b>' + esc(s.tel) + '</b><small>Llamar a la asistencia ANTES de ir a un hospital</small></a>' : '') +
    '<p class="gnota">Guárdenlo aquí: queda solo en este teléfono, no se publica.</p><div class="sosf"><input id="sgNom" placeholder="Aseguradora (ej. SURA)" value="' + esc(s.nom || '') + '"><input id="sgTel" type="tel" placeholder="Teléfono de asistencia (WhatsApp o +57…)" value="' + esc(s.tel || '') + '"><input id="sgPol" placeholder="Número de póliza o voucher" value="' + esc(s.pol || '') + '"><input id="sgDir" placeholder="Dirección donde se quedan" value="' + esc(s.dir || '') + '"><button class="btn sm pri" id="sgOk">Guardar</button></div></div>';
  h += '<div class="box"><h4>🏠 Dirección donde se quedan</h4>' + (dir ? '<p class="sosdir">' + esc(dir) + '</p><p class="gnota">Muéstrenla a un taxista o a la policía.</p>' : '<p class="gnota">Escríbanla abajo (queda solo en este teléfono) y llévenla también en papel.</p>') + (ca ? '<button class="btn sm" id="sosCasa">🧭 Cómo volver a casa</button>' : '') + '</div>';
  h += EMERGENCIA.secciones.map(function (x) { return '<details class="box"><summary><b>' + esc(x.t) + '</b></summary><ul>' + x.p.map(function (y) { return '<li>' + esc(y) + '</li>'; }).join('') + '</ul>' + (x.tel ? '<a class="btn sm" href="tel:' + x.tel.replace(/[^\d+]/g, '') + '">📞 ' + esc(x.tel) + '</a>' : '') + (x.u ? ' <a class="btn sm" href="' + x.u + '" target="_blank" rel="noopener">Página oficial ↗</a>' : '') + '</details>'; }).join('');
  h += '<p class="gnota">En inglés: “I need help, please. Call an ambulance.” · “I lost my passport.” · “Where is the nearest hospital?”</p></div>';
  hoja('🆘 Emergencia', h, function (d) {
    d.querySelector('#sgOk').onclick = function () {
      var x = { nom: d.querySelector('#sgNom').value.trim(), tel: d.querySelector('#sgTel').value.trim(), pol: d.querySelector('#sgPol').value.trim(), dir: d.querySelector('#sgDir').value.trim() };
      try { localStorage.setItem('guiaSeguro', JSON.stringify(x)); } catch (e) {}
      toast('✓ Guardado solo en este teléfono'); abrirSOS();
    };
    var vc = d.querySelector('#sosCasa'); if (vc) vc.onclick = function () { cerrarHoja(); volverACasa(); };
  });
}
(function () { var b = document.getElementById('sosBtn'); if (b) b.onclick = abrirSOS; })();
