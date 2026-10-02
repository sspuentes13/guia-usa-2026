/**
 * Gastos de la Guía USA · API privada en Google Apps Script.
 *
 * Este código va DENTRO de tu Google Sheet (Extensiones → Apps Script).
 * Guarda los gastos en la pestaña "Gastos" y la configuración en "Config".
 * La clave NO está escrita aquí: se guarda en las "Propiedades del script"
 * con el menú "Gastos de la guía → Preparar hoja y clave".
 * Instrucciones completas: README.md del proyecto, sección "Gastos".
 */

var HOJA_GASTOS = 'Gastos';
var HOJA_CONFIG = 'Config';
var COLUMNAS = ['id', 'fecha', 'dia', 'destino', 'categoria', 'subcategoria', 'descripcion', 'regalo_para', 'regalo_que',
  'monto', 'moneda', 'tasa', 'valor_cop', 'valor_usd', 'pago_por', 'pago_entre', 'division_tipo', 'division_personas',
  'division_montos', 'metodo', 'notas', 'borrado', 'creado', 'modificado'];
var MAX_FALLOS = 20;        // intentos con clave equivocada antes de bloquear
var MINUTOS_BLOQUEO = 15;

/* ---------- menú en la hoja ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gastos de la guía')
    .addItem('Preparar hoja y clave', 'prepararHojaYClave')
    .addItem('Cambiar la clave', 'cambiarClave')
    .addToUi();
}

function prepararHojaYClave() {
  prepararHojas_();
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('CLAVE')) {
    SpreadsheetApp.getUi().alert('La hoja ya está lista y ya tiene clave. Si quieres cambiarla usa "Cambiar la clave".');
    return;
  }
  cambiarClave();
}

function cambiarClave() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Clave de los gastos',
    'Escribe la clave que pedirá la app en cada teléfono (mínimo 6 caracteres; mejor una frase corta que sea fácil de recordar):',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var clave = r.getResponseText().trim();
  if (clave.length < 6) { ui.alert('Muy corta. Debe tener al menos 6 caracteres. Intenta de nuevo.'); return; }
  PropertiesService.getScriptProperties().setProperty('CLAVE', clave);
  ui.alert('Listo. Clave guardada. Ahora publica el script como aplicación web (paso 4 de la guía).');
}

function prepararHojas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var g = ss.getSheetByName(HOJA_GASTOS) || ss.insertSheet(HOJA_GASTOS);
  if (g.getLastRow() === 0) {
    g.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#BFE4F7');
    g.setFrozenRows(1);
    // fechas y textos como texto, para que Sheets no los cambie
    g.getRange('A:I').setNumberFormat('@');
    g.getRange('O:U').setNumberFormat('@');
  }
  var c = ss.getSheetByName(HOJA_CONFIG) || ss.insertSheet(HOJA_CONFIG);
  if (c.getLastRow() === 0) {
    c.getRange(1, 1, 2, 2).setValues([['config', '{}'], ['modificado', 0]]);
    c.getRange('B1').setNumberFormat('@');
  }
  return { gastos: g, config: c };
}

/* ---------- API web ---------- */
function doGet() {
  return json_({ ok: true, app: 'Gastos Guía USA', mensaje: 'Funciona. Copia este enlace en la app (pestaña Gastos).' });
}

function doPost(e) {
  var res;
  try {
    var req = JSON.parse(e.postData.contents);
    res = atender_(req);
  } catch (err) {
    res = { ok: false, error: 'servidor', detalle: String(err && err.message || err) };
  }
  return json_(res);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function atender_(req) {
  var clave = PropertiesService.getScriptProperties().getProperty('CLAVE');
  if (!clave) return { ok: false, error: 'sin_clave' };
  var cache = CacheService.getScriptCache();
  var fallos = Number(cache.get('fallos') || 0);
  if (fallos >= MAX_FALLOS) return { ok: false, error: 'bloqueado' };
  if (String(req.clave || '') !== clave) {
    cache.put('fallos', String(fallos + 1), MINUTOS_BLOQUEO * 60);
    return { ok: false, error: 'clave' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var hojas = prepararHojas_();
    if (req.accion === 'probar') {
      return { ok: true, config: leerConfig_(hojas.config) };
    }
    if (req.accion === 'sync') {
      var config = leerConfig_(hojas.config);
      if (req.config && Number(req.config.modificado) >= Number(config.modificado || 0)) {
        config = guardarConfig_(hojas.config, req.config);
      }
      var gastos = guardarGastos_(hojas.gastos, Array.isArray(req.gastos) ? req.gastos : []);
      return { ok: true, gastos: gastos, config: config, ahora: Date.now() };
    }
    return { ok: false, error: 'accion' };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- configuración (personas y categorías nuevas) ---------- */
function leerConfig_(hoja) {
  var v = hoja.getRange(1, 2, 2, 1).getValues();
  var c = {};
  try { c = JSON.parse(v[0][0] || '{}'); } catch (e) { c = {}; }
  c.modificado = Number(v[1][0] || 0);
  return c;
}

function guardarConfig_(hoja, c) {
  var limpio = {
    personas: Array.isArray(c.personas) ? c.personas.map(String).slice(0, 30) : [],
    catsExtra: Array.isArray(c.catsExtra) ? c.catsExtra.slice(0, 50) : [],
    subsExtra: c.subsExtra && typeof c.subsExtra === 'object' ? c.subsExtra : {}
  };
  hoja.getRange(1, 2, 2, 1).setValues([[JSON.stringify(limpio)], [Number(c.modificado) || Date.now()]]);
  limpio.modificado = Number(c.modificado) || Date.now();
  return limpio;
}

/* ---------- gastos ---------- */
/* texto literal al escribir: evita que Sheets lo tome como fórmula (=, +, -, @) */
function seguro_(fila) {
  return fila.map(function (v) { return typeof v === 'string' && /^[=+\-@']/.test(v) ? "'" + v : v; });
}

function t_(v) {
  return String(v == null ? '' : v);
}

function aFila_(g) {
  var monto = Number(g.monto) || 0, tasa = Number(g.tasa) || 4000, d = g.division || {};
  var cop = g.moneda === 'USD' ? monto * tasa : monto;
  var usd = g.moneda === 'USD' ? monto : monto / tasa;
  return [t_(g.id), t_(g.fecha), Number(g.dia) || '', t_(g.destino), t_(g.categoria),
    t_(g.subcategoria), t_(g.descripcion), t_(g.regaloPara), t_(g.regaloQue),
    monto, g.moneda === 'USD' ? 'USD' : 'COP', tasa, Math.round(cop), Math.round(usd * 100) / 100,
    t_(g.pagoPor), t_((g.pagoEntre || []).join(', ')), t_(d.tipo || 'todos'), t_((d.personas || []).join(', ')),
    JSON.stringify(d.montos || {}), t_(g.metodo), t_(g.notas), g.borrado ? 'sí' : '',
    Number(g.creado) || Date.now(), Number(g.modificado) || Date.now()];
}

function deFila_(f) {
  var o = {};
  COLUMNAS.forEach(function (c, i) { o[c] = f[i]; });
  var fecha = o.fecha instanceof Date ? Utilities.formatDate(o.fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(o.fecha || '');
  var lista = function (s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(String); };
  var montos = {};
  try { montos = JSON.parse(o.division_montos || '{}'); } catch (e) { montos = {}; }
  return {
    id: String(o.id), fecha: fecha, dia: Number(o.dia) || 0, destino: String(o.destino), categoria: String(o.categoria),
    subcategoria: String(o.subcategoria), descripcion: String(o.descripcion), regaloPara: String(o.regalo_para),
    regaloQue: String(o.regalo_que), monto: Number(o.monto) || 0, moneda: String(o.moneda), tasa: Number(o.tasa) || 4000,
    pagoPor: String(o.pago_por), pagoEntre: lista(o.pago_entre),
    division: { tipo: String(o.division_tipo || 'todos'), personas: lista(o.division_personas), montos: montos },
    metodo: String(o.metodo), notas: String(o.notas), borrado: String(o.borrado) === 'sí',
    creado: Number(o.creado) || 0, modificado: Number(o.modificado) || 0
  };
}

function guardarGastos_(hoja, entrantes) {
  var n = hoja.getLastRow() - 1;
  var filas = n > 0 ? hoja.getRange(2, 1, n, COLUMNAS.length).getValues() : [];
  var pos = {};
  filas.forEach(function (f, i) { pos[String(f[0])] = i; });
  var nuevas = [];
  var iMod = COLUMNAS.indexOf('modificado');
  entrantes.forEach(function (g) {
    if (!g || !g.id || !/^\d{4}-\d{2}-\d{2}$/.test(String(g.fecha))) return;
    var fila = aFila_(g);
    var i = pos[String(g.id)];
    if (i === undefined) {
      pos[String(g.id)] = filas.length + nuevas.length;
      nuevas.push(fila);
    } else if (Number(fila[iMod]) > Number(filas[i][iMod])) {
      // gana la versión modificada más recientemente
      hoja.getRange(i + 2, 1, 1, COLUMNAS.length).setValues([seguro_(fila)]);
      filas[i] = fila;
    }
  });
  if (nuevas.length) {
    hoja.getRange(filas.length + 2, 1, nuevas.length, COLUMNAS.length).setValues(nuevas.map(seguro_));
    filas = filas.concat(nuevas);
  }
  return filas.filter(function (f) { return f[0] !== ''; }).map(deFila_);
}
