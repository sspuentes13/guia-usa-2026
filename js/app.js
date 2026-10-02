/* Guía USA · lógica principal */
var TILES={}; /*__TILES__*/

var g=2,tab='inicio',daysMode='res',energy='media',snowOn=false,added={},cur='',activeId=null,filter='todo',imgCache={},photosBlocked=false;
try{var sv=JSON.parse(localStorage.getItem('guiaUSA')||'{}');if(sv.g)g=sv.g;if(sv.daysMode)daysMode=sv.daysMode;if(sv.energy)energy=sv.energy;if(sv.added)added=sv.added;if(sv.snowOn)snowOn=sv.snowOn}catch(e){}
function save(){try{localStorage.setItem('guiaUSA',JSON.stringify({g:g,daysMode:daysMode,energy:energy,added:added,snowOn:snowOn}))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cost(i,n){return i.t==='pp'?i.v*n:(i.t==='car'?i.v:i.v*Math.ceil(n/2))}
function fmt(v,cur){v=Math.round(v);return cur==='USD'?'US$'+v.toLocaleString('en-US'):'$'+v.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function toast(t){var e=document.getElementById('toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('on')},1800)}
function extraItems(){var r=[];Object.keys(added).forEach(function(k){var p=P[+k];if(p&&p.e)r.push({city:p.c,cat:'Entradas y otros',label:p.n,v:p.e,cur:'USD',t:'pp'})});if(snowOn)r.push({city:'ny',cat:'Entradas y otros',label:'Big SNOW',v:40,cur:'USD',t:'pp'},{city:'ny',cat:'Transporte',label:'Bus 355',v:16,cur:'USD',t:'pp'});return r}
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
 var h='<div class="hero"><span class="pl">✈</span><span class="pill o">Guía flexible · no un horario</span><h2>Toma lo que quieras de cada día.</h2><p>Esto no es un itinerario para seguir al pie de la letra. Cada día tiene opciones según la energía, alternativas si llueve, qué comer, un reto de inglés, la foto del día y su canción.</p>'+
 '<div class="cd"><div><b>'+dd+'</b><small>días</small></div><div><b>'+hh+'</b><small>horas</small></div><div><b>'+P.filter(function(p){return p.c!=='col'}).length+'</b><small>lugares</small></div><div><b>'+FREE.filter(function(f){return f.st!=='no'}).length+'</b><small>gratis</small></div></div></div>';
 h+='<div class="grid4"><div class="stat o"><small>Total para '+g+'</small><b>'+fmt(t.all,'COP')+'</b></div><div class="stat"><small>Cada persona</small><b>'+fmt(t.all/g,'COP')+'</b></div><div class="stat"><small>Gastos en EE. UU.</small><b>'+fmt(t.USD,'USD')+'</b></div><div class="stat"><small>Gastos en Colombia</small><b>'+fmt(t.COP,'COP')+'</b></div></div>';
 h+='<div class="card mt"><h3 style="margin:0 0 8px">Cómo usar la guía</h3><div class="grid2"><div class="box"><h4>🗓️ Días</h4>Cambia entre <b>resumido</b> y <b>completo</b>, y escoge tu energía: alta, media o baja.</div><div class="box"><h4>🗺️ Mapa</h4>Lugares numerados, extras sugeridos con borde punteado y botón <b>＋ Añadir</b> para sumarlos al presupuesto.</div><div class="box"><h4>🗣️ Inglés</h4>Frases por situación con botón para escuchar la pronunciación.</div><div class="box"><h4>📸 Fotos</h4>Poses para 1, 2, 3 y 4 personas y canciones para historias y publicaciones.</div><div class="box"><h4>💸 Gastos</h4>Anoten cada gasto en pesos o dólares, vean cuánto llevan y quién le debe a quién.</div><div class="box"><h4>📶 Sin internet</h4>Abran la guía una vez con wifi y toquen <b>Preparar para usar sin internet</b>.</div></div></div>';
 h+='<div class="card" id="offlineCard"></div>';
 h+='<div class="card"><h3 style="margin:0 0 4px">Presupuesto por categoría</h3><p class="lead" style="font-size:14px;margin:0 0 8px">Sin vuelos ni compras. Comidas en casa no suman. Taxis y Uber se pagan por carro.</p><div class="tw"><table class="bt"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th></tr>';
 ['Desayuno','Almuerzo','Cena','Transporte','Entradas y otros'].forEach(function(c){h+='<tr><td>'+c+'</td>';[1,2,3,4].forEach(function(n){var o=catTotals(n)[c]||{USD:0,COP:0};h+='<td'+(n===g?' class="hl"':'')+'>'+fmt(o.COP+o.USD*RATE,'COP')+'</td>'});h+='</tr>'});
 h+='<tr class="t"><td>Total</td>';[1,2,3,4].forEach(function(n){h+='<td>'+fmt(totals(n).all,'COP')+'</td>'});h+='</tr><tr><td>Cada uno</td>';[1,2,3,4].forEach(function(n){h+='<td>'+fmt(totals(n).all/n,'COP')+'</td>'});h+='</tr></table></div><p class="warn">Dólares convertidos a $4.000 pesos aprox. Extras añadidos en el mapa: '+Object.keys(added).length+'. <label style="font-weight:700"><input type="checkbox" id="snowChk"'+(snowOn?' checked':'')+'> Sumar día de nieve en Big SNOW</label></p></div>';
 h+='<div class="card"><h3 style="margin:0 0 8px">Si van 2, 3 o 4</h3>'+GROUP.map(function(x){return '<div class="box mt"><h4>'+x[0]+'</h4>'+x[1]+'</div>'}).join('')+'</div>';
 var el=document.getElementById('v-inicio');el.innerHTML=h;renderOfflineCard(document.getElementById('offlineCard'));
 document.getElementById('snowChk').onchange=function(e){snowOn=e.target.checked;save();renderInicio();toast(snowOn?'Nieve sumada al presupuesto':'Nieve quitada')};
}

/* ---------- DÍAS ---------- */
function renderDias(){
 var h='<h2 class="big">Día a día</h2><p class="lead">Escojan según el día y la energía. Lo naranja son los días de viaje o paseo fuera de Washington.</p>';
 h+='<div class="row" style="margin-bottom:12px"><div class="toggle2" role="group" aria-label="Vista"><button data-m="res"'+(daysMode==='res'?' class="on"':'')+'>Resumido</button><button data-m="full"'+(daysMode==='full'?' class="on"':'')+'>Completo</button></div>'+
 '<div class="toggle2" role="group" aria-label="Energía"><button data-e="alta"'+(energy==='alta'?' class="on"':'')+'>⚡ Alta</button><button data-e="media"'+(energy==='media'?' class="on"':'')+'>🙂 Media</button><button data-e="baja"'+(energy==='baja'?' class="on"':'')+'>😴 Baja</button></div></div>';
 DAYS.forEach(function(d,k){var go=['col','ny','bal','phi','del'].indexOf(d.city)>-1;
  h+='<article class="day'+(go?' go':'')+(daysMode==='full'?' open':'')+'" data-k="'+k+'"><div class="dh" role="button" tabindex="0"><div class="dn"><small>'+(d.n.indexOf('–')>-1?'Días':'Día')+'</small><b>'+d.n+'</b></div><div><h3>'+esc(d.title)+'</h3><p>'+esc(d.date)+' · '+esc(CITYNAME[d.city])+' · '+esc(d.short)+'</p></div><div class="cost">'+dayCost(d)+'</div></div><div class="db">';
  h+='<div class="en3"><div'+(energy==='alta'?' class="on"':'')+'><small>⚡ ENERGÍA ALTA</small>'+esc(d.alta)+'</div><div'+(energy==='media'?' class="on"':'')+'><small>🙂 MEDIA</small>'+esc(d.media)+'</div><div'+(energy==='baja'?' class="on"':'')+'><small>😴 BAJA</small>'+esc(d.baja)+'</div></div>';
  h+='<div class="mt"><ul class="tl">'+d.acts.map(function(a){return '<li><b>'+esc(a[0])+'</b><span>'+esc(a[1])+'</span></li>'}).join('')+'</ul></div>';
  h+='<div class="grid2 mt"><div class="box"><h4>☔ Si llueve</h4>'+esc(d.rain)+'</div><div class="box"><h4>🍽️ Qué comer</h4>'+d.eat.map(esc).join('<br>')+'</div><div class="box o"><h4>🗣️ Reto de inglés</h4>'+esc(d.en)+'</div><div class="box"><h4>📸 Foto y 🎵 canción</h4>'+(esc(d.ig)||'Día libre de fotos')+(d.song?'<br><b>'+esc(d.song)+'</b>':'')+'</div></div>';
  h+='<div class="mt tw"><table class="bt"><tr><th>Gasto para '+g+'</th><th></th></tr>'+d.items.filter(function(i){return i.v}).map(function(i){return '<tr><td>'+esc(i.cat)+' · '+esc(i.label)+'</td><td>'+fmt(cost(i,g),i.cur)+'</td></tr>'}).join('')+'<tr class="t"><td>Total del día</td><td>'+dayCost(d)+'</td></tr></table></div>';
  h+='<div class="row mt"><button class="btn pri" data-map="'+d.city+'">Ver en el mapa ›</button></div></div></article>'});
 h+=totBar();
 var el=document.getElementById('v-dias');el.innerHTML=h;
 [].forEach.call(el.querySelectorAll('[data-m]'),function(b){b.onclick=function(){daysMode=b.dataset.m;save();renderDias()}});
 [].forEach.call(el.querySelectorAll('[data-e]'),function(b){b.onclick=function(){energy=b.dataset.e;save();renderDias();toast('Energía '+energy+': opciones resaltadas')}});
 [].forEach.call(el.querySelectorAll('.dh'),function(x){var f=function(){x.parentNode.classList.toggle('open')};x.onclick=f;x.onkeydown=function(e){if(e.key==='Enter')f()}});
 [].forEach.call(el.querySelectorAll('[data-map]'),function(b){b.onclick=function(e){e.stopPropagation();go('mapa');showCity(b.dataset.map==='col'?'col':b.dataset.map)}});
}

/* ---------- COMER ---------- */
function renderComer(){
 var h='<h2 class="big">Qué comer</h2><p class="lead">Lo típico de cada ciudad con precio aproximado por persona y la frase para pedirlo. Toquen 🔊 para escucharla.</p>';
 ['dc','arl','ny','bal','phi','del','col'].forEach(function(c){var f=FOOD.filter(function(x){return x.c===c});if(!f.length)return;
  h+='<div class="card"><h3 style="margin:0 0 8px">'+CITYNAME[c]+'</h3>';
  f.forEach(function(x){h+='<div class="phr"><div><b>'+esc(x.w)+' <span class="pill o">~US$'+x.p+' c/u · '+fmt(x.p*g,'USD')+' para '+g+'</span></b><small>'+esc(x.d)+' · '+esc(x.t)+'</small>'+(x.en?'<small><i>“'+esc(x.en)+'”</i></small>':'')+'</div>'+(x.en?'<button class="say" data-say="'+esc(x.en)+'" aria-label="Escuchar">🔊</button>':'<span></span>')+'</div>'});
  h+='</div>'});
 h+='<p class="warn">Precios aproximados; pueden cambiar. En EE. UU. en restaurantes con mesero se deja propina de 15–20 %. En food trucks y mostradores es opcional.</p>';
 document.getElementById('v-comer').innerHTML=h;bindSay('v-comer');
}

/* ---------- INGLÉS ---------- */
var voice=null;
function speak(t,btn){if(!('speechSynthesis' in window)){toast('Este dispositivo no tiene voz disponible');return}
 speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.88;
 if(!voice){var vs=speechSynthesis.getVoices();voice=vs.filter(function(v){return /en-US/.test(v.lang)})[0]||null}if(voice)u.voice=voice;
 if(btn){btn.classList.add('on');u.onend=u.onerror=function(){btn.classList.remove('on')}}speechSynthesis.speak(u)}
function bindSay(id){[].forEach.call(document.getElementById(id).querySelectorAll('[data-say]'),function(b){b.onclick=function(e){e.stopPropagation();speak(b.dataset.say,b)}})}
function renderIngles(){
 var h='<h2 class="big">Inglés en la calle</h2><p class="lead">Frases reales para cada situación. Toquen 🔊 para escuchar la pronunciación; funciona sin internet en la mayoría de iPads.</p>';
 h+='<div class="card"><h3 style="margin:0 0 8px">🎯 Retos del viaje</h3><div class="grid2">'+DAYS.filter(function(d){return d.en}).map(function(d){return '<div class="box"><h4>'+(d.n.indexOf('–')>-1?'Días ':'Día ')+d.n+'</h4>'+esc(d.en)+'</div>'}).join('')+'</div></div>';
 PHRASES.forEach(function(s){h+='<div class="card"><h3 style="margin:0 0 6px">'+s.k+'</h3>'+s.l.map(function(x){return '<div class="phr"><div><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></div><button class="say" data-say="'+esc(x[0])+'" aria-label="Escuchar">🔊</button></div>'}).join('')+'</div>'});
 h+='<div class="card"><h3 style="margin:0 0 6px">💡 Para aprender más rápido</h3><div class="grid2"><div class="box">Pidan siempre ustedes, aunque se equivoquen. Los meseros están acostumbrados.</div><div class="box">Si no entienden: <b>"Sorry, could you repeat that?"</b></div><div class="box">Cada noche, cuenten el día en inglés en un audio de 1 minuto.</div><div class="box">Lean en voz alta los carteles de los museos.</div></div></div>';
 document.getElementById('v-ingles').innerHTML=h;bindSay('v-ingles');
}

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
function renderGratis(){
 var lab={ok:['Gratis, sin reserva','g'],res:['Gratis con reserva','o'],no:['No aplica','r']};
 var h='<h2 class="big">Lo gratis y cómo reclamarlo</h2><p class="lead">Verificado en páginas oficiales. Los enlaces necesitan internet.</p>';
 h+='<div class="card"><h3 style="margin:0 0 8px">📅 Qué reservar y cuándo</h3><div class="tw"><table class="bt"><tr><th>Qué</th><th style="text-align:left">Cuándo reservar</th><th style="text-align:left">Para</th></tr>'+FREE.filter(function(f){return f.st==='res'}).map(function(f){return '<tr><td><a href="'+f.u+'" target="_blank" rel="noopener">'+esc(f.n)+' ↗</a></td><td style="text-align:left;white-space:normal">'+esc(f.when)+'</td><td style="text-align:left">'+esc(f.day)+'</td></tr>'}).join('')+'</table></div></div>';
 var last='';FREE.forEach(function(f){if(f.g!==last){if(last)h+='</ul></div>';h+='<div class="card"><h3 style="margin:0 0 8px">'+f.g+'</h3><ul class="free">';last=f.g}
  h+='<li><b>'+esc(f.n)+'</b> <span class="pill '+lab[f.st][1]+'">'+lab[f.st][0]+'</span><small>'+esc(f.s)+'</small><a class="btn" href="'+f.u+'" target="_blank" rel="noopener">Abrir página oficial ↗</a></li>'});
 h+='</ul></div>';
 document.getElementById('v-gratis').innerHTML=h;
}

/* ---------- MAPA ---------- */
var NS='http://www.w3.org/2000/svg',svg=null,vb={x:0,y:0,w:1000,h:760};
var EMO=[[/Aeropuerto|Dulles|El Dorado/,'✈️'],[/Terminal|Station|Estación|Penn/,'🚆'],[/Cementerio/,'🎖️'],[/Capitolio|Casa Blanca|Independence|City Hall/,'🏛️'],[/Museo|Gallery|Library|Biblioteca|Torpedo|Kennedy|Walters|Portrait/,'🖼️'],[/Zoo/,'🐼'],[/Catedral|Cathedral/,'⛪'],[/Puente|Bridge|DUMBO|Teleférico/,'🌉'],[/Ferry|Harbor|Wharf|Riverfront|Boathouse/,'⛴️'],[/Park|Island|Bethesda|Gravelly|Trail|High Line|Square|Circle/,'🌳'],[/Market|Chili|Pizza|Halal|Clarendon/,'🍔'],[/Mall|Fashion/,'🛍️'],[/Times Square|Rockefeller|Grand Central|Summit/,'🌆'],[/Rocky/,'🥊'],[/SNOW|Killington|Snowshoe|Shenandoah/,'❄️'],[/Fort/,'🏰'],[/Memorial|Monument|Monumento|Jefferson|Lincoln|Liberty|Toro|Iwo|Air Force|MLK|Carillon/,'🗽'],[/Old Town|Georgetown|Fells|Elfreth|Exorcista|Vernon|Magic/,'🏘️']];
function emo(p){for(var k=0;k<EMO.length;k++)if(EMO[k][0].test(p.n))return EMO[k][1];return '📍'}
function visible(p){if(filter==='todo')return true;if(filter==='core')return p.core;if(filter==='extra')return !p.core;if(filter==='comer')return p.cat==='comer';if(filter==='foto')return !!p.ig;if(filter==='gratis')return FK[p.n]!==undefined||(!p.e&&p.cat!=='transporte');return true}
function el(n,a,par){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(par)par.appendChild(e);return e}
function numOf(i){return MAPS[P[i].c].pins.map(function(x){return x.i}).indexOf(i)+1}
function drawMap(id){var m=MAPS[id],L=m.L,box=document.getElementById('map');box.innerHTML='';
 svg=el('svg',{viewBox:'0 0 1000 760',preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Mapa de '+CITYNAME[id]});box.appendChild(svg);
 el('rect',{x:-3000,y:-3000,width:7000,height:7000,fill:'#BFE4F7'},svg);
 el('path',{d:L.land,fill:'#FDFBF7',stroke:'#D9E6EE','vector-effect':'non-scaling-stroke'},svg);
 if(L.land2)el('path',{d:L.land2,fill:'#FDFBF7',stroke:'#8CCBEB','vector-effect':'non-scaling-stroke'},svg);
 if(L.hl)el('path',{d:L.hl,fill:'#FFF6EE',stroke:'#FF8A3D','stroke-width':2,'vector-effect':'non-scaling-stroke'},svg);
 if(L.urban)el('path',{d:L.urban,fill:'#FFE9D9',opacity:.7},svg);
 if(L.parks)el('path',{d:L.parks,fill:'#D7EEC8'},svg);
 if(L.lakes)el('path',{d:L.lakes,fill:'#BFE4F7'},svg);
 L.rivers.forEach(function(r){el('path',{d:r.d,fill:'none',stroke:'#BFE4F7','stroke-width':r.w,'stroke-linecap':'round','stroke-linejoin':'round'},svg)});
 if(L.roads)el('path',{d:L.roads,fill:'none',stroke:'#FFC9A3','class':'rd'},svg);
 if(L.borders)el('path',{d:L.borders,fill:'none',stroke:'#4A6A80',opacity:.55,'class':'bd'},svg);
 var core=m.pins.filter(function(p){return P[p.i].core});
 if(core.length>1&&id!=='snow')el('path',{d:'M'+core.map(function(p){return p.x+' '+p.y}).join(' L'),'class':'route'},svg);
 m.labels.forEach(function(l){var t=el('text',{x:l.x,y:l.y,'class':'lb k'+l.k,'data-k':l.k},svg);t.textContent=l.t});
 m.pins.forEach(function(p,j){var pl=P[p.i];var gr=el('g',{'class':'pn'+(pl.snow?' snow':'')+(pl.core?'':' x')+(visible(pl)?'':' hide'),'data-i':p.i,transform:'translate('+p.x+' '+p.y+')',tabindex:0,role:'button','aria-label':pl.n},svg);
  var c=el('circle',{cx:0,cy:0,r:15},gr);c.style.animationDelay=(j*30)+'ms';var tx=el('text',{x:0,y:0},gr);tx.textContent=pl.snow?'❄':j+1;
  gr.addEventListener('click',function(e){e.stopPropagation();showPlace(p.i)});gr.addEventListener('keydown',function(e){if(e.key==='Enter')showPlace(p.i)})});
 vb={x:0,y:0,w:1000,h:760};setVB();bindPan()}
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
function stopTour(){if(tourT){clearInterval(tourT);tourT=null}var b=document.getElementById('tour');if(b)b.textContent='▶ Recorrido'}
function startTour(){stopTour();var ids=MAPS[cur].pins.map(function(x){return x.i}).filter(function(i){return visible(P[i])});if(!ids.length)return;var k=0;showPlace(ids[0],true);document.getElementById('tour').textContent='❚❚ Pausa';tourT=setInterval(function(){k++;if(k>=ids.length){stopTour();return}showPlace(ids[k],true)},4500)}
function showCity(id){activeId=null;
 [].forEach.call(document.querySelectorAll('#cityChips .chip'),function(b){b.classList.toggle('on',b.dataset.id===id)});
 if(cur!==id||!svg){cur=id;drawMap(id)}else mark(-1);
 if(realOn)fitCity(id);
 var c=CITIES.filter(function(x){return x.id===id})[0],ps=MAPS[id].pins.map(function(x){return P[x.i]}),ct=cityTotals(id);
 var core=ps.filter(function(p){return p.core}),tk=0;for(var q=1;q<core.length;q++)tk+=hav(core[q-1].ll,core[q].ll);
 var h='<div class="pad"><span class="pill o">'+esc(c.day)+'</span><h2>'+esc(c.name)+'</h2><p>'+esc(c.desc)+'</p>';
 if(id!=='snow')h+='<div class="facts"><div class="fact"><small>Presupuesto aquí ('+g+')</small><b>'+both(ct)+'</b></div><div class="fact"><small>Caminando la ruta</small><b>'+(core.length>1?kmF(tk*1.25)+' · '+walk(tk):'—')+'</b></div></div>';
 h+='<ul class="places">';
 MAPS[id].pins.forEach(function(x,j){var p=P[x.i];if(!visible(p))return;var fr=FK[p.n]!==undefined?FREE[FK[p.n]]:null;
  h+='<li><button data-i="'+x.i+'"><span class="num'+(p.snow?' snow':'')+(p.core?'':' x')+'">'+(p.snow?'❄':j+1)+'</span><span><b>'+esc(p.n)+'</b><small>'+esc(p.d)+' · '+esc(p.h)+(fr&&fr.st==='res'?' · 🎟️ reservar':'')+'</small></span><span class="price">'+(p.e?fmt(p.e,'USD'):'Gratis')+(added[x.i]?' ✓':'')+'</span></button></li>'});
 h+='</ul></div>';
 var pan=document.getElementById('panel');pan.innerHTML=h;pan.scrollTop=0;
 [].forEach.call(pan.querySelectorAll('.places button'),function(b){b.onclick=function(){showPlace(+b.dataset.i)}})}
function showPlace(i,fromTour){if(!fromTour)stopTour();var p=P[i];activeId=i;
 if(tab!=='mapa')go('mapa');
 if(cur!==p.c){cur=p.c;drawMap(p.c);[].forEach.call(document.querySelectorAll('#cityChips .chip'),function(b){b.classList.toggle('on',b.dataset.id===p.c)})}
 mark(i);
 var pins=MAPS[p.c].pins,pin=pins.filter(function(x){return x.i===i})[0];
 if(pin&&svg){var tw=Math.min(vb.w,520),sx=vb.x,sy=vb.y,sw=vb.w,tx=pin.x-tw*.5,ty=pin.y-tw*.38,t0=performance.now();(function st(now){var k=Math.min(1,(now-t0)/600),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;vb.x=sx+(tx-sx)*e;vb.y=sy+(ty-sy)*e;vb.w=sw+(tw-sw)*e;vb.h=vb.w*.76;setVB();if(k<1)requestAnimationFrame(st)})(t0)}
 if(realOn)lmap.flyTo(p.ll,p.snow?9:16,{duration:.8});
 var order=pins.map(function(x){return x.i}).filter(function(k){return P[k].core}),pos=order.indexOf(i),prev=pos>0?P[order[pos-1]]:null,dk=prev?hav(prev.ll,p.ll):0;
 var fr=FK[p.n]!==undefined?FREE[FK[p.n]]:null;
 var h='<div class="ph'+(p.snow?' s':'')+'"><div class="img" id="img"></div><button class="back" id="back">‹ '+esc(CITYNAME[p.c])+'</button><span class="nb">'+(p.snow?'❄':numOf(i))+'</span><span class="em">'+emo(p)+'</span><small>'+(p.core?'En el plan':'Sugerido · opcional')+'</small></div><div class="pad">';
 h+='<span class="pill '+(p.core?'o':'s')+'">'+esc(p.d)+'</span><h2>'+esc(p.n)+'</h2><p>'+esc(p.txt)+'</p><div id="warn"></div>';
 h+='<div class="facts"><div class="fact"><small>Entrada c/u</small><b>'+(p.e?fmt(p.e,'USD'):'Gratis')+'</b></div><div class="fact"><small>Para '+g+'</small><b>'+(p.e?fmt(p.e*g,'USD'):'Gratis')+'</b></div><div class="fact" style="grid-column:1/-1"><small>Cuándo ir</small><b>'+esc(p.h)+'</b></div>'+(prev&&!p.snow?'<div class="fact"><small>Desde '+esc(prev.n)+'</small><b>'+kmF(dk*1.25)+'</b></div><div class="fact"><small>A pie, aprox.</small><b>'+walk(dk)+'</b></div>':'')+'</div>';
 if(fr)h+='<div class="box '+(fr.st==='res'?'o':'')+'"><h4>🎟️ '+(fr.st==='res'?'Gratis con reserva':'Gratis')+'</h4>'+esc(fr.s)+'<div class="row mt"><a class="btn pri" href="'+fr.u+'" target="_blank" rel="noopener">Reservar / ver página oficial ↗</a></div></div>';
 if(p.ig)h+='<div class="box mt"><h4>📸 Foto para Instagram</h4>'+esc(p.ig)+'</div>';
 h+='<div class="row mt">'+(!p.core?'<button class="btn or" id="add">'+(added[i]?'✓ En mi plan · quitar':'＋ Añadir a mi plan')+'</button>':'')+'<a class="btn pri" href="'+gmPlace(p)+'" target="_blank" rel="noopener">Google Maps: fotos ↗</a>'+(prev&&!p.snow?'<a class="btn" href="'+gmDir(prev,p)+'" target="_blank" rel="noopener">Cómo llegar ↗</a>':'')+'</div>';
 h+='<div class="row mt"><button class="btn" id="pv">‹ Anterior</button><button class="btn" id="nx">Siguiente ›</button></div></div>';
 var pan=document.getElementById('panel');pan.innerHTML=h;pan.scrollTop=0;
 var all=pins.map(function(x){return x.i}).filter(function(k){return visible(P[k])}),ap=all.indexOf(i);
 document.getElementById('back').onclick=function(){stopTour();showCity(p.c);if(svg){vb={x:0,y:0,w:1000,h:760};setVB()}};
 document.getElementById('pv').onclick=function(){showPlace(all[(ap-1+all.length)%all.length])};
 document.getElementById('nx').onclick=function(){showPlace(all[(ap+1)%all.length])};
 var ad=document.getElementById('add');if(ad)ad.onclick=function(){if(added[i])delete added[i];else added[i]=1;save();toast(added[i]?'Añadido a tu plan'+(p.e?' · +'+fmt(p.e*g,'USD'):''):'Quitado de tu plan');showPlace(i)};
 wikiImg(p.w,function(u){if(activeId!==i)return;if(u){var im=new Image();im.crossOrigin='anonymous';im.onload=function(){var e=document.getElementById('img');if(e){e.style.backgroundImage='url("'+u+'")';e.classList.add('on')}};im.src=u}else if(photosBlocked){var w=document.getElementById('warn');if(w)w.innerHTML='<div class="warn">Sin internet no se cargan fotos. Toquen "Google Maps: fotos" cuando tengan conexión.</div>'}})}
/* satélite */
var realOn=false,lmap=null,lmk={},lroute=null,realTried=false;
function hasTiles(){for(var k in TILES)return true;return false}
function tileSrc(v){return (v.charAt(0)==='/'?'data:image/jpeg;base64,':'data:image/png;base64,')+v}
var SAT_URL='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',OSM_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png',satLabel='';
function setMode(label,real){var md=document.getElementById('mode');md.textContent=label;md.className='mode'+(real?' real':'')}
function makeLeaflet(label){var e=document.getElementById('lmap');e.style.display='block';realOn=true;satLabel=label;setMode(label+' ⇄',true);document.getElementById('scale').style.display='none';
 if(!lmap){lmap=L.map('lmap',{zoomControl:false,maxZoom:19}).setView([38.9,-77.03],12);L.control.scale({imperial:false,position:'bottomright'}).addTo(lmap);
 P.forEach(function(p,i){lmk[i]=L.marker(p.ll,{icon:L.divIcon({className:'',html:'<div class="lpin'+(p.snow?' snow':'')+(p.core?'':' x')+'">'+(p.snow?'❄':numOf(i))+'</div>',iconSize:[28,28],iconAnchor:[14,14]}),title:p.n}).addTo(lmap).on('click',function(){showPlace(i)})});
 if(navigator.geolocation){var me=null;try{navigator.geolocation.watchPosition(function(pos){var ll=[pos.coords.latitude,pos.coords.longitude];if(!me)me=L.circleMarker(ll,{radius:8,color:'#fff',weight:3,fillColor:'#1A73E8',fillOpacity:1}).addTo(lmap).bindTooltip('Estás aquí');else me.setLatLng(ll)},function(){},{enableHighAccuracy:true})}catch(e){}}}
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
function fitCity(id){if(!realOn||!id)return;if(lroute)lmap.removeLayer(lroute);var core=MAPS[id].pins.map(function(x){return P[x.i]}).filter(function(p){return p.core});
 if(core.length>1&&id!=='snow')lroute=L.polyline(core.map(function(p){return p.ll}),{color:'#FF8A3D',weight:4,dashArray:'8 10'}).addTo(lmap);
 var ps=MAPS[id].pins.map(function(x){return P[x.i].ll});lmap.invalidateSize();lmap.flyToBounds(L.latLngBounds(ps).pad(.15),{duration:1})}
function initMap(){var cc=document.getElementById('cityChips'),fc=document.getElementById('filterChips');
 CITIES.forEach(function(c){var b=document.createElement('button');b.className='chip';b.dataset.id=c.id;b.innerHTML='<i'+(c.snow?' style="background:#5AA9D6"':'')+'></i>'+c.name;b.onclick=function(){stopTour();showCity(c.id)};cc.appendChild(b)});
 [['todo','Todo'],['core','En el plan'],['extra','Sugeridos'],['comer','Comer'],['foto','Fotos'],['gratis','Gratis']].forEach(function(f){var b=document.createElement('button');b.className='chip sm'+(f[0]===filter?' on':'');b.textContent=f[1];b.onclick=function(){filter=f[0];[].forEach.call(fc.children,function(x){x.classList.toggle('on',x===b)});applyFilter();if(activeId===null)showCity(cur)};fc.appendChild(b)});
 document.getElementById('zIn').onclick=function(){if(realOn)lmap.zoomIn();else zoom(.7)};document.getElementById('zOut').onclick=function(){if(realOn)lmap.zoomOut();else zoom(1.4)};
 document.getElementById('zReset').onclick=function(){if(realOn)fitCity(cur);else{vb={x:0,y:0,w:1000,h:760};setVB()}};
 document.getElementById('tour').onclick=function(){if(tourT)stopTour();else startTour()};
 document.getElementById('mode').onclick=toggleMode;
 showCity('dc');if(hasTiles())startEmbedded();else tryReal();window.addEventListener('resize',function(){updScale();if(lmap)lmap.invalidateSize()})}

/* ---------- navegación ---------- */
var mapReady=false;
function go(t){tab=t;[].forEach.call(document.querySelectorAll('.view'),function(v){v.classList.toggle('on',v.id==='v-'+t)});[].forEach.call(document.querySelectorAll('#tabs button'),function(b){b.classList.toggle('on',b.dataset.t===t)});
 if(t==='mapa'){if(!mapReady){mapReady=true;initMap()}else{setTimeout(function(){if(lmap)lmap.invalidateSize();updScale()},60)}}
 else{stopTour();render(t)}window.scrollTo(0,0)}
function render(t){var f={inicio:renderInicio,dias:renderDias,comer:renderComer,ingles:renderIngles,fotos:renderFotos,gratis:renderGratis,gastos:renderGastos}[t];if(f)f()}
[].forEach.call(document.querySelectorAll('#tabs button'),function(b){b.onclick=function(){go(b.dataset.t)}});
[].forEach.call(document.querySelectorAll('.seg button'),function(b){b.classList.toggle('on',+b.dataset.g===g);b.onclick=function(){g=+b.dataset.g;save();[].forEach.call(document.querySelectorAll('.seg button'),function(x){x.classList.toggle('on',x===b)});toast('Presupuesto para '+g+(g>1?' personas':' persona'));if(tab==='mapa'){if(activeId!==null)showPlace(activeId,true);else showCity(cur)}else render(tab)}});
(function(){var t=gxTabInicial();if(t)go(t);else renderInicio()})();
