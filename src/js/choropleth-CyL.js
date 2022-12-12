/**********************
 ** By: Jorge Arranz **
 **********************/
/**
 * Referencias utilizadas
 *  Proyectos de otros años
 *  - https://gitlab.inf.uva.es/desi_20-21/muertesviolenciapolicialeeuu
 *  - https://gitlab.inf.uva.es/desi_20-21/muertesmenorescincoanios
 * 
 *  Otras
 *  - https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
 */

// Definimos area de dibujo
const WIDTH_MAP = 700;
const HEIGHT_MAP = 400;

// Paleta de colores en formato diccionario
const paleta = {
  "incendio":   [ "rgb( 250, 219, 216)",
                  "rgb( 255,  51,  30)",
                  "rgb( 162,  28,  12)",
                  "rgb( 135, 135, 135)"],

   "sequia":    [ "rgb(  50, 235, 238)",
                  "rgb(  36, 113, 163)",
                  "rgb(  46,  64,  83)", 
                  "rgb( 135, 135, 135)"],

  "superficie": [ "rgb( 246, 221, 204)",
                  "rgb( 235, 152,  78)",
                  "rgb( 147,  81,  22)",
                  "rgb( 135, 135, 135)"]};

// Limites de cada grupo

const INCENDIO_MIN = 150;
const INCENDIO_MAX = 300;

const SEQUIA_MIN = 80;
const SEQUIA_MAX = 130;

const SUPERFICIE_MIN = 500;
const SUPERFICIE_MAX = 1000;


// La utilizamos para obtener información sobre si es la primera o la segunda pulsación sobre la misma provincia
var lastProv;


/**
 * Función principal.
 * Muestra los datos para el año y variable seleccionada
 * 
 * @param {int} year Obtenido del slider
 * @param {String} selectedVar Obtenido de la selectBox
 */
function plotCyL(year, selectedVar){

  // Construimos la leyenda
  leyenda(selectedVar);
  
  // Eliminamos todo lo que pudiera haber anteriormente
  d3.select("#mapa").selectAll("svg").remove();

  
  // Abrimos el geoJson
  d3.json(MAP_DATA).then((mapData)=>{

    var svg = d3.select("#mapa")
            .append("svg")
            .attr("width", WIDTH_MAP)
            .attr("height", HEIGHT_MAP);
              
    // Proyeccion
    var projection = d3.geoMercator();
    var geoPath = d3.geoPath(projection);
              
    // Calculo tamaño original, calculando los valores maximos y minimos de las coordenadas x e y del mapa
    var Xmax = 0;
    var Xmin = WIDTH_MAP;
    var Ymax = 0;
    var Ymin = HEIGHT_MAP;

    numPaths = mapData.features.length;
    
    mapData.features.forEach(function(data2,i)
    {
      var bordeInfX = geoPath.bounds(data2)[0][0];
      if (bordeInfX < Xmin) 
      {
        Xmin = bordeInfX;
      }

      var bordeInfY = geoPath.bounds(data2)[0][1];
      if (bordeInfY < Ymin)
      {
        Ymin = bordeInfY;
      }

      var bordeSupX = geoPath.bounds(data2)[1][0];
      if (bordeSupX > Xmax) 
      {
        Xmax = bordeSupX;
      }

      var bordeSupY = geoPath.bounds(data2)[1][1];
      if (bordeSupY > Ymax)
      {
        Ymax = bordeSupY;
      }
                
    });
              

    var porcentajeAjuste = 0.9 // se ajusta el grafico a este porcentaje de la ventana

    var proporcionX = WIDTH_MAP / (Xmax - Xmin); // se ve cuantas veces puedo aumentar en esta dimension
    var proporcionY = HEIGHT_MAP / (Ymax - Ymin); // idem para Y

    if (proporcionX < proporcionY) // ajusto al porcentaje maximo en la dimension X
    { 
      var escala = Math.floor((WIDTH_MAP*porcentajeAjuste)/(Xmax-Xmin));
    } else{  
        var escala = Math.floor((HEIGHT_MAP*porcentajeAjuste)/(Ymax-Ymin));
    }

    // Multiplicador de escala
    escala = escala*projection.scale();
    
    projection = d3.geoMercator().scale(escala);
    geoPath = d3.geoPath(projection);
              
              
              
              
    // Se calcula el centro de cada path (Provincia), y con estos el del centro del mapa,
    // ajustando este al centro del elemento svg
              
    var centroX = 0;
    var centroY = 0;
    var numPaths = mapData.features.length;
    mapData.features.forEach(function(data2,i)
    {

      centroX = centroX + geoPath.centroid(data2)[0];
      centroY = centroY + geoPath.centroid(data2)[1];
    
    });

    centroX = centroX / numPaths;
    centroY = centroY / numPaths;

    
    var offsetX = projection.translate()[0];  
    var offsetY = projection.translate()[1];
      
    var transX = Math.floor((WIDTH_MAP/2)-centroX)+offsetX;
    var transY = Math.floor((HEIGHT_MAP/2)-centroY)+offsetY;
    
      
    projection = projection.translate([transX,transY]);
    geoPath = d3.geoPath(projection);
          

    d3.csv(DATA_CSV).then(function(data) {
  
      data.forEach(function(data)
      {
        /*******************************
         * AÑADIMOS LOS DATOS AL JSON **
         *******************************/
        var dataProvincia = data.provincia;

        var dataIncendio = data.incendio;
        var dataSequia = data.sequia;
        var dataSuperficie = data.superficie;

        var dataFecha = data.fecha; 
        

        mapData.features.forEach(function(features)
        {

          var mapProvincia = features.properties.provincia;


          if (dataProvincia == mapProvincia && dataFecha == year) {
          
            // Añadimos los datos a cada provincia del año seleccionado
            features.properties.incendio    = dataIncendio;
            features.properties.sequia      = dataSequia;
            features.properties.superficie  = dataSuperficie;

            features.properties.fecha       = dataFecha;
            
            // Colores
            features.properties.colorIncendio   = coloresMapa(dataIncendio, 'incendio');
            features.properties.colorSequia     = coloresMapa(dataSequia, 'sequia');
            features.properties.colorSuperficie = coloresMapa(dataSuperficie, 'superficie');

          }


        });
        
      });

    
      
      //Dibujamos el mapa 
      svg.selectAll("path")
          .data(mapData.features)
          .enter()
          .append("path")
        
          // ATRIBUTOS
          .attr("d", geoPath)
          .attr("provincia",  function (d) { return d.properties.provincia;  })
          .attr("incendio",   function (d) { return d.properties.incendio;   })
          .attr("sequia",     function (d) { return d.properties.sequia;     })
          .attr("superficie", function (d) { return d.properties.superficie; })

          // STYLE
          .style("opacity", 0.95)
          .style("stroke", "black")
          .style("fill", function(d) {
                // Pintamos la variable seleccionada
                var valor;

                switch(selectedVar)
                {
                  case 'incendio':
                    valor = d.properties.incendio;
                    
                    if (valor) {  return d.properties.colorIncendio; } else { return paleta["incendio"][3] /*No hay datos*/; }
                  case 'sequia':
                    valor = d.properties.sequia;
                    if (valor) {  return d.properties.colorSequia; } else { return paleta["sequia"][3] /*No hay datos*/; }
                  case 'superficie':
                        valor = d.properties.superficie;
                        if (valor) {  return d.properties.colorSuperficie; } else { return paleta["superficie"][3] /*No hay datos*/ }
                }
                

              })

          // EVENTS
          .on("click", function(d, prov){muestraLineChart(prov);})
          .on("mousemove", handlerMouseOver)
          .on("mouseout", handlerMouseOut);
    });


          
  })
};    
              

/**
* Función para crear la leyenda
* @param {String} selectedVar 
*/
function leyenda(selectedVar)
{

  // Eliminamos lo que pudiera haber
  d3.select("#leyenda").selectAll("svg").remove();


  var texto;
  var titulo;

  switch(selectedVar){
    case 'incendio':
      texto = ["< " + INCENDIO_MIN, INCENDIO_MIN + " - " + INCENDIO_MAX, "> " + INCENDIO_MAX],'';
      titulo = 'Nº de incendios forestales';
      break;
    
    case 'sequia':
      texto = ["< " + SEQUIA_MIN + "%", SEQUIA_MIN + " - " + SEQUIA_MAX + "%", ">"+ SEQUIA_MAX + "%",''];
      titulo = '% Precipitación normal';
      break;
    
    case 'superficie':
      texto = ["< "+ SUPERFICIE_MIN + "Ha", SUPERFICIE_MIN + " - " + SUPERFICIE_MAX + "Ha", ">" + SUPERFICIE_MAX + "Ha",''];
      titulo = 'Hectáreas incenciadas';
      break;

  }

  color    = paleta[selectedVar];
  texto[3] = "No hay datos disponibles";

  // creamos la leyenda
  var svg = d3.select("#leyenda")
              .append("svg");

  // Anadimos los rectangulos que representaran cada color de la leyenda y el texto correspondiente
  var leyenda      = svg.append("g");
  var textoLeyenda = svg.append("g");

  for (i = 0; i < color.length; i++){
    // Color
    leyenda.append('rect')
            .style("fill",color[i])
            .attr("x", 20)
            .attr("y", 45 + 20*i)
            .attr("width", 30)
            .attr("height", 20);
    
    // Texto
    textoLeyenda.append('text')
                .style("font-size", "15px")
                .style("font-weight", "bold")
                .attr("x", 60)
                .attr("y", 60 + 20*i)
                .text(texto[i]);

  }



  svg.append('text')
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .attr("x", 20)
      .attr("y", 25)
      .text(titulo);

};


/**
 * Devuelve el color de la categoría del valor introducido según el indicador
 * 
 * @param {int} valor 
 * @param {Sring} indicador 
 * @returns 
 */
function coloresMapa(valor, indicador)
{

    var color;

    switch(indicador)
    {
      case 'incendio':
        color = paleta['incendio'];

        if(valor < INCENDIO_MIN ){ colorDato = color[0]}
        else if (valor >= INCENDIO_MIN  && valor < INCENDIO_MAX ){ colorDato = color[1]}
        else if (valor >= INCENDIO_MAX  ){ colorDato= color[2]}

      break;
      
      case 'sequia':
        color = paleta['sequia'];

        if(valor < SEQUIA_MIN ){ colorDato = color[0]}
        else if (valor >= SEQUIA_MIN  && valor < SEQUIA_MAX ){ colorDato = color[1]}
        else if (valor >= SEQUIA_MAX  ){ colorDato= color[2]}

      break;
      
      case 'superficie':
        color = paleta['superficie'];

        if(valor < SUPERFICIE_MIN ){ colorDato = color[0]}
        else if (valor >= SUPERFICIE_MIN  && valor < SUPERFICIE_MAX ){ colorDato = color[1]}
        else if (valor >= SUPERFICIE_MAX  ){ colorDato= color[2]}

      break;
      

    }
    
  return colorDato;
};



/**
 * Muestra u oculta el gráfico de líneas de la provincia seleccionada
 * 
 * @param {JSON} prov 
 */
function muestraLineChart(prov){

  if(lastProv != prov){
    
    // Muestra el gráfico de líneas
    d3.select('#checkLineas').style("display","block");
    d3.select('#lineas').style('display', 'block');
    plotLineChart(listaIndicadores, prov.properties.provincia);
    lastProv = prov;


  }else{

    // Si el gráfico actual corresponde a la provincia seleccionada lo oculta
    d3.select('#checkLineas').style("display","none");
    d3.select('#lineas').style('display', 'none');
    muestraGrafico = true;
    lastProv = '';
  }
  
}


/**
 * Manejador del ratón cuando se sitúa sobre una provincia.
 * Muestra la información resumida y resalta la provincia en cuestión.
 * 
 */
function handlerMouseOver()
{
        
  // borramos lo que pudiera haber en la etiqueta
  document.getElementById("infoResumen").innerHTML="";

  // Resalta la provincia seleccionada
  d3.selectAll("path").style("opacity", .1);
  d3.select(this).style("opacity", 1);

  // Obtenemos la posición del ratón
  function position(event)
  {
    var x = event.clientX;
    var y = event.clientY;
    return{x,y}
  }

  
  // posRaton contiene las coordenadas {x, y} de la posicion del ratón en la pantalla
  posRaton = position(event);

  // colocamos la etiqueta en la posicion relativa al raton que queremos
  posRaton.x = posRaton.x - 205;
  posRaton.y = posRaton.y - 95;

  // modificamos la posicion del div que contiene la etiqueta para que aparezca donde hemos establecido
  d3.select("#infoResumen")
                          .style("display","block") // cambiamos la visibilidad del div que inicialmente estaba oculto
                          .style("left", posRaton.x+"px")
                          .style("top" ,posRaton.y+"px");

  // creamos un elemento svg para representar la etiqueta mediante un rectangulo con borde al que introducimos texto
  var svg = d3.select("#infoResumen")
                                    .append("svg")
                                    .attr("width", 200)
                                    .attr("height", 90);

  var etiqueta = svg.append("g");

  // Obtenemos los datos que vamos a mostrar
  
  var provincia = this.__data__.properties.provincia;
  var inc = this.__data__.properties.incendio;
  var seq = this.__data__.properties.sequia;
  var sup = this.__data__.properties.superficie;
            
  // Nombre de la provincia
  etiqueta.append("text")
                        .style("font-size", "15px")
                        .style("font-weight", "bold")
                        .attr("x", 10)
                        .attr("y", 20)
                        .text(provincia);

  // Nº de incendios  
  etiqueta.append("text")
                        .style("font-size", "15px")
                        .attr("x", 10)
                        .attr("y", 40)
                        .text("Nº de indendios: "+inc);

  // Periodos de sequía
  etiqueta.append("text")
                        .style("font-size", "15px")
                        .attr("x", 10)
                        .attr("y", 60)
                        .text("% de precipitación: "+seq);

  // Superficie incendiada
  etiqueta.append("text")
                        .style("font-size", "15px")
                        .attr("x", 10)
                        .attr("y", 80)
                        .text("Superficie incendiada: "+sup);
}

/**
 * Devuelve el mapa a la situación normal
 * 
 */
function handlerMouseOut()
{
  // Volvemos recuperar la misma tonalidad
  d3.selectAll("path").style("opacity", 1);

  // Vaciamos el contenido del div donde hemos creado la etiqueta y lo ocultamos
  document.getElementById("infoResumen").innerHTML="";
  d3.select("#infoResumen").style("display","none");

}


