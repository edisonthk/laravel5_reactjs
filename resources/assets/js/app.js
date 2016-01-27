import routesMap from './Route'

if(typeof __SERVER === 'undefined') {
    ReactDOM.render(routesMap, document.getElementById("main"));    
}
