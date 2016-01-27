import {EventEmitter} from 'events'

var CHANGE_EVENT = "change";

export default class BaseStore extends EventEmitter{
    
    constructor() {
        super();
    }

    emitChange() {
        this.emit(CHANGE_EVENT);
    }

    /**
     * @param {function} callback
     */
    addChangeListener(callback) {
        this.on(CHANGE_EVENT, callback);
    }

    /**
     * @param {function} callback
     */
    removeChangeListener(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }

    ajax (method ,path ,cb ,data ) {
        
        var xhr = null;
        try{ xhr = new XMLHttpRequest(); }catch(e){
            try{ xhr = new ActiveXObject("Msxml2.XMLHTTP"); }catch (e){
                console.log("tinyxhr: XMLHttpRequest not supported");
                return null;
            }
        }

        xhr.open(method.toUpperCase(), path);
        xhr.onreadystatechange = function(){
            if (xhr.readyState != 4) return;

            var res = JSON.parse(xhr.responseText);
            var error = false;
            if (xhr.status !== 200) {
                error = true;  
            } 
            cb(error, res, xhr.status);
        };

        var getParams = function(data, url) {
            var arr = [], str;
            for(var name in data) {
                if(Array.isArray(data[name])) {
                    var arrayData = data[name];
                    for (var i = 0; i < arrayData.length; i++) {
                        arr.push(name+"[]" + '=' + encodeURIComponent(arrayData[i]));
                    }
                }else {
                    arr.push(name + '=' + encodeURIComponent(data[name]));    
                }
            }
            str = arr.join('&');
            if(str != '') {
                return url ? (url.indexOf('?') < 0 ? '?' + str : '&' + str) : str;
            }
            return '';
        }

        var formData = null;
        if(typeof data === 'object') {
            
            xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');
            formData = getParams(data);
        }

        xhr.send(formData);
    }
}