/* JD & Santi On Tour · cifra los pases (tickets, QR, confirmaciones) para publicarlos sin exponerlos.
   El repo y la página son públicos: aquí solo quedan archivos cifrados con AES-256-GCM.
   La app los abre con la clave (PBKDF2-SHA256), que nunca va al repo.

   Uso:  node herramientas/cifrar-pases.js ../Reservas
   La carpeta privada debe tener:
     - pases.json        lista de pases (id, res, t, fecha, hora, personas, quien, codigo, nota, archivos[{f, t, qr}])
     - CLAVE-PASES.txt   la clave (o la variable de entorno PASES_CLAVE)
   Salida: pases/lista.json (público: solo nombres al azar) y pases/*.bin (cifrados). */
var fs = require('fs'), path = require('path'), crypto = require('crypto');

var ITER = 600000;
var dir = process.argv[2];
if (!dir) { console.error('Uso: node herramientas/cifrar-pases.js <carpeta privada>'); process.exit(1); }
var clave = (process.env.PASES_CLAVE || fs.readFileSync(path.join(dir, 'CLAVE-PASES.txt'), 'utf8')).trim();
var pases = JSON.parse(fs.readFileSync(path.join(dir, 'pases.json'), 'utf8'));
var sal = crypto.randomBytes(16), llave = crypto.pbkdf2Sync(clave, sal, ITER, 32, 'sha256');
var TIPOS = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf', '.webp': 'image/webp' };

function cifrar(buf) {
  var iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', llave, iv);
  return Buffer.concat([iv, c.update(buf), c.final(), c.getAuthTag()]);   // iv | datos | etiqueta (como WebCrypto)
}
function nombre() { return crypto.randomBytes(8).toString('hex') + '.bin'; }

var salida = path.join(__dirname, '..', 'pases');
fs.mkdirSync(salida, { recursive: true });
fs.readdirSync(salida).forEach(function (f) { if (/\.bin$/.test(f)) fs.unlinkSync(path.join(salida, f)); });

var archivos = [], total = 0;
var indice = pases.map(function (p) {
  return Object.assign({}, p, {
    archivos: (p.archivos || []).map(function (a) {
      var origen = path.join(dir, a.f), tipo = TIPOS[path.extname(a.f).toLowerCase()];
      if (!tipo) throw new Error('Tipo de archivo no soportado: ' + a.f);
      var n = nombre(), datos = cifrar(fs.readFileSync(origen));
      fs.writeFileSync(path.join(salida, n), datos); archivos.push(n); total += datos.length;
      return { f: n, tipo: tipo, t: a.t || '', qr: !!a.qr };
    })
  });
});
var ni = nombre();
fs.writeFileSync(path.join(salida, ni), cifrar(Buffer.from(JSON.stringify(indice), 'utf8')));
archivos.unshift(ni);
fs.writeFileSync(path.join(salida, 'lista.json'), JSON.stringify({ v: 1, iter: ITER, sal: sal.toString('base64'), indice: ni, archivos: archivos }) + '\n');
console.log(pases.length + ' pases, ' + (archivos.length - 1) + ' archivos cifrados (' + Math.round(total / 1024) + ' KB) en pases/');
