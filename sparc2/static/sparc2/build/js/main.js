var buildGroupsAndColumnsForCountry = function(chartConfig, popatrisk_config)
{
  var groups = [[]];
  var columns = [];

  if (chartConfig.hazard == "cyclone")
  {
    $.each(popatrisk_config["data"]["summary"]["prob_class"], function(prob_class, value){
      var data = value["by_month"];
      //
      columns.push([prob_class].concat(data));
      groups[0].push(prob_class);
    });
  }
  else if(chartConfig.hazard == "drought")
  {
    for(var i = 0; i < chartConfig.groups.length; i++)
    {
      var group_prefix = chartConfig.group_prefix;
      var group_key = chartConfig.group_key;
      var group_modifier = chartConfig.group_modifier;
      var g = chartConfig.groups[i];
      var data = popatrisk_config["data"]["summary"][group_key][""+(g * group_modifier)]["by_month"];
      //
      columns.push([group_prefix+g].concat(data));
      groups[0].push(group_prefix+g);
    }
    columns.reverse();
  }
  else if(chartConfig.hazard == "flood")
  {
    for(var i = 0; i < chartConfig.groups.length; i++)
    {
      var group_prefix = chartConfig.group_prefix;
      var group_key = chartConfig.group_key;
      var g = chartConfig.groups[i];
      var group_modifier = chartConfig.group_modifier;
      var data = popatrisk_config["data"]["summary"][group_key][""+(g * group_modifier)]["by_month"];
      //
      columns.push([group_prefix+g].concat(data));
      groups[0].push(group_prefix+g);
    }
    columns.reverse();
  }

  return {'groups': groups, 'columns': columns};
};
var buildGroupsAndColumnsForAdmin2 = function(chartConfig, popatrisk_config, admin2_code)
{
  var groups = [[]];
  var columns = [];

  if(chartConfig.hazard == "flood")
  {
    for(var i = 0; i < chartConfig.returnPeriods.length; i++)
    {
      var rp = chartConfig.returnPeriods[i];
      var data = popatrisk_config["data"]["summary"]["admin2"][admin2_code]["rp"][""+rp]["by_month"];
      //
      columns.push(['rp'+rp].concat(data));
      groups[0].push('rp'+rp);
    }
    columns.reverse();
  }
  else if (chartConfig.hazard == "cyclone")
  {
    $.each(popatrisk_config["data"]["summary"]["admin2"][admin2_code]["prob_class"], function(prob_class, value){
      var data = value["by_month"];
      //
      columns.push([prob_class].concat(data));
      groups[0].push(prob_class);
    });
  }
  return {'groups': groups, 'columns': columns};
};
var buildHazardChart = function(chartConfig, popatrisk_config, options)
{
  var gc = undefined;
  if(chartConfig.type == "bar")
  {
    var groups = [[]];
    var columns = [];
    if(options != undefined && options.groups != undefined && options.columns != undefined)
    {
      gc = {
        "groups": options.groups,
        "columns": options.columns
      };
    }
    else
    {
      gc = buildGroupsAndColumnsForCountry(chartConfig, popatrisk_config);
    }
    var barConfig = undefined;
    if(chartConfig.subtype=="bullet")
    {
      barConfig =
      {
        bullet: true,
        width: function(d, i)
        {
          return d.id == "rp25" ? 8 : 16;
        },
        offset: function(d, i)
        {
          return 0;  // Stacks bar chartActuals on top of each other
        }
      };
      if(options != undefined && options.bullet_width != undefined)
      {
        barConfig["width"] = options.bullet_width;
      }
    }
    else
    {
      barConfig = {
        width: {
          ratio: 0.6
        }
      };
    }
    var axisConfig = {"x":{}, "y": {}};
    if(chartConfig.axis != undefined && chartConfig.axis.x != undefined)
    {
      if(chartConfig.axis.x.type == "months")
      {
        axisConfig["x"]["tick"] = {
          format: function (x){return months_short_3[x].toTitleCase();}
        };
      }
    }
    axisConfig["y"]["label"] = chartConfig.axis.y.label;
    axisConfig["y"]["tick"] = {format: d3.format("s,")};
    var chartActual = c3.generate({
      bindto: '#'+chartConfig.id,
      data: {
        columns: gc.columns,
        groups: gc.groups,
        type: 'bar',
        colors: chartConfig.colors
      },
      axis : axisConfig,
      bar: barConfig
    });
  }
};

geosite.config = {
  'click_radius': 2.0
};

var init_start = function(appName)
{
  var url_popatrisk_summary = geosite.map_config["featurelayers"]["popatrisk"]["urls"]["summary"]
    .replace("{iso3}", geosite.initial_state["iso3"])
    .replace("{hazard}", geosite.initial_state["hazard"]);

  var url_popatrisk_geojson = geosite.map_config["featurelayers"]["popatrisk"]["urls"]["geojson"]
    .replace("{iso3}", geosite.initial_state["iso3"])
    .replace("{hazard}", geosite.initial_state["hazard"]);

  var url_context_summary = geosite.map_config["featurelayers"]["context"]["urls"]["summary"]
    .replace("{iso3}", geosite.initial_state["iso3"]);

  var url_context_geojson = geosite.map_config["featurelayers"]["context"]["urls"]["geojson"]
    .replace("{iso3}", geosite.initial_state["iso3"]);

  var url_vam_geojson = geosite.map_config["featurelayers"]["vam"]["urls"]["geojson"]
    .replace("{iso3}", geosite.initial_state["iso3"]);

  $.when(
    $.ajax({dataType: "json", url: url_popatrisk_summary}),
    $.ajax({dataType: "json", url: url_popatrisk_geojson}),
    $.ajax({dataType: "json", url: url_context_summary}),
    $.ajax({dataType: "json", url: url_context_geojson}),
    $.ajax({dataType: "json", url: url_vam_geojson})
  ).done(function(
    response_popatrisk_summary,
    response_popatrisk_geojson,
    response_context_summary,
    response_context_geojson,
    response_vam_geojson
    ){
    geosite.initial_data["layers"]["popatrisk"]["data"]["summary"] = response_popatrisk_summary[0];
    geosite.initial_data["layers"]["popatrisk"]["data"]["geojson"] = response_popatrisk_geojson[0];
    geosite.initial_data["layers"]["context"]["data"]["summary"] = response_context_summary[0];
    geosite.initial_data["layers"]["context"]["data"]["geojson"] = response_context_geojson[0];
    geosite.initial_data["layers"]["vam"]["data"]["geojson"] = response_vam_geojson[0];
    init_main_app(appName);
  });
};

var init_main_app = function(appName)
{
  geosite.app = app = angular.module(appName, ['ngRoute','ngSanitize']);

  if(geosite.templates != undefined)
  {
    $.each(geosite.templates, function(name, template){
      app.run(function($templateCache){$templateCache.put(name,template);});
    });
  }

  if(geosite.filters != undefined)
  {
    $.each(geosite.filters, function(name, func){ app.filter(name, func); });
  }

  if(geosite.directives != undefined)
  {
    $.each(geosite.directives, function(name, dir){ app.directive(name, dir); });
  }

  app.factory('state', function(){return $.extend({}, geosite.initial_state);});
  app.factory('stateschema', function(){return $.extend({}, geosite.state_schema);});
  app.factory('popatrisk_config', function(){return $.extend({}, geosite.initial_data["layers"]["popatrisk"]);});
  app.factory('context_config', function(){return $.extend({}, geosite.initial_data["layers"]["context"]);});
  app.factory('map_config', function(){return $.extend({}, geosite.map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers": {
        "popatrisk":undefined
      }
    };
  });

  /*
  init_sparc_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geosite.init_controller_base(app);

  init_sparc_controller_main($('.geosite-controller.geosite-main'), app);

  angular.bootstrap(document, [appName]);
};

var init_sparc_controller = function(that, app)
{
  var controllerName = that.data('controllerName');
  var controllerType = that.data('controllerType');

  app.controller(controllerName, function($scope, $element) {

    init_intents($($element), $scope);

  });
};

geosite.style_cyclone = function(f, state, map_config, popatrisk_config)
{
  var style = {};
  var filters = state["filters"]["popatrisk"];
  var prob_class_max = filters["prob_class_max"];
  var range = filters["popatrisk_range"];
  //
  var month_short3 = months_short_3[state["month"]-1];
  var value = 0;
  for(var i = 0; i < f.properties.addinfo.length; i++)
  {
      var a = f.properties.addinfo[i];
      if(a["category"] == filters["category"])
      {
        if(a["prob_class_max"] != 0 && a["prob_class_max"] <= prob_class_max)
        {
          console.log("matched prob_class", prob_class_max);
          value += a[month_short3];
        }
      }
  }

  // Adjust by VAM FCS Filter
  if(filters["fcs"] != undefined)
  {
    var fcs_modifier = 100.0;
    if(filters["fcs"].length == 0)
    {
      fcs_modifier = 0.0;
    }
    else
    {
      if(filters["fcs"].join(",") != "poor,borderline,acceptable")
      {
        console.log("FCS Filter:", filters["fcs"]);
        var admin1_code = f.properties.admin1_code;
        var matches = $.grep(geosite.initial_data.layers.vam.data.geojson.features, function(x, i){
            return x.properties.admin1_code == admin1_code;
        });
        if(matches.length > 0)
        {
          var match = matches[0];
          if(match.properties.vam.fcs != undefined)
          {
            fcs_modifier = 0;
            $.each(match.properties.vam.fcs, function(k,v){
                if($.inArray(k,filters["fcs"])!= -1)
                {
                  fcs_modifier += v;
                }
            });
          }
        }
      }
    }
    value = value * (fcs_modifier / 100.0);
  }

  // Adjust by VAM FCS Filter
  if(filters["csi"] != undefined)
  {
    var csi_modifier = 100.0;
    if(filters["csi"].length == 0)
    {
      csi_modifier = 0.0;
    }
    else
    {
      if(filters["csi"].join(",") != "no,low,medium,high")
      {
        var admin1_code = f.properties.admin1_code;
        var matches = $.grep(geosite.initial_data.layers.vam.data.geojson.features, function(x, i){
            return x.properties.admin1_code == admin1_code;
        });
        if(matches.length > 0)
        {
          var match = matches[0];
          if(match.properties.vam.csi != undefined)
          {
            csi_modifier = 0;
            $.each(match.properties.vam.csi, function(k,v){
                if($.inArray(k,filters["csi"])!= -1)
                {
                  csi_modifier += v;
                }
            });
          }
        }
      }
    }
    value = value * (csi_modifier / 100.0);
  }

  if(value >= range[0] && value <= range[1])
  {
    var colors = map_config["featurelayers"]["popatrisk"]["cartography"][0]["colors"]["ramp"];
    var breakpoints = popatrisk_config["data"]["summary"]["all"]["breakpoints"]["natural"];
    var color = undefined;
    for(var i = 0; i < breakpoints.length; i++)
    {
      if(value < breakpoints[i])
      {
        color = colors[i];
        break;
      }
    }
    style["fillColor"] = (color == undefined) ? colors[colors.length-1] : color;
  }
  else
  {
    style["opacity"] = 0;
    style["fillOpacity"] = 0;
  }
  return style;
};

geosite.style_drought = function(f, state, map_config, popatrisk_config)
{
  var style = {};
  var filters = state["filters"]["popatrisk"];
  var prob_class_max = filters["prob_class_max"] / 100.0;
  var range = filters["popatrisk_range"];
  //
  var month_short3 = months_short_3[state["month"]-1];
  var value = 0;
  for(var i = 0; i < f.properties.addinfo.length; i++)
  {
      var a = f.properties.addinfo[i];
      if(a["month"] == month_short3)
      {
        if(a["prob"] < prob_class_max)
        {
          value += a["popatrisk"];
        }
      }
  }
  if(value >= range[0] && value <= range[1])
  {
    var colors = map_config["featurelayers"]["popatrisk"]["cartography"][0]["colors"]["ramp"];
    var breakpoints = popatrisk_config["data"]["summary"]["all"]["breakpoints"]["natural"];
    var color = undefined;
    for(var i = 0; i < breakpoints.length; i++)
    {
      if(value < breakpoints[i])
      {
        color = colors[i];
        break;
      }
    }
    style["fillColor"] = (color == undefined) ? colors[colors.length-1] : color;
  }
  else
  {
    style["opacity"] = 0;
    style["fillOpacity"] = 0;
  }
  return style;
};
geosite.style_flood = function(f, state, map_config, popatrisk_config)
{
  var style = {};
  var filters = state["filters"]["popatrisk"];
  var rp = filters["rp"];
  var range = filters["popatrisk_range"];
  //
  var month_short3 = months_short_3[state["month"]-1];
  var value = f.properties["RP"+rp.toString(10)][month_short3];

  if(value >= range[0] && value <= range[1])
  {
      var colors = map_config["featurelayers"]["popatrisk"]["cartography"][0]["colors"]["ramp"];
      var breakpoints = popatrisk_config["data"]["summary"]["all"]["breakpoints"]["natural_adjusted"];
      var color = undefined;
      for(var i = 0; i < breakpoints.length; i++)
      {
        if(value < breakpoints[i])
        {
          color = colors[i];
          break;
        }
      }
      style["fillColor"] = (color == undefined) ? colors[colors.length-1] : color;
  }
  else
  {
    style["opacity"] = 0;
    style["fillOpacity"] = 0;
  }
  return style;
};
geosite.style_context = function(f, state, map_config, context_config)
{
  var style = {};

  var fl = map_config["featurelayers"]["context"];
  var filters = state["filters"]["context"];
  var currentStyleID = state["styles"]["context"];
  var currentStyleList = $.grep(fl["cartography"], function(style, i){return style.id == currentStyleID;});
  var currentStyle = (currentStyleList.length == 1) ? currentStyleList[0] : fl["cartography"][0];
  //
  var mask = f.properties[currentStyle["mask"]];
  var value = f.properties[currentStyle["attribute"]];
  if(mask == 1)
  {
    var colors = currentStyle["colors"]["ramp"];
    var breakPointsName = currentStyle["breakpoints"] || "natural_adjusted";
    var breakpoints = context_config["data"]["summary"]["all"]["breakpoints"][breakPointsName];
    var color = undefined;
    for(var i = 0; i < breakpoints.length; i++)
    {
      if(value < breakpoints[i])
      {
        color = colors[i];
        break;
      }
    }
    style["fillColor"] = (color == undefined) ? colors[colors.length-1] : color;
  }
  else
  {
    style["fillColor"] = currentStyle["colors"]["outside"]
  }
  return style;
};

var buildPageURL = function(page, state)
{
  var url = geosite.pages[page]
    .replace("{iso3}", state["iso3"])
    .replace("{hazard}", state["hazard"])
    .replace("{month}", state["month"]);

  var hash_args = [];
  var view = state["view"];
  if(view != undefined && view["z"] != undefined && view["lat"] != undefined && view["lon"] != undefined)
  {
    hash_args.push("z="+view["z"]);
    hash_args.push("lat="+view["lat"].toFixed(4));
    hash_args.push("lon="+view["lon"].toFixed(4));
  }
  var filters = state["filters"];
  if(filters)
  {
      $.each(state["filters"], function(layer_id, layer_filters)
      {
        $.each(layer_filters, function(filter_id, filter_value)
        {
            hash_args.push(layer_id+":"+filter_id+"="+filter_value);
        });
      });
  }
  if(hash_args.length > 0)
  {
    url += "#"+hash_args.join("&");
  }
  return url;
};


geosite.utility = {};

geosite.utility.getClosestFeature = function(nearbyFeatures, target)
{
  var closestFeature = undefined;
  var closestDistance = 0;
  if(nearbyFeatures != undefined)
  {
    if(nearbyFeatures.length > 0)
    {
      closestFeature = nearbyFeatures[0];
      closestDistance = target.distanceTo(nearbyFeatures[0].geometry)
      for(var i = 0; i < nearbyFeatures.length ;i++)
      {
        var f = nearbyFeatures[i];
        if(target.distanceTo(f.geometry) < closestDistance)
        {
          closestFeature = f;
          closestDistance = target.distanceTo(f.geometry);
        }
      }
    }
  }
  return closestFeature;
};

geosite.templates = {};
geosite.templates["modal_layer_carto.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }} / Cartography</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <p class=\"navbar-text\" style=\"margin-bottom:0px;\"><b>Select</b><br><b>a Style:</b></p>\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"style in layer.cartography track by $index\">\n            <a\n              class=\"geosite-intent\"\n              href=\"#modal-layer-carto-style-{{ style.id }}\"\n              aria-controls=\"modal-layer-carto-style-{{ style.id }}\"\n              data-intent-name=\"selectStyle\"\n              data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;,&quot;style&quot;:&quot;{{ style.id }}&quot;}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"style.title | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"style in layer.cartography track by $index\"\n            id=\"modal-layer-carto-style-{{ style.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Attribute: </b><span>{{ style.attribute | default:\"Not styled by attribute\" }}</span></span><br>\n            <span><b>Mask: </b><span ng-bind-html=\"style.mask | md2html | default:\'No Mask\'\"></span></span><br>\n            <span><b>Description: </b><span ng-bind-html=\"style.description | md2html | default:\'Not specified\'\"></span></span>\n            <br>\n            <br>\n            <div\n              ng-if=\"style.type == \'graduated\'\"\n              geosite-symbol-graduated>\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'circle\'\"\n              geosite-symbol-circle>\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'graphic\'\"\n              geosite-symbol-graphic>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_layer_more.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <span ng-bind-html=\"layer.description | md2html | default:\'No description given.\'\"></span>\n      <br><br><b>Source:</b> {{ layer.source.name | default:\"Not specified\" }}\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["symbol_circle.tpl.html"] = "<div>\n  <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle\n    cx=\"50%\" cy=\"50%\" r=\"{{ style.legend.symbol.radius }}\"\n    fill=\"{{ style.styles.default.static.color }}\" stroke-width=\"1\" stroke=\"#000000\"></circle>\n  </svg>\n</div>\n";
geosite.templates["symbol_graduated.tpl.html"] = "<div>\n  <div style=\"display: inline-block; vertical-align:top;\" >{{ style.label_left }}</div>\n  <svg width=\"300px\" height=\"50px\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect\n      ng-repeat-start=\"color in style.colors.ramp track by $index\"\n      x=\"{{ idx|percent:numberOfColors }}%\"\n      y=\"0\"\n      width=\"{{ 1|percent:numberOfColors }}%\"\n      height=\"50px\"\n      fill=\"{{ color }}\"\n      stroke-width=\"1\"\n      stroke=\"#000000\"/>\n    <text\n      ng-repeat-end\n      x=\"{{ idx|as_float|addFloat:0.5|percent:numberOfColors }}%\"\n      y=\"50%\"\n      text-anchor=\"middle\"\n      fill=\"white\"\n      font-size=\"18px\">{{ idx }}</text>\n  </svg>\n  <div style=\"display: inline-block; vertical-align:top;\">{{ style.label_right }}</div>\n</div>\n";
geosite.templates["symbol_graphic.tpl.html"] = "<img src=\"{{ style }}\" />\n";

geosite.directives["geositeModalLayerCarto"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_layer_carto.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalLayerMore"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_layer_more.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolCircle"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'symbol_circle.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolGraduated"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolGraphic"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.controllers["controller_modal"] = function(
  $scope,
  $element,
  $controller,
  state,
  popatrisk_config,
  map_config,
  live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  var jqe = $($element);

  $scope.test = "blah blah blah";
};

geosite.controllers["controller_breadcrumb"] = function($scope, $element, $controller, state)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  $('select', $element).each(function(){
    var s = $(this);
    var breadcrumbs = s.data('breadcrumbs');
    var placeholder = s.data('placeholder');
    var initialData = s.data('initialData');
    var w = s.data('width');
    var h = s.data('height');
    var css = 'sparc-select-dropdown';

    s.select2({
      data: geosite.initial_data["data"][initialData], // global variable set in header
      placeholder: placeholder,
      allowClear: false,
      width: w,
      height: h,
      dropdownCssClass: css
    });

    s.on("select2:select", function(e){
      var newValue = e.params.data.id;
      $scope.$apply(function()
      {
        var output = s.data('output');
        $scope["state"][output] = newValue;
      });
      //Build URL
      var url = "";
      for(var i = 0; i < breadcrumbs.length; i++)
      {
        var bc = breadcrumbs[i];
        if(state[bc["value"]] != undefined)
        {
          url += "/"+bc["name"]+"/"+$scope["state"][bc["value"]];
        }
      }
      //Update URL
      console.log("Going to url ", url);
      window.location.href = url;
      //Update Map
    });
  });
};

geosite.controllers["controller_legend"] = function(
  $scope,
  $element,
  $controller,
  state,
  popatrisk_config,
  map_config,
  live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  var jqe = $($element);

  $scope.$on("refreshMap", function(event, args){
    console.log('args: ', args);
    var element_featurelayers = jqe.find('.geosite-map-legend-featurelayers');
    $('.geosite-map-legend-item', element_featurelayers).each(function(){
      var layerID = $(this).data('layer');
      var element_symbol = $(this).find('.geosite-map-legend-item-symbol:first');
      var styleID = args.state.styles[layerID];
      var styles = $.grep(geosite.map_config.featurelayers["context"].cartography, function(x, i){
        return x["id"] == styleID;
      });
      var style =  styles.length > 0 ? styles[0] : undefined;


    });
  });
};

geosite.controllers["controller_filter"] = function($scope, $element, $controller, state, popatrisk_config, map_config, live)
{
  var maxValueFromSummary = popatrisk_config["data"]["summary"]["all"]["max"]["at_admin2_month"];
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));

  // Initialize Checkbox Filters
  $($element).on('change', 'input:checkbox', function(event) {
    console.log(event);
    var that = this;
    var output = $(that).data('output');
    var filter = {};

    var btngroup = $(that).parents('.btn-group:first');
    var output = btngroup.data('output');
    if(filter[output] == undefined)
    {
      filter[output] = [];
    }
    btngroup.find('input').each(function(){
      if($(this).is(':checked'))
      {
        filter[output].push($(this).data('value'))
      }
    });
    geosite.intend("filterChanged", {"layer": "popatrisk", "filter": filter}, $scope);
  });

  // Initialize Radio Filters
  $($element).on('change', 'input:radio[name="cat"]', function(event) {
    console.log(event);
    var output = $(this).data('output');
    var filter = {};
    filter[output] = this.value;
    geosite.intend("filterChanged", {"layer": "popatrisk", "filter": filter}, $scope);
  });

  // Initialize Slider Filters
  $(".geosite-filter-slider", $($element)).each(function(){

    var slider = $(this).find(".geosite-filter-slider-slider");
    var label = $(this).find(".geosite-filter-slider-label");

    var type = slider.data('type');
    var output = slider.data('output');

    if(type=="ordinal")
    {
      var range = slider.data('range');
      //var value = slider.data('value');
      var value = state["filters"]["popatrisk"][output];
      var options = slider.data('options');

      slider.data('label', label);
      geosite.ui_init_slider_label(slider, type, range, value);
      geosite.ui_init_slider_slider($scope, slider, type, range, options.indexOf(value), 0, options.length - 1, 1);
    }
    else
    {
      var range = slider.data('range');
      //var value = slider.data('value');
      var minValue = geosite.assert_float(slider.data('min-value'), undefined);
      var step = slider.data('step');
      //var label_template = slider.data('label');

      if(range.toLowerCase() == "true")
      {
        var maxValue = maxValueFromSummary != undefined ? maxValueFromSummary : geosite.assert_float(slider.data('max-value'), undefined);
        var values = state["filters"]["popatrisk"][output];
        values = geosite.assert_array_length(values, 2, [minValue, maxValue]);
        var values_n = [Math.floor(values[0]), Math.floor(values[1])];
        var min_n = Math.floor(minValue);
        var max_n = Math.floor(maxValue);
        var step_n = Math.floor(step);

        slider.data('label', label);
        geosite.ui_init_slider_label(slider, type, range, values);
        geosite.ui_init_slider_slider($scope, slider, type, range, values_n, min_n, max_n, step_n);
        console.log(value_n, min_n, max_n, step_n, range);
      }
      else
      {
        var maxValue = geosite.assert_float(slider.data('max-value'), undefined);
        var value = state["filters"]["popatrisk"][output];
        var value_n = Math.floor(value * 100);
        var min_n = Math.floor(minValue * 100);
        var max_n = Math.floor(maxValue * 100);
        var step_n = Math.floor(step * 100);

        slider.data('label', label);
        geosite.ui_init_slider_label(slider, type, range, value);
        geosite.ui_init_slider_slider($scope, slider, type, range, values_n, min_n, max_n, step_n);
        console.log(value_n, min_n, max_n, step_n, range);
      }
    }
  });
};

geosite.controllers["controller_map"] = function($scope, $element, $controller, state, popatrisk_config, map_config) {

};

var init_map = function(opts)
{
  var map = L.map('map',
  {
    zoomControl: opt_b(opts, "zoomControl", false),
    minZoom: opt_i(opts, "minZoom", 3),
    maxZoom: opt_i(opts, "maxZoom", 18)
  });
  map.setView(
    [opt_i(opts,["latitude", "lat"],0), opt_i(opts,["longitude", "lon", "lng", "long"], 0)],
    opt_i(opts, ["zoom", "z"], 0));

  $.each(opt_j(opts, "listeners"), function(e, f){
    map.on(e, f);
  });

  return map;
};
geosite.controllers["controller_map_map"] = function(
  $rootScope, $scope, $element, $compile, $interpolate, $templateCache,
  state, popatrisk_config, context_config, map_config, live) {
  //////////////////////////////////////
  var listeners =
  {
    click: function(e) {
      var c = e.latlng;
      var delta = {
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("clickedOnMap", delta, $scope);
    },
    zoomend: function(e){
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "z": live["map"].getZoom()
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    }
  };
  //////////////////////////////////////
  // The Map
  var hasViewOverride = hasHashValue(["latitude", "lat", "longitude", "lon", "lng", "zoom", "z"]);
  var view = state["view"];
  live["map"] = init_map({
    "zoomControl": map_config["controls"]["zoom"],
    "minZoom": map_config["view"]["minZoom"],
    "maxZoom": map_config["view"]["maxZoom"],
    "lat": view["lat"],
    "lon": view["lon"],
    "z": view["z"],
    "listeners": listeners
  });
  //////////////////////////////////////
  // Base Layers
  var baseLayers = geosite.layers.init_baselayers(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  var baseLayerID = map_config["baselayers"][0].id;
  live["baselayers"][baseLayerID].addTo(live["map"]);
  geosite.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
  geosite.intend("layerLoaded", {'type':'baselayer', 'layer': baseLayerID}, $scope);
  //////////////////////////////////////
  $.each(map_config.featurelayers, function(id, layerConfig){
    if(id != "popatrisk" && id != "context")
    {
      geosite.layers.init_featurelayer(id, layerConfig, $scope, live, map_config);
    }
  });
  //////////////////////////////////////
  // Feature layers
  var popatrisk_popup_content = function(source)
  {
    console.log(source);
    var f = source.feature;
    //
    var $scope = angular.element("#geosite-main").scope();
    var state = $scope.state;
    var filters = state["filters"]["popatrisk"];
    //
    //var popupTemplate = map_config["featurelayers"]["popatrisk"]["popup"]["template"];
    var popupTemplate = popup_templates["popatrisk"];
    var ctx = $.extend({}, f.properties);
    var month_short_3 = months_short_3[state["month"]-1];
    var month_long = months_long[state["month"]-1];
    ctx["month"] = month_long;
    if(state.hazard == "flood")
    {
      var rp = filters["rp"];
      ctx["popatrisk"] = f.properties["RP"+rp.toString(10)][month_short_3];
    }
    else if(state.hazard == "cyclone")
    {
      var prob_class_max = filters["prob_class_max"];
      var value = 0;
      for(var i = 0; i < f.properties.addinfo.length; i++)
      {
          var a = f.properties.addinfo[i];
          if(a["category"] == filters["category"])
          {
            if(a["prob_class_max"] != 0 && a["prob_class_max"] <= prob_class_max)
            {
              console.log("matched prob_class", prob_class_max);
              value += a[month_short_3];
            }
          }
      }
      ctx["popatrisk"] = value;
    }
    var chartConfig = map_config["featurelayers"]["popatrisk"]["popup"]["chart"];
    ctx["chartID"] = chartConfig.id;
    //Run this right after
    setTimeout(function(){
      var gc = buildGroupsAndColumnsForAdmin2(chartConfig, popatrisk_config, f.properties.admin2_code);
      var chartOptions = {
        groups: gc.groups,
        columns: gc.columns,
        bullet_width: function(d, i)
        {
          return d.id == "rp25" ? 6 : 12;
        }
      };
      buildHazardChart(chartConfig, popatrisk_config, chartOptions);
    }, 1000);
    return $interpolate(popupTemplate)(ctx);
  };
  var context_popup_content = function(source)
  {
    console.log(source);
    var fl = map_config.featurelayers.context
    var f = source.feature;
    var popupTemplate = geosite.popup.buildPopupTemplate(fl.popup, fl, f);
    var ctx = {
      'layer': fl,
      'feature': {
        'attributes': f.properties,
        'geometry': {}
      }
    };
    return $interpolate(popupTemplate)(ctx);
  };
  // Load Context Layer
  live["featurelayers"]["context"] = L.geoJson(context_config["data"]["geojson"],{
    renderOrder: $.inArray("context", map_config.renderlayers),
    style: context_config["style"]["default"],
    /* Custom */
    hoverStyle: context_config["style"]["hover"],
    /* End Custom */
    onEachFeature: function(f, layer){
      var popupOptions = {maxWidth: 300};
      //var popupContent = "Loading ..."
      layer.bindPopup(context_popup_content, popupOptions);
      layer.on({
        mouseover: highlightFeature,
        mouseout: function(e) {
          live["featurelayers"]["context"].resetStyle(e.target);
        }
      });
    }
  });
  // Load Population at Risk
  live["featurelayers"]["popatrisk"] = L.geoJson(popatrisk_config["data"]["geojson"],{
    renderOrder: $.inArray("popatrisk", map_config.renderlayers),
    style: popatrisk_config["style"]["default"],
    /* Custom */
    hoverStyle: popatrisk_config["style"]["hover"],
    /* End Custom */
    onEachFeature: function(f, layer){
      var popupOptions = {maxWidth: 300};
      //var popupContent = "Loading ..."
      layer.bindPopup(popatrisk_popup_content, popupOptions);
      layer.on({
        mouseover: highlightFeature,
        mouseout: function(e){
          live["featurelayers"]["popatrisk"].resetStyle(e.target);
        },
        click: function(e) {
          // This is handled by setting popupContent to be a function.
          //var popup = e.target.getPopup();
          //popup.update();
        }
      });
    }
  });
  geosite.layers.init_featurelayer_post(
    $scope,
    live,
    "popatrisk",
    live["featurelayers"]["popatrisk"],
    map_config.featurelayers.popatrisk.visible);
  // Zoom to Data
  if(!hasViewOverride)
  {
      live["map"].fitBounds(live["featurelayers"]["popatrisk"].getBounds());
  }
  //////////////////////////////////////
  // Sidebar Toggle
  $("#geosite-map-sidebar-toggle-left").click(function (){
    $(this).toggleClass("sidebar-open sidebar-left-open");
    $("#geosite-sidebar-left, #geosite-map").toggleClass("sidebar-open sidebar-left-open");
    setTimeout(function(){
      live["map"].invalidateSize({
        animate: true,
        pan: false
      });
    },2000);
  });
  //////////////////////////////////////
  $scope.$on("refreshMap", function(event, args) {
    // Forces Refresh
    console.log("Refreshing map...");
    // Update Visibility
    var visibleBaseLayer = args.state.view.baselayer;
    $.each(live["baselayers"], function(id, layer) {
      var visible = id == visibleBaseLayer;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    var visibleFeatureLayers = args.state.view.featurelayers;
    $.each(live["featurelayers"], function(id, layer) {
      var visible = $.inArray(id, visibleFeatureLayers) != -1;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    // Update Render Order
    var renderLayers = $.grep(layersAsArray(live["featurelayers"]), function(layer){ return $.inArray(layer["id"], visibleFeatureLayers) != -1;});
    var renderLayersSorted = sortLayers($.map(renderLayers, function(layer, i){return layer["layer"];}),true);
    var baseLayersAsArray = $.map(live["baselayers"], function(layer, id){return {'id':id,'layer':layer};});
    var baseLayers = $.map(
      $.grep(layersAsArray(live["baselayers"]), function(layer){return layer["id"] == visibleBaseLayer;}),
      function(layer, i){return layer["layer"];});
    updateRenderOrder(baseLayers.concat(renderLayersSorted));
    // Update Styles
    live["featurelayers"]["popatrisk"].setStyle(popatrisk_config["style"]["default"]);
    live["featurelayers"]["context"].setStyle(context_config["style"]["default"]);
    // Force Refresh
    setTimeout(function(){live["map"]._onResize()}, 0);
  });

  $scope.$on("changeView", function(event, args) {
    console.log("Refreshing map...");
    if(args["layer"] != undefined)
    {
      live["map"].fitBounds(live["featurelayers"][args["layer"]].getBounds());
    }
  });

  $scope.$on("openPopup", function(event, args) {
    console.log("Refreshing map...");
    if(
      args["featureLayer"] != undefined &&
      args["feature"] != undefined &&
      args["location"] != undefined)
    {
      geosite.popup.openPopup(
        $interpolate,
        args["featureLayer"],
        args["feature"],
        args["location"],
        live["map"]);
    }
  });
};

geosite.controllers["controller_sidebar_sparc"] = function($scope, $element, $controller, state, popatrisk_config, map_config, live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  var jqe = $($element);
  if(map_config.charts != undefined)
  {
    for(var i = 0; i < map_config.charts.length; i++)
    {
      var options = {};
      if(map_config.charts[i].hazard == "drought")
      {
        options["bullet_width"] = function(d, i)
        {
          if(d.id == "p6")
          {
            return 6;
          }
          else if(d.id == "p8")
          {
            return 8;
          }
          else
          {
            return 16;
          }
        };
      }
      buildHazardChart(map_config.charts[i], popatrisk_config, options);
    }
  }
};

geosite.controllers["controller_main"] = function($scope, $element, $controller, $http, $q, state, map_config, stateschema, popatrisk_config, live)
{

    $scope.state = geosite.init_state(state, stateschema);
    $scope.live = live;

    // Toggle Modals
    $scope.$on("toggleModal", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var id = args["id"];
        var modal_scope = angular.element("#"+id).scope();
        var modal_scope_new = {};
        $.each(args["dynamic"],function(key, value){
          modal_scope_new[key] = angular.isArray(value) ? extract(value, map_config): value;
        });
        modal_scope.$apply(function () {
            modal_scope = $.extend(modal_scope, modal_scope_new);
            setTimeout(function(){$("#"+id).modal('toggle');},0);
        });
    });

    // Calendar, Country, Hazard, or Filter Changed
    $scope.$on("stateChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state = $.extend($scope.state, args);
            var url = buildPageURL("countryhazardmonth_detail", $scope.state);
            history.replaceState(state, "", url);
            // Refresh Map
            $scope.$broadcast("refreshMap", {'state': $scope.state});
        });
    });

    // Filter Changed
    $scope.$on("filterChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state.filters[args["layer"]] = $.extend(
              $scope.state.filters[args["layer"]],
              args["filter"]);
            var url = buildPageURL("countryhazardmonth_detail", $scope.state);
            history.replaceState(state, "", url);
            // Refresh Map
            $scope.$broadcast("refreshMap", {'state': $scope.state});
        });
    });

    // Style Changed
    $scope.$on("selectStyle", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state.styles[args["layer"]] = args["style"];
            var url = buildPageURL("countryhazardmonth_detail", $scope.state);
            history.replaceState(state, "", url);
            // Refresh Map
            $scope.$broadcast("refreshMap", {'state': $scope.state});
        });
    });

    // Map Panned or Zoomed
    $scope.$on("viewChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view = $.extend($scope.state.view, args);
        var url = buildPageURL("countryhazardmonth_detail", $scope.state);
        history.replaceState(state, "", url);
        // $scope.$on already wraps $scope.$apply
        /*$scope.$apply(function () {
            $scope.state.view = $.extend($scope.state.view, args);
            var url = buildPageURL("countryhazardmonth_detail", state);
            history.replaceState(state, "", url);
        });*/
    });

    $scope.$on("layerLoaded", function(event, args) {
        var $scope = angular.element("#geosite-main").scope();
        var type = args.type;
        var layer = args.layer;
        var visible = args.visible != undefined ? args.visible : true;
        if(type == "featurelayer")
        {
          if(visible)
          {
            $scope.state.view.featurelayers.push(layer);
          }
        }
        else if(type == "baselayer")
        {
          $scope.state.view.baselayer = layer;
        }
    });

    $scope.$on("showLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        if($.inArray(layer, $scope.state.view.featurelayers) == -1)
        {
          $scope.state.view.featurelayers.push(layer);
          // Refresh Map
          $scope.$broadcast("refreshMap", {'state': $scope.state});
        }
    });
    $scope.$on("hideLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        var i = $.inArray(layer, $scope.state.view.featurelayers);
        if(i != -1)
        {
          $scope.state.view.featurelayers.splice(i, 1);
          // Refresh Map
          $scope.$broadcast("refreshMap", {'state': $scope.state});
        }
    });
    $scope.$on("switchBaseLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view.baselayer = args.layer;
        // Refresh Map
        $scope.$broadcast("refreshMap", {'state': $scope.state});
    });

    $scope.$on("zoomToLayer", function(event, args) {
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        var i = $.inArray(layer, $scope.state.view.featurelayers);
        if(i != -1)
        {
          $scope.$broadcast("changeView", {'layer': layer});
        }
    });

    $scope.$on("clickedOnMap", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        var z = $scope.state.view.z;
        var visibleFeatureLayers = $scope.state.view.featurelayers;
        console.log("visibleFeatureLayers", visibleFeatureLayers);
        var featurelayers_by_featuretype = {};
        var fields_by_featuretype = {};
        var urls = [];
        for(var i = 0; i < visibleFeatureLayers.length; i++)
        {
            var fl = map_config.featurelayers[visibleFeatureLayers[i]];
            if(fl.wfs != undefined)
            {
              var params = {
                service: "wfs",
                version: fl.wfs.version,
                request: "GetFeature",
                srsName: "EPSG:4326",
              };

              var targetLocation = new L.LatLng(args.lat, args.lon);
              var bbox = geosite.tilemath.point_to_bbox(args.lon, args.lat, z, 4).join(",");
              var typeNames = fl.wfs.layers || fl.wms.layers || [] ;
              for(var j = 0; j < typeNames.length; j++)
              {
                typeName = typeNames[j];
                var url = fl.wfs.url + "?" + $.param($.extend(params, {typeNames: typeName, bbox: bbox}));
                urls.push(url);
                fields_by_featuretype[typeName.toLowerCase()] = geosite.layers.aggregate_fields(fl);
                featurelayers_by_featuretype[typeName.toLowerCase()] = fl;
              }
            }
          }

          $q.all(geosite.http.build_promises($http, urls)).then(function(responses){
              var features = geosite.http.build_features(responses, fields_by_featuretype);
              console.log("Features: ", features);
              if(features.length > 0 )
              {
                var featureAndLocation = geosite.vecmath.getClosestFeatureAndLocation(features, targetLocation);
                var fl = featurelayers_by_featuretype[featureAndLocation.feature.featuretype];
                $scope.$broadcast("openPopup", {
                  'featureLayer': fl,
                  'feature': featureAndLocation.feature,
                  'location': {
                    'lon': featureAndLocation.location.lng,
                    'lat': featureAndLocation.location.lat
                  }
                });
              }
          });
    });
};


