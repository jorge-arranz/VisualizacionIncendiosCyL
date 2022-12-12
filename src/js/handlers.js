/**********************
 ** By: Jorge Arranz **
 **********************/


/**
 * Manejador del slider selector de año
 */
function handlerSliderYear(){

    document.getElementById('selectedYear').innerHTML = document.getElementById('years').value;    
    d3.select("#mapa").selectAll("svg").remove();
    plotCyL(document.getElementById('years').value, document.getElementById('vars').value);

}

/**
 * Manejador del slider selector de variables del mapa.
 */
function handlerListVar(){

    plotCyL(document.getElementById('years').value, document.getElementById('vars').value);
}


/**
 * Manejador del slider selector de varables en el gráfico de líneas
 */
function handlerCheck(){

    reiniciar();
}