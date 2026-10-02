/* Guía USA · registro de gastos
   Los gastos se guardan primero en este dispositivo (IndexedDB) y luego se sincronizan con una
   Google Sheet privada a través de Google Apps Script (ver apps-script/Codigo.gs).
   La URL del script y la clave NO están en el código: cada dispositivo las escribe una vez. */

var GX_INICIO='2026-10-30',GX_DIAS=26,GX_ENTRE='Entre todos';
var GX_DESTINOS=['Neiva','Cali','Bogotá','Arlington','Washington DC','Nueva York','Baltimore','Filadelfia','Delaware','En tránsito','Otro'];
var GX_DEST_CITY={'Neiva':'col','Cali':'col','Bogotá':'col','En tránsito':'col','Arlington':'arl','Washington DC':'dc','Nueva York':'ny','Baltimore':'bal','Filadelfia':'phi','Delaware':'del'};
var GX_CATS=[
 {n:'Alimentación',e:'🍽️',s:['Desayuno','Almuerzo','Cena','Merienda / snack','Café','Agua','Hidratación / bebidas','Mercado / supermercado','Propina']},
 {n:'Transporte',e:'🚇',s:['Bus intermunicipal','Metro','Tren (Amtrak / MARC / SEPTA)','Uber / taxi','Ferry','Bus urbano','Equipaje extra']},
 {n:'Entradas y tours',e:'🎟️',s:[]},
 {n:'Compras',e:'🛍️',s:['Ropa','Zapatos','Tecnología','Cosméticos','Souvenirs','Otros']},
 {n:'Regalos',e:'🎁',s:[]},
 {n:'Salud',e:'💊',s:['Farmacia','Medicamentos']},
 {n:'Comunicación',e:'📶',s:['eSIM / datos']},
 {n:'Alojamiento',e:'🛏️',s:[]},
 {n:'Imprevistos',e:'⚠️',s:[]},
 {n:'Otros',e:'📦',s:[]}
];
var GX_METODOS=['Efectivo','Tarjeta débito','Tarjeta crédito'];
var GX_COLORES=['#FF8A3D','#12344D','#5AA9D6','#1E6B3A','#C2531A','#E9B949','#8E6CC9','#D9577A','#7FB77E','#4A6A80','#8CCBEB','#B07A4A'];

var gx={db:null,items:[],cfg:{personas:[],catsExtra:[],subsExtra:{},modificado:0},cfgPend:false,conn:null,listo:false,cargando:null,
 vista:'nuevo',edit:null,b:null,filtro:{desde:'',hasta:'',destino:'',cat:'',persona:''},
 sync:{estado:'',cuando:0,error:''},tasa:4000,urlPendiente:'',syncP:null,timer:null};

/* ---------- utilidades ---------- */
function gxHoy(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function gxFecha(f){return new Date(f+'T12:00:00')}
function gxDia(f){if(!f)return 0;var n=Math.round((gxFecha(f)-gxFecha(GX_INICIO))/864e5)+1;return n}
function gxDiaTxt(f){var n=gxDia(f),d=gxFecha(f).toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
 return (n<1?'Antes del viaje':n>GX_DIAS?'Después del viaje':'Día '+n)+' · '+d}
function gxDestinoDia(n){var fijo={1:'Neiva',2:'Cali',25:'En tránsito',26:'Cali'};if(fijo[n])return fijo[n];if(n<1||n>GX_DIAS)return 'Neiva';
 var c={arl:'Arlington',dc:'Washington DC',ny:'Nueva York',bal:'Baltimore',phi:'Filadelfia',del:'Delaware'};
 for(var k=0;k<DAYS.length;k++){var p=String(DAYS[k].n).split('–'),a=+p[0],z=+(p[1]||p[0]);if(n>=a&&n<=z)return c[DAYS[k].city]||'Otro'}return 'Otro'}
function gxMonedaDe(dest){var c=GX_DEST_CITY[dest];return dest==='En tránsito'||dest==='Otro'?null:(c==='col'?'COP':'USD')}
function gxUSD(v){v=Math.round(v*100)/100;if(v<0)return '-'+gxUSD(-v);return 'US$'+v.toLocaleString('en-US',{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2})}
function gxCOP(v){v=Math.round(v);return v<0?'-'+fmt(-v,'COP'):fmt(v,'COP')}
function gxM(v,m){return m==='USD'?gxUSD(v):gxCOP(v)}
function gxCop(g){return g.moneda==='USD'?g.monto*g.tasa:g.monto}
function gxUsd(g){return g.moneda==='USD'?g.monto:g.monto/g.tasa}
function gxAmbos(cop,tasa){return gxCOP(cop)+' · '+gxUSD(cop/(tasa||gx.tasa))}
function gxNum(s,m){s=String(s==null?'':s).trim();if(!s)return 0;
 if(m==='COP')return +s.replace(/[^\d]/g,'')||0;
 s=s.replace(/[^\d.,]/g,'');if(s.indexOf(',')>-1&&s.indexOf('.')<0)s=s.replace(/,(?=\d{1,2}$)/,'.');s=s.replace(/,/g,'');return Math.round((parseFloat(s)||0)*100)/100}
function gxId(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
function gxCats(){var extra=gx.cfg.catsExtra||[],subs=gx.cfg.subsExtra||{};
 return GX_CATS.concat(extra).map(function(c){return {n:c.n,e:c.e||'🏷️',s:(c.s||[]).concat(subs[c.n]||[])}})}
function gxCat(n){var c=gxCats().filter(function(x){return x.n===n})[0];return c||{n:n,e:'🏷️',s:[]}}
function gxColor(n){var i=gxCats().map(function(c){return c.n}).indexOf(n);return GX_COLORES[(i<0?11:i)%GX_COLORES.length]}
function gxPersonas(){return (gx.cfg.personas||[]).slice()}
function gxActivos(){return gx.items.filter(function(x){return !x.borrado})}
function gxDesde(t){var s=Math.round((Date.now()-t)/1000);return s<60?'hace un momento':s<3600?'hace '+Math.round(s/60)+' min':s<86400?'hace '+Math.round(s/3600)+' h':'el '+new Date(t).toLocaleDateString('es-CO',{day:'numeric',month:'short'})}

/* ---------- IndexedDB ---------- */
function gxDB(){if(gx.db)return Promise.resolve(gx.db);return new Promise(function(ok,ko){if(!window.indexedDB)return ko(new Error('Este navegador no permite guardar datos.'));
 var r=indexedDB.open('guiaGastos',1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('gastos'))d.createObjectStore('gastos',{keyPath:'id'});if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv')};
 r.onsuccess=function(){gx.db=r.result;ok(gx.db)};r.onerror=function(){ko(r.error)}})}
function gxTx(store,mode,fn){return gxDB().then(function(d){return new Promise(function(ok,ko){var t=d.transaction(store,mode),req=fn(t.objectStore(store));
 t.oncomplete=function(){ok(req&&'result' in req?req.result:undefined)};t.onerror=t.onabort=function(){ko(t.error)}})})}
function gxKv(k,v){return arguments.length<2?gxTx('kv','readonly',function(s){return s.get(k)}):gxTx('kv','readwrite',function(s){return s.put(v,k)})}
function gxPut(arr){if(!arr.length)return Promise.resolve();return gxTx('gastos','readwrite',function(s){arr.forEach(function(g){s.put(g)})})}
function gxCargar(){if(gx.cargando)return gx.cargando;
 gx.cargando=Promise.all([gxTx('gastos','readonly',function(s){return s.getAll()}),gxKv('conn'),gxKv('cfg'),gxKv('cfgPend'),gxKv('tasa'),gxKv('ultimaSync')]).then(function(r){
  gx.items=(r[0]||[]).map(gxNormal);gx.conn=r[1]||null;if(r[2])gx.cfg=gxCfgNormal(r[2]);gx.cfgPend=!!r[3];gx.tasa=+r[4]||RATE||4000;gx.sync.cuando=+r[5]||0;gx.listo=true;
 },function(e){gx.cargando=null;throw e});return gx.cargando}
function gxNormal(g){g=g||{};var d=g.division||{};
 return {id:String(g.id),fecha:String(g.fecha||'').slice(0,10),dia:gxDia(String(g.fecha||'').slice(0,10)),destino:g.destino||'Otro',categoria:g.categoria||'Otros',subcategoria:g.subcategoria||'',
  descripcion:g.descripcion||'',regaloPara:g.regaloPara||'',regaloQue:g.regaloQue||'',monto:+g.monto||0,moneda:g.moneda==='USD'?'USD':'COP',tasa:+g.tasa||4000,
  pagoPor:g.pagoPor||'',pagoEntre:Array.isArray(g.pagoEntre)?g.pagoEntre:[],
  division:{tipo:d.tipo||'todos',personas:Array.isArray(d.personas)?d.personas:[],montos:d.montos&&typeof d.montos==='object'?d.montos:{}},
  metodo:g.metodo||'',notas:g.notas||'',creado:+g.creado||0,modificado:+g.modificado||0,borrado:g.borrado===true||g.borrado==='true'||g.borrado==='TRUE',_pend:g._pend?1:0}}
function gxCfgNormal(c){c=c||{};return {personas:Array.isArray(c.personas)?c.personas.filter(Boolean):[],catsExtra:Array.isArray(c.catsExtra)?c.catsExtra:[],subsExtra:c.subsExtra&&typeof c.subsExtra==='object'?c.subsExtra:{},modificado:+c.modificado||0}}
function gxLimpio(g){var o={};for(var k in g)if(k!=='_pend')o[k]=g[k];return o}

/* ---------- conexión con Google Apps Script ---------- */
function gxErr(c){return {clave:'Clave incorrecta.',bloqueado:'Demasiados intentos fallidos. Espera 15 minutos.',sin_clave:'La hoja todavía no tiene clave. En la Google Sheet usa el menú “Gastos de la guía → Preparar hoja y clave”.'}[c]||'No se pudo conectar con la hoja.'}
function gxApi(req,url){return fetch(url||gx.conn.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(req),redirect:'follow',cache:'no-store'})
 .then(function(r){if(!r.ok)throw new Error('El script respondió '+r.status+'. Revisa que esté publicado para “Cualquier persona”.');return r.text()})
 .then(function(t){var j;try{j=JSON.parse(t)}catch(e){throw new Error('El enlace no parece ser el del script (debe terminar en /exec).')}
  if(!j.ok){var e=new Error(gxErr(j.error));e.code=j.error;throw e}return j})}
function gxConectar(url,clave){url=String(url||'').trim();clave=String(clave||'');
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url))return Promise.reject(new Error('El enlace debe verse así: https://script.google.com/macros/s/…/exec'));
 if(!clave)return Promise.reject(new Error('Escribe la clave.'));
 if(!navigator.onLine)return Promise.reject(new Error('Necesitas internet solo esta primera vez.'));
 return gxApi({accion:'probar',clave:clave},url).then(function(j){gx.conn={url:url,clave:clave};return gxKv('conn',gx.conn).then(function(){
  if(j.config){gx.cfg=gxCfgNormal(j.config);gx.cfgPend=false;return Promise.all([gxKv('cfg',gx.cfg),gxKv('cfgPend',false)])}})}).then(function(){return gxSync()})}
