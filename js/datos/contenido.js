/* Lugares gratis, comida, frases, canciones, poses */
var FREE=[
 {g:'Washington DC',n:'Tour del Capitolio',st:'res',s:'Gratis. Lunes a sábado, último tour 3:20 p. m. Reserven por internet: hay pocos pases el mismo día.',u:'https://www.visitthecapitol.gov/visit/book-a-tour',when:'Ya mismo',day:'Día 7 · jue 5 nov'},
 {g:'Washington DC',n:'Library of Congress',st:'res',s:'Gratis con pase de hora obligatorio. Se liberan 30 días antes y el mismo día a las 9:00. Abre martes a sábado.',u:'https://www.loc.gov/visit/know-before-you-go/',when:'Desde el 6 de octubre',day:'Día 7 · jue 5 nov'},
 {g:'Washington DC',n:'Washington Monument',st:'res',s:'Gratis en la taquilla el mismo día desde las 8:45, mientras haya. Por internet cobran US$1. Cierra un día de la primera semana de cada mes: confirmen que no sea el 4 de noviembre.',u:'https://www.nps.gov/wamo/planyourvisit/fees.htm',when:'Revisar a finales de octubre',day:'Día 6 · mié 4 nov'},
 {g:'Washington DC',n:'Museo del Aire y el Espacio',st:'res',s:'Gratis con pase de hora obligatorio para todos.',u:'https://airandspace.si.edu/visit/museum-dc',when:'Revisar en su web cuándo se liberan',day:'Día 7 · jue 5 nov'},
 {g:'Washington DC',n:'Museo de Historia Afroamericana',st:'res',s:'Gratis con pase de hora obligatorio. Se liberan 30 días antes y el mismo día por internet.',u:'https://nmaahc.si.edu/visit/plan-your-visit',when:'Desde el 14 de octubre',day:'Día 15 · vie 13 nov'},
 {g:'Washington DC',n:'National Zoo',st:'res',s:'Gratis con pase de entrada obligatorio.',u:'https://www.si.edu/visit/museums',when:'Revisar en su web cuándo se liberan',day:'Día 14 · jue 12 nov'},
 {g:'Washington DC',n:'Historia Natural e Historia Americana',st:'ok',s:'Gratis y sin pase: se entra directo.',u:'https://www.si.edu/visit/museums',when:'No hay que reservar',day:'Días 6 y 7'},
 {g:'Washington DC',n:'National Gallery of Art',st:'ok',s:'Siempre gratis, sin registro. 10:00 a 5:00 p. m.',u:'https://www.nga.gov/',when:'No hay que reservar',day:'Día 15'},
 {g:'Washington DC',n:'Millennium Stage, Kennedy Center',st:'res',s:'Shows gratis a las 6:00 p. m. en días seleccionados. Las reservas abren los miércoles, dos semanas antes; el mismo día dan boletas desde las 4:30 p. m.',u:'https://www.kennedy-center.org/whats-on/free/',when:'Miércoles 21 de octubre, aprox.',day:'Día 7 · jue 5 nov'},
 {g:'Nueva York',n:'Ferry de Staten Island',st:'ok',s:'Gratis, sin tiquete, todos los días. Unos 25 minutos por trayecto y pasa frente a la Estatua de la Libertad. Bajar en la isla de la Estatua sí se paga: es otro barco.',u:'https://www.nyc.gov/sifschedule',when:'No hay que reservar',day:'Día 12 · mar 10 nov'},
 {g:'Nueva York',n:'Memorial del 11 de septiembre',st:'ok',s:'Las fuentes al aire libre son gratis, de 8:00 a. m. a 8:00 p. m. El museo se paga y el gratis es solo los lunes.',u:'https://www.911memorial.org/visit',when:'No hay que reservar',day:'Día 12'},
 {g:'Nueva York',n:'Big Apple Greeter',st:'no',s:'Paseo gratis con un neoyorquino, pero exigen alojamiento en Nueva York por al menos 2 noches. No aplica para un día.',u:'https://www.bigapplegreeter.org/request-a-greeter',when:'No aplica',day:'—'},
 {g:'Filadelfia',n:'Liberty Bell',st:'ok',s:'Gratis, sin tiquete. Solo hay control de seguridad.',u:'https://www.phlvisitorcenter.com/IndependenceHall',when:'No hay que reservar',day:'Día 21 · jue 19 nov'},
 {g:'Filadelfia',n:'Independence Hall',st:'res',s:'Tiquete gratis con cargo de US$1 en Recreation.gov. Revisen si hay algún cierre anunciado para noviembre.',u:'https://www.recreation.gov/ticket/facility/234639',when:'Apenas abran fechas de noviembre',day:'Día 21 · jue 19 nov'},
 {g:'Baltimore',n:'Walters Art Museum',st:'ok',s:'Siempre gratis. Abre miércoles a domingo; el sábado 14 está abierto.',u:'https://thewalters.org/visit/hours/',when:'No hay que reservar',day:'Día 16 · sáb 14 nov'}
];
var FK={'Capitolio':0,'Library of Congress':1,'Washington Monument':2,'Air and Space Museum':3,'Museo Afroamericano':4,'National Zoo':5,'Museo de Historia Natural':6,'National Gallery of Art':7,'Kennedy Center':8,'Ferry de Staten Island':9,'Memorial del 11-S':10,'Liberty Bell':12,'Independence Hall':13,'Walters Art Museum':14};

var FOOD=[
 {c:'dc',w:'Half-smoke con chili',d:'Ben’s Chili Bowl, U Street',p:10,t:'La salchicha típica de Washington.',en:'Can I get a half-smoke with everything?'},
 {c:'dc',w:'Jumbo slice',d:'Adams Morgan',p:6,t:'Una tajada de pizza gigante para compartir.',en:'One jumbo slice, please.'},
 {c:'dc',w:'Comida de food truck',d:'National Mall, entre museos',p:14,t:'Tacos, arepas, hamburguesas. Comparen precios entre camiones.',en:'What’s the most popular thing here?'},
 {c:'dc',w:'Mercado de comidas',d:'Union Market / Eastern Market',p:15,t:'Muchos puestos: cada uno escoge lo suyo.',en:'Is this spicy?'},
 {c:'arl',w:'Picnic de supermercado',d:'Trader Joe’s / Aldi',p:6,t:'Lo más barato: sándwiches, fruta y snacks para el día.',en:'Where can I find the bread?'},
 {c:'ny',w:'Bagel con queso crema',d:'Cualquier deli',p:5,t:'El desayuno neoyorquino por excelencia.',en:'Everything bagel with cream cheese, toasted.'},
 {c:'ny',w:'Pollo con arroz halal',d:'Halal Guys o carritos',p:11,t:'Pidan salsa blanca; la roja pica mucho.',en:'Chicken over rice, white sauce, a little hot sauce.'},
 {c:'ny',w:'Pizza en tajada',d:'Joe’s Pizza, Village',p:4,t:'Se dobla por la mitad y se come de pie.',en:'One plain slice, please.'},
 {c:'ny',w:'Tacos',d:'Los Tacos No. 1, Chelsea Market',p:6,t:'Famosos; hay fila pero avanza rápido.',en:'Two adobada tacos, please.'},
 {c:'bal',w:'Crab cake',d:'Lexington Market',p:22,t:'Lo típico de Baltimore. Compartan uno si el presupuesto aprieta.',en:'Can we share one crab cake?'},
 {c:'bal',w:'Papas con Old Bay',d:'Puestos del puerto',p:6,t:'El condimento de Maryland va en todo.',en:'Fries with Old Bay, please.'},
 {c:'phi',w:'Cheesesteak',d:'Reading Terminal Market o Italian Market',p:15,t:'Pidan "wit" (con cebolla) o "witout" (sin).',en:'One cheesesteak, wit, please.'},
 {c:'phi',w:'Pretzel suave',d:'Puestos callejeros',p:3,t:'El snack barato de Filadelfia.',en:'Can I get a pretzel with mustard?'},
 {c:'del',w:'Food court',d:'Christiana Mall',p:12,t:'Para cenar rápido después de las compras.',en:'Can I get this to go?'},
 {c:'col',w:'Pandebono y café',d:'Terminal de Cali',p:3,t:'El último sabor de casa antes del viaje (US$ aprox.).',en:''}
];

var PHRASES=[
 {k:'✈️ Aeropuerto y migración',l:[['I’m here on vacation for three weeks.','Estoy de vacaciones por tres semanas.'],['I’m staying with family in Arlington, Virginia.','Me quedo con familia en Arlington, Virginia.'],['My return flight is on November twenty-third.','Mi vuelo de regreso es el 23 de noviembre.'],['Where is the exit to the Silver Line?','¿Dónde está la salida a la línea plateada?'],['Is this the line for visitors?','¿Esta es la fila de visitantes?']]},
 {k:'🚇 Metro y tren',l:[['Which train goes to Union Station?','¿Qué tren va a Union Station?'],['Is this the right platform for New York?','¿Es el andén correcto para Nueva York?'],['How many stops to Times Square?','¿Cuántas paradas hasta Times Square?'],['Excuse me, is this seat taken?','Disculpe, ¿este puesto está ocupado?'],['Does this train stop at Wilmington?','¿Este tren para en Wilmington?']]},
 {k:'🍔 Restaurante y comida',l:[['Can I get a coffee with milk, please?','¿Me da un café con leche, por favor?'],['For here or to go? — To go, please.','¿Para aquí o para llevar? — Para llevar.'],['What do you recommend?','¿Qué me recomienda?'],['Can we split the check?','¿Podemos dividir la cuenta?'],['Is the tip included?','¿La propina está incluida?']]},
 {k:'🛍️ Compras',l:[['Do you have this in a medium?','¿Tiene esto en talla M?'],['Can I try this on?','¿Me lo puedo probar?'],['Is there any discount today?','¿Hay algún descuento hoy?'],['I’m just looking, thanks.','Solo estoy mirando, gracias.'],['Can I get a receipt, please?','¿Me da el recibo, por favor?']]},
 {k:'🏛️ Museos y tours',l:[['We have a timed pass for ten o’clock.','Tenemos pase para las diez.'],['Where does the tour start?','¿Dónde empieza el tour?'],['Can we take pictures here?','¿Podemos tomar fotos aquí?'],['What’s the story behind this?','¿Cuál es la historia de esto?'],['Could you take a picture of us, please?','¿Nos podría tomar una foto, por favor?']]},
 {k:'🆘 Ayuda',l:[['Excuse me, could you help me?','Disculpe, ¿me podría ayudar?'],['I’m lost. How do I get to…?','Estoy perdido. ¿Cómo llego a…?'],['Could you speak more slowly, please?','¿Podría hablar más despacio, por favor?'],['Where is the nearest restroom?','¿Dónde queda el baño más cercano?'],['I need a pharmacy.','Necesito una farmacia.']]},
 {k:'💬 Conversar',l:[['We’re from Colombia.','Somos de Colombia.'],['It’s our first time in the U.S.','Es nuestra primera vez en EE. UU.'],['What’s your favorite place in the city?','¿Cuál es tu lugar favorito de la ciudad?'],['That sounds awesome!','¡Suena genial!'],['Have a great day!','¡Que tengas un buen día!']]}
];

var SONGS=[
 {t:'NUEVAYoL',a:'Bad Bunny',c:'ny',u:'Historia: llegada a Times Square'},
 {t:'Un Verano en Nueva York',a:'El Gran Combo',c:'ny',u:'Publicación: carrusel de Nueva York'},
 {t:'Empire State of Mind',a:'Jay-Z y Alicia Keys',c:'ny',u:'Historia: skyline o Times Square de noche'},
 {t:'Welcome to New York',a:'Taylor Swift',c:'ny',u:'Historia: primer video al salir de Penn Station'},
 {t:'Autumn in New York',a:'Ella Fitzgerald y Louis Armstrong',c:'ny',u:'Publicación: Central Park con hojas de otoño'},
 {t:'No Sleep till Brooklyn',a:'Beastie Boys',c:'ny',u:'Historia: cruzando el puente de Brooklyn'},
 {t:'New York, New York',a:'Frank Sinatra',c:'ny',u:'Publicación: resumen del día'},
 {t:'Washington, D.C.',a:'The Magnetic Fields',c:'dc',u:'Historia: monumentos'},
 {t:'Chocolate City',a:'Parliament',c:'dc',u:'Historia: U Street y museos'},
 {t:'Take Me Home, Country Roads',a:'John Denver',c:'arl',u:'Publicación: Virginia y la familia'},
 {t:'Good Morning Baltimore',a:'Hairspray',c:'bal',u:'Historia: llegada a Baltimore'},
 {t:'Gonna Fly Now',a:'Tema de Rocky',c:'phi',u:'Video: subiendo las escaleras de Rocky'},
 {t:'Philadelphia Freedom',a:'Elton John',c:'phi',u:'Publicación: Liberty Bell e Independence Hall'},
 {t:'Delaware',a:'Perry Como',c:'del',u:'Historia: el "haul" de compras'},
 {t:'Leaving on a Jet Plane',a:'John Denver',c:'col',u:'Historia: despegue'},
 {t:'Cali Pachanguero',a:'Grupo Niche',c:'col',u:'Historia: salida desde Cali'},
 {t:'El Sanjuanero',a:'Tradicional del Huila',c:'col',u:'Publicación final: de vuelta en Neiva'},
 {t:'Let It Snow! Let It Snow! Let It Snow!',a:'Dean Martin',c:'snow',u:'Historia: primera vez en la nieve'}
];

var POSES=[
 ['Monumentos','Sentado en escalones mirando al monumento, de espaldas.','Espalda con espalda, el monumento al centro.','Bajando escaleras juntos, foto desde abajo.','En fila, reflejados en el agua.'],
 ['Calles y barrios','Caminando sin mirar la cámara.','De la mano, foto desde atrás.','Cruzando la calle en paso de cebra, tipo Abbey Road.','Sentados en unas escaleras, cada uno en un escalón.'],
 ['Puentes y skyline','Apoyado en la baranda mirando la ciudad.','Frente a frente en el centro del puente.','Saltando al tiempo, en ráfaga.','Brazos arriba con el skyline atrás.'],
 ['Comida','La comida en primer plano, tú desenfocado atrás.','"Brindis" con lo que comen.','Mesa desde arriba con todas las comidas.','Cada uno mordiendo al tiempo.'],
 ['Museos','Mirando una obra, de perfil.','Señalando la misma obra.','Imitando la pose de una estatua.','Foto de grupo en la escalera principal.']
];

var GROUP=[
 ['2 personas','El metro casi siempre es lo más barato. Uber solo de madrugada o con maletas.'],
 ['3 personas','Para tramos cortos (10–15 min), un Uber puede costar casi lo mismo que 3 pasajes de metro y ahorra tiempo. Comparen en la app antes.'],
 ['4 personas','Un Uber normal lleva hasta 4. En tramos cortos suele salir igual o más barato que el metro. Compartan platos grandes: ahorran en comida.']
];
