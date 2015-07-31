var db;

var inicializado = false;

var global_fdatos = {
    timestamp:null,
    valor:null
};

var posicion = {
    latitud:null,
    longitud:null
};

var fotos = [];

var app = {
    info: {
        estado_conexion:'',
        numero_estacion:0,
        usuario:null,
        crypt_password: 'H4ck.m4pP',
        
        remoteDB_url: 'http://104.131.40.56:5984/marke3',
        
        remoteDB_mail_url: 'http://104.131.40.56:5984/marke3_mail',
        
        version:1
    },

    
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);
    },
    
    
    onDeviceReady: function() {
        if (!window.inicializado) {
            $("#calificacion").rating({'size':'lg','starCaptions':{
    1: 'Una estrella',
    2: 'Dos estrellas',
    3: 'Tres estrellas',
    4: 'Cuatro estrellas',
    5: 'Cinco estrellas'
}});
            //app.receivedEvent('deviceready');
            window.inicializado = true;
            
            //Inicializa combobox
            $('.combobox').combobox();
            $(".combo-multiselect").each(function() {
                $(this).prop('name', $(this).prop('name') + '[]');
                $(this).multiselect();
            });

            p_('version_etiqueta').innerHTML = window.app.info.version;
            
            
            p_('boton_guardar').onclick = function() {
                //Obtención de documento a partir del formulario:
                var doc = p_generar_doc();

                p_guardar_formulario(doc);

                //salida:
                $('#vm_confirmar_guardado').modal('hide');
                p_registro();
            };

            $('#capacitacion').on('change', function() {
                p_validar_capacitacion();
            });

            p_('guardar').onclick = function() {

                $('#vm_confirmar_guardado').modal('show');
            };
            
            //////////////////////
            // geo-posicionamiento:
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    window.posicion.latitud = position.coords.latitude;
                    window.posicion.longitud = position.coords.longitude;
                });
                
                navigator.geolocation.watchPosition(function(position) {
                    window.posicion.latitud = position.coords.latitude;
                    window.posicion.longitud = position.coords.longitude;
                });
            }
            
            /////////////////
            // Validaciones:
            
            p_validar_cedula('entrevistado_cedula');
            p_validar_texto('entrevistado_nombres');
            p_validar_texto('entrevistado_apellidos');
            p_validar_texto('entrevistado_telefono', 10, '0-9');
            p_validar_texto('entrevistado_celular', 10, '0-9');
            p_validar_mail('entrevistado_email');


            app.geo();
            
            /////////////////
            // Base de datos
            
            app.conectarBdd();
        }
    },
    
    
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    
    
    conectarBdd: function() {
        console.log('en conectarBdd');
        window.db = new PouchDB('marke3');
        
        window.db.sync(window.app.info.remoteDB_url, {
            live: true,
            retry: true
        }).on('change', function (change) {
            p_inicializar_sistema();
        }).on('paused', function (info) {
            if (info) {
                p_mostrar_estado_conexion('offline');
            } else {
                p_mostrar_estado_conexion('online');
            }
        }).on('active', function (info) {
            p_mostrar_estado_conexion('online');
        }).on('denied', function (info) {
        }).on('complete', function (info) {
        }).on('error', function (err) {
        }).catch(function(err){
        });
        
        console.log('en conectarBdd 2');
        
        var remoteDB = new PouchDB(window.app.info.remoteDB_url).then(function(r){
            p_mostrar_estado_conexion('online');

            //////////////////////////////////////////////////////////
            // Obteniendo la cantidad de documentos locales y remotos:
            //l.allDocs({limit:0}).then(function(ll){
            //    // comentados todos los console.log //console.log('Docs en local: ' + ll.total_rows);
            //});

            //r.allDocs({limit:0}).then(function(rr){
            //    // comentados todos los console.log //console.log('Docs en remoto: ' + rr.total_rows);
            //});
            remoteDB = null;
            // comentados todos los console.log //console.log('--- --- ---');

        }).catch(function(err){
            p_mostrar_estado_conexion('offline');
            // comentados todos los console.log //console.log('Error en remoto: ', err);
        });
    },
    
    geo: (function(){
        //////////////////////////////
        // Manejo de info geográfica
        
        var bubble = false;

        var parroquia = null;
        var adm_zonal = null;
        var barrio = null;
        var canton = null;
        var provincia = null;
        
        return function() {
        
            // comentados todos los console.log //console.log('geo OK, bubble: ', app.geo.bubble);

            //parroquia = document.getElementById('parroquia');
            app.geo.barrio = $('#barrio');
            app.geo.parroquia = $('#parroquia');
            app.geo.adm_zonal = $('#adm_zonal');
            app.geo.canton = $('#canton');    
            app.geo.provincia = $('#provincia');
            app.geo.pais = $('#pais');


            app.geo.pais.on("change", function() {
                valor = app.geo.pais.val();

                if (valor != 'Ecuador') {
                    app.geo.provincia.val('');
                    app.geo.provincia.selectedIndex = 0;
                    app.geo.provincia.data('combobox').clearTarget();
                    app.geo.provincia.data('combobox').clearElement();
                    app.geo.provincia.change();
                }
            });

            app.geo.provincia.on("change", function() {
                en = this.options[this.selectedIndex].getAttribute('en');

                ubicacion = en ? en : '';

                // comentados todos los console.log //console.log('provincia ubicacion:', ubicacion);


                if (ubicacion != '') {
                    app.geo.pais.val(ubicacion);
                    app.geo.pais.data('combobox').refresh();
                    app.geo.pais.change();
                } else {
                    app.geo.canton.val('');
                    app.geo.canton.selectedIndex = 0;
                    app.geo.canton.data('combobox').clearTarget();
                    app.geo.canton.data('combobox').clearElement();
                    app.geo.canton.change();
                }
            });


            app.geo.canton.on("change", function() {
                en = this.options[this.selectedIndex].getAttribute('en');

                ubicacion = en ? en : '';

                // comentados todos los console.log //console.log('canton ubicacion:', ubicacion);


                if (ubicacion != '') {
                    app.geo.provincia.val(ubicacion);
                    app.geo.provincia.data('combobox').refresh();
                    app.geo.provincia.change();
                } else {
                    app.geo.adm_zonal.val('');
                    app.geo.adm_zonal.selectedIndex = 0;
                    app.geo.adm_zonal.data('combobox').clearTarget();
                    app.geo.adm_zonal.data('combobox').clearElement();
                    app.geo.adm_zonal.change();
                }
            });


            app.geo.adm_zonal.on("change", function() {
                en = this.options[this.selectedIndex].getAttribute('en');

                ubicacion = en ? en : '';

                // comentados todos los console.log //console.log('adm_zonal ubicacion:', ubicacion);

                if (ubicacion != '') {
                    app.geo.canton.val(ubicacion);
                    app.geo.canton.data('combobox').refresh();
                    app.geo.canton.change();
                } else {
                    app.geo.parroquia.val('');
                    app.geo.parroquia.selectedIndex = 0;
                    app.geo.parroquia.data('combobox').clearTarget();
                    app.geo.parroquia.data('combobox').clearElement();
                    app.geo.parroquia.change();
                }
            });


            app.geo.parroquia.on("change", function() {
                en = this.options[this.selectedIndex].getAttribute('en');

                ubicacion = en ? en : '';

                // comentados todos los console.log //console.log('parroquia ubicacion:', ubicacion);

                if (ubicacion != '') {
                    app.geo.adm_zonal.val(ubicacion);
                    app.geo.adm_zonal.data('combobox').refresh();
                    app.geo.adm_zonal.change();
                } else {
                    app.geo.barrio.val('');
                    app.geo.barrio.selectedIndex = 0;
                    app.geo.barrio.data('combobox').clearTarget();
                    app.geo.barrio.data('combobox').clearElement();
                    app.geo.barrio.change();
                }
            });

            app.geo.barrio.on("change", function() {
                en = this.options[this.selectedIndex].getAttribute('en');
                ubicacion = en ? en : '';

                // comentados todos los console.log //console.log('barrio ubicacion:', ubicacion);
                p_display('es_dmq', true);

                if (ubicacion == 'no') {
                    app.geo.parroquia.val('');
                    app.geo.parroquia.selectedIndex = 0;
                    app.geo.parroquia.data('combobox').clearTarget();
                    app.geo.parroquia.data('combobox').clearElement();
                    
                    app.geo.adm_zonal.val('');
                    app.geo.adm_zonal.selectedIndex = 0;
                    app.geo.adm_zonal.data('combobox').clearTarget();
                    app.geo.adm_zonal.data('combobox').clearElement();
                    
                    app.geo.canton.val('');
                    app.geo.canton.selectedIndex = 0;
                    app.geo.canton.data('combobox').clearTarget();
                    app.geo.canton.data('combobox').clearElement();
                    
                    p_display('es_dmq', (this.options[this.selectedIndex].value != 'no barrio dmq'));
                    
                } else if (ubicacion != '') {
                    app.geo.parroquia.val(ubicacion);
                    app.geo.parroquia.data('combobox').refresh();
                    app.geo.parroquia.change();
                }
            });
        };
    }()),
};

moment().format();
app.initialize();


function p_mostrar_estado_conexion(estado) {
    console.log('mostrando estado', estado);
    app.info.estado_conexion = estado;
    
    msg = p_('online_offline');
    if (estado == 'offline') {
        msg.innerHTML = 'offline';
        msg.style.color = '#696';
        msg.style.backgroundColor = '#030';
    } else if (estado == 'online') {
        msg.innerHTML = 'online';
        msg.style.color = '#FFF';
        msg.style.backgroundColor = '#3a3';
        
        //evento ONLINE
        //p_evaluar_metadata_sistema();
        //p_verificar_configuracion();
        p_inicializar_sistema();
    }
}

function p_inicializar_sistema() {
    //p_evaluar_metadata_sistema();

    //p_llenar_opciones_ubicaciones();
    
    //p_borrar_ordenes_correo_atendidas();
    
    
    
    p_poner_foco_en_nombre_usuario();
}


var nombre_usuario_sin_foco = true;

function p_poner_foco_en_nombre_usuario(forzar_foco) {
    forzar_foco = (typeof(forzar_foco) === 'undefined') ? false : forzar_foco;
    
    if (forzar_foco || window.nombre_usuario_sin_foco) {
        window.nombre_usuario_sin_foco = false;
        p_('usuario').focus();
    }
}


function p_alerta(msg) {
    p_('vm_alerta_mensaje').innerHTML = msg;
    $('#vm_alerta').modal('show');
}

function p_(target) {
    return document.getElementById(target);
}

function p_display(target, display) {

    var nodo = (typeof(target) == 'string') ? p_(target) : target;

    if (nodo) {
        var typeof_display = typeof(display);

        if (typeof_display == 'undefined') {
            display = (nodo.style.display != 'none');
        } else if (typeof_display == 'string' && display == 'cambio') {
            display = p_display(nodo, !p_display(nodo));
        } else {
            nodo.style.display = (display) ? '' : 'none';
            if (!display) {
                //si se oculta, borra todos los valores de los campos dentro:
                //var listado_campos = nodo.querySelectorAll(":scope > input,textarea,select");
                
                //var listado_campos = nodo.querySelectorAll("input");
                //// comentados todos los console.log //console.log('LISTADO querySelectorAll: ', listado_campos);
                //for (var i = 0; i < listado_campos.length; i++) {
                //    campo = listado_campos[i];
                    //p_valor(campo, '');
                //    if (campo.type == 'text' || campo.type == 'number') {
                //        campo.value = '';
                //    }
                //}
            }
        }
    }
    return display;
}


function p_select(target, value) {
    value = value || null;
    
    if (target) {
        var nodo = (typeof(target) == 'string') ? p_(target) : target;
        
        if (nodo.tagName.toLowerCase() == 'select') {
            if (value !== null) {
                // poner valor en select
                nodo.value = value;

            } else {
                // retornar valor de select
                value = nodo.options[nodo.selectedIndex].value;
            }
        }
    }
    return value;
}

function p_iniciar_sesion_usuario() {
    
    var usuario = p_('usuario').value;
    var clave = p_('clave').value;    
        
    /*
    //Cambiando base de usuarios
    var opciones = {
        include_docs : true,
        startkey : 'usuario|',
        endkey : 'usuario|\uffff', 
        //descending: true
    };
    db.allDocs(opciones).then(function(response) {
        // comentados todos los console.log //console.log('RESPONSE: ', response);
        //var doc = null;
        response.rows.forEach(function(resp){
            var doc = resp.doc;
            doc.clave = md5('S4luD' + doc.cedula);
            //doc.indice_apellidosnombres = '|usuario|' + doc.indice_apellidonombre;
            //doc.username = doc.cedula;
            //db.remove(doc);
            //doc._id = 'usuario|' + doc.cedula + '|operador';
            
            db.put(doc);
        });
    }).catch(function(err){
        // comentados todos los console.log //console.log('ERROR catch en traer todos los usuarios', err);
    });
    return;
    */
    
    
    
    /*
    //Borra todos los formularios
    var opciones = {
        include_docs : true,
        startkey : 'formulario|',
        endkey : 'formulario|\uffff', 
        //descending: true
    };
    db.allDocs(opciones).then(function(response) {
        // comentados todos los console.log //console.log('RESPONSE: ', response);
        //var doc = null;
        response.rows.forEach(function(resp){
            var doc = resp.doc;
            db.remove(doc);
        });
    }).catch(function(err){
        // comentados todos los console.log //console.log('ERROR catch en traer todos los usuarios', err);
    });
    return;
    */
    

    
    /*
    //borra todo menos config inicial:
    var opciones = {
        include_docs : true
        //descending: true
    };
    db.allDocs(opciones).then(function(response) {
        // comentados todos los console.log //console.log('RESPONSE: ', response);
        //var doc = null;
        response.rows.forEach(function(resp){
            var doc = resp.doc;
           
            
            if (doc._id != 'configuracion' && doc._id != 'listado_estaciones' && doc._id != 'secuencial|estaciones') {
                db.remove(doc);
            }
            
            //db.put(doc);
        });        
    }).catch(function(err){
        // comentados todos los console.log //console.log('ERROR catch en traer todos los usuarios', err);
    });
    return;
    */
    
    
/*
    window.db.bulkDocs([
{"_id":"usuario|1713175071","rol":"operador","cedula":"1713175071","clave":"1713175071","nombre":"Valarezo Edgar","telefono":"5101776","celular":"0998869770","email":"edgar.valarezo@gmail.com","indice_apellidosnombres":"|usuario|valarezoedgar"},
{"_id":"usuario|0401240353","rol":"operador","cedula":"0401240353","clave":"0401240353","nombre":"Huertas Vinicio","telefono":"2798291","celular":"0984404988","email":"vinicio.huertas@gmail.com","indice_apellidosnombres":"|usuario|huertasvinicio"},
{"_id":"usuario|1723224141","rol":"operador","cedula":"1723224141","clave":"1723224141","nombre":"Cisneros Salazar Gina Gabriela","telefono":"2372301","celular":"0992758637","email":"gabycisneros12@hotmail.com","indice_apellidosnombres":"|usuario|cisnerossalazarginagabriela"},
{"_id":"usuario|1716636392","rol":"operador","cedula":"1716636392","clave":"1716636392","nombre":"Dueñas Llumipanta Jéssica Solange","telefono":"2587418","celular":"0995034353","email":"jessi.s.d@hotmail.com","indice_apellidosnombres":"|usuario|duenasllumipantajessicasolange"},
{"_id":"usuario|1718097346","rol":"operador","cedula":"1718097346","clave":"1718097346","nombre":"Velastegui Montalvo Nadia Gabriela","telefono":"2340327","celular":"0984533832","email":"ngvelastegui@hotmail.com","indice_apellidosnombres":"|usuario|velasteguimontalvonadiagabriela"},
{"_id":"usuario|1002609160","rol":"operador","cedula":"1002609160","clave":"1002609160","nombre":"Guerrero Ipiales Milton Giovanny ","telefono":"2650476","celular":"0999835375","email":"geova1916@hotmail.com","indice_apellidosnombres":"|usuario|guerreroipialesmiltongiovanny"},
{"_id":"usuario|1003240593","rol":"operador","cedula":"1003240593","clave":"1003240593","nombre":"Luna Flores Christian Fernando","telefono":"2601162","celular":"0987083665","email":"chris.luna94@yahoo.es","indice_apellidosnombres":"|usuario|lunafloreschristianfernando"},
{"_id":"usuario|1313384172","rol":"operador","cedula":"1313384172","clave":"1313384172","nombre":"Molina Santacruz Gema Lisbeth","telefono":"052578319","celular":"0969850356 0984107419","email":"gemi_024@hotmail.com","indice_apellidosnombres":"|usuario|molinasantacruzgemalisbeth"},
{"_id":"usuario|1715112767","rol":"operador","cedula":"1715112767","clave":"1715112767","nombre":"Moreno Cruz Mónica Jaqueline","telefono":"2409829","celular":"0984142036","email":"mona.jmc90@gmail.com","indice_apellidosnombres":"|usuario|morenocruzmonicajaqueline"},
{"_id":"usuario|1714738018","rol":"operador","cedula":"1714738018","clave":"1714738018","nombre":"Pazmiño Tamayo Johanna Paola","telefono":" 2652 589 ","celular":"0984454995 ","email":"johannapaola1985@yahoo.es","indice_apellidosnombres":"|usuario|pazminotamayojohannapaola"},
{"_id":"usuario|1003612593","rol":"operador","cedula":"1003612593","clave":"1003612593","nombre":"Perugachi  Colta Beatriz Azucena","telefono":"063016968","celular":"0997626854","email":"banchis.bebe@hotmail.com","indice_apellidosnombres":"|usuario|perugachicoltabeatrizazucena"},
{"_id":"usuario|1715641310","rol":"operador","cedula":"1715641310","clave":"1715641310","nombre":"Reyes Ruiz María Emilia","telefono":"-----","celular":"0984681812","email":"mae.reyes@hotmail.com","indice_apellidosnombres":"|usuario|reyesruizmariaemilia"},
{"_id":"usuario|1719004440","rol":"operador","cedula":"1719004440","clave":"1719004440","nombre":"Riofrio Pazmiño Cecilia","telefono":"2445385","celular":"0995383048","email":"chechi_riofrio@hotmail.com","indice_apellidosnombres":"|usuario|riofriopazminocecilia"},
{"_id":"usuario|1720031812","rol":"operador","cedula":"1720031812","clave":"1720031812","nombre":"Ruiz Torres Johanna Paola","telefono":"3653338","celular":"0983512185 ","email":"joa_e5n2@hotmail.com","indice_apellidosnombres":"|usuario|ruiztorresjohannapaola"},
{"_id":"usuario|1721618260","rol":"operador","cedula":"1721618260","clave":"1721618260","nombre":"Sarria Salazar Alvaro Alejandro","telefono":"2078624","celular":"0984091298","email":"ale_sarria@hotmail.com","indice_apellidosnombres":"|usuario|sarriasalazaralvaroalejandro"},
{"_id":"usuario|17154378159","rol":"operador","cedula":"17154378159","clave":"17154378159","nombre":"Flores Artieda Gissel Carolina","telefono":"023550121","celular":"0999985937","email":"gissfartied@yahoo.com ","indice_apellidosnombres":"|usuario|floresartiedagisselcarolina"},
{"_id":"usuario|1714003272","rol":"operador","cedula":"1714003272","clave":"1714003272","nombre":"Castro Tandaza Michelle Alexandra ","telefono":"02291773","celular":"0984454891","email":"mact260692@gmail.com","indice_apellidosnombres":"|usuario|castrotandazamichellealexandra"},
{"_id":"usuario|1002914511","rol":"operador","cedula":"1002914511","clave":"1002914511","nombre":"Mier Chávez Doris Adriana ","telefono":"-------------","celular":"0987280422","email":"adry612y@hotmail.com ","indice_apellidosnombres":"|usuario|mierchavezdorisadriana"},
{"_id":"usuario|1003002100","rol":"operador","cedula":"1003002100","clave":"1003002100","nombre":"Vargas Vinueza María Belén","telefono":"-------------","celular":"0969037796","email":"mariabelenvv8@gmail.com","indice_apellidosnombres":"|usuario|vargasvinuezamariabelen"},
{"_id":"usuario|1003289970","rol":"operador","cedula":"1003289970","clave":"1003289970","nombre":"Recalde Vargas Flavio Anibal ","telefono":"-------------","celular":"0987677549","email":"farecalde@outlook.com","indice_apellidosnombres":"|usuario|recaldevargasflavioanibal"},
{"_id":"usuario|1002602744","rol":"operador","cedula":"1002602744","clave":"1002602744","nombre":"Lara Cárdenas Byron Santiago ","telefono":"062546170","celular":"0996541653","email":"bysant0403@yahoo.com","indice_apellidosnombres":"|usuario|laracardenasbyronsantiago"},
{"_id":"usuario|1003516182","rol":"operador","cedula":"1003516182","clave":"1003516182","nombre":"Díaz Ayala Marco Vinicio ","telefono":"0","celular":"0986509878","email":"linking_mark@hotmail.es","indice_apellidosnombres":"|usuario|diazayalamarcovinicio"},
{"_id":"usuario|1002754248","rol":"operador","cedula":"1002754248","clave":"1002754248","nombre":"Anrango Fernandez Clara Soledad","telefono":"-------------","celular":"0968509302","email":"soledadanrango@yahoo.es","indice_apellidosnombres":"|usuario|anrangofernandezclarasoledad"},
{"_id":"usuario|1003334149","rol":"operador","cedula":"1003334149","clave":"1003334149","nombre":"López Paredes Cristina Fernanda","telefono":"022609101","celular":"0986707428","email":"cris_fer2@yahoo.com","indice_apellidosnombres":"|usuario|lopezparedescristinafernanda"},
{"_id":"usuario|1002587606","rol":"operador","cedula":"1002587606","clave":"1002587606","nombre":"Guevara Castillo Washigton David","telefono":"022544298","celular":"0981106732","email":"david_guevarita@hotmail.com","indice_apellidosnombres":"|usuario|guevaracastillowashigtondavid"},
{"_id":"usuario|1721400586","rol":"operador","cedula":"1721400586","clave":"1721400586","nombre":"Carvajal Endara Maria Catalina","telefono":"022243536","celular":"0984189730","email":"mcatalina_ce@hotmail.com","indice_apellidosnombres":"|usuario|carvajalendaramariacatalina"},
{"_id":"usuario|1002847299","rol":"operador","cedula":"1002847299","clave":"1002847299","nombre":"García Huertas Andrea Elizabeth ","telefono":"-------------","celular":"0980703480","email":"anhy140219@hotmail.com","indice_apellidosnombres":"|usuario|garciahuertasandreaelizabeth"},
{"_id":"usuario|0201366507","rol":"operador","cedula":"0201366507","clave":"0201366507","nombre":"Alarcón Ramirez  Mercedes Hortencia ","telefono":"023034353","celular":"0990739268","email":"malarconr1973@hotmail.com","indice_apellidosnombres":"|usuario|alarconramirezmercedeshortencia"},
{"_id":"usuario|1711646982","rol":"operador","cedula":"1711646982","clave":"1711646982","nombre":"Concha Quinde Jenny Elizabeth ","telefono":"023132980","celular":"0995581077","email":"elizaje1611@hotmail.com","indice_apellidosnombres":"|usuario|conchaquindejennyelizabeth"},
{"_id":"usuario|1710981729","rol":"operador","cedula":"1710981729","clave":"1710981729","nombre":"Morales Moreno María Augusta ","telefono":"022630464","celular":"0995391215","email":"magusmoralesmoreno@yahoo.com","indice_apellidosnombres":"|usuario|moralesmorenomariaaugusta"},
{"_id":"usuario|1003918925","rol":"operador","cedula":"1003918925","clave":"1003918925","nombre":"Cañarejo Loachamin Cristian Mauricio ","telefono":"062919343","celular":"0982791414","email":"criss_maury@hotmail.com","indice_apellidosnombres":"|usuario|canarejoloachamincristianmauricio"},
{"_id":"usuario|1715141824","rol":"operador","cedula":"1715141824","clave":"1715141824","nombre":"Dominguez Ponce Dennis Alejandra ","telefono":"023006398","celular":"0986888177","email":"theblack-edu1977@hotmail.es","indice_apellidosnombres":"|usuario|dominguezponcedennisalejandra"},
{"_id":"usuario|0603935446","rol":"coordinador","cedula":"0603935446","clave":"0603935446","nombre":"Rivas Mariño Gabriela","telefono":"----------","celular":"0986241777","email":"gabrielarm19@gmail.com","indice_apellidosnombres":"|usuario|rivasmarinogabriela"},
{"_id":"usuario|1714434618","rol":"coordinador","cedula":"1714434618","clave":"1714434618","nombre":"Jarrín Arboleda Estefani Johanna","telefono":"022249660","celular":"0992719722","email":"estefani.jarrin@yahoo.com","indice_apellidosnombres":"|usuario|jarrinarboledaestefanijohanna"}
    ]);
    return;
*/    
    
/*
    //Cambiando base de usuarios
    var opciones = {
        include_docs : true,
        startkey : 'usuario|',
        endkey : 'usuario|\uffff', 
        //descending: true
    };
    db.allDocs(opciones).then(function(response) {
        // comentados todos los console.log //console.log('RESPONSE: ', response);
        //var doc = null;
        response.rows.forEach(function(resp){
            var doc = resp.doc;
            doc.clave = md5(window.app.info.crypt_password + doc.cedula);
            //doc.indice_apellidosnombres = '|usuario|' + doc.indice_apellidonombre;
            //doc.username = doc.cedula;
            //db.remove(doc);
            //doc._id = 'usuario|' + doc.cedula + '|operador';
            
            db.put(doc);
        });
    }).catch(function(err){
        // comentados todos los console.log //console.log('ERROR catch en traer todos los usuarios', err);
    });
    return;
*/    
    
/*    
//CON OPERADOR AL FINAL DEL _id:    
db.bulkDocs([
{"_id":"usuario|0201810652|operador","rol":"operador","cedula":"0201810652","clave":"0201810652","nombre":"Ruiz Masson Maria Victoria ","telefono":"247-8244","celular":"0983549141","email":"vicky_ruiz42@hotmail.com","indice_apellidonombre":"ruizmassonmariavictoria"},
{"_id":"usuario|2000048112|operador","rol":"operador","cedula":"2000048112","clave":"2000048112","nombre":"Bravo Pazmiño Katherine Stefanie","telefono":"2798291","celular":"0984404988","email":"beaustefy@gmail.com","indice_apellidonombre":"bravopazminokatherinestefanie"},
{"_id":"usuario|1723224141|operador","rol":"operador","cedula":"1723224141","clave":"1723224141","nombre":"Cisneros Salazar Gina Gabriela","telefono":"2372301","celular":"0992758637","email":"gabycisneros12@hotmail.com","indice_apellidonombre":"cisnerossalazarginagabriela"},
{"_id":"usuario|1716636392|operador","rol":"operador","cedula":"1716636392","clave":"1716636392","nombre":"Dueñas Llumipanta Jéssica Solange","telefono":"2587418","celular":"0995034353","email":"jessi.s.d@hotmail.com","indice_apellidonombre":"duenasllumipantajessicasolange"},
{"_id":"usuario|1718097346|operador","rol":"operador","cedula":"1718097346","clave":"1718097346","nombre":"Velastegui Montalvo Nadia Gabriela","telefono":"2340327","celular":"0984533832","email":"ngvelastegui@hotmail.com","indice_apellidonombre":"velasteguimontalvonadiagabriela"},
{"_id":"usuario|1002609160|operador","rol":"operador","cedula":"1002609160","clave":"1002609160","nombre":"Guerrero Ipiales Milton Giovanny ","telefono":"2650476","celular":"0999835375","email":"geova1916@hotmail.com","indice_apellidonombre":"guerreroipialesmiltongiovanny"},
{"_id":"usuario|1003240593|operador","rol":"operador","cedula":"1003240593","clave":"1003240593","nombre":"Luna Flores Christian Fernando","telefono":"2601162","celular":"0987083665","email":"chris.luna94@yahoo.es","indice_apellidonombre":"lunafloreschristianfernando"},
{"_id":"usuario|1313384172|operador","rol":"operador","cedula":"1313384172","clave":"1313384172","nombre":"Molina Santacruz Gema Lisbeth","telefono":"052578319","celular":"0969850356 0984107419","email":"gemi_024@hotmail.com","indice_apellidonombre":"molinasantacruzgemalisbeth"},
{"_id":"usuario|1715112767|operador","rol":"operador","cedula":"1715112767","clave":"1715112767","nombre":"Moreno Cruz Mónica Jaqueline","telefono":"2409829","celular":"0984142036","email":"mona.jmc90@gmail.com","indice_apellidonombre":"morenocruzmonicajaqueline"},
{"_id":"usuario|1714738018|operador","rol":"operador","cedula":"1714738018","clave":"1714738018","nombre":"Pazmiño Tamayo Johanna Paola","telefono":" 2652 589 ","celular":"0984454995 ","email":"johannapaola1985@yahoo.es","indice_apellidonombre":"pazminotamayojohannapaola"},
{"_id":"usuario|1003612593|operador","rol":"operador","cedula":"1003612593","clave":"1003612593","nombre":"Perugachi  Colta Beatriz Azucena","telefono":"063016968","celular":"0997626854","email":"banchis.bebe@hotmail.com","indice_apellidonombre":"perugachicoltabeatrizazucena"},
{"_id":"usuario|1715641310|operador","rol":"operador","cedula":"1715641310","clave":"1715641310","nombre":"Reyes Ruiz María Emilia","telefono":"-----","celular":"0984681812","email":"mae.reyes@hotmail.com","indice_apellidonombre":"reyesruizmariaemilia"},
{"_id":"usuario|1719004440|operador","rol":"operador","cedula":"1719004440","clave":"1719004440","nombre":"Riofrio Pazmiño Cecilia","telefono":"2445385","celular":"0995383048","email":"chechi_riofrio@hotmail.com","indice_apellidonombre":"riofriopazminocecilia"},
{"_id":"usuario|1720031812|operador","rol":"operador","cedula":"1720031812","clave":"1720031812","nombre":"Ruiz Torres Johanna Paola","telefono":"3653338","celular":"0983512185 ","email":"joa_e5n2@hotmail.com","indice_apellidonombre":"ruiztorresjohannapaola"},
{"_id":"usuario|1721618260|operador","rol":"operador","cedula":"1721618260","clave":"1721618260","nombre":"Sarria Salazar Alvaro Alejandro","telefono":"2078624","celular":"0984091298","email":"ale_sarria@hotmail.com","indice_apellidonombre":"sarriasalazaralvaroalejandro"},
{"_id":"usuario|17154378159|operador","rol":"operador","cedula":"17154378159","clave":"17154378159","nombre":"Flores Artieda Gissel Carolina","telefono":"023550121","celular":"0999985937","email":"gissfartied@yahoo.com ","indice_apellidonombre":"floresartiedagisselcarolina"},
{"_id":"usuario|1714003272|operador","rol":"operador","cedula":"1714003272","clave":"1714003272","nombre":"Castro Tandaza Michelle Alexandra ","telefono":"02291773","celular":"0984454891","email":"mact260692@gmail.com","indice_apellidonombre":"castrotandazamichellealexandra"},
{"_id":"usuario|1002914511|operador","rol":"operador","cedula":"1002914511","clave":"1002914511","nombre":"Mier Chávez Doris Adriana ","telefono":"-------------","celular":"0987280422","email":"adry612y@hotmail.com ","indice_apellidonombre":"mierchavezdorisadriana"},
{"_id":"usuario|1003002100|operador","rol":"operador","cedula":"1003002100","clave":"1003002100","nombre":"Vargas Vinueza María Belén","telefono":"-------------","celular":"0969037796","email":"mariabelenvv8@gmail.com","indice_apellidonombre":"vargasvinuezamariabelen"},
{"_id":"usuario|1003289970|operador","rol":"operador","cedula":"1003289970","clave":"1003289970","nombre":"Recalde Vargas Flavio Anibal ","telefono":"-------------","celular":"0987677549","email":"farecalde@outlook.com","indice_apellidonombre":"recaldevargasflavioanibal"},
{"_id":"usuario|1002602744|operador","rol":"operador","cedula":"1002602744","clave":"1002602744","nombre":"Lara Cárdenas Byron Santiago ","telefono":"062546170","celular":"0996541653","email":"bysant0403@yahoo.com","indice_apellidonombre":"laracardenasbyronsantiago"},
{"_id":"usuario|1003516182|operador","rol":"operador","cedula":"1003516182","clave":"1003516182","nombre":"Díaz Ayala Marco Vinicio ","telefono":"0","celular":"0986509878","email":"linking_mark@hotmail.es","indice_apellidonombre":"diazayalamarcovinicio"},
{"_id":"usuario|1002754248|operador","rol":"operador","cedula":"1002754248","clave":"1002754248","nombre":"Anrango Fernandez Clara Soledad","telefono":"-------------","celular":"0968509302","email":"soledadanrango@yahoo.es","indice_apellidonombre":"anrangofernandezclarasoledad"},
{"_id":"usuario|1003334149|operador","rol":"operador","cedula":"1003334149","clave":"1003334149","nombre":"López Paredes Cristina Fernanda","telefono":"022609101","celular":"0986707428","email":"cris_fer2@yahoo.com","indice_apellidonombre":"lopezparedescristinafernanda"},
{"_id":"usuario|1002587606|operador","rol":"operador","cedula":"1002587606","clave":"1002587606","nombre":"Guevara Castillo Washigton David","telefono":"022544298","celular":"0981106732","email":"david_guevarita@hotmail.com","indice_apellidonombre":"guevaracastillowashigtondavid"},
{"_id":"usuario|1721400586|operador","rol":"operador","cedula":"1721400586","clave":"1721400586","nombre":"Carvajal Endara Maria Catalina","telefono":"022243536","celular":"0984189730","email":"mcatalina_ce@hotmail.com","indice_apellidonombre":"carvajalendaramariacatalina"},
{"_id":"usuario|1002847299|operador","rol":"operador","cedula":"1002847299","clave":"1002847299","nombre":"García Huertas Andrea Elizabeth ","telefono":"-------------","celular":"0980703480","email":"anhy140219@hotmail.com","indice_apellidonombre":"garciahuertasandreaelizabeth"},
{"_id":"usuario|0201366507|operador","rol":"operador","cedula":"0201366507","clave":"0201366507","nombre":"Alarcón Ramirez  Mercedes Hortencia ","telefono":"023034353","celular":"0990739268","email":"malarconr1973@hotmail.com","indice_apellidonombre":"alarconramirezmercedeshortencia"},
{"_id":"usuario|1711646982|operador","rol":"operador","cedula":"1711646982","clave":"1711646982","nombre":"Concha Quinde Jenny Elizabeth ","telefono":"023132980","celular":"0995581077","email":"elizaje1611@hotmail.com","indice_apellidonombre":"conchaquindejennyelizabeth"},
{"_id":"usuario|1710981729|operador","rol":"operador","cedula":"1710981729","clave":"1710981729","nombre":"Morales Moreno María Augusta ","telefono":"022630464","celular":"0995391215","email":"magusmoralesmoreno@yahoo.com","indice_apellidonombre":"moralesmorenomariaaugusta"},
{"_id":"usuario|1003918925|operador","rol":"operador","cedula":"1003918925","clave":"1003918925","nombre":"Cañarejo Loachamin Cristian Mauricio ","telefono":"062919343","celular":"0982791414","email":"criss_maury@hotmail.com","indice_apellidonombre":"canarejoloachamincristianmauricio"},
{"_id":"usuario|1715141824|operador","rol":"operador","cedula":"1715141824","clave":"1715141824","nombre":"Dominguez Ponce Dennis Alejandra ","telefono":"023006398","celular":"0986888177","email":"theblack-edu1977@hotmail.es","indice_apellidonombre":"dominguezponcedennisalejandra"},
{"_id":"usuario|0603935446|operador","rol":"coordinador","cedula":"0603935446","clave":"0603935446","nombre":"Rivas Mariño Gabriela","telefono":"----------","celular":"0986241777","email":"gabrielarm19@gmail.com","indice_apellidonombre":"rivasmarinogabriela"},
{"_id":"usuario|1714434618|operador","rol":"coordinador","cedula":"1714434618","clave":"1714434618","nombre":"Jarrín Arboleda Estefani Johanna","telefono":"022249660","celular":"0992719722","email":"estefani.jarrin@yahoo.com","indice_apellidonombre":"jarrinarboledaestefanijohanna"}
    ]);
    return;
*/    
    
    
    //p_alerta(p_decifrar(p_cifrar('texto cualquiera')));
    //return;
    
    
    
    //p_('form_ubicacion').value = '';
    //p_('form_usuario_nombre').value = '';
    //p_('form_usuario_id').value = '';

    window.app.info.usuario = null;
    
    if (usuario && clave) {
        db.get('usuario|' + usuario).then(function(usuario){
        //db.get('usuario|0201810652').then(function(usuario){
            var clave = p_('clave').value;
            p_('clave').value = '';

            if (usuario.clave === window.md5(window.app.info.crypt_password + clave)) {
                //USUARIO ENCONTRADO

                if (!usuario.estado || usuario.estado !== 'bloqueado') {
                    //USUARIO ACTIVO
                    
                    console.log('USUARIO ACTIVO');


                    //var ubicacion = $('#usuario_ubicacion').val();

                    //////////////////////////////
                    // actualiza metadata usuario:

                    usuario.ultima_sesion_fecha = new Date().toJSON();
                    //usuario.ultima_sesion_ubicacion = ubicacion;
                    //usuario.ultima_sesion_estacion = window.app.info.numero_estacion;
                    //usuario.intentos_clave_olvidada = 0;


                    /////////////////////////////////
                    // menu del usuario para su rol:

                    p_display('menu_usuario', true);

                    if (usuario.rol == 'operador') {
                        p_display('menu_registro', true);
                    }

                    ///////////////////////
                    // pantalla de registro:

                    if (usuario.clave === window.md5(window.app.info.crypt_password + usuario.cedula) || usuario.clave === window.md5(window.app.info.crypt_password + usuario.celular)) {

                        p_cambio_clave('urgente');
                    } else {

                        //if (usuario.rol == 'operador') {
                            p_registro();
                        //}
                    }                            

                    db.put(usuario).then(function() {
                        ///////////////////////////////////////////
                        // registra usuario activo en el sistema:


                        //p_alerta('Usuario encontrado.');
                        //p_('usuario_msg').innerHTML = p_('usuario').value;
                        window.app.info.usuario = usuario;
                        

                        p_('form_usuario_id').value = usuario._id;
                        p_('form_usuario_nombre').value = usuario.nombre;
                        //p_('usuario_msg').innerHTML = p_('form_usuario_nombre').value;

                        p_('menu_usuario_nombre').innerHTML = usuario.nombre;




                        // comentados todos los console.log //console.log('metadata registrada de usuario logeado', usuario);
                    }).catch(function(err) {
                        console.log('ERROR en registrar metadata de usuario logeado', usuario, err);
                        p_ingreso('confirmado');
                        p_alerta('No se puede iniciar sesión.');
                    });

                } else {
                    // comentados todos los console.log //console.log('Usuario bloqueado.', usuario);
                    p_alerta('Usuario bloqueado. Contáctese con su supervisor.');
                }

            } else {
                // comentados todos los console.log //console.log('Clave incorrecta.', usuario.clave, window.md5('S4luD' + clave));
                p_alerta('Usuario no encontrado, o clave incorrecta.');
            }
        }).catch(function(err){
            // comentados todos los console.log //console.log('USUARIO NO ENCONTRADO', 'usuario|', usuario, err)
            p_('clave').value = '';
            p_alerta('Usuario no encontrado, o clave incorrecta.');
        });
    } else {
        p_alerta('Ingrese el nombre de usuario y la clave.');
    }
}


