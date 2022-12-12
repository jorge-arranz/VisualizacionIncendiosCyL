/**********************
 ** By: Jorge Arranz **
 **********************/

/**
 * Referencias utilzadas
 *  Proyectos de otros años
 *  - https://desi_20-21.pages.gitlab.inf.uva.es/evolucioncoronavirusencyl/
 *  - https://gitlab.inf.uva.es/desi_20-21/consumoelectricidadcyl
 *  
 *  Otras:
 *  - https://d3-graph-gallery.com/graph/connectedscatter_multi.html
 */


// Definimos area de dibujo
const WIDTH_LINECHART = 400;
const HEIGHT_LINECHART = 250;

const margin_x = 50;
const margin_y = 90;


// Paleta de colores en formato diccionario
const PALETA_LINE = {"superficie": 'brown',
                     "sequia"    : 'blue' };

// Variables globales para los ejes
var x, y1, y2;


// Array para seleccionar qué indicadores se van a representar
// Valores iniciales:
var listaIndicadores = ["sequia","superficie"]; 

// Uso de Nº de incendios para el tamaño del punto de la superficie incendiada
var usaIncendios = false;

// Variable que nos ayuda a recordar que provincia pintar al reiniciar
var provIni;

/**
 * Traza un gráfico de líneas con dos ejes, que representan a cada uno de los dos indicadores posibles
 * 
 * @param {*} listaIndicadores 
 * @param {*} provincia 
 */
function plotLineChart(listaIndicadores, provincia){
 
    // Guardamos la primera provincia
    provIni = provincia;

    // Eliminamos lo que pudiera haber
    d3.select("#lineas").selectAll("svg").remove();

    var svg = d3.select("#lineas")
                .append("svg")
                .attr("width", WIDTH_LINECHART + margin_x + margin_x)
                .attr("height", HEIGHT_LINECHART + margin_y + margin_y).append("g")
                .attr("transform", "translate(" + margin_x + "," + margin_y + ")");

    //Añadimos una etiqueta para el eje y izquierdo
    svg.append("text") 
        .text("% Precipitación normal")
        .style("font-size","10pt").attr("x",-38).attr("y",-5);
    
    // Añadimos una etiqueta para el eje y derecho
    svg.append("text") 
        .text("Ha")
        .style("font-size","10pt").attr("x",WIDTH_LINECHART).attr("y",-5);

    // Título
    svg.append("text") 
        .text(`Evolución de las precipitaciones y superficie incendiada`)
        .style("font-size","13pt")
        .style("font-weight", "bold")
        .attr("x", -30).attr("y",-70);

    // Título
    svg.append("text") 
        .text(provincia)
        .style("font-size","15pt")
        .attr("x", 170).attr("y",-40);
    
    //Leemos los datos del csv
    d3.csv(DATA_CSV).then(function (data) {

    // Aseguramos que las variables sean numéricas
    data.forEach(function(d) {
        
        d.fecha = +d.fecha;
        d.incendio = +d.incendio;
        d.sequia = +d.sequia;
        d.superficie = +d.superficie;
    
    });
   
    // Seleccionamos los datos solo de la provincia que nos interesa
    var datos = data.filter(function(d){return d.provincia==provincia});



    var valoresSequia = []; //Array donde guardo los valores de Sequia
    var valoresSup = []; //Array donde guardo los valores de Superficie Incendiada

    var maximoSeq = 0;
    var maximoSup = 0;

    //Bucle para cada provincia donde cojo todos los datos de cada provincia y busco el maximo de ellos para usarlo en el dominio de la y
    
    for (i = 0; i<datos.length; i++)
    {
        valoresSequia[i] = +datos[i].sequia;
        valoresSup[i]    = +datos[i].superficie;
    }

    //Maximo de la provincia
    maximoSeq = d3.max(valoresSequia); 
    maximoSup = d3.max(valoresSup);

    x = d3.scaleLinear()
            .rangeRound([0, WIDTH_LINECHART])
            .domain(d3.extent(data, function(d) { return (d.fecha); }));
    
    var x_axis = d3.axisBottom(x).ticks(16);

    // Eje para los datos de sequia
    y1 = d3.scaleLinear()
            .rangeRound([HEIGHT_LINECHART, 0])
            .domain([0, maximoSeq+10]);

    var y_axis_left = d3.axisLeft(y1).ticks(10);

    // Eje para los datos de superficie
    y2 = d3.scaleLinear()
            .rangeRound([HEIGHT_LINECHART, 0])
            .domain([0 ,maximoSup+10]);

    var y_axis_right = d3.axisRight(y2).ticks(10);


   if(listaIndicadores.length!=0){
        var pares = []; 
        
        for (i=0;i<datos.length-1;i++){
            pares[i]=[];
        }
        

        
        for (i=1;i<datos.length;i++){ 
            pares[i-1][0]=datos[i-1]; 
            pares[i-1][1]=datos[i];
        }

        var lineas = svg.append("g").selectAll("line"); //Para representar las lineas
        var circulos = svg.append("g").selectAll("circle"); //Para representar los puntos

        var representaSequia = false;
        var representaSupInc = false;
        
        // Comprobamos cual de las líneas hay que representar        
        switch(listaIndicadores.length){
            // No es posible el 0 por que sino no hubieramos entrado en esta sección del código
            case 1:
                // Solo representamos un indicador
                if(listaIndicadores[0] == 'sequia'){
                    // Representamos los datos de la sequía
                    representaSequia = true;
                    
                }else{
                    representaSupInc = true;
                }
                break;
            
            case 2:
                representaSequia = true;
                representaSupInc = true;
                break;
            default:
                console.log('ERROR EN LA SELECCIÓN DE VARIABLES');
        }

        
        if(representaSequia)
        {
            lineas.data(pares)
                    .enter()
                    .append("line")
                    .attr("id","seq")
                    .style("stroke",PALETA_LINE["sequia"])
                    .style("stroke-width",function(pares){ if(pares[1].fecha != 2016) return 2; else return 0} )
                    .attr("class","line")
                    .on("mouseover",ratonSobreLinea)
                    .on("mouseout",ratonFueraLinea)
                 
                    .transition().duration(1000)
                    .attr("x1",function(pares){return x(pares[0].fecha)})
                    .attr("x2",function(pares){return x(pares[1].fecha)})
                    .attr("y1",function(pares){return y1(Math.round(pares[0].sequia))})
                    .attr("y2",function(pares){return y1(Math.round(pares[1].sequia))});
                       


            circulos.data(datos) 
                    .enter()
                    .append("circle")
                    .attr("r", 2)
                    .attr("class", "seqCircle")
                    .attr("id","seq")
                    .on("mouseover",ratonSobrePunto) 
                    .on("mouseout",ratonFueraPunto)

                    .transition().duration(1000)
                    .attr("cx",function(datos){return x(datos.fecha)})
                    .attr("cy",function(datos){return y1(Math.round(datos.sequia))})
                    .attr("fill",PALETA_LINE['sequia'])

        }

        if(representaSupInc)
        {
            lineas.data(pares)
                    .enter()
                    .append("line")
                    .attr("id","sup")
                    .style("stroke",PALETA_LINE["superficie"])
                    .style("stroke-width","2px")
                    .attr("class","line")
                    .on("mouseover",ratonSobreLinea)
                    .on("mouseout",ratonFueraLinea)

                    .attr("x1",function(pares){return x(pares[0].fecha)})
                    .attr("x2",function(pares){return x(pares[1].fecha)})
                    
                    .transition().duration(1000)
                    .attr("y1",function(pares){return y2(Math.round(pares[0].superficie))})
                    .attr("y2",function(pares){return y2(Math.round(pares[1].superficie))});

            circulos.data(datos)
                    .enter()
                    .append("circle")
                    .attr("r",function(datos){if(usaIncendios) {return 0.01*datos.incendio; }else{return 2;}})
                    .attr("class", "supCircle")
                    .attr("id","sup")
                    .on("mouseover",ratonSobrePunto)
                    .on("mouseout",ratonFueraPunto)
                    .transition().duration(1000)
                    .attr("cx",function(datos){return x(datos.fecha)})
                    .attr("cy",function(datos){return y2(Math.round(datos.superficie))}) 
                    .attr("fill",PALETA_LINE['superficie']);
             
        }
        
   } 

 

    svg.append("g").attr("class", "y_axis_left").call(y_axis_left); 

    // Añadimos la rejilla para el eje y	
    svg.append("g")
     .attr("class", "grid")
     .call(y_axis_left
         .tickSize(-WIDTH_LINECHART)
         .tickFormat("")   
        )
    
    svg.append("g")
        .attr("class", "y_axis_right")
        .call(y_axis_right)
        .attr("transform", "translate("+WIDTH_LINECHART+", 0)");

    svg.append("g")
     .attr("class", "gridright")

    
    svg.append("g")
        .attr("transform", "translate("+WIDTH_LINECHART+", 0)")
        .call(y_axis_right);
     
    svg.append("g").attr("class", "x axis")
                    .attr("transform", "translate(0," + HEIGHT_LINECHART + ")")
                    .call(x_axis)
                    .selectAll('text')
                    .attr('dx', '-2.5em')
                    .attr('dy', '.1em')
                    
                    .attr("transform", "rotate(-65)");
    

    });


    /******************
     * EVENTOS PUNTOS *
     ******************/

    function ratonSobrePunto (event, i){
        var idElemento = this.id; 

        // Hacemos transparentes todos los elementos
        d3.selectAll("#sup")        
            .style('opacity', 0.2);

        d3.selectAll("#seq")
            .style('opacity', 0.2);

        // Selecionamos la linea y el resto de puntos de la misma variable
        d3.selectAll("#"+this.id).transition().duration(1000)
            .style("opacity",1);

        // Selecionamos el texto para el cuadro resumen
        var indica, unidades, valor;
        if(idElemento == "seq"){
            indica = y1(this.__data__.sequia);
            unidades = 'Precipitaciones: ';
            valor = this.__data__.sequia + '%';
            
        }else{
            indica = y2(this.__data__.superficie);
            unidades = 'Ha incendiadas: ';
            valor = this.__data__.superficie;
        }

        
        var ff = this.__data__.fecha;
        var radio = d3.select(this).attr("r");

        // Agrandamos el punto
        d3.select(this)
            .style("opacity", 1)
            .attr("r", 2*radio); 

        // Caja para el texto
        svg.append("rect") 
        .attr("id","caja1")
        .attr("x",function(){return x(ff)-31;})
        .attr("y",indica - 55)
        .attr("height",48)
        .attr("width",90)
        .style("stroke","black")
        .style("fill","white");

        // Año
        svg.append("text") 
        .attr("id","texto")
        .style("font-size","9pt")
        .attr("x", function(){return x(ff)-28;})
        .attr("y", indica - 40)
        .text('Año: ' + ff); 

        // Unidades
        svg.append("text") 
        .attr("id","texto")
        .style("font-size","9pt")
        .attr("x", function(){return x(ff)-28;})
        .attr("y", indica - 25)
        .text(unidades); 

        svg.append("text") //Añadimos el texto sobre la fecha
        .attr("id","texto") // Le ponemos un id para poder luego borrarlo haciendo referencia a el
        .style("font-size","9pt")
        .attr("x", function(){return x(ff)-28;})
        .attr("y", indica - 10)
        .text(valor); 

    }

//Funcion para el evento de quitar el raton sobre el punto en el que estaba
   function ratonFueraPunto(event, i){

        radio = d3.select(this).attr("r");

        d3.select(this)
            .attr("r", 0.5*radio); //Devolvemos el punto a su tamaño original

        d3.selectAll("#texto").remove(); //Borramos todo lo añadido en la funcion onMouseOverPoint
        d3.select("#caja1").remove();
        
    
        d3.selectAll("#sup").style('opacity', 1);
        d3.selectAll("#seq").style('opacity', 1);
   }

}

/**
 * Reinicia el gráfico y representa las variables seleccionadas en el checkbox
 * 
 */
function reiniciar(){

    // Eliminamos los elementos que pudiera haber
    d3.select("#lineas").selectAll("svg").remove();

    //Vaciamos la lista de indicadores
    listaIndicadores = []; 
    
    d3.select("input[id=sequia]").each(function(d){
        if (this["checked"]==true){
            listaIndicadores.push("sequia");
        }

    });
    d3.select("input[id=superficie]").each(function(d){
        if (this["checked"]==true){
            listaIndicadores.push("superficie");
        }

    });

    // El número de incendios se utiliza como factor multiplicador al tamaño 
    d3.select("input[id=incendio]").each(function(d){
        usaIncendios = this["checked"];
    });

    plotLineChart(listaIndicadores, provIni);
}

/******************
 * EVENTOS LINEAS *
 ******************/

/**
 * Controlador del raton que ejecuta las acciones cuando el ratón se posiciona sobre una linea del gráfico
 * Baja la opacidad.
 * 
 */
function ratonSobreLinea(event, i){
    //Guardamos el identificador del elemento bajo el raton
    var idElemento = this.id; 
    if(idElemento == 'seq'){
        d3.selectAll("#sup").transition().duration(50).style('opacity', 0.2);
    }else{
        d3.selectAll('#seq').transition().duration(50).style('opacity', 0.2);
    }

}

/**
 * Controlador del raton que ejecuta las acciones cuando el ratón abandona una linea del gráfico
 * Recupera la opacidad total.
 *  
 */
function ratonFueraLinea(){
    d3.selectAll("#sup").style('opacity', 1);
    d3.selectAll("#seq").style('opacity', 1);
}