function gxSync(){
 if(!gx.conn)return Promise.resolve();
 if(!navigator.onLine){gx.sync.estado='offline';gxPintarEstado();return Promise.resolve()}
 if(gx.syncP)return gx.syncP;
 var pend=gx.items.filter(function(x){return x._pend});
 gx.sync.estado='sync';gxPintarEstado();
 gx.syncP=gxApi({accion:'sync',clave:gx.conn.clave,gastos:pend.map(gxLimpio),config:gx.cfgPend?gx.cfg:null}).then(gxAplicar).then(function(){
  gx.sync={estado:'ok',cuando:Date.now(),error:''};return gxKv('ultimaSync',gx.sync.cuando)
 }).catch(function(e){gx.sync.estado='error';gx.sync.error=e.message;console.warn('sync',e)}).then(function(){gx.syncP=null;gxPintarEstado();gxRefrescarSiSeguro()});
 return gx.syncP}
function gxAplicar(j){var map={},cambios=[];gx.items.forEach(function(x){map[x.id]=x});
 (j.gastos||[]).forEach(function(s){s=gxNormal(s);var l=map[s.id];
  if(!l||(!l._pend&&s.modificado!==l.modificado)||(l._pend&&s.modificado>=l.modificado)){s._pend=0;map[s.id]=s;cambios.push(s)}});
 gx.items=Object.keys(map).map(function(k){return map[k]});
 if(j.config&&(!gx.cfgPend||+j.config.modificado>=gx.cfg.modificado)){gx.cfg=gxCfgNormal(j.config);gx.cfgPend=false}
 return Promise.all([gxPut(cambios),gxKv('cfg',gx.cfg),gxKv('cfgPend',gx.cfgPend)])}
function gxProgramarSync(ms){clearTimeout(gx.timer);gx.timer=setTimeout(gxSync,ms||400)}
function gxGuardarCfg(){gx.cfg.modificado=Date.now();gx.cfgPend=true;return Promise.all([gxKv('cfg',gx.cfg),gxKv('cfgPend',true)]).then(function(){gxProgramarSync()})}
window.addEventListener('online',function(){if(gx.conn)gxProgramarSync(800)});
window.addEventListener('offline',function(){if(gx.conn){gx.sync.estado='offline';gxPintarEstado()}});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&gx.conn)gxProgramarSync(500)});
setInterval(function(){if(gx.conn&&document.visibilityState==='visible'&&navigator.onLine)gxSync()},90000);

/* ---------- estado de sincronización ---------- */
function gxEstadoHTML(){var p=gx.items.filter(function(x){return x._pend}).length,s=gx.sync,t,c='';
 if(s.estado==='sync'){t='🔄 Sincronizando…'}
 else if(!navigator.onLine||s.estado==='offline'){t=p?'📱 '+p+' guardado'+(p>1?'s':'')+' en el teléfono · sin internet':'📱 Sin internet · todo guardado en el teléfono';c='o'}
 else if(s.estado==='error'){t='⚠️ '+s.error+(p?' · '+p+' en el teléfono':'');c='r'}
 else if(p){t='📱 '+p+' guardado'+(p>1?'s':'')+' en el teléfono · toca para sincronizar';c='o'}
 else t='☁️ Sincronizado'+(s.cuando?' · '+gxDesde(s.cuando):'');
 return '<button class="pill gsync '+(c||'g')+'" id="gxSyncBtn" title="Sincronizar ahora">'+esc(t)+'</button>'}
function gxPintarEstado(){var e=document.getElementById('gxEstado');if(e){e.innerHTML=gxEstadoHTML();document.getElementById('gxSyncBtn').onclick=function(){gxSync()}}
 [].forEach.call(document.querySelectorAll('[data-pend]'),function(x){var g=gx.items.filter(function(i){return i.id===x.dataset.pend})[0];if(g){x.textContent=g._pend?'📱':'☁️';x.title=g._pend?'Guardado en el teléfono':'Sincronizado'}})}
function gxRefrescarSiSeguro(){if(tab!=='gastos'||!gx.conn)return;if(gx.vista==='nuevo'||gx.vista==='ajustes')return;gxPintar()}

/* ---------- vista principal ---------- */
function renderGastos(){var el=document.getElementById('v-gastos');
 if(!gx.listo){el.innerHTML='<h2 class="big">Gastos</h2><p class="lead">Cargando…</p>';gxCargar().then(renderGastos,function(e){el.innerHTML='<h2 class="big">Gastos</h2><div class="warn">No se pudo abrir el almacenamiento del dispositivo: '+esc(e.message)+'. Si estás en modo privado/incógnito, ábrela en una ventana normal.</div>'});return}
 if(!gx.conn)return gxPintarCandado();
 gxPintar();if(Date.now()-gx.sync.cuando>30000)gxProgramarSync(300)}
function gxPintarCandado(err){var el=document.getElementById('v-gastos');
 var h='<h2 class="big">Gastos</h2><p class="lead">Anoten cada gasto en pesos o dólares, con reportes y cuentas claras entre todos.</p>';
 h+='<div class="card glock"><div class="glock-ic">🔒</div><h3>Gastos privados</h3><p>Para ver y anotar gastos en este dispositivo, conéctalo a la hoja privada del viaje. Se hace una sola vez; necesitas internet solo para este paso.</p>';
 h+='<label class="gl">Enlace del script<input class="gin" id="gxUrl" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="'+esc(gx.urlPendiente)+'"></label>';
 h+='<label class="gl">Clave<input class="gin" id="gxClave" type="password" autocomplete="current-password" placeholder="La clave que te dieron"></label>';
 h+='<div id="gxErr">'+(err?'<div class="warn gerr">'+esc(err)+'</div>':'')+'</div><div class="row mt"><button class="btn or gbig" id="gxConectar">Conectar este dispositivo</button></div>';
 h+='<p class="warn">¿Todavía no existe la hoja? Sigue la guía paso a paso del README del proyecto (sección “Gastos: crear la Google Sheet”).</p></div>';
 el.innerHTML=h;
 var b=document.getElementById('gxConectar');b.onclick=function(){b.disabled=true;b.textContent='Conectando…';
  gxConectar(document.getElementById('gxUrl').value,document.getElementById('gxClave').value).then(function(){gx.urlPendiente='';
   if(!gxPersonas().length){gx.vista='ajustes';toast('Conectado. Ahora agrega quiénes viajan')}else{gx.vista='nuevo';toast('Conectado ☁️')}renderGastos()
  },function(e){gx.conn=null;gxPintarCandado(e.message)})};
 document.getElementById('gxClave').onkeydown=function(e){if(e.key==='Enter')b.click()}}

function gxPintar(){var el=document.getElementById('v-gastos'),V=[['nuevo',gx.edit?'✏️ Editar':'＋ Anotar'],['lista','Lista'],['reportes','Reportes'],['cuentas','Cuentas claras'],['ajustes','⚙️ Ajustes']];
 var h='<div class="ghead"><h2 class="big">Gastos</h2><div id="gxEstado">'+gxEstadoHTML()+'</div></div>';
 h+='<div class="gtabs" role="tablist">'+V.map(function(v){return '<button role="tab" data-gv="'+v[0]+'"'+(gx.vista===v[0]?' class="on" aria-selected="true"':'')+'>'+v[1]+'</button>'}).join('')+'</div>';
 h+='<div id="gxBody"></div>';el.innerHTML=h;
 document.getElementById('gxSyncBtn').onclick=function(){gxSync()};
 [].forEach.call(el.querySelectorAll('[data-gv]'),function(b){b.onclick=function(){if(gx.vista==='nuevo')gxLeerForm();gx.vista=b.dataset.gv;gxPintar();window.scrollTo(0,0)}});
 var body=document.getElementById('gxBody');
 ({nuevo:gxVistaForm,lista:gxVistaLista,reportes:gxVistaReportes,cuentas:gxVistaCuentas,ajustes:gxVistaAjustes})[gx.vista](body)}

/* ---------- formulario ---------- */
function gxNuevoBorrador(prev){var f=gxHoy(),d=gxDestinoDia(gxDia(f));prev=prev||{};
 var dest=prev.fecha===f&&prev.destino?prev.destino:d;
 return {id:null,fecha:f,destino:dest,moneda:prev.moneda&&!gxMonedaDe(dest)?prev.moneda:(gxMonedaDe(dest)||prev.moneda||'COP'),monto:'',tasa:gx.tasa,categoria:'',subcategoria:'',descripcion:'',regaloPara:'',regaloQue:'',
  pagoPor:prev.pagoPor||'',division:{tipo:'todos',personas:gxPersonas(),montos:{}},metodo:prev.metodo||'Efectivo',notas:''}}
function gxChips(name,opts,val,extra){return '<div class="gchips" data-name="'+name+'">'+opts.map(function(o){var v=typeof o==='string'?o:o[0],l=typeof o==='string'?esc(o):o[1];
 return '<button type="button" class="chip sm'+(v===val?' on':'')+'" data-v="'+esc(v)+'">'+l+'</button>'}).join('')+(extra||'')+'</div>'}
function gxVistaForm(body){
 if(!gxPersonas().length){body.innerHTML='<div class="card"><h3 style="margin:0 0 6px">Primero, ¿quiénes viajan?</h3><p class="lead" style="font-size:15px">Agrega las personas en Ajustes. Así se puede saber quién pagó y cómo se divide cada gasto.</p><button class="btn or" id="gxIrAj">Agregar personas</button></div>';
  document.getElementById('gxIrAj').onclick=function(){gx.vista='ajustes';gxPintar()};return}
 var b=gx.b||(gx.b=gxNuevoBorrador()),cat=gxCat(b.categoria),pers=gxPersonas(),n=gxDia(b.fecha);
 var h='<form class="card gform" id="gxForm" novalidate autocomplete="off">';
 // monto y moneda
 h+='<div class="gmonto"><label class="gl">Monto<input class="gin gnum" id="gxMonto" inputmode="decimal" enterkeyhint="done" placeholder="0" value="'+esc(b.monto)+'"></label>'+
  '<div class="toggle2 gcur" role="group" aria-label="Moneda"><button type="button" data-cur="COP"'+(b.moneda==='COP'?' class="on"':'')+'>COP</button><button type="button" data-cur="USD"'+(b.moneda==='USD'?' class="on"':'')+'>USD</button></div></div>';
 h+='<div class="gconv"><b id="gxConv"></b><label class="gtasa">1 US$ = <input class="gin" id="gxTasa" inputmode="numeric" value="'+esc(b.tasa)+'"> COP</label></div>';
 // fecha
 h+='<div class="gfila"><label class="gl">Fecha<input class="gin" id="gxFecha" type="date" value="'+esc(b.fecha)+'"></label><div class="gdia" id="gxDiaTxt">'+esc(gxDiaTxt(b.fecha))+'</div></div>';
 h+='<div class="gl">Destino</div>'+gxChips('destino',GX_DESTINOS,b.destino);
 h+='<div class="gl">Categoría</div><div class="gcats" data-name="categoria">'+gxCats().map(function(c){return '<button type="button" class="gcat'+(c.n===b.categoria?' on':'')+'" data-v="'+esc(c.n)+'"><span>'+c.e+'</span>'+esc(c.n)+'</button>'}).join('')+'<button type="button" class="gcat add" id="gxNuevaCat"><span>＋</span>Nueva</button></div>';
 if(b.categoria){
  if(b.categoria==='Regalos')h+='<div class="grid2 gfila2"><label class="gl">¿Para quién?<input class="gin" id="gxRegPara" value="'+esc(b.regaloPara)+'" placeholder="Ej.: la abuela"></label><label class="gl">¿Qué se compró?<input class="gin" id="gxRegQue" value="'+esc(b.regaloQue)+'" placeholder="Ej.: bufanda"></label></div>';
  h+='<div class="gl">Subcategoría <small>(opcional)</small></div>'+gxChips('subcategoria',cat.s,b.subcategoria,'<button type="button" class="chip sm add" id="gxNuevaSub">＋ Nueva</button>');
 }
 h+='<label class="gl">Qué se compró y dónde<input class="gin" id="gxDesc" value="'+esc(b.descripcion)+'" placeholder="Ej.: 2 cafés en Union Station"></label>';
 h+='<div class="gl">¿Quién pagó?</div>'+gxChips('pagoPor',pers.concat([GX_ENTRE]),b.pagoPor);
 var dv=b.division;
 h+='<div class="gl">¿Para quién es? ¿Cómo se divide?</div><div class="toggle2 gdiv" role="group">'+[['todos','Todos por igual'],['algunos','Solo algunos'],['montos','Montos']].map(function(o){return '<button type="button" data-div="'+o[0]+'"'+(dv.tipo===o[0]?' class="on"':'')+'>'+o[1]+'</button>'}).join('')+'</div>';
 if(dv.tipo==='todos')h+='<p class="gnota">Se divide igual entre '+esc(pers.join(', '))+'.</p>';
 if(dv.tipo==='algunos')h+='<div class="gchips" id="gxDivAlg">'+pers.map(function(p){return '<button type="button" class="chip sm'+(dv.personas.indexOf(p)>-1?' on':'')+'" data-p="'+esc(p)+'">'+(dv.personas.indexOf(p)>-1?'✓ ':'')+esc(p)+'</button>'}).join('')+'</div><p class="gnota" id="gxDivTxt"></p>';
 if(dv.tipo==='montos')h+='<div class="gmontos">'+pers.map(function(p){return '<label>'+esc(p)+'<input class="gin" data-mp="'+esc(p)+'" inputmode="decimal" placeholder="0" value="'+esc(dv.montos[p]==null?'':dv.montos[p])+'"></label>'}).join('')+'</div><p class="gnota" id="gxDivTxt"></p>';
 h+='<div class="gl">Método de pago</div>'+gxChips('metodo',GX_METODOS,b.metodo);
 h+='<label class="gl">Notas <small>(opcional)</small><textarea class="gin" id="gxNotas" rows="2">'+esc(b.notas)+'</textarea></label>';
 h+='<div id="gxErr"></div><div class="row mt gacciones"><button type="submit" class="btn or gbig">'+(b.id?'Guardar cambios':'Guardar gasto')+'</button>'+(b.id?'<button type="button" class="btn" id="gxCancel">Cancelar</button><button type="button" class="btn gdel" id="gxDel">Borrar</button>':'')+'</div></form>';
 body.innerHTML=h;
 var f=document.getElementById('gxForm');
 function conv(){var m=gxNum(document.getElementById('gxMonto').value,b.moneda),t=gxNum(document.getElementById('gxTasa').value,'COP')||gx.tasa;
  document.getElementById('gxConv').textContent=m?(b.moneda==='USD'?gxUSD(m)+' = '+gxCOP(m*t):gxCOP(m)+' = '+gxUSD(m/t)):'Valor en las dos monedas';gxDivTxt()}
 function gxDivTxt(){var e=document.getElementById('gxDivTxt');if(!e)return;var m=gxNum(document.getElementById('gxMonto').value,b.moneda);
  if(b.division.tipo==='algunos'){var k=b.division.personas.length;e.textContent=k?'Cada uno: '+gxM(m/k,b.moneda):'Escoge al menos una persona.'}
  else{var s=0;[].forEach.call(f.querySelectorAll('[data-mp]'),function(i){s+=gxNum(i.value,b.moneda)});var r=Math.round((m-s)*100)/100;e.textContent='Asignado '+gxM(s,b.moneda)+' de '+gxM(m,b.moneda)+(r?(r>0?' · faltan '+gxM(r,b.moneda):' · sobran '+gxM(-r,b.moneda)):' ✓');e.className='gnota'+(r?' gwarn':'')}}
 conv();
 document.getElementById('gxMonto').oninput=conv;document.getElementById('gxTasa').oninput=conv;
 [].forEach.call(f.querySelectorAll('[data-mp]'),function(i){i.oninput=gxDivTxt});
 document.getElementById('gxFecha').onchange=function(e){gxLeerForm();var nd=gxDestinoDia(gxDia(b.fecha));if(!b.id&&nd!==b.destino){b.destino=nd;var mc=gxMonedaDe(nd);if(mc)b.moneda=mc}gxPintar()};
 [].forEach.call(f.querySelectorAll('[data-cur]'),function(x){x.onclick=function(){gxLeerForm();b.moneda=x.dataset.cur;gxPintar()}});
 [].forEach.call(f.querySelectorAll('[data-div]'),function(x){x.onclick=function(){gxLeerForm();b.division.tipo=x.dataset.div;if(x.dataset.div==='todos')b.division.personas=gxPersonas();gxPintar()}});
 [].forEach.call(f.querySelectorAll('#gxDivAlg [data-p]'),function(x){x.onclick=function(){gxLeerForm();var p=x.dataset.p,a=b.division.personas,i=a.indexOf(p);if(i>-1)a.splice(i,1);else a.push(p);gxPintar()}});
 [].forEach.call(f.querySelectorAll('.gchips[data-name] [data-v],.gcats [data-v]'),function(x){x.onclick=function(){gxLeerForm();var k=x.parentNode.dataset.name,v=x.dataset.v;
  if(k==='subcategoria'&&b.subcategoria===v)v='';
  if(k==='categoria'&&b.categoria!==v)b.subcategoria='';
  b[k]=v;if(k==='destino'){var mc=gxMonedaDe(v);if(mc&&!b.monto)b.moneda=mc}gxPintar()}});
 document.getElementById('gxNuevaCat').onclick=function(){gxLeerForm();var n=(prompt('Nombre de la nueva categoría:')||'').trim();if(!n)return;
  if(gxCats().some(function(c){return c.n.toLowerCase()===n.toLowerCase()})){toast('Esa categoría ya existe');return}
  var e=(prompt('Un emoji para "'+n+'" (opcional):','🏷️')||'🏷️').trim().slice(0,4);gx.cfg.catsExtra=(gx.cfg.catsExtra||[]).concat([{n:n,e:e,s:[]}]);b.categoria=n;b.subcategoria='';gxGuardarCfg();gxPintar()};
 var ns=document.getElementById('gxNuevaSub');if(ns)ns.onclick=function(){gxLeerForm();var n=(prompt('Nueva subcategoría para '+b.categoria+':')||'').trim();if(!n)return;
  if(gxCat(b.categoria).s.some(function(s){return s.toLowerCase()===n.toLowerCase()})){b.subcategoria=n;gxPintar();return}
  var se=gx.cfg.subsExtra||(gx.cfg.subsExtra={});se[b.categoria]=(se[b.categoria]||[]).concat([n]);b.subcategoria=n;gxGuardarCfg();gxPintar()};
 f.onsubmit=function(e){e.preventDefault();gxLeerForm();gxGuardar()};
 var c=document.getElementById('gxCancel');if(c)c.onclick=function(){gx.edit=null;gx.b=null;gx.vista='lista';gxPintar()};
 var d=document.getElementById('gxDel');if(d)d.onclick=function(){if(!confirm('¿Borrar este gasto? Se borra también en los otros teléfonos.'))return;gxBorrar(b.id)}}
function gxLeerForm(){var b=gx.b,f=document.getElementById('gxForm');if(!b||!f)return;var v=function(id){var e=document.getElementById(id);return e?e.value:null};
 b.monto=v('gxMonto');b.tasa=gxNum(v('gxTasa'),'COP')||gx.tasa;b.fecha=v('gxFecha')||b.fecha;b.descripcion=v('gxDesc');b.notas=v('gxNotas');
 if(v('gxRegPara')!==null){b.regaloPara=v('gxRegPara');b.regaloQue=v('gxRegQue')}
 if(b.division.tipo==='montos'){var m={};[].forEach.call(f.querySelectorAll('[data-mp]'),function(i){if(i.value.trim())m[i.dataset.mp]=i.value.trim()});b.division.montos=m}}
function gxGuardar(){var b=gx.b,err=[],monto=gxNum(b.monto,b.moneda),pers=gxPersonas(),dv=b.division,montos={};
 if(!(monto>0))err.push('Escribe el monto.');if(!b.fecha)err.push('Escoge la fecha.');if(!b.categoria)err.push('Escoge una categoría.');if(!b.pagoPor)err.push('Escoge quién pagó.');
 if(!(b.tasa>0))err.push('La tasa de cambio debe ser mayor que cero.');
 var divP=dv.tipo==='todos'?pers:dv.tipo==='algunos'?dv.personas.filter(function(p){return pers.indexOf(p)>-1||true}):[];
 if(dv.tipo==='algunos'&&!divP.length)err.push('Escoge para quién es el gasto.');
 if(dv.tipo==='montos'){var s=0;Object.keys(dv.montos).forEach(function(p){var x=gxNum(dv.montos[p],b.moneda);if(x>0){montos[p]=x;s+=x}});divP=Object.keys(montos);
  if(!divP.length)err.push('Escribe cuánto le corresponde a cada uno.');else if(Math.abs(s-monto)>(b.moneda==='COP'?1:0.01))err.push('Los montos por persona suman '+gxM(s,b.moneda)+' y el gasto es '+gxM(monto,b.moneda)+'.')}
 if(err.length){document.getElementById('gxErr').innerHTML='<div class="warn gerr">'+err.map(esc).join('<br>')+'</div>';document.getElementById('gxErr').scrollIntoView({block:'center',behavior:'smooth'});return}
 var ahora=Date.now(),viejo=b.id?gx.items.filter(function(x){return x.id===b.id})[0]:null;
 var g={id:b.id||gxId(),fecha:b.fecha,dia:gxDia(b.fecha),destino:b.destino,categoria:b.categoria,subcategoria:b.subcategoria,descripcion:b.descripcion.trim(),
  regaloPara:b.categoria==='Regalos'?b.regaloPara.trim():'',regaloQue:b.categoria==='Regalos'?b.regaloQue.trim():'',monto:monto,moneda:b.moneda,tasa:b.tasa,
  pagoPor:b.pagoPor,pagoEntre:b.pagoPor===GX_ENTRE?pers:[],division:{tipo:dv.tipo,personas:divP,montos:dv.tipo==='montos'?montos:{}},
  metodo:b.metodo,notas:b.notas.trim(),creado:viejo?viejo.creado:ahora,modificado:Math.max(ahora,viejo?viejo.modificado+1:0),borrado:false,_pend:1};
 gx.tasa=b.tasa;gxKv('tasa',gx.tasa);
 gxPut([g]).then(function(){gx.items=gx.items.filter(function(x){return x.id!==g.id}).concat([g]);
  toast((viejo?'Cambios guardados':'Gasto guardado')+' en el teléfono');var prev=b;gx.edit=null;gx.b=gxNuevoBorrador(prev);if(viejo)gx.vista='lista';gxPintar();window.scrollTo(0,0);gxProgramarSync(300)
 },function(e){document.getElementById('gxErr').innerHTML='<div class="warn gerr">No se pudo guardar: '+esc(e.message)+'</div>'})}
function gxBorrar(id){var g=gx.items.filter(function(x){return x.id===id})[0];if(!g)return;
 var n=gxNormal(g);n.borrado=true;n.modificado=Math.max(Date.now(),g.modificado+1);n._pend=1;
 gxPut([n]).then(function(){gx.items=gx.items.filter(function(x){return x.id!==id}).concat([n]);gx.edit=null;gx.b=null;gx.vista='lista';toast('Gasto borrado');gxPintar();gxProgramarSync(300)})}
function gxEditar(id){var g=gx.items.filter(function(x){return x.id===id})[0];if(!g)return;
 gx.edit=id;gx.b={id:g.id,fecha:g.fecha,destino:g.destino,moneda:g.moneda,monto:g.moneda==='USD'?String(g.monto):String(g.monto),tasa:g.tasa,categoria:g.categoria,subcategoria:g.subcategoria,
  descripcion:g.descripcion,regaloPara:g.regaloPara,regaloQue:g.regaloQue,pagoPor:g.pagoPor,division:{tipo:g.division.tipo,personas:g.division.personas.slice(),montos:JSON.parse(JSON.stringify(g.division.montos))},metodo:g.metodo,notas:g.notas};
 gx.vista='nuevo';gxPintar();window.scrollTo(0,0)}

/* ---------- filtros ---------- */
function gxFiltrados(){var f=gx.filtro;return gxActivos().filter(function(g){
 if(f.desde&&g.fecha<f.desde)return false;if(f.hasta&&g.fecha>f.hasta)return false;if(f.destino&&g.destino!==f.destino)return false;if(f.cat&&g.categoria!==f.cat)return false;
 if(f.persona&&g.pagoPor!==f.persona&&g.division.personas.indexOf(f.persona)<0&&(g.pagoPor!==GX_ENTRE||g.pagoEntre.indexOf(f.persona)<0))return false;return true}).sort(function(a,b){return a.fecha<b.fecha?1:a.fecha>b.fecha?-1:b.creado-a.creado})}
function gxTodosNombres(){var s={};gxPersonas().forEach(function(p){s[p]=1});gxActivos().forEach(function(g){if(g.pagoPor&&g.pagoPor!==GX_ENTRE)s[g.pagoPor]=1;g.division.personas.forEach(function(p){s[p]=1})});return Object.keys(s)}
function gxFiltrosHTML(){var f=gx.filtro,act=f.desde||f.hasta||f.destino||f.cat||f.persona;
 function sel(id,lab,opts,v){return '<label class="gl">'+lab+'<select class="gin" id="'+id+'"><option value="">Todos</option>'+opts.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select></label>'}
 return '<details class="card gfiltros"'+(act?' open':'')+'><summary>🔎 Filtros'+(act?' <span class="pill o">activos</span>':'')+'</summary><div class="gfgrid">'+
  '<label class="gl">Desde<input class="gin" type="date" id="gfDesde" value="'+esc(f.desde)+'"></label><label class="gl">Hasta<input class="gin" type="date" id="gfHasta" value="'+esc(f.hasta)+'"></label>'+
  sel('gfDest','Destino',GX_DESTINOS,f.destino)+sel('gfCat','Categoría',gxCats().map(function(c){return c.n}),f.cat)+sel('gfPer','Persona',gxTodosNombres(),f.persona)+
  '</div>'+(act?'<button class="btn mt" id="gfLimpiar">Quitar filtros</button>':'')+'</details>'}
function gxBindFiltros(){var m={gfDesde:'desde',gfHasta:'hasta',gfDest:'destino',gfCat:'cat',gfPer:'persona'};
 Object.keys(m).forEach(function(id){var e=document.getElementById(id);if(e)e.onchange=function(){gx.filtro[m[id]]=e.value;gxPintar()}});
 var l=document.getElementById('gfLimpiar');if(l)l.onclick=function(){gx.filtro={desde:'',hasta:'',destino:'',cat:'',persona:''};gxPintar()}}

/* ---------- lista ---------- */
function gxVistaLista(body){var L=gxFiltrados(),cop=0,usd=0;L.forEach(function(g){cop+=gxCop(g);usd+=gxUsd(g)});
 var h=gxFiltrosHTML()+'<div class="grid2 gtot"><div class="stat o"><small>Total en pesos ('+L.length+' gasto'+(L.length===1?'':'s')+')</small><b>'+gxCOP(cop)+'</b></div><div class="stat"><small>Total en dólares</small><b>'+gxUSD(usd)+'</b></div></div>';
 if(!L.length)h+='<div class="card"><p class="lead" style="margin:0">'+(gxActivos().length?'Ningún gasto con estos filtros.':'Todavía no hay gastos. Toca <b>＋ Anotar</b> para registrar el primero.')+'</p></div>';
 var last='';L.forEach(function(g){if(g.fecha!==last){if(last)h+='</div>';var dc=0;L.forEach(function(x){if(x.fecha===g.fecha)dc+=gxCop(x)});h+='<div class="gdiahead"><b>'+esc(gxDiaTxt(g.fecha))+'</b><span>'+gxCOP(dc)+'</span></div><div class="card glista">';last=g.fecha}
  var c=gxCat(g.categoria),otro=g.moneda==='USD'?gxCOP(gxCop(g)):gxUSD(gxUsd(g));
  h+='<button class="gitem" data-id="'+esc(g.id)+'"><span class="gic" style="background:'+gxColor(g.categoria)+'22">'+c.e+'</span><span class="gtx"><b>'+esc(g.descripcion||g.subcategoria||g.categoria)+'</b><small>'+esc([g.categoria+(g.subcategoria?' · '+g.subcategoria:''),g.destino].join(' · '))+(g.categoria==='Regalos'&&(g.regaloPara||g.regaloQue)?'<br>🎁 '+esc(g.regaloQue)+(g.regaloPara?' para '+esc(g.regaloPara):''):'')+'<br>Pagó '+esc(g.pagoPor)+(g.metodo?' · '+esc(g.metodo):'')+' · '+esc(gxDivResumen(g))+'</small></span><span class="gval"><b>'+gxM(g.monto,g.moneda)+'</b><small>'+otro+'</small><i data-pend="'+esc(g.id)+'" title="'+(g._pend?'Guardado en el teléfono':'Sincronizado')+'">'+(g._pend?'📱':'☁️')+'</i></span></button>'});
 if(last)h+='</div>';
 h+='<p class="warn">📱 = guardado en el teléfono, falta sincronizar · ☁️ = sincronizado con la hoja.</p>';
 body.innerHTML=h;gxBindFiltros();
 [].forEach.call(body.querySelectorAll('.gitem'),function(b){b.onclick=function(){gxEditar(b.dataset.id)}})}
function gxDivResumen(g){var d=g.division,n=d.personas.length;if(d.tipo==='montos')return 'montos: '+d.personas.map(function(p){return p+' '+gxM(d.montos[p]||0,g.moneda)}).join(', ');
 if(d.tipo==='todos')return 'todos por igual';return 'para '+d.personas.join(', ')}

/* ---------- gráficas (sin internet) ---------- */
function gxBarras(rows,o){o=o||{};var max=0;rows.forEach(function(r){max=Math.max(max,r.v)});if(!rows.length)return '<p class="gnota">Sin datos.</p>';
 return '<div class="gbars">'+rows.map(function(r){var pc=max?r.v/max*100:0;return '<div class="gbar-r"><span class="gbar-l">'+esc(r.l)+'</span><span class="gbar-t"><i style="width:'+pc.toFixed(1)+'%;background:'+(r.c||'var(--orange)')+'"></i></span><span class="gbar-v"><b>'+gxCOP(r.v)+'</b><small>'+gxUSD(r.v/gx.tasa)+'</small></span></div>'}).join('')+'</div>'}
function gxDona(rows,usd){var tot=0;rows.forEach(function(r){tot+=r.v});if(!tot)return '<p class="gnota">Sin datos.</p>';
 var R=15.915,acc=0,s='<svg viewBox="0 0 42 42" class="gdona" role="img" aria-label="Gastos por categoría"><circle cx="21" cy="21" r="'+R+'" fill="none" stroke="var(--sky-2)" stroke-width="6"></circle>';
 rows.forEach(function(r){var p=r.v/tot*100;s+='<circle cx="21" cy="21" r="'+R+'" fill="none" stroke="'+r.c+'" stroke-width="6" stroke-dasharray="'+p.toFixed(3)+' '+(100-p).toFixed(3)+'" stroke-dashoffset="'+(25-acc).toFixed(3)+'"><title>'+esc(r.l)+': '+Math.round(p)+'%</title></circle>';acc+=p});
 s+='<text x="21" y="20" class="gdona-t">'+esc(gxCOP(tot))+'</text><text x="21" y="25" class="gdona-s">'+esc(gxUSD(usd==null?tot/gx.tasa:usd))+'</text></svg>';
 return '<div class="gdonawrap">'+s+'<ul class="gley">'+rows.map(function(r){return '<li><i style="background:'+r.c+'"></i><span>'+esc(r.l)+'</span><b>'+Math.round(r.v/tot*100)+'%</b><small>'+gxCOP(r.v)+'</small></li>'}).join('')+'</ul></div>'}
function gxAgrupar(L,fn){var o={};L.forEach(function(g){var k=fn(g);o[k]=(o[k]||0)+gxCop(g)});return Object.keys(o).map(function(k){return {l:k,v:o[k]}}).sort(function(a,b){return b.v-a.v})}

/* ---------- reportes ---------- */
function gxVistaReportes(body){var L=gxFiltrados(),cop=0,usd=0,dias={};L.forEach(function(g){cop+=gxCop(g);usd+=gxUsd(g);dias[g.fecha]=1});var nd=Object.keys(dias).length;
 var h=gxFiltrosHTML();
 h+='<div class="grid4 gtot"><div class="stat o"><small>Total en pesos</small><b>'+gxCOP(cop)+'</b></div><div class="stat"><small>Total en dólares</small><b>'+gxUSD(usd)+'</b></div><div class="stat"><small>Gastos</small><b>'+L.length+'</b></div><div class="stat"><small>Promedio por día con gastos</small><b>'+gxCOP(nd?cop/nd:0)+'</b></div></div>';
 if(!L.length){body.innerHTML=h+'<div class="card"><p class="lead" style="margin:0">Todavía no hay gastos para mostrar.</p></div>';gxBindFiltros();return}
 var cats=gxAgrupar(L,function(g){return g.categoria}).map(function(r){r.c=gxColor(r.l);return r});
 h+='<div class="card"><h3 class="gh3">Por categoría</h3>'+gxDona(cats,usd)+'</div>';
 h+='<div class="card"><h3 class="gh3">Categoría y subcategoría</h3><div class="tw"><table class="bt"><tr><th>Categoría</th><th>COP</th><th>USD</th></tr>';
 cats.forEach(function(c){h+='<tr class="t"><td>'+gxCat(c.l).e+' '+esc(c.l)+'</td><td>'+gxCOP(c.v)+'</td><td>'+gxUSD(c.v/gx.tasa)+'</td></tr>';
  var sub=gxAgrupar(L.filter(function(g){return g.categoria===c.l}),function(g){return g.subcategoria||'(sin subcategoría)'});
  if(sub.length>1||sub[0].l!=='(sin subcategoría)')sub.forEach(function(s){h+='<tr><td style="padding-left:22px">'+esc(s.l)+'</td><td>'+gxCOP(s.v)+'</td><td>'+gxUSD(s.v/gx.tasa)+'</td></tr>'})});
 h+='</table></div><p class="gnota">USD calculado con la tasa de hoy ('+gxCOP(gx.tasa)+'). Los totales de arriba usan la tasa de cada gasto.</p></div>';
 h+='<div class="grid2"><div class="card"><h3 class="gh3">Por destino</h3>'+gxBarras(gxAgrupar(L,function(g){return g.destino}),{})+'</div>';
 h+='<div class="card"><h3 class="gh3">Por quién pagó</h3>'+gxBarras(gxAgrupar(L,function(g){return g.pagoPor}).map(function(r){r.c='var(--ink)';return r}))+'</div></div>';
 var porDia=gxAgrupar(L,function(g){return g.fecha}).sort(function(a,b){return a.l<b.l?-1:1}).map(function(r){r.l=gxDiaTxt(r.l);r.c='var(--snow)';return r});
 h+='<div class="card"><h3 class="gh3">Por día</h3>'+gxBarras(porDia)+'</div>';
 h+=gxPresupuestoHTML(L);
 h+='<div class="card"><h3 class="gh3">Exportar</h3><p class="gnota">Con los filtros actuales. El CSV abre en Excel y Google Sheets.</p><div class="row"><button class="btn pri" id="gxCsv">⬇️ CSV</button><button class="btn" id="gxJson">⬇️ JSON (respaldo)</button></div></div>';
 body.innerHTML=h;gxBindFiltros();
 document.getElementById('gxCsv').onclick=function(){gxExportarCSV(L)};document.getElementById('gxJson').onclick=function(){gxExportarJSON(L)}}

/* comparación con el presupuesto planeado (BUDGET de la guía) */
function gxCatPlan(i){if(i.cat==='Desayuno'||i.cat==='Almuerzo'||i.cat==='Cena')return 'Alimentación';if(i.cat==='Transporte')return 'Transporte';
 if(i.t==='room'||/hostal/i.test(i.label))return 'Alojamiento';if(/snack|caf[eé]|agua|mercado|s[aá]ndwich|merienda/i.test(i.label))return 'Alimentación';if(/equipaje/i.test(i.label))return 'Transporte';return 'Entradas y tours'}
function gxPresupuestoHTML(L){var pc={},pd={},rc={},rd={};
 items().forEach(function(i){var v=cost(i,g)*(i.cur==='USD'?RATE:1),c=gxCatPlan(i),d=i.city==='snow'?'ny':i.city;pc[c]=(pc[c]||0)+v;pd[d]=(pd[d]||0)+v});
 L.forEach(function(x){var v=gxCop(x),d=GX_DEST_CITY[x.destino]||'otro';rc[x.categoria]=(rc[x.categoria]||0)+v;rd[d]=(rd[d]||0)+v});
 function fila(l,p,r){var pct=p?r/p*100:0,cl=!p?'':pct>100?' over':pct>85?' warn':'';
  return '<div class="gpres'+cl+'"><div class="gpres-h"><b>'+esc(l)+'</b><span>'+gxCOP(r)+' de '+(p?gxCOP(p):'—')+(p?' · <b>'+Math.round(pct)+'%</b>':'')+'</span></div>'+(p?'<span class="gbar-t"><i style="width:'+Math.min(100,pct).toFixed(1)+'%"></i></span>':'<small>Sin presupuesto planeado</small>')+'</div>'}
 var cats=Object.keys(pc).concat(Object.keys(rc).filter(function(k){return !(k in pc)}));
 var h='<div class="card"><h3 class="gh3">Real vs. presupuesto planeado</h3><p class="gnota">Plan de la guía para <b>'+g+' persona'+(g>1?'s':'')+'</b> (cámbialo arriba en “Personas”). El plan no incluye vuelos, compras, regalos ni comidas en casa.'+(gx.filtro.desde||gx.filtro.hasta||gx.filtro.destino||gx.filtro.cat||gx.filtro.persona?' <b>Ojo: los filtros activos reducen lo real.</b>':'')+'</p><div class="grid2"><div><h4 class="gh4">Por categoría</h4>';
 cats.forEach(function(c){h+=fila(gxCat(c).e+' '+c,pc[c]||0,rc[c]||0)});
 h+='</div><div><h4 class="gh4">Por destino</h4>';
 ['col','arl','dc','ny','bal','phi','del'].forEach(function(d){if(pd[d]||rd[d])h+=fila(d==='col'?'Colombia y tránsito':CITYNAME[d],pd[d]||0,rd[d]||0)});
 if(rd.otro)h+=fila('Otro',0,rd.otro);
 return h+'</div></div></div>'}

/* ---------- cuentas claras ---------- */
function gxCuentas(L){var pagó={},toca={};function add(o,p,v){o[p]=(o[p]||0)+v}
 L.forEach(function(x){var v=gxCop(x),d=x.division;
  if(x.pagoPor===GX_ENTRE){var pe=x.pagoEntre.length?x.pagoEntre:(d.personas.length?d.personas:gxPersonas());pe.forEach(function(p){add(pagó,p,v/pe.length)})}else add(pagó,x.pagoPor,v);
  if(d.tipo==='montos'){var s=0;d.personas.forEach(function(p){s+=+d.montos[p]||0});d.personas.forEach(function(p){add(toca,p,s?v*(+d.montos[p]||0)/s:0)})}
  else{var ps=d.personas.length?d.personas:gxPersonas();ps.forEach(function(p){add(toca,p,v/ps.length)})}});
 var nombres={};Object.keys(pagó).concat(Object.keys(toca)).forEach(function(p){nombres[p]=1});
 var filas=Object.keys(nombres).map(function(p){return {p:p,pagó:pagó[p]||0,toca:toca[p]||0,saldo:(pagó[p]||0)-(toca[p]||0)}});
 // mínimo de transferencias: el que más debe le paga al que más le deben
 var deben=filas.filter(function(f){return f.saldo<-0.5}).map(function(f){return {p:f.p,v:-f.saldo}}),reciben=filas.filter(function(f){return f.saldo>0.5}).map(function(f){return {p:f.p,v:f.saldo}}),tr=[];
 while(deben.length&&reciben.length){deben.sort(function(a,b){return b.v-a.v});reciben.sort(function(a,b){return b.v-a.v});var a=deben[0],b=reciben[0],m=Math.min(a.v,b.v);
  tr.push({de:a.p,a:b.p,v:m});a.v-=m;b.v-=m;if(a.v<0.5)deben.shift();if(b.v<0.5)reciben.shift()}
 return {filas:filas.sort(function(a,b){return b.saldo-a.saldo}),tr:tr}}
function gxVistaCuentas(body){var L=gxFiltrados(),c=gxCuentas(L);
 var h=gxFiltrosHTML()+'<div class="card"><h3 class="gh3">Quién pagó y cuánto le correspondía</h3>';
 if(!L.length){body.innerHTML=h+'<p class="lead" style="margin:0">Todavía no hay gastos.</p></div>';gxBindFiltros();return}
 h+='<div class="tw"><table class="bt"><tr><th>Persona</th><th>Pagó</th><th>Le tocaba</th><th>Saldo</th></tr>'+c.filas.map(function(f){return '<tr><td><b>'+esc(f.p)+'</b></td><td>'+gxCOP(f.pagó)+'</td><td>'+gxCOP(f.toca)+'</td><td class="'+(f.saldo>0.5?'gpos':f.saldo<-0.5?'gneg':'')+'">'+(f.saldo>0.5?'+':'')+gxCOP(f.saldo)+'<br><small>'+gxUSD(f.saldo/gx.tasa)+'</small></td></tr>'}).join('')+'</table></div>';
 h+='<p class="gnota">Saldo positivo: le deben. Negativo: debe. Todo se calcula en pesos con la tasa guardada en cada gasto; los dólares son con la tasa de hoy ('+gxCOP(gx.tasa)+').</p></div>';
 h+='<div class="card"><h3 class="gh3">Para quedar a paz y salvo</h3>'+(c.tr.length?'<ul class="gtr">'+c.tr.map(function(t){return '<li><b>'+esc(t.de)+'</b> le paga a <b>'+esc(t.a)+'</b><span><b>'+gxCOP(t.v)+'</b><small>'+gxUSD(t.v/gx.tasa)+'</small></span></li>'}).join('')+'</ul><p class="gnota">'+c.tr.length+' transferencia'+(c.tr.length>1?'s':'')+' en total: el mínimo posible para dejar todo en cero.</p>':'<p class="lead" style="margin:0">✓ Todos están a paz y salvo.</p>')+'</div>';
 body.innerHTML=h;gxBindFiltros()}

/* ---------- ajustes ---------- */
function gxVistaAjustes(body){var pers=gxPersonas(),pend=gx.items.filter(function(x){return x._pend}).length;
 var h='<div class="card"><h3 class="gh3">👥 Personas del viaje</h3><p class="gnota">Aparecen en “¿Quién pagó?” y en la división. Se comparten con todos los teléfonos conectados.</p><div id="gxPers">'+
  pers.map(function(p,i){return '<div class="gper"><input class="gin" data-pi="'+i+'" value="'+esc(p)+'" aria-label="Nombre"><button class="btn" data-pdel="'+i+'" aria-label="Quitar">✕</button></div>'}).join('')+
  '</div><div class="gper"><input class="gin" id="gxPerNueva" placeholder="Nombre (ej.: Juan)" enterkeyhint="done"><button class="btn or" id="gxPerAdd">Agregar</button></div><div class="row mt"><button class="btn pri" id="gxPerSave">Guardar nombres</button></div></div>';
 h+='<div class="card"><h3 class="gh3">🏷️ Categorías</h3><p class="gnota">Toca ＋ para agregar subcategorías. Las nuevas también se pueden crear desde el formulario.</p>'+gxCats().map(function(c){return '<div class="gcatrow"><b>'+c.e+' '+esc(c.n)+'</b><div class="gchips">'+c.s.map(function(s){return '<span class="pill">'+esc(s)+'</span>'}).join('')+'<button class="chip sm add" data-addsub="'+esc(c.n)+'">＋</button></div></div>'}).join('')+'<div class="row mt"><button class="btn" id="gxAddCat">＋ Nueva categoría</button></div></div>';
 h+='<div class="card"><h3 class="gh3">💱 Tasa de cambio</h3><p class="gnota">Valor por defecto para gastos nuevos. Cada gasto guarda la tasa con la que se anotó.</p><div class="gper"><label class="gtasa">1 US$ = <input class="gin" id="gxTasaDef" inputmode="numeric" value="'+esc(gx.tasa)+'"> COP</label><button class="btn" id="gxTasaSave">Guardar</button></div></div>';
 h+='<div class="card"><h3 class="gh3">💾 Respaldo</h3><p class="gnota">Exporta todo (sin filtros) o restaura desde un archivo JSON. Lo importado se suma: no borra nada.</p><div class="row"><button class="btn pri" id="gxCsvAll">⬇️ CSV</button><button class="btn" id="gxJsonAll">⬇️ JSON</button><label class="btn">⬆️ Importar JSON<input type="file" id="gxImport" accept=".json,application/json" hidden></label></div></div>';
 h+='<div class="card"><h3 class="gh3">☁️ Conexión</h3><p class="gnota">Conectado a la hoja privada.'+(gx.sync.cuando?' Última sincronización: '+gxDesde(gx.sync.cuando)+'.':'')+(pend?' <b>'+pend+' gasto'+(pend>1?'s':'')+' por sincronizar.</b>':'')+'</p><div class="row"><button class="btn pri" id="gxSyncNow">🔄 Sincronizar ahora</button><button class="btn" id="gxLink">🔗 Link para otro teléfono</button><button class="btn gdel" id="gxSalir">Desconectar este dispositivo</button></div><p class="gnota">El link para otro teléfono lleva el enlace del script, pero <b>no la clave</b>: mándala en un mensaje aparte.</p></div>';
 body.innerHTML=h;
 function leerNombres(){var a=[];[].forEach.call(body.querySelectorAll('[data-pi]'),function(i){var v=i.value.trim();if(v&&a.indexOf(v)<0&&v!==GX_ENTRE)a.push(v)});return a}
 function guardarNombres(nuevos,msg){var viejos=gxPersonas(),ren={};
  viejos.forEach(function(v,i){var inp=body.querySelector('[data-pi="'+i+'"]');if(inp&&inp.value.trim()&&inp.value.trim()!==v)ren[v]=inp.value.trim()});
  gx.cfg.personas=nuevos;var cambios=[];
  if(Object.keys(ren).length)gxActivos().forEach(function(x){var c=false,r=function(p){if(ren[p]){c=true;return ren[p]}return p};
   x.pagoPor=r(x.pagoPor);x.pagoEntre=x.pagoEntre.map(r);x.division.personas=x.division.personas.map(r);var m={};Object.keys(x.division.montos).forEach(function(p){m[r(p)]=x.division.montos[p]});x.division.montos=m;
   if(c){x.modificado=Math.max(Date.now(),x.modificado+1);x._pend=1;cambios.push(x)}});
  gx.b=null;gxPut(cambios).then(gxGuardarCfg).then(function(){toast(msg||'Nombres guardados');gxPintar()})}
 document.getElementById('gxPerAdd').onclick=function(){var v=document.getElementById('gxPerNueva').value.trim();if(!v)return;var a=leerNombres();if(a.indexOf(v)>-1||v===GX_ENTRE){toast('Ese nombre ya está');return}a.push(v);guardarNombres(a,v+' agregado')};
 document.getElementById('gxPerNueva').onkeydown=function(e){if(e.key==='Enter')document.getElementById('gxPerAdd').click()};
 document.getElementById('gxPerSave').onclick=function(){guardarNombres(leerNombres())};
 [].forEach.call(body.querySelectorAll('[data-pdel]'),function(b){b.onclick=function(){var p=gxPersonas()[+b.dataset.pdel],usado=gxActivos().some(function(x){return x.pagoPor===p||x.division.personas.indexOf(p)>-1});
  if(!confirm(usado?p+' aparece en gastos ya anotados. Si lo quitas, esos gastos se quedan igual pero ya no podrás escogerlo. ¿Quitar?':'¿Quitar a '+p+'?'))return;
  gx.cfg.personas=gxPersonas().filter(function(x){return x!==p});gx.b=null;gxGuardarCfg().then(function(){gxPintar()})}});
 [].forEach.call(body.querySelectorAll('[data-addsub]'),function(b){b.onclick=function(){var c=b.dataset.addsub,n=(prompt('Nueva subcategoría para '+c+':')||'').trim();if(!n)return;
  if(gxCat(c).s.some(function(s){return s.toLowerCase()===n.toLowerCase()})){toast('Ya existe');return}var se=gx.cfg.subsExtra||(gx.cfg.subsExtra={});se[c]=(se[c]||[]).concat([n]);gxGuardarCfg().then(function(){gxPintar()})}});
 document.getElementById('gxAddCat').onclick=function(){var n=(prompt('Nombre de la nueva categoría:')||'').trim();if(!n)return;if(gxCats().some(function(c){return c.n.toLowerCase()===n.toLowerCase()})){toast('Esa categoría ya existe');return}
  var e=(prompt('Un emoji para "'+n+'" (opcional):','🏷️')||'🏷️').trim().slice(0,4);gx.cfg.catsExtra=(gx.cfg.catsExtra||[]).concat([{n:n,e:e,s:[]}]);gxGuardarCfg().then(function(){gxPintar()})};
 document.getElementById('gxTasaSave').onclick=function(){var t=gxNum(document.getElementById('gxTasaDef').value,'COP');if(!(t>0)){toast('Escribe una tasa válida');return}gx.tasa=t;if(gx.b)gx.b.tasa=t;gxKv('tasa',t).then(function(){toast('Tasa guardada: '+gxCOP(t))})};
 document.getElementById('gxCsvAll').onclick=function(){gxExportarCSV(gxActivos())};document.getElementById('gxJsonAll').onclick=function(){gxExportarJSON(gx.items)};
 document.getElementById('gxImport').onchange=function(e){var f=e.target.files[0];if(f)gxImportar(f);e.target.value=''};
 document.getElementById('gxSyncNow').onclick=function(){gxSync().then(function(){toast(gx.sync.estado==='ok'?'Sincronizado ☁️':gx.sync.estado==='offline'?'Sin internet: se sincroniza al volver la conexión':gx.sync.error)})};
 document.getElementById('gxLink').onclick=function(){var u=location.origin+location.pathname+'#conectar='+encodeURIComponent(gx.conn.url);
  if(navigator.share)navigator.share({title:'Gastos del viaje',text:'Abre este link para conectar los gastos (la clave te la mando aparte):',url:u}).catch(function(){});
  else if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){toast('Link copiado')},function(){prompt('Copia este link:',u)});else prompt('Copia este link:',u)};
 document.getElementById('gxSalir').onclick=function(){var p=gx.items.filter(function(x){return x._pend}).length;
  if(!confirm((p?'¡Atención! Hay '+p+' gasto(s) sin sincronizar que se perderán. ':'')+'Se borrarán los gastos de ESTE dispositivo (en la hoja quedan guardados). ¿Desconectar?'))return;
  gxTx('gastos','readwrite',function(s){return s.clear()}).then(function(){return gxTx('kv','readwrite',function(s){return s.clear()})}).then(function(){
   gx.items=[];gx.conn=null;gx.cfg=gxCfgNormal({});gx.cfgPend=false;gx.b=null;gx.edit=null;gx.vista='nuevo';gx.sync={estado:'',cuando:0,error:''};toast('Dispositivo desconectado');renderGastos()})}}

/* ---------- exportar / importar ---------- */
function gxDescargar(nombre,tipo,contenido){var blob=new Blob([contenido],{type:tipo});
 try{var file=new File([blob],nombre,{type:tipo});if(navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Android|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){navigator.share({files:[file],title:nombre}).catch(function(){});return}}catch(e){}
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nombre;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
function gxCsvCampo(v){v=v==null?'':String(v);if(/^[=+\-@]/.test(v))v="'"+v;return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function gxDec(v,d){return (Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d).replace('.',',')}
function gxExportarCSV(L){var cab=['Fecha','Día del viaje','Destino','Categoría','Subcategoría','Descripción','Regalo para','Regalo (qué)','Monto','Moneda','Tasa (COP por US$)','Valor COP','Valor USD','Pagó','Dividido entre','Tipo de división','Detalle de montos','Método de pago','Notas','ID'];
 var filas=L.slice().sort(function(a,b){return a.fecha<b.fecha?-1:a.fecha>b.fecha?1:a.creado-b.creado}).map(function(g){var d=g.division;
  return [g.fecha,g.dia>=1&&g.dia<=GX_DIAS?g.dia:'',g.destino,g.categoria,g.subcategoria,g.descripcion,g.regaloPara,g.regaloQue,gxDec(g.monto,g.moneda==='USD'?2:0),g.moneda,gxDec(g.tasa,0),gxDec(gxCop(g),0),gxDec(gxUsd(g),2),
   g.pagoPor===GX_ENTRE?GX_ENTRE+' ('+g.pagoEntre.join(', ')+')':g.pagoPor,d.personas.join(', '),{todos:'Todos por igual',algunos:'Solo algunos',montos:'Montos personalizados'}[d.tipo],
   d.tipo==='montos'?d.personas.map(function(p){return p+': '+gxDec(d.montos[p]||0,g.moneda==='USD'?2:0)}).join(' · '):'',g.metodo,g.notas,g.id].map(gxCsvCampo).join(';')});
 gxDescargar('gastos-viaje-'+gxHoy()+'.csv','text/csv;charset=utf-8','﻿'+cab.join(';')+'\r\n'+filas.join('\r\n')+'\r\n');toast(L.length+' gastos exportados')}
function gxExportarJSON(L){gxDescargar('gastos-viaje-'+gxHoy()+'.json','application/json',JSON.stringify({app:'guia-usa-2026',tipo:'gastos',version:1,exportado:new Date().toISOString(),config:gx.cfg,gastos:L.map(gxLimpio)},null,1));toast('Respaldo JSON listo')}
function gxImportar(file){var r=new FileReader();r.onload=function(){var j;try{j=JSON.parse(r.result)}catch(e){toast('El archivo no es un JSON válido');return}
 var arr=Array.isArray(j)?j:j.gastos;if(!Array.isArray(arr)){toast('No encontré gastos en el archivo');return}
 var map={},cambios=[];gx.items.forEach(function(x){map[x.id]=x});
 arr.forEach(function(x){if(!x||!x.id||!x.fecha)return;var g=gxNormal(x),l=map[g.id];if(!l||g.modificado>l.modificado){g.modificado=Math.max(g.modificado,Date.now());g._pend=1;map[g.id]=g;cambios.push(g)}});
 if(j.config&&!gxPersonas().length&&Array.isArray(j.config.personas)){gx.cfg=gxCfgNormal(j.config);gxGuardarCfg()}
 gxPut(cambios).then(function(){gx.items=Object.keys(map).map(function(k){return map[k]});toast(cambios.length?cambios.length+' gastos importados':'Nada nuevo para importar');gxPintar();gxProgramarSync(500)})};
 r.readAsText(file)}

/* ---------- enlaces de entrada: ?tab=gastos y #conectar=… ---------- */
(function(){var m=/[#&]conectar=([^&]+)/.exec(location.hash);if(m){try{gx.urlPendiente=decodeURIComponent(m[1])}catch(e){}history.replaceState(null,'',location.pathname+location.search)}})();
function gxTabInicial(){var t=(/[?&]tab=(\w+)/.exec(location.search)||[])[1];if(gx.urlPendiente)return 'gastos';return ['dias','mapa','gastos','comer','ingles','fotos','gratis'].indexOf(t)>-1?t:''}