function p_ingreso(confirmacion) {
    
    
    if (typeof(confirmacion) == 'undefined'){
        //se debe confirmar
        if (p_display('registro')) {
            p_('boton_salir').onclick = function() {
                p_ingreso('confirmado');
            };
            
            $('#vm_confirmar_salida').modal('show');
        } else {
            p_ingreso('confirmado');
        }
    } else if (confirmacion == 'confirmado') {

        
        //FOCO en campo de nombre de usuario:
        p_poner_foco_en_nombre_usuario(true);
        window.nombre_usuario_sin_foco = true;
        
        
        //VENTANAS:
        window.app.info.usuario = null;

        p_display('ingreso', true);
        p_display('registro', false);
        p_display('cambio_clave', false);


        //MENU:
        p_display('menu_registro', false);
       

        //modal:
        $('#vm_confirmar_salida').modal('hide');
        
        //ubicacion
        //$('#usuario_ubicacion').val('');
        //$('#usuario_ubicacion').selectedIndex = 0;
        //$('#usuario_ubicacion').data('combobox').clearTarget();
        //$('#usuario_ubicacion').data('combobox').clearElement();
        
        //$('#usuario_ubicacion').data('combobox').refresh();
        
        
    }
}


function p_cambio_clave(tipo) {
    tipo = tipo || '';
    
    //VENTANAS:

    p_display('ingreso', false);
    p_display('registro', false);
    p_display('cambio_clave', true);


    //modal:
    $('#vm_confirmar_salida').modal('hide');
    
    
    //inicialización de campos
    p_('clave_actual').value = '';
    p_('nueva_clave').value = '';
    p_('nueva_clave_2').value = '';
    
    //mensajes
    p_display('cambio_clave_msg_urgente', (tipo == 'urgente'));
}


function p_cambiar_clave() {
    var clave_actual = p_('clave_actual').value || '';
    var nueva_clave = p_('nueva_clave').value || '';
    var nueva_clave_2 = p_('nueva_clave_2').value || '';
    
    if (app.info.usuario && md5(window.app.info.crypt_password + clave_actual) === app.info.usuario.clave) {
        if (nueva_clave === nueva_clave_2) {
            if (nueva_clave.length >= 8) {
                p_('clave_actual').value = '';
                p_('nueva_clave').value = '';
                p_('nueva_clave_2').value = '';
                //cambiando clave:
                //app.info.usuario.clave = md5('S4luD' + nueva_clave);
                db.get(app.info.usuario._id).then(function(usuario){
                    usuario.clave = md5(window.app.info.crypt_password + nueva_clave);
                    db.put(usuario).then(function(){
                        p_alerta('Nueva clave registrada con éxito.');
                        p_ingreso('confirmado');
                    }).catch(function(err){
                        // comentados todos los console.log //console.log('ERROR actualizando clave del usuario del sistema', usuario, err);
                        p_alerta('No se pudo cambiar la clave, error interno.');
                    });
                }).catch(function(err){
                    // comentados todos los console.log //console.log('ERROR obteniendo el usuario del sistema', app.info.usuario, err);
                    p_alerta('No se pudo cambiar la clave, error interno.');
                });
            } else {
                p_alerta('La clave es muy corta, debe tener 8 caracteres o más.');
            }
        } else {
            p_alerta('La repetición de la nueva clave no coincide.');
        }
    } else {
        p_alerta('La clave actual no es correcta.');
        p_ingreso('confirmado');
    }
}

function p_registro() {
    window.fotos = [];
    
    p_borrar_datos_formulario();

    
    //VENTANAS:
    
    p_display('ingreso', false);
    p_display('registro', true);
    p_display('cambio_clave', false);

}


function p_borrar_datos_formulario() {
    
    ////////////////////////////
    // BORRANDO TODOS LOS DATOS:

    p_('fdatos').reset();
    //$('#fdatos').trigger('reset');
    

    //////////////////////////
    //Borrado de los combobox:

    var fnodo;

    $('#fdatos select.combobox').each(function(i){ // Solo select, también hay input dinámicos con esa clase combobox
        fnodo = $(this);
        fnodo.val('');
        fnodo.selectedIndex = 0;        
        fnodo.data('combobox').clearTarget();
        //fnodo.data('combobox').clearElement(); //le pone foco, sí parece que funciona sin este clearElement
    });
    return;

    ///////////////////////////////////
    // Borrado de los combo multiselect

    $('#fdatos select.combo-multiselect option:selected').each(function(i){ 
        $(this).prop('selected', false);

    });

    $('#fdatos select.combo-multiselect').each(function(i){ 
        $(this).multiselect('refresh');

    });
    
    

    /////////////////////////////////////
    // Valor geográfico por defecto:
    
    $('#provincia').val('PICHINCHA');
    $('#provincia').data('combobox').refresh();
    $('#provincia').change();
    
    ///////////
    // FOTO:
    
    p_('imagen1').src = "img/logo.png";
        

    /////////////////////////////////////////////////
    // Inicializacion de validaciones del formulario

    p_inicializar_formulario();


    ////////////////////////////////////////////////////////////
    // Puesto el foco en la primera pestaña, en el primer campo:

    //$('#mi_datos_personales_tab').trigger('click');
    //$('#tipo_doc_identidad').focus();
}


function p_inicializar_formulario() {
    //css de validacion

    p_('entrevistado_correo').parentNode.parentNode.classList.remove('has-error');
    p_('entrevistado_correo').parentNode.parentNode.classList.remove('has-success');
       
    p_('provincia').onchange();
    
    
    $('#barrio').change();
    
    p_validar_capacitacion();

    //semaforos


}


function p_validar_numero(input_id, max_digitos, max_decimales) {
    var input = (typeof(input_id) == 'string') ? p_(input_id) : input_id;
    //input = $(input); //JQuery
    
    max_digitos = max_digitos || 0;
    max_decimales = max_decimales || 0;
    
    if (input) {
        //// comentados todos los console.log //console.log('XXX En p_validar_numero para input: ' + input_id, input);
        input.setAttribute('type', 'number');
        //input.attr('type', 'number'); //JQuery
        
        var placeholder = max_digitos + ' dígito' + (max_digitos == 1 ? '' : 's') + (max_decimales > 0 ? ', ' + max_decimales + ' decimal' + (max_decimales == 1 ? '' : 'es'): '');
        input.setAttribute('placeholder', placeholder);
        //input.attr('placeholder', placeholder); //JQuery
        
        input.setAttribute('step', '1');
        //input.attr('step', '1'); //JQuery
        
        input.setAttribute('min', '0');
        //input.attr('min', '0'); //JQuery
        
        input.setAttribute('pattern', '');
        //input.attr('pattern', ''); //JQuery
        
        var max = Math.pow(10, max_digitos) - 1;
        input.setAttribute('max', max);
        //input.attr('max', max); //JQuery
        
        input.addEventListener('keypress', function(event){
        //input.on('keypress', function(event){ //JQuery
            
            var charCode = (event.which) ? event.which : event.keyCode;
            
            // comentados todos los console.log //console.log('KEYPRESS, charCode: ' + charCode);
            if (max_decimales > 0 && charCode == 46 && event.srcElement.value.split('.').length > 1) {
            //if (max_decimales > 0 && charCode == 46 && (event.srcElement || event.target).value.split('.').length > 1) { //JQuery
                event.preventDefault();
                // comentados todos los console.log //console.log('KEYPRESS preventDefault 1', input);
                return false;
            }
            if ((max_decimales == 0 || charCode != 46) && charCode > 31 && (charCode < 48 || charCode > 57)) {
                event.preventDefault();
                // comentados todos los console.log //console.log('KEYPRESS preventDefault 2', input);
                return false;
            }
            
            //Si es decimal y es punto, que pase sin comprobar el numero:
            if (max_decimales != 0 && charCode == 46) {
                return true;
            }
            
            //Comprobando el número;
            var next_input_value = input.value + String.fromCharCode(charCode);
            var v = parseFloat(next_input_value) || 0;
            //v = parseFloat(input.val()) || 0; //JQuery
            
            if (v.toString() != next_input_value) {
                //// comentados todos los console.log //console.log('no coincide: [v.toString():'+ v.toString()+'] != [this.value:'+ this.value+']');
                input.value = v; //problema con el punto decimal, cuando está a medio ingresar la cantidad
            }
            
            // comentados todos los console.log //console.log('En '+input_id+'.addEventListener:keypress: max_digitos:'+max_digitos+', max_decimales:'+max_decimales+', v:'+v);
            if (max_digitos > 0 && v > Math.pow(10, max_digitos) - 1) {
                //input.value = (v / 10) | 0;
                event.preventDefault();
                return false;
                //// comentados todos los console.log //console.log('En '+input_id+'.addEventListener:input: value:'+input.value);
            }
            
            factor_decimal = Math.pow(10, max_decimales);
            v = parseInt(v * factor_decimal) || 0;
            v = v / factor_decimal;
            
            if (v < parseFloat(next_input_value)) {
            //if (v < parseFloat(input.val())) {
                //input.value = v;
                event.preventDefault();
                return false;
            }
            

            return true;
        });
        
        /*
        input.addEventListener('input', function(){
        //input.on('input', function(event){ //JQuery
            var v = parseFloat(input.value) || 0;
            //v = parseFloat(input.val()) || 0; //JQuery
            
            if (v.toString() != input.value) {
                //// comentados todos los console.log //console.log('no coincide: [v.toString():'+ v.toString()+'] != [this.value:'+ this.value+']');
                //input.value = v; //problema con el punto decimal, cuando está a medio ingresar la cantidad
            }
            
            // comentados todos los console.log //console.log('En '+input_id+'.addEventListener:input: max_digitos:'+max_digitos+', max_decimales:'+max_decimales+', v:'+v);
            if (max_digitos > 0 && v > Math.pow(10, max_digitos) - 1) {
                input.value = (v / 10) | 0;
                //input.val(v); //JQuery
                //// comentados todos los console.log //console.log('En '+input_id+'.addEventListener:input: value:'+input.value);
            }
            
            factor_decimal = Math.pow(10, max_decimales);
            v = parseInt(v * factor_decimal) || 0;
            v = v / factor_decimal;
            
            if (v < parseFloat(input.value)) {
            //if (v < parseFloat(input.val())) {
                input.value = v;
                //input.val(v); //JQuery
            }
            
        });
        */
        
    }
}


function p_validar_texto(input_id, max_chars, regexp_chars, nuevo_placeholder) {
    var input = (typeof(input_id) == 'string') ? p_(input_id) : input_id;
    
    max_chars = max_chars || 0;
    regexp_chars = regexp_chars || 'a-zA-ZñÑáéíóúÁÉÍÓÚ ';
    nuevo_placeholder = nuevo_placeholder || null;
    
    //var re = new RegExp("a|b", "i"); //var re = /a|b/i;
    
    if (input) {
        
        input.setAttribute('type', 'text');
        
        var msg_max_chars = '';
        
        if (max_chars > 0) {
            input.setAttribute('maxlength', max_chars);
            msg_max_chars = ' hasta ' + max_chars + ' caracter' + (max_chars == 1 ? '' : 'es');
        }
        
        if (nuevo_placeholder) {
            input.setAttribute('placeholder', nuevo_placeholder);
        } else {
            input.setAttribute('placeholder', 'Ingrese texto' + msg_max_chars);
        }
        
        
                
        input.addEventListener('keypress', function(event){
            
            var charCode = (event.which) ? event.which : event.keyCode;
            var charStr = String.fromCharCode(charCode);
            
            //if (/[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+/.test(charStr)) {
            if (!(new RegExp('[' + regexp_chars + ']+').test(charStr))) {                
                event.preventDefault();
                // comentados todos los console.log //console.log('validacion text KEYPRESS preventDefault 1');
                return false;
            }

            var next_input_value = input.value + String.fromCharCode(charCode);
            var v = next_input_value.replace(new RegExp('[^' + regexp_chars + ']+', 'g'), '').replace(/[ ]+/g, ' ') || '';
            
            if (v != next_input_value) {
                event.preventDefault();
                // comentados todos los console.log //console.log('validacion text KEYPRESS preventDefault 2', v, next_input_value);
                return false;
            }

            return true;
            
        });
        
        /*
        input.addEventListener('input', function(){
            //var v = input.value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ ]+/g, '').replace(/[ ]+/g, ' ') || '';
            var v = input.value.replace(new RegExp('[^' + regexp_chars + ']+', 'g'), '').replace(/[ ]+/g, ' ') || '';
            
            if (v != input.value) {
                input.value = v;
            }
        });
        */
    }
}


//////


function p_validar_mail(input_id) {
    var input = (typeof(input_id) == 'string') ? p_(input_id) : input_id;
    
    if (input) {
        p_validar_texto(input, 100, '0-9@\\.a-zA-Z-_\\+');
                
        input.setAttribute('placeholder', 'Ingrese correo electrónico');
                
        input.addEventListener('keypress', function(event){
            var charCode = (event.which) ? event.which : event.keyCode;
            
            var next_input_value = input.value + String.fromCharCode(charCode);
            
            //if (/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(next_input_value)) {
            if (/^[a-zA-Z0-9\.-_\+]+@[a-zA-Z0-9-_\+]+\.[a-zA-Z\.]+$/.test(next_input_value)) {
                // comentados todos los console.log //console.log('EMAIL si valida');

                input.parentNode.parentNode.classList.remove('has-error');
                input.parentNode.parentNode.classList.add('has-success');
            }else{
                // comentados todos los console.log //console.log('EMAIL no valida');

                input.parentNode.parentNode.classList.remove('has-success');
                input.parentNode.parentNode.classList.add('has-error');
            }

            return true;
            
        });
        
        /*
        input.addEventListener('input', function(){
            //var v = input.value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ ]+/g, '').replace(/[ ]+/g, ' ') || '';
            var v = input.value.replace(new RegExp('[^' + regexp_chars + ']+', 'g'), '').replace(/[ ]+/g, ' ') || '';
            
            if (v != input.value) {
                input.value = v;
            }
        });
        */
    }
}


//function p_validar_texto(input_id, max_digitos, max_decimales) {
function p_validar_cedula(input_id) {
    var input = (typeof(input_id) == 'string') ? p_(input_id) : input_id;
    
    var max_chars = 10;
    
    if (input) {
        input.setAttribute('type', 'text');
        
        input.setAttribute('maxlength', max_chars);

        input.setAttribute('placeholder', 'Ingrese número de cédula válido');
                
                
        input.addEventListener('keypress', function(event) {
            
            var charCode = (event.which) ? event.which : event.keyCode;
            
            // comentados todos los console.log //console.log('KEYPRESS, charCode: ' + charCode);
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                event.preventDefault();
                // comentados todos los console.log //console.log('cedula keypress preventDefault');
                return false;
            }

            return true;
        });
        
        input.addEventListener('input', function() {
            
        });
    }
}


function p_comprobar_numero_cedula(cedula) {

    if (typeof(cedula) == 'string' && cedula.length == 10 && /^\d+$/.test(cedula)) {
        var digitos = cedula.split('').map(Number);
        var codigo_provincia = digitos[0] * 10 + digitos[1];

        if (codigo_provincia >= 1 && codigo_provincia <= 24 && digitos[2] < 6) {
            var digito_verificador = digitos.pop();

            var digito_calculado = digitos.reduce(function(valorPrevio, valorActual, indice) {
                return valorPrevio - (valorActual * (2 - indice % 2)) % 9 - (valorActual == 9) * 9;
            }, 1000) % 10;

            return (digito_calculado === digito_verificador);
        }
    }
    return false;
}


function p_validar_capacitacion() {

    p_display('capacitacion_otro_detalle', false);
    
    
    target = $('#capacitacion');
    if (target && target.val()) {
        target.val().forEach(function(opcion) {
            v = opcion;
            if (v.indexOf('Otro') != -1) {
                p_display('capacitacion_otro_detalle', true);
            }
        });
    }
}

function p_tomar_foto() {
    
    try{
    navigator.camera.getPicture(onSuccess, onFail, { 
        quality: 50,
        targetWidth: 200,
        targetHeight: 300,
        //destinationType: navigator.camera.DestinationType.FILE_URI,
        destinationType: navigator.camera.DestinationType.DATA_URL,
        correctOrientation: true
    });
    } catch(e) {
        alert(e);
    }
    
    //function onSuccess(imageURI) {
    function onSuccess(imageData) {
        var image = p_('imagen1');
        //image.src = imageURI;
        image.src = "data:image/png;base64," + imageData;
        
        window.fotos.push(imageData);
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }

}


function p_guardar_formulario(doc) {
    
    db.put(doc).then(function(){
        console.log('FFFFformulario guardado');
    }).catch(function(err){
        console.log('ERROR en guardar formulario',err);
    });
    
}

function p_borrar_formulario() {
    
}

function p_generar_doc() {
    var doc;
    
    if (window.global_fdatos.timestamp && window.global_fdatos.valor && (+new Date()) - window.global_fdatos.timestamp < 10) {
        //Si se generó otro doc en el instante anterior:
        doc = window.global_fdatos.valor;        
    } else {
        var ahora = new Date().toJSON();
        
        doc = JSON.parse($('#fdatos').serializeJSON());
        // comentados todos los console.log //console.log('EN generar DOC',doc);

        //registro de metadata:

        //doc.estado_conexion = p_('online_offline').innerHTML;
        doc.estado_conexion = app.info.estado_conexion;
        doc.version_sistema = app.info.version;

        
        doc.latitud = window.posicion.latitud;
        doc.longitud = window.posicion.longitud;

        
        doc._id = 'formulario|' + doc.tipo_doc_identidad + '|'+ doc.numero_doc_identidad + '|'+ ahora +'|'+ Math.random();

        doc.creado = ahora;
        doc.modificado = ahora;
        doc.organizacion_tipo_color = p_obtener_color_tipo_organizacion();

        //doc.creado_por = p_('usuario').value;
        //doc.modificado_por = p_('usuario').value;
        doc.creado_por = $('#form_usuario_id').val();
        doc.creado_por_nombre = $('#form_usuario_nombre').val();

        doc.modificado_por = $('#form_usuario_id').val();
        doc.modificado_por_nombre = $('#form_usuario_nombre').val();

        doc.indice_apellidosnombres = p_generar_indice_busqueda(doc.apellidos + doc.nombres);
        //doc.indice_nombresapellidos = p_generar_indice_busqueda(doc.nombres + doc.apellidos);

        doc.indice_fecha = doc.creado;


        doc.indice_usuario = doc.creado_por + '|' + doc.creado;
        doc.indice_usuario_apellidosnombres = doc.creado_por + '|' + doc.indice_apellidosnombres + '|' + doc.creado;
        
        
        window.fotos.forEach(function(foto){
            
        });
        
        
        console.log('WINDOW.FOTO', window.fotos)
        var foto = (window.fotos && window.fotos[0]) ? window.fotos[0] : '';
        
        doc._attachments = {
            'imagen1.png' : {
                content_type: 'image/png',
                data: foto
            }
        };
        

        
        window.global_fdatos.valor = doc;
    }
    window.global_fdatos.timestamp = +new Date();
    
    return doc;
}

function p_obtener_color_tipo_organizacion() {
    
    var nodo = p_('organizacion_tipo');
    var color = 'gray';
    
    //if (nodo.selectedIndex && nodo.selectedIndex >= 0) {
    //    color = nodo.options[nodo.selectedIndex].getAttribute('color');
    //} 
    
    return color;
}


function p_generar_indice_busqueda(text) {
      var text = (text || '').trim().toLowerCase(); // a minusculas
      text = text.replace(/[áàäâå]/g, 'a');
      text = text.replace(/[éèëê]/g, 'e');
      text = text.replace(/[íìïî]/g, 'i');
      text = text.replace(/[óòöô]/g, 'o');
      text = text.replace(/[úùüû]/g, 'u');
      text = text.replace(/[ýÿ]/g, 'y');
      text = text.replace(/[ñ]/g, 'n');
      text = text.replace(/[ç]/g, 'c');
      text = text.replace(/['"]/g, '');
      text = text.replace(/[^a-zA-Z0-9-]/g, ''); 
      text = text.replace(/\s+/g, '');
      text = text.replace(/' '/g, '');
      text = text.replace(/(_)$/g, '');
      text = text.replace(/^(_)/g, '');
      return text;
}

function p_cancelar_registro() {
    p_inicio();
}