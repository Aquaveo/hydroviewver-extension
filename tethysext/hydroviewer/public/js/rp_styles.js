var StylesLayers = function(){
    var two_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(254,240,1,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })
    
    this.five_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(253,154,1,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })
    
    this.ten_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(255,56,5,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })
    
    this.twenty_five_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(255,0,0,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })
    
    this.fifty_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(128,0,106,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })
    
    this.hundred_year_warning_style = new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'rgba(128,0,246,1)' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
            points: 3,
            radius: 10,
            angle: 0
        })
    })


    this.hundred_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(128,0,246,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(128,0,246,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(128,0,246,1)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(128,0,246,0.4)',
            width: 1
        })
    })];
    
    this.fifty_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(128,0,106,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(128,0,106,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(128,0,106,1)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(128,0,106,0.4)',
            width: 1
        })
    })];
    
    this.twenty_five_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(255,0,0,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,1)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(255,0,0,0.4)',
            width: 1
        })
    })];
    
    //symbols
    this.ten_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(255,56,5,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(255,56,5,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(255,56,5,1)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(255,56,5,0.4)',
            width: 1
        })
    })];
    
    this.five_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(253,154,1,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(253,154,1,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(253,154,1,1)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(253,154,1,0.4)',
            width: 1
        })
    })];
    
    this.two_symbols = [new ol.style.RegularShape({
        points: 3,
        radius: 5,
        fill: new ol.style.Fill({
            color: 'rgba(254,240,1,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(254,240,1,1)',
            width: 1
        })
    }), new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({
            color: 'rgba(254,240,1,0.4)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(254,240,1,1)',
            width: 1
        })
    })];
    
    // functions //
    var create_rules = function(properties){
        var sld_rules = ''
        for (const element of properties) {
            sld_rules +=
            `<Rule>
            <Name>${element['val']}</Name>
            <ogc:Filter>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>${element['names']}</ogc:PropertyName>
                <ogc:Literal>${element['val']}</ogc:Literal>
              </ogc:PropertyIsEqualTo>
            </ogc:Filter>
            <LineSymbolizer>
              <Stroke>
                <CssParameter name="stroke">${element['stroke_color']}</CssParameter>
                <CssParameter name="stroke-width">${element['stroke_width']}</CssParameter>
              </Stroke>
            </LineSymbolizer>
          </Rule>`;
        };
        return sld_rules
    }
    
    this.create_style = function(layer,properties){
        console.log(layer);
        //Display styling for the selected watershed boundaries
        var sld_string =
            '<StyledLayerDescriptor version="1.0.0"\
            xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"\
            xmlns="http://www.opengis.net/sld"\
            xmlns:ogc="http://www.opengis.net/ogc"\
            xmlns:xlink="http://www.w3.org/1999/xlink"\
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'+
            '<NamedLayer><Name>' +
            layer +
            '</Name><UserStyle><FeatureTypeStyle>' +
            create_rules(properties) +
            '</FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';
        return sld_string
    }
    this.get_two_year_warning_style = function(){
        return two_year_warning_style
    }
    

};

















