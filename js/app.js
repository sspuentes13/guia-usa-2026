/* JD & Santi On Tour · lógica principal */
var TILES={}; /*__TILES__*/

var g=2,tab='inicio',daysMode='res',energy='media',snowOn=false,added={},cur='',activeId=null,filter='todo',imgCache={},photosBlocked=false;
try{var sv=JSON.parse(localStorage.getItem('guiaUSA')||'{}');if(sv.g)g=sv.g;if(sv.daysMode)daysMode=sv.daysMode;if(sv.energy)energy=sv.energy;if(sv.added)added=sv.added;if(sv.snowOn)snowOn=sv.snowOn}catch(e){}
function save(){try{localStorage.setItem('guiaUSA',JSON.stringify({g:g,daysMode:daysMode,energy:energy,added:added,snowOn:snowOn}))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cost(i,n){return i.t==='pp'?i.v*n:(i.t==='car'?i.v:i.v*Math.ceil(n/2))}
function fmt(v,cur){v=Math.round(v);return cur==='USD'?'US$'+v.toLocaleString('en-US'):'$'+v.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function toast(t){var e=document.getElementById('toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('on')},1800)}
var IMP_PROPINA=0.15; /* comidas: impuesto ~6–10 % + propina opcional en mostrador; con mesero, 15–20 % */
function extraItems(){var r=[],ks={};Object.keys(added).forEach(function(k){ks[k]=1});P.forEach(function(p,i){if(!p.core&&p.e&&diasDe(p).length)ks[i]=1});Object.keys(ks).forEach(function(k){var p=P[+k];if(p&&p.e)r.push({city:p.c,cat:'Entradas y otros',label:p.n,v:p.e,cur:'USD',t:'pp'})});var ip={};BUDGET.forEach(function(i){if(i.cur==='USD'&&i.v&&/Desayuno|Almuerzo|Cena/.test(i.cat)){var k=i.city+'|'+i.cat;ip[k]=(ip[k]||0)+i.v*IMP_PROPINA}});Object.keys(ip).forEach(function(k){var s=k.split('|');r.push({city:s[0],cat:s[1],label:'Impuestos y propina (~'+Math.round(IMP_PROPINA*100)+' %)',v:Math.round(ip[k]*100)/100,cur:'USD',t:'pp'})});
 if(snowOn)r.push({city:'ny',cat:'Entradas y otros',label:'Big SNOW',v:40,cur:'USD',t:'pp'},{city:'ny',cat:'Transporte',label:'Bus 355',v:16,cur:'USD',t:'pp'});return r}
function items(){return BUDGET.concat(extraItems())}
function totals(n){var o={USD:0,COP:0};items().forEach(function(i){o[i.cur]+=cost(i,n)});o.all=o.COP+o.USD*RATE;return o}
function catTotals(n){var o={};items().forEach(function(i){var k=i.cat;o[k]=o[k]||{USD:0,COP:0};o[k][i.cur]+=cost(i,n)});return o}
function cityTotals(id){var o={USD:0,COP:0};items().forEach(function(i){if(i.city===id)o[i.cur]+=cost(i,g)});return o}
function both(o){var r=[];if(o.USD)r.push(fmt(o.USD,'USD'));if(o.COP)r.push(fmt(o.COP,'COP'));return r.join(' + ')||'$0'}
function dayCost(d){var o={USD:0,COP:0};d.items.forEach(function(i){o[i.cur]+=cost(i,g)});return both(o)}
function totBar(){var t=totals(g);return '<div class="tot"><div><small>Total del viaje para '+g+'</small><b>'+fmt(t.all,'COP')+'</b></div><div><small>En dólares</small><b>'+fmt(t.USD,'USD')+'</b></div><div><small>En pesos</small><b>'+fmt(t.COP,'COP')+'</b></div><div><small>Cada uno</small><b>'+fmt(t.all/g,'COP')+'</b></div></div>'}

/* ---------- INICIO ---------- */
function renderInicio(){
 var start=new Date('2026-10-30T20:30:00-05:00'),now=new Date(),ms=start-now,dd=Math.max(0,Math.floor(ms/864e5)),hh=Math.max(0,Math.floor(ms%864e5/36e5));
 var t=totals(g),ct=catTotals(g);
 var h='<div class="hero"><span class="pl">✈</span><span class="pill o">JD &amp; Santi On Tour · 2026</span><h2>Washington, Nueva York y más, a su manera.</h2><p>Un plan listo para seguir al pie de la letra, con horarios verificados. Si algo cambia, muevan un día o un lugar y todo se reajusta solo: rutas, horas, reservas y lo que toca hoy.</p>'+
 '<div class="cd"><div><b>'+dd+'</b><small>días</small></div><div><b>'+hh+'</b><small>horas</small></div><div><b>'+P.filter(function(p){return p.c!=='col'}).length+'</b><small>lugares</small></div><div><b>'+FREE.filter(function(f){return f.st!=='no'}).length+'</b><small>gratis</small></div></div></div>';
 h+='<div class="card paraTi hoy" id="hoyCard"></div>';
 h+='<div class="card paraTi" id="paraTi"></div>';
 h+='<div class="card" id="reservasCard"></div>';
 h+='<div class="card" id="prepCard"></div><div class="card" id="guiaCard"></div>';
 h+='<div class="grid4"><div class="stat o"><small>Total para '+g+'</small><b>'+fmt(t.all,'COP')+'</b></div><div class="stat"><small>Cada persona</small><b>'+fmt(t.all/g,'COP')+'</b></div><div class="stat"><small>Gastos en EE. UU.</small><b>'+fmt(t.USD,'USD')+'</b></div><div class="stat"><small>Gastos en Colombia</small><b>'+fmt(t.COP,'COP')+'</b></div></div>';
 h+='<div class="card mt"><h3 style="margin:0 0 8px">Cómo usar la guía</h3><div class="grid2"><div class="box"><h4>🗓️ Días</h4>Cada día con su ruta ordenada por cercanía y la vista <b>📊 Análisis</b> para comparar km, costos e intensidad.</div><div class="box"><h4>🗺️ Mapa</h4>Tu ubicación en vivo, <b>🧭 Cómo llegar</b> a pie o en metro (línea, dirección, paradas y tarifa), <b>🏠 Volver a casa</b> y rutas de cada día. Funciona sin internet.</div><div class="box"><h4>🗣️ Inglés</h4>Más de 100 frases con voz normal o 🐢 lenta, práctica con 🎤 micrófono y simulacro de migración.</div><div class="box"><h4>📸 Fotos</h4>Poses para 1, 2, 3 y 4 personas y canciones para historias y publicaciones.</div><div class="box"><h4>💸 Gastos</h4>Anoten cada gasto en pesos o dólares, vean cuánto llevan y quién le debe a quién.</div><div class="box"><h4>📶 Sin internet</h4>Abran la guía una vez con wifi y toquen <b>Preparar para usar sin internet</b>.</div></div></div>';
 h+='<div class="card" id="offlineCard"></div>';
 h+='<div class="card"><h3 style="margin:0 0 4px">Presupuesto por categoría</h3><p class="lead" style="font-size:14px;margin:0 0 8px">Sin vuelos ni compras. Comidas en casa no suman; las de afuera incluyen ~15 % de impuestos y propina. Taxis y Uber se pagan por carro.</p><div class="tw"><table class="bt"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th></tr>';
 ['Desayuno','Almuerzo','Cena','Transporte','Entradas y otros'].forEach(function(c){h+='<tr><td>'+c+'</td>';[1,2,3,4].forEach(function(n){var o=catTotals(n)[c]||{USD:0,COP:0};h+='<td'+(n===g?' class="hl"':'')+'>'+fmt(o.COP+o.USD*RATE,'COP')+'</td>'});h+='</tr>'});
 h+='<tr class="t"><td>Total</td>';[1,2,3,4].forEach(function(n){h+='<td>'+fmt(totals(n).all,'COP')+'</td>'});h+='</tr><tr><td>Cada uno</td>';[1,2,3,4].forEach(function(n){h+='<td>'+fmt(totals(n).all/n,'COP')+'</td>'});h+='</tr></table></div><p class="warn">Dólares convertidos a $4.000 pesos aprox. Extras añadidos en el mapa: '+Object.keys(added).length+'. <label style="font-weight:700"><input type="checkbox" id="snowChk"'+(snowOn?' checked':'')+'> Sumar día de nieve en Big SNOW</label></p></div>';
 h+='<div class="card"><h3 style="margin:0 0 8px">Si van 2, 3 o 4</h3>'+GROUP.map(function(x){return '<div class="box mt"><h4>'+x[0]+'</h4>'+x[1]+'</div>'}).join('')+'</div>';
 var el=document.getElementById('v-inicio');el.innerHTML=h;renderOfflineCard(document.getElementById('offlineCard'));renderParaTi(document.getElementById('paraTi'));renderHoy(document.getElementById('hoyCard'));renderReservas(document.getElementById('reservasCard'));if(typeof renderPreparar==='function'){renderPreparar(document.getElementById('prepCard'));renderGuia(document.getElementById('guiaCard'))}else{['prepCard','guiaCard'].forEach(function(k){var e=document.getElementById(k);if(e)e.remove()})}
 document.getElementById('snowChk').onchange=function(e){snowOn=e.target.checked;save();renderInicio();toast(snowOn?'Nieve sumada al presupuesto':'Nieve quitada')};
}

/* ---------- DÍAS: ver js/vista-dias.js ---------- */

/* ---------- COMER: ver js/comer.js ---------- */

/* ---------- INGLÉS ---------- */
var voice=null;
function speak(t,btn,rate){if(!('speechSynthesis' in window)){toast('Este dispositivo no tiene voz disponible');return}
 speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=rate||.9;
 if(!voice){var vs=speechSynthesis.getVoices();voice=vs.filter(function(v){return /en-US/.test(v.lang)})[0]||null}if(voice)u.voice=voice;
 if(btn){btn.classList.add('on');u.onend=u.onerror=function(){btn.classList.remove('on')}}speechSynthesis.speak(u)}
function bindSay(id){[].forEach.call(document.getElementById(id).querySelectorAll('[data-say]'),function(b){b.onclick=function(e){e.stopPropagation();speak(b.dataset.say,b)}})}
/* renderIngles: ver js/ingles.js */

/* ---------- FOTOS ---------- */
function renderFotos(){
 var h='<h2 class="big">Fotos y música</h2><p class="lead">Spots para Instagram, poses para 1, 2, 3 y 4 personas, y la canción para cada historia o publicación.</p>';
 h+='<div class="card"><h3 style="margin:0 0 8px">🎵 Canciones</h3>'+SONGS.map(function(s){return '<div class="song"><span class="disc">♪</span><div><b>'+esc(s.t)+'</b><small>'+esc(s.a)+' · '+esc(s.u)+'</small></div><span class="pill">'+CITYNAME[s.c]+'</span></div>'}).join('')+'</div>';
 h+='<div class="card"><h3 style="margin:0 0 8px">🧍 Poses según cuántos son</h3><div class="tw"><table class="bt"><tr><th>Lugar</th><th style="text-align:left">1</th><th style="text-align:left">2</th><th style="text-align:left">3</th><th style="text-align:left">4</th></tr>'+POSES.map(function(r){return '<tr>'+r.map(function(c,i){return '<td style="text-align:left;white-space:normal;min-width:'+(i?150:100)+'px">'+(i?esc(c):'<b>'+esc(c)+'</b>')+'</td>'}).join('')+'</tr>'}).join('')+'</table></div><p class="warn">Para fotos de 3 o 4: trípode pequeño de celular y temporizador de 10 s, o pídanle el favor a alguien: “Could you take a picture of us, please?”</p></div>';
 ['dc','arl','ny','bal','phi','del','snow'].forEach(function(c){var ps=P.map(function(p,i){return [p,i]}).filter(function(x){return x[0].c===c&&x[0].ig});if(!ps.length)return;
  h+='<div class="card"><h3 style="margin:0 0 8px">📸 '+CITYNAME[c]+'</h3><div class="grid2">'+ps.map(function(x){return '<div class="spot"><b>'+esc(x[0].n)+'</b>'+(x[0].core?'':' <span class="pill o">Extra</span>')+'<small>'+esc(x[0].ig)+'</small><div class="row mt"><button class="btn" data-pl="'+x[1]+'">Ver en el mapa ›</button></div></div>'}).join('')+'</div></div>'});
 h+='<div class="card"><h3 style="margin:0 0 6px">✨ Trucos</h3><div class="grid2"><div class="box">Live Photo + "Exposición larga" en Grand Central y Times Square.</div><div class="box">Hora dorada: el sol se pone hacia las 4:50 p. m. en noviembre.</div><div class="box">Ráfaga (mantener el botón) para saltos y aviones.</div><div class="box">Graben 3 segundos de video en cada lugar: al final arman un reel con la canción.</div></div></div>';
 var el=document.getElementById('v-fotos');el.innerHTML=h;
 [].forEach.call(el.querySelectorAll('[data-pl]'),function(b){b.onclick=function(){go('mapa');showPlace(+b.dataset.pl)}});
}

/* ---------- GRATIS ---------- */
function cuandoGratis(f){var k=FREE.indexOf(f),r=null;P.forEach(function(p){if(FK[p.n]===k&&!r)r=RESERVAS.filter(function(x){return x.lugar===p.n})[0]||null});if(!r)return f.when;var x=filaReserva(r,new Date(),hechas());return x?(x.cuando||x.est):f.when}
function diaGratis(f){var k=FREE.indexOf(f),ns=[];P.forEach(function(p){if(FK[p.n]===k)diasDe(p).forEach(function(n){if(ns.indexOf(n)<0)ns.push(n)})});return ns.length?ns.sort(function(x,y){return x-y}).map(etiquetaDia).join(' y '):(f.day&&!/D[ií]a \d/.test(f.day)?f.day:'Cuando quieran')}
function renderGratis(){
 var lab={ok:['Gratis, sin reserva','g'],res:['Gratis con reserva','o'],no:['No aplica','r']};
 var h='<h2 class="big">Lo gratis y cómo reclamarlo</h2><p class="lead">Verificado en páginas oficiales. Los enlaces necesitan internet.</p>';
 h+='<div class="card"><h3 style="margin:0 0 8px">📅 Qué reservar y cuándo</h3><div class="tw"><table class="bt"><tr><th>Qué</th><th style="text-align:left">Cuándo reservar</th><th style="text-align:left">Para</th></tr>'+FREE.filter(function(f){return f.st==='res'}).map(function(f){return '<tr><td><a href="'+f.u+'" target="_blank" rel="noopener">'+esc(f.n)+' ↗</a></td><td style="text-align:left;white-space:normal">'+esc(cuandoGratis(f))+'</td><td style="text-align:left">'+esc(diaGratis(f))+'</td></tr>'}).join('')+'</table></div></div>';
 var last='';FREE.forEach(function(f){if(f.g!==last){if(last)h+='</ul></div>';h+='<div class="card"><h3 style="margin:0 0 8px">'+f.g+'</h3><ul class="free">';last=f.g}
  h+='<li><b>'+esc(f.n)+'</b> <span class="pill '+lab[f.st][1]+'">'+lab[f.st][0]+'</span><small>'+esc(f.s)+'</small><a class="btn" href="'+f.u+'" target="_blank" rel="noopener">Abrir página oficial ↗</a></li>'});
 h+='</ul></div>';
 document.getElementById('v-gratis').innerHTML=h;
}

/* ---------- MAPA ---------- */
var NS='http://www.w3.org/2000/svg',svg=null,vb={x:0,y:0,w:1000,h:760};
var EMO=[[/Wizards/,'🏀'],[/Capitals/,'🏒'],[/Rink|Patinaje|Hielo/,'⛸️'],[/Concierto/,'🎵'],[/Teatro|Theatre|Theater|GALA|Stage|Broadway/,'🎭'],[/Basílica|Misa|Iglesia|Shrine|Parroquia/,'⛪'],[/Aeropuerto|Dulles|El Dorado/,'✈️'],[/Terminal|Station|Estación|Penn/,'🚆'],[/Cementerio/,'🎖️'],[/Capitolio|Casa Blanca|Independence|City Hall/,'🏛️'],[/Museo|Gallery|Library|Biblioteca|Torpedo|Kennedy|Walters|Portrait/,'🖼️'],[/Zoo/,'🐼'],[/Catedral|Cathedral/,'⛪'],[/Puente|Bridge|DUMBO|Teleférico/,'🌉'],[/Ferry|Harbor|Wharf|Riverfront|Boathouse/,'⛴️'],[/Park|Island|Bethesda|Gravelly|Trail|High Line|Square|Circle/,'🌳'],[/Market|Chili|Pizza|Halal|Clarendon/,'🍔'],[/Mall|Fashion/,'🛍️'],[/Times Square|Rockefeller|Grand Central|Summit/,'🌆'],[/Rocky/,'🥊'],[/SNOW|Killington|Snowshoe|Shenandoah/,'❄️'],[/Fort/,'🏰'],[/Memorial|Monument|Monumento|Jefferson|Lincoln|Liberty|Toro|Iwo|Air Force|MLK|Carillon/,'🗽'],[/Old Town|Georgetown|Fells|Elfreth|Exorcista|Vernon|Magic/,'🏘️']];
function emo(p){for(var k=0;k<EMO.length;k++)if(EMO[k][0].test(p.n))return EMO[k][1];return '📍'}
function visible(p){if(dayFilter&&diasDe(p).indexOf(dayFilter)<0)return false;if(filter==='todo')return true;if(filter==='core')return p.core;if(filter==='extra')return !p.core;if(filter==='comer')return p.cat==='comer';if(filter==='foto')return !!p.ig;if(filter==='gratis')return FK[p.n]!==undefined||(!p.e&&p.cat!=='transporte');return true}
function el(n,a,par){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(par)par.appendChild(e);return e}
function numOf(i){return MAPS[P[i].c].pins.map(function(x){return x.i}).indexOf(i)+1}
/* Carga un script una sola vez (mapas por ciudad, Leaflet) */
var _scripts={};
function cargarScript(src){if(!_scripts[src])_scripts[src]=new Promise(function(ok,ko){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){delete _scripts[src];ko(new Error(src))};document.head.appendChild(s)});return _scripts[src]}
function pintarGeo(g,L){var f=document.createDocumentFragment(),add=function(n,a){f.appendChild(el(n,a))};
 add('path',{d:L.land,fill:'#FDFBF7',stroke:'#D9E6EE','vector-effect':'non-scaling-stroke'});
 if(L.land2)add('path',{d:L.land2,fill:'#FDFBF7',stroke:'#8CCBEB','vector-effect':'non-scaling-stroke'});
 if(L.hl)add('path',{d:L.hl,fill:'#FFF6EE',stroke:'#FF8A3D','stroke-width':2,'vector-effect':'non-scaling-stroke'});
 if(L.urban)add('path',{d:L.urban,fill:'#FFE9D9',opacity:.7});
 if(L.parks)add('path',{d:L.parks,fill:'#D7EEC8'});
 if(L.lakes)add('path',{d:L.lakes,fill:'#BFE4F7'});
 L.rivers.forEach(function(r){add('path',{d:r.d,fill:'none',stroke:'#BFE4F7','stroke-width':r.w,'stroke-linecap':'round','stroke-linejoin':'round'})});
 if(L.roads)add('path',{d:L.roads,fill:'none',stroke:'#FFC9A3','class':'rd'});
 if(L.borders)add('path',{d:L.borders,fill:'none',stroke:'#4A6A80',opacity:.55,'class':'bd'});
 g.appendChild(f)}
function drawMap(id){var m=MAPS[id],box=document.getElementById('map');box.innerHTML='';
 svg=el('svg',{viewBox:'0 0 1000 760',preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Mapa de '+CITYNAME[id],'data-id':id});box.appendChild(svg);
 el('rect',{x:-3000,y:-3000,width:7000,height:7000,fill:'#BFE4F7'},svg);
 var geo=el('g',{'class':'geo'},svg);
 if(m.L)pintarGeo(geo,m.L);
 else{box.classList.add('cargando');cargarScript('js/datos/geo/'+id+'.js').then(function(){box.classList.remove('cargando');if(svg&&svg.getAttribute('data-id')===id&&!geo.firstChild){pintarGeo(geo,m.L);setVB()}},function(){box.classList.remove('cargando')})}
 m.labels.forEach(function(l){var t=el('text',{x:l.x,y:l.y,'class':'lb k'+l.k,'data-k':l.k},svg);t.textContent=l.t});
 m.pins.forEach(function(p,j){var pl=P[p.i];var gr=el('g',{'class':'pn'+(pl.snow?' snow':'')+(pl.core?'':' x')+(visible(pl)?'':' hide'),'data-i':p.i,transform:'translate('+p.x+' '+p.y+')',tabindex:0,role:'button','aria-label':pl.n},svg);
  var c=el('circle',{cx:0,cy:0,r:15},gr);c.style.animationDelay=(j*30)+'ms';var tx=el('text',{x:0,y:0},gr);tx.textContent=pl.snow?'❄':j+1;
  gr.addEventListener('click',function(e){e.stopPropagation();showPlace(p.i)});gr.addEventListener('keydown',function(e){if(e.key==='Enter')showPlace(p.i)})});
 vb={x:0,y:0,w:1000,h:760};bindPan();refrescarRuta()}
function setVB(){if(!svg)return;svg.setAttribute('viewBox',vb.x+' '+vb.y+' '+vb.w+' '+vb.h);var s=vb.w/1000;
 [].forEach.call(svg.querySelectorAll('.pn'),function(p){p.firstChild.setAttribute('r',15*s);p.firstChild.setAttribute('stroke-width',3*s);p.lastChild.setAttribute('font-size',13*s)});
 [].forEach.call(svg.querySelectorAll('.lb'),function(l){var k=+l.dataset.k;l.setAttribute('font-size',(k===1?17:k===2?15:14)*s);l.setAttribute('stroke-width',4*s)});
 [].forEach.call(svg.querySelectorAll('.rd'),function(r){r.setAttribute('stroke-width',2.4*s)});
 [].forEach.call(svg.querySelectorAll('.route'),function(r){r.setAttribute('stroke-width',3*s);r.setAttribute('stroke-dasharray',(8*s)+' '+(8*s))});
 [].forEach.call(svg.querySelectorAll('.bd'),function(r){r.setAttribute('stroke-width',1.4*s);r.setAttribute('stroke-dasharray',(6*s)+' '+(5*s))});
 updScale()}
function updScale(){var m=MAPS[cur];if(!m||!svg||realOn)return;var r=svg.getBoundingClientRect();if(!r.width)return;var ppm=m.ppm*Math.min(r.width/vb.w,r.height/vb.h),target=110/ppm,d=50;[50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000].forEach(function(n){if(n<=target)d=n});document.getElementById('scaleB').style.width=Math.round(d*ppm)+'px';document.getElementById('scaleT').textContent=d>=1000?(d/1000)+' km':d+' m'}
function zoom(f,cx,cy){var nw=Math.min(1600,Math.max(60,vb.w*f)),k=nw/vb.w;if(cx===undefined){cx=vb.x+vb.w/2;cy=vb.y+vb.h/2}vb.x=cx-(cx-vb.x)*k;vb.y=cy-(cy-vb.y)*k;vb.w=nw;vb.h=nw*.76;setVB()}
function toSvg(e){var r=svg.getBoundingClientRect(),sc=Math.max(vb.w/r.width,vb.h/r.height),ox=(r.width*sc-vb.w)/2,oy=(r.height*sc-vb.h)/2;return {x:vb.x+(e.clientX-r.left)*sc-ox,y:vb.y+(e.clientY-r.top)*sc-oy}}
function bindPan(){var pts={},dist=0;
 svg.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('.pn'))return;svg.setPointerCapture(e.pointerId);pts[e.pointerId]=e;dist=0});
 svg.addEventListener('pointermove',function(e){if(!pts[e.pointerId])return;var ids=Object.keys(pts);
  if(ids.length===1){var p=toSvg(e),q=toSvg(pts[e.pointerId]);vb.x-=p.x-q.x;vb.y-=p.y-q.y;pts[e.pointerId]=e;setVB()}
  else if(ids.length===2){pts[e.pointerId]=e;var a=pts[ids[0]],b=pts[ids[1]],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(dist){var c=toSvg({clientX:(a.clientX+b.clientX)/2,clientY:(a.clientY+b.clientY)/2});zoom(dist/d,c.x,c.y)}dist=d}});
 function up(e){delete pts[e.pointerId];dist=0}svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
 svg.addEventListener('wheel',function(e){e.preventDefault();var c=toSvg(e);zoom(e.deltaY>0?1.15:.87,c.x,c.y)},{passive:false})}
function mark(i){if(svg)[].forEach.call(svg.querySelectorAll('.pn'),function(p){p.classList.toggle('act',+p.dataset.i===i);if(+p.dataset.i===i)svg.appendChild(p)});
 if(realOn)Object.keys(lmk).forEach(function(k){var e=lmk[k].getElement();if(e)e.firstChild.classList.toggle('act',+k===i)})}
function applyFilter(){if(svg)[].forEach.call(svg.querySelectorAll('.pn'),function(p){p.classList.toggle('hide',!visible(P[+p.dataset.i]))});
 if(realOn)Object.keys(lmk).forEach(function(k){var e=lmk[k].getElement();if(e)e.style.display=visible(P[+k])?'':'none'})}
function hav(a,b){var R=6371,t=Math.PI/180,dLa=(b[0]-a[0])*t,dLo=(b[1]-a[1])*t,x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*t)*Math.cos(b[0]*t)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.sqrt(x))}
function kmF(k){return k<1?Math.round(k*1000)+' m':k.toFixed(1).replace('.',',')+' km'}
function walk(k){var m=Math.round(k*1.25/4.8*60);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'}
function gmPlace(p){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.n+', '+CITYNAME[p.c])}
function gmDir(a,b){return 'https://www.google.com/maps/dir/?api=1&origin='+a.ll.join(',')+'&destination='+b.ll.join(',')+'&travelmode='+(hav(a.ll,b.ll)>2.5?'transit':'walking')}
function wikiImg(t,cb){if(imgCache[t]!==undefined)return cb(imgCache[t]);try{fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+t).then(function(r){return r.json()}).then(function(j){var s=j.thumbnail?j.thumbnail.source:null;imgCache[t]=s?s.replace(/\/\d+px-/,'/960px-'):null;cb(imgCache[t])}).catch(function(){photosBlocked=true;cb(null)})}catch(e){photosBlocked=true;cb(null)}}
var tourT=null;
function stopTour(){if(tourT){clearInterval(tourT);tourT=null}var b=document.getElementById('tour');if(b)b.innerHTML='▶<span class="lbl"> Recorrido</span>'}
function startTour(){stopTour();var ids=ordenActual().filter(function(i){return visible(P[i])});if(!ids.length)return;var k=0;showPlace(ids[0],true);document.getElementById('tour').innerHTML='❚❚<span class="lbl"> Pausa</span>';tourT=setInterval(function(){k++;if(k>=ids.length){stopTour();return}showPlace(ids[k],true)},4500)}
function showCity(id){activeId=null;
 if(dayFilter&&diasConLugares(id).indexOf(dayFilter)<0)dayFilter=null;
 [].forEach.call(document.querySelectorAll('#cityChips .chip'),function(b){b.classList.toggle('on',b.dataset.id===id)});
 if(cur!==id||!svg){cur=id;drawMap(id)}else{mark(-1);refrescarRuta()}
 pintarDias(id);
 if(realOn)fitCity(id);
 if(dayFilter)return panelDia();
 var c=CITIES.filter(function(x){return x.id===id})[0],ps=MAPS[id].pins.map(function(x){return P[x.i]}),ct=cityTotals(id),dias=diasConLugares(id);
 var core=ps.filter(function(p){return p.core}),tk=0;for(var q=1;q<core.length;q++)tk+=hav(core[q-1].ll,core[q].ll);
 var h='<div class="pad"><span class="pill o">'+esc(/^D[ií]as? \d/.test(c.day)&&dias.length?(dias.length>1?'Días '+dias.slice(0,-1).join(', ')+' y '+dias[dias.length-1]:'Día '+dias[0]):c.day)+'</span><h2>'+esc(c.name)+'</h2><p>'+esc(c.desc)+'</p>';
 if(id!=='snow')h+='<div class="facts"><div class="fact"><small>Presupuesto aquí ('+g+')</small><b>'+both(ct)+'</b></div><div class="fact"><small>Lugares · días</small><b>'+ps.length+' · '+(dias.length||'—')+'</b></div></div>';
 if(dias.length)h+='<div class="diasgrid">'+dias.map(function(n){var r=rutaDia(n),R=r.cerca,it=intensidad(r),d=r.dia;return '<button class="diabtn" data-dia="'+n+'"><b>Día '+n+' · '+fechaCorta(n)+'</b><small>'+esc(d?d.title:'')+'</small><span>'+it.e+' '+kmF(R.kmPie)+' a pie</span></button>'}).join('')+'</div>';
 h+='<div class="buscar"><input id="buscar" type="search" placeholder="🔎 Buscar en todo el viaje" autocomplete="off" aria-label="Buscar lugar"><button class="btn" id="cercaP" type="button">📍 Cerca de mí</button></div>';
 h+='<ul class="places" id="lista"></ul></div>';
 var pan=document.getElementById('panel');pan.innerHTML=h;pan.scrollTop=0;buscarLugares('');
 [].forEach.call(pan.querySelectorAll('[data-dia]'),function(b){b.onclick=function(){setDay(+b.dataset.dia)}});
 document.getElementById('buscar').oninput=function(e){buscarLugares(e.target.value)};
 document.getElementById('cercaP').onclick=cercaDeMi}
function showPlace(i,fromTour){if(!fromTour)stopTour();var p=P[i];activeId=i;
 if(tab!=='mapa')go('mapa');
 var quitarDia=dayFilter&&diasDe(p).indexOf(dayFilter)<0;if(quitarDia)dayFilter=null;
 if(cur!==p.c){cur=p.c;drawMap(p.c);[].forEach.call(document.querySelectorAll('#cityChips .chip'),function(b){b.classList.toggle('on',b.dataset.id===p.c)});pintarDias(p.c)}else if(quitarDia){refrescarRuta();pintarDias(p.c)}
 mark(i);
 var pins=MAPS[p.c].pins,pin=pins.filter(function(x){return x.i===i})[0];
 if(pin&&svg){var tw=Math.min(vb.w,520),sx=vb.x,sy=vb.y,sw=vb.w,tx=pin.x-tw*.5,ty=pin.y-tw*.38,t0=performance.now();(function st(now){var k=Math.min(1,(now-t0)/600),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;vb.x=sx+(tx-sx)*e;vb.y=sy+(ty-sy)*e;vb.w=sw+(tw-sw)*e;vb.h=vb.w*.76;setVB();if(k<1)requestAnimationFrame(st)})(t0)}
 if(realOn)lmap.flyTo(p.ll,p.snow?9:16,{duration:.8});
 var order=dayFilter?ordenActual():pins.map(function(x){return x.i}).filter(function(k){return P[k].core}),pos=order.indexOf(i),prev=pos>0?P[order[pos-1]]:null,dk=prev?hav(prev.ll,p.ll):0;
 var fr=FK[p.n]!==undefined?FREE[FK[p.n]]:null;
 var h='<div class="ph'+(p.snow?' s':'')+'"><div class="img" id="img"></div><button class="back" id="back">‹ '+esc(CITYNAME[p.c])+'</button><span class="nb">'+(p.snow?'❄':numero(i))+'</span><span class="em">'+emo(p)+'</span><small>'+(p.core?'En el plan':'Sugerido · opcional')+(dayFilter?' · Día '+dayFilter:'')+'</small></div><div class="pad">';
 h+='<span class="pill '+(p.core?'o':'s')+'">'+esc(etiquetaLugar(p))+'</span><h2>'+esc(p.n)+'</h2><p>'+esc(p.txt)+'</p><div id="warn"></div>';
 h+='<div id="estCerca" class="estcerca"></div><div id="horarioLugar"></div>';
 h+='<div class="facts"><div class="fact"><small>Entrada c/u</small><b>'+(p.e?fmt(p.e,'USD'):'Gratis')+'</b></div><div class="fact"><small>Para '+g+'</small><b>'+(p.e?fmt(p.e*g,'USD'):'Gratis')+'</b></div><div class="fact" style="grid-column:1/-1"><small>Cuándo ir</small><b>'+esc(p.h)+'</b></div>'+(prev&&!p.snow?'<div class="fact"><small>Desde '+esc(prev.n)+'</small><b>'+(dk<=RUTA_A_PIE_MAX?kmF(dk*1.25):kmF(dk))+'</b></div><div class="fact"><small>'+(dk<=RUTA_A_PIE_MAX?'🚶 A pie, aprox.':'🚇 Metro, tren o Uber')+'</small><b>'+(dk<=RUTA_A_PIE_MAX?walk(dk):'~'+durTxt(minTransporte(dk)))+'</b></div>':'')+'</div>';
 if(fr)h+='<div class="box '+(fr.st==='res'?'o':'')+'"><h4>🎟️ '+(fr.st==='res'?'Gratis con reserva':'Gratis')+'</h4>'+esc(fr.s)+'<div class="row mt"><a class="btn pri" href="'+fr.u+'" target="_blank" rel="noopener">Reservar / ver página oficial ↗</a></div></div>';
 if(p.ig)h+='<div class="box mt"><h4>📸 Foto para Instagram</h4>'+esc(p.ig)+'</div>';
 h+='<div class="row mt"><button class="btn or" id="irAqui">🧭 Cómo llegar</button>'+(p.c!=='col'&&p.cat!=='transporte'&&!p.snow?'<button class="btn" id="cambiarDia">📅 '+(diasDe(p).length?'Cambiar de día':'Agregar a un día')+'</button>':'')+(!p.core?'<button class="btn" id="add">'+(added[i]?'✓ En mi plan · quitar':'＋ Añadir a mi plan')+'</button>':'')+'<a class="btn pri" href="'+gmPlace(p)+'" target="_blank" rel="noopener">Google Maps: fotos ↗</a>'+(prev&&!p.snow?'<a class="btn" href="'+gmDir(prev,p)+'" target="_blank" rel="noopener">Cómo llegar ↗</a>':'')+'</div>';
 h+='<div class="row mt"><button class="btn" id="pv">‹ Anterior</button><button class="btn" id="nx">Siguiente ›</button></div></div>';
 var pan=document.getElementById('panel');pan.innerHTML=h;pan.scrollTop=0;
 var all=(dayFilter?ordenActual():pins.map(function(x){return x.i})).filter(function(k){return visible(P[k])}),ap=all.indexOf(i);
 document.getElementById('back').onclick=function(){stopTour();showCity(p.c);if(svg){vb={x:0,y:0,w:1000,h:760};setVB()}};
 document.getElementById('pv').onclick=function(){showPlace(all[(ap-1+all.length)%all.length])};
 document.getElementById('nx').onclick=function(){showPlace(all[(ap+1)%all.length])};
 document.getElementById('irAqui').onclick=function(){irA({ll:p.ll,n:p.n,i:i})};
 var cd=document.getElementById('cambiarDia');if(cd)cd.onclick=function(){var bs=bloquesDe(p),de=dayFilter&&diaDeN(dayFilter)&&bs.indexOf(diaDeN(dayFilter).id)>-1?diaDeN(dayFilter).id:bs[0]||null;elegirDiaLugar(i,de)};
 if(p.c!=='snow')trListo().then(function(){var e=document.getElementById('estCerca'),x=estacionDeLugar(p.ll);if(e&&activeId===i)e.innerHTML=x?'🚇 Metro más cercano: '+x.html:''});
 if(typeof horarioHTML==='function'){var hz=document.getElementById('horarioLugar');if(hz)hz.innerHTML=horarioHTML(i)}
 var ad=document.getElementById('add');if(ad)ad.onclick=function(){if(added[i])delete added[i];else added[i]=1;save();toast(added[i]?'Añadido a tu plan'+(p.e?' · +'+fmt(p.e*g,'USD'):''):'Quitado de tu plan');showPlace(i)};
 if(!fromTour)verPanel();
 wikiImg(p.w,function(u){if(activeId!==i)return;if(u){var im=new Image();im.crossOrigin='anonymous';im.onload=function(){var e=document.getElementById('img');if(e){e.style.backgroundImage='url("'+u+'")';e.classList.add('on')}};im.src=u}else if(photosBlocked){var w=document.getElementById('warn');if(w)w.innerHTML='<div class="warn">Sin internet no se cargan fotos. Toquen "Google Maps: fotos" cuando tengan conexión.</div>'}})}