var init_sparc_controller_main = function(that, app)
{
  geosite.init_controller(that, app, geosite.controllers.controller_main);

  $('.geosite-controller.geosite-sidebar.geosite-sidebar-left', that).each(function(){
    geosite.init_controller($(this), app, geosite.controllers.controller_sidebar_sparc);
  });

  $('.geosite-controller.geosite-sidebar.geosite-sidebar-right', that).each(function(){
    geosite.init_controller($(this), app, geosite.controllers.controller_sidebar_editor);
  });

  $('.geosite-controller.geosite-map', that).each(function(){
    // Init This
    geosite.init_controller($(this), app, geosite.controllers.controller_map);

    // Init Children
    geosite.init_controllers($(this), app, [
      { "selector": ".geosite-controller.geosite-map-map", "controller": geosite.controllers.controller_map_map },
      { "selector": ".geosite-controller.sparc-map-calendar", "controller": undefined },
      { "selector": ".geosite-controller.sparc-map-breadcrumb", "controller": geosite.controllers.controller_breadcrumb },
      { "selector": ".geosite-controller.geosite-map-filter", "controller": geosite.controllers.controller_filter },
      { "selector": ".geosite-controller.geosite-map-legend", "controller": geosite.controllers.controller_legend },
    ]);

    // Init Modals
    geosite.init_controllers($(this), app, [
      { "selector": ".geosite-controller.geosite-controller-modal", "controller": geosite.controllers.controller_modal }
    ]);
  });
};