/* satélite */
var realOn=false,lmap=null,lmk={},lroute=null,realTried=false;
function hasTiles(){for(var k in TILES)return true;return false}
function tileSrc(v){return (v.charAt(0)==='/'?'data:image/jpeg;base64,':'data:image/png;base64,')+v}
var SAT_URL='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',OSM_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png',satLabel='';
function setMode(label,real){var md=document.getElementById('mode');md.textContent=label;md.className='mode'+(real?' real':'')}
function makeLeaflet(label){var e=document.getElementById('lmap');e.style.display='block';realOn=true;satLabel=label;setMode(label+' ⇄',true);document.getElementById('scale').style.display='none';
 if(!lmap){lmap=L.map('lmap',{zoomControl:false,maxZoom:19}).setView([38.9,-77.03],12);L.control.scale({imperial:false,position:'bottomright'}).addTo(lmap);
 P.forEach(function(p,i){lmk[i]=L.marker(p.ll,{icon:iconoPin(i),title:p.n}).addTo(lmap).on('click',function(){showPlace(i)})});
 ubicIniciar(true);dibujarYo();dibujarCasa();capaEstaciones();lmap.on('dragstart',function(){if(seguir&&!NAV){seguir=false;var f=document.getElementById('fabYo');if(f)f.classList.remove('on')}})}
 lmap.invalidateSize();applyFilter();if(activeId!==null){mark(activeId);lmap.setView(P[activeId].ll,P[activeId].snow?9:16)}else fitCity(cur)}
/* Vuelve al mapa dibujado (SVG), que siempre funciona sin internet */
function showDrawn(){realOn=false;document.getElementById('lmap').style.display='none';document.getElementById('scale').style.display='';setMode('✏️ Mapa dibujado ⇄',false);if(activeId!==null)mark(activeId);updScale()}
function toggleMode(){stopTour();if(realOn)showDrawn();else if(lmap)makeLeaflet(satLabel);else{realTried=false;tryReal(true)}}
var Emb=window.L&&L.GridLayer?L.GridLayer.extend({createTile:function(c,done){var cv=document.createElement('canvas');cv.width=cv.height=256;var ctx=cv.getContext('2d'),z=c.z,x=c.x,y=c.y;
 for(var d=0;d<=8&&z-d>=0;d++){var k=(z-d)+'/'+(x>>d)+'/'+(y>>d);if(TILES[k]){var im=new Image();(function(dd){im.onload=function(){var s=256>>dd;ctx.drawImage(im,(x-((x>>dd)<<dd))*s,(y-((y>>dd)<<dd))*s,s,s,0,0,256,256);done(null,cv)}})(d);im.onerror=function(){done(null,cv)};im.src=tileSrc(TILES[k]);return cv}}
 ctx.fillStyle='#BFE4F7';ctx.fillRect(0,0,256,256);setTimeout(function(){done(null,cv)},0);return cv}}):null;
function startEmbedded(){realTried=true;makeLeaflet('🛰️ Satélite sin internet');new Emb({maxZoom:19,attribution:'Imágenes: USGS'}).addTo(lmap)}
/* Prueba si hay satélite: con internet o con los tiles guardados por "Preparar para usar sin internet" (el service worker los entrega desde la caché) */
function tryReal(manual){if(realTried||!window.L)return;realTried=true;var img=new Image(),late=false;img.crossOrigin='anonymous';
 var tm=setTimeout(function(){late=true;if(manual)toast('Sin internet y sin satélite guardado para esta zona')},4000);
 img.onerror=function(){clearTimeout(tm);if(manual&&!late)toast('Sin internet y sin satélite guardado para esta zona')};
 img.onload=function(){clearTimeout(tm);if(late)return;makeLeaflet(navigator.onLine?'🛰️ Satélite en línea':'🛰️ Satélite guardado');
 var sat=L.tileLayer(SAT_URL,{maxZoom:19,maxNativeZoom:19,crossOrigin:'anonymous',attribution:'© Esri'}).addTo(lmap),street=L.tileLayer(OSM_URL,{maxZoom:19,crossOrigin:'anonymous',attribution:'© OpenStreetMap'});
 L.control.layers({'Satélite':sat,'Calles':street},{},{position:'bottomleft'}).addTo(lmap)};
 img.src=SAT_URL.replace('{z}',12).replace('{y}',1567).replace('{x}',1170)}
function fitCity(id){if(!realOn||!id)return;if(lroute){lmap.removeLayer(lroute);lroute=null}if(legLayer){lmap.removeLayer(legLayer);legLayer=null}
 var ord=dayFilter?rutaActiva().orden:MAPS[id].pins.filter(function(x){return P[x.i].core}).map(function(x){return x.i});
 if(ord.length>1&&id!=='snow'){lroute=L.polyline(ord.map(function(i){return P[i].ll}),dayFilter?{color:'#FF8A3D',weight:5,opacity:.95}:{color:'#FF8A3D',weight:4,dashArray:'8 10'}).addTo(lmap);if(dayFilter)legLayer=etiquetasTramos(ord)}
 var sel=dayFilter?ordenActual().filter(function(i){return P[i].c===id}):MAPS[id].pins.map(function(x){return x.i});if(!sel.length)sel=MAPS[id].pins.map(function(x){return x.i});
 lmap.invalidateSize();lmap.flyToBounds(L.latLngBounds(sel.map(function(i){return P[i].ll})).pad(dayFilter?.25:.15),{duration:1,maxZoom:17})}
function initMap(){var cc=document.getElementById('cityChips'),fc=document.getElementById('filterChips');document.getElementById('map').classList.remove('cargando');
 CITIES.forEach(function(c){var b=document.createElement('button');b.className='chip';b.dataset.id=c.id;b.innerHTML='<i'+(c.snow?' style="background:#5AA9D6"':'')+'></i>'+c.name;b.onclick=function(){stopTour();showCity(c.id)};cc.appendChild(b)});
 [['todo','Todo'],['core','En el plan'],['extra','Sugeridos'],['comer','Comer'],['foto','Fotos'],['gratis','Gratis']].forEach(function(f){var b=document.createElement('button');b.className='chip sm'+(f[0]===filter?' on':'');b.textContent=f[1];b.onclick=function(){filter=f[0];[].forEach.call(fc.children,function(x){x.classList.toggle('on',x===b)});applyFilter();if(activeId===null)showCity(cur)};fc.appendChild(b)});
 document.getElementById('zIn').onclick=function(){if(realOn)lmap.zoomIn();else zoom(.7)};document.getElementById('zOut').onclick=function(){if(realOn)lmap.zoomOut();else zoom(1.4)};
 document.getElementById('zReset').onclick=function(){if(realOn)fitCity(cur);else if(dayFilter)encuadrarSvg();else{vb={x:0,y:0,w:1000,h:760};setVB()}};
 document.getElementById('cercaBtn').onclick=cercaDeMi;document.getElementById('fabYo').onclick=centrarEnMi;document.getElementById('fabCasa').onclick=volverACasa;document.getElementById('fullBtn').onclick=function(){pantallaCompleta()};
 document.getElementById('tour').onclick=function(){if(tourT)stopTour();else startTour()};
 document.getElementById('mode').onclick=toggleMode;
 showCity('dc');if(hasTiles())startEmbedded();else tryReal();mostrarTips();window.addEventListener('resize',function(){updScale();if(lmap)lmap.invalidateSize()})}

/* guía rápida del mapa (solo la primera vez) */
function mostrarTips(){try{if(localStorage.getItem('guiaTips'))return}catch(e){}var w=document.querySelector('.mapwrap'),t=document.createElement('div');t.className='tips';
 t.innerHTML='<b>Cómo usar el mapa</b><ul><li>👆 Toca un lugar y luego <b>🧭 Cómo llegar</b></li><li>◎ Tu ubicación en vivo · 🏠 Volver a casa</li><li>🗓️ Elige un día arriba para ver su ruta y horario</li></ul><button class="btn or">Entendido</button>';
 w.appendChild(t);t.querySelector('button').onclick=function(){t.remove();try{localStorage.setItem('guiaTips','1')}catch(e){}}}

/* ---------- navegación ---------- */
var mapReady=false;
function go(t){tab=t;document.body.setAttribute('data-tab',t);if(t!=='mapa'&&document.body.classList.contains('mapa-full'))pantallaCompleta(false);[].forEach.call(document.querySelectorAll('.view'),function(v){v.classList.toggle('on',v.id==='v-'+t)});[].forEach.call(document.querySelectorAll('#tabs button'),function(b){b.classList.toggle('on',b.dataset.t===t)});
 if(t==='mapa'){if(!mapReady){mapReady=true;document.getElementById('map').classList.add('cargando');cargarScript('js/vendor/leaflet.js').then(initMap,function(){initMap()})}else{setTimeout(function(){if(lmap)lmap.invalidateSize();updScale()},60)}}
 else{stopTour();render(t)}window.scrollTo(0,0)}
function render(t){var f={inicio:renderInicio,dias:renderDias,comer:renderComer,ingles:renderIngles,fotos:renderFotos,gratis:renderGratis,gastos:renderGastos}[t];if(f)f()}
[].forEach.call(document.querySelectorAll('#tabs button'),function(b){b.onclick=function(){go(b.dataset.t)}});
[].forEach.call(document.querySelectorAll('.seg button'),function(b){b.classList.toggle('on',+b.dataset.g===g);b.onclick=function(){g=+b.dataset.g;save();[].forEach.call(document.querySelectorAll('.seg button'),function(x){x.classList.toggle('on',x===b)});toast('Presupuesto para '+g+(g>1?' personas':' persona'));if(tab==='mapa'){if(activeId!==null)showPlace(activeId,true);else showCity(cur)}else render(tab)}});
(function(){var t=gxTabInicial();if(t)go(t);else renderInicio()})();
/* alto real del encabezado: el mapa llena el resto de la pantalla en computador y tableta */
(function(){var t=document.querySelector('.top');function m(){document.documentElement.style.setProperty('--toph',t.offsetHeight+'px');if(typeof lmap!=='undefined'&&lmap)setTimeout(function(){lmap.invalidateSize()},60)}m();addEventListener('resize',m);if(window.ResizeObserver)new ResizeObserver(m).observe(t)})();
/* botón de pantalla completa (si el navegador lo permite y la app no está instalada) */
(function(){var b=document.getElementById('pcBtn'),de=document.documentElement,inst=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone,rq=de.requestFullscreen||de.webkitRequestFullscreen;if(!b||inst||!rq)return;b.hidden=false;
 b.onclick=function(){if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document);else rq.call(de)};
 document.addEventListener('fullscreenchange',function(){var on=!!document.fullscreenElement;b.textContent=on?'🗗':'⛶';b.title=on?'Salir de pantalla completa':'Pantalla completa'})})();
/* prepara el mapa en segundo plano mientras ven Inicio */
(window.requestIdleCallback||function(f){setTimeout(f,1500)})(function(){cargarScript('js/vendor/leaflet.js').catch(function(){});trListo().catch(function(){});
 /* trae el plan del otro teléfono por la hoja de Gastos, si está conectada */
 gxCargar().then(function(){if(gx.conn){gxProgramarSync(300);if(tab==='dias')renderDias()}}).catch(function(){})},{timeout:4000});
