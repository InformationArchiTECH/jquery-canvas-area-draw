(function( $ ){

  $.fn.canvasAreaDraw = function(options) {
    var args = Array.prototype.slice.call(arguments, 1);
    this.each(function(index, element) {
      instance = $(element).data('canvasAreaDraw');
      if(!instance){
        $(element).data('canvasAreaDraw',init.apply(element, [index, element, options]));
      } else {
        if(typeof options === 'string') {
            instance[options].apply(instance, args);
        }
      }
    });
  }

  var init = function(index, input, options) { 

    var thisInstance = this;

    var colors, points, activePoint, settings, activeRegion, maxRegion, numRegions = 0;
    var $addRegion, $reset, $regions, $canvas, ctx, image;
    var addRegion, draw, mousedown, stopdrag, move, resize, reset, rightclick, record;

    settings = $.extend({
      imageUrl: $(this).attr('data-image-url'),
      width: false,
      height: false,
      sensitivity: 6,
      rectWidth: 2,
      lineWidth: 1,
      initialRegions: 1,
      resetSelector: false,
      addRegionSelector: false,
      regionsSelector: false,
      regionSelectedClass: 'btn-success',
      noRegionsSelector: false,
      regionButtonCallback: function(region_id) {
        return '<button type="button" class="btn btn-success regionSelect" data-region="' + maxRegion + '">Select Region #' + region_id + '</button>';
      }
    }, options);

    if(settings.addRegionSelector)
      $addRegion = $(settings.addRegionSelector);
    else
      $addRegion = $('<button type="button" class="addRegion btn btn-default"><i class="icon-plus"></i>Add Region</button>');
    
    if(settings.resetSelector)
      $reset = $(settings.resetSelector);
    else
      $reset = $('<button type="button" class="btn btn-default"><i class="icon-trash"></i>Clear</button>');

    if(settings.regionsSelector)
      $regions = $(settings.regionsSelector);
    else
      $regions = $('<div style="float:left;" class="regions"></div>');

    $canvas = $('<canvas>');
    ctx = $canvas[0].getContext('2d');

    points = {};
    if ( $(this).val().length ) {
      points = JSON.parse($(this).val());
    } else if (settings.points) {
      points = settings.points;
      $(this).val(JSON.stringify(points));
    }

    activeRegion = 0;
    maxRegion = (-1);

    image = new Image();

    resize = function() {

      if(!settings.height)
        $canvas.attr('height', image.height);
      else
        $canvas.attr('height', settings.height);

      if(!settings.width)
        $canvas.attr('width', image.width);
      else
        $canvas.attr('width', settings.width);

      draw();
    };

    this.addRegion = function() {

      numRegions++;

      if(settings.noRegionsSelector){
        $(settings.noRegionsSelector).hide();
      }

      maxRegion++;
      activeRegion = maxRegion;

      var $regionSelect = $(settings.regionButtonCallback(maxRegion));
      $regionSelect.addClass('regionSelect');
      $('.regionSelect').removeClass(settings.regionSelectedClass);
      $regionSelect.addClass(settings.regionSelectedClass);
      $regionSelect.data('region',maxRegion);
      $regions.append($regionSelect);

      $regionSelect.click(function(){
        $('.regionSelect').removeClass(settings.regionSelectedClass);
        $(this).addClass(settings.regionSelectedClass);
        activeRegion = $(this).data('region');
        activePoint = null;
        draw();
      });
      
      if(typeof points[maxRegion] == 'undefined'){
        points[maxRegion] = [];
      }

      draw();

    }

    reset = function() {
      points = {};
      $regions.empty();
      activeRegion = 0;
      maxRegion = (-1);
      numRegions = 0;
      for(i=0;i<settings.initialRegions;i++)
        thisInstance.addRegion();
      if(settings.noRegionsSelector && numRegions==0){
        $(settings.noRegionsSelector).show();
      }        
      draw();
    };

    move = function(e) {
      if(!e.offsetX) {
        if(isNaN(e.pageX) || isNaN(e.pageY)){
          e.offsetX = (event.targetTouches[0].pageX - $(e.target).offset().left);
          e.offsetY = (event.targetTouches[0].pageY - $(e.target).offset().top);
        } else {
          e.offsetX = (e.pageX - $(e.target).offset().left);
          e.offsetY = (e.pageY - $(e.target).offset().top);
        }
      }
      points[activeRegion][activePoint] = Math.round(e.offsetX);
      points[activeRegion][activePoint+1] = Math.round(e.offsetY);
      draw();
    };

    stopdrag = function() {
      $(this).off('mousemove');
      record();
      activePoint = null;
    };

    rightclick = function(e) {
      e.preventDefault();
      if(!e.offsetX) {
        e.offsetX = (e.pageX - $(e.target).offset().left);
        e.offsetY = (e.pageY - $(e.target).offset().top);
      }
      var x = e.offsetX, y = e.offsetY;
      for (var i = 0; i < points[activeRegion].length; i+=2) {
        dis = Math.sqrt(Math.pow(x - points[activeRegion][i], 2) + Math.pow(y - points[activeRegion][i+1], 2));
        if ( dis < 6 ) {
          points[activeRegion].splice(i, 2);
          draw();
          record();
          return false;
        }
      }
      return false;
    };

    mousedown = function(e) {

      var x, y, dis, lineDis, insertAt = points[activeRegion].length;

      if (e.which === 3) {
        return false;
      }

      e.preventDefault();
      if(!e.offsetX) {
        e.offsetX = (e.pageX - $(e.target).offset().left);
        e.offsetY = (e.pageY - $(e.target).offset().top);
      }
      x = e.offsetX; y = e.offsetY;

      if(isNaN(x) || isNaN(y)){
        x = event.targetTouches[0].pageX - $(e.target).offset().left;
        y = event.targetTouches[0].pageY - $(e.target).offset().top;
      }

      for (var i = 0; i < points[activeRegion].length; i+=2) {
        dis = Math.sqrt(Math.pow(x - points[activeRegion][i], 2) + Math.pow(y - points[activeRegion][i+1], 2));
        // this determines sensitivity
        if ( dis < settings.sensitivity ) {
          activePoint = i;
          $(this).on('touchmove mousemove', move);
          return false;
        }
      }

      for (var i = 0; i < points[activeRegion].length; i+=2) {
        if (i > 1) {
          lineDis = dotLineLength(
            x, y,
            points[activeRegion][i], points[activeRegion][i+1],
            points[activeRegion][i-2], points[activeRegion][i-1],
            true
          );
          if (lineDis < 6) {
            insertAt = i;
          }
        }
      }

      points[activeRegion].splice(insertAt, 0, Math.round(x), Math.round(y));
      activePoint = insertAt;
      $(this).on('mousemove', move);

      draw();
      record();

      return false;
    };

    draw = function() {

      record();

      ctx.canvas.width = ctx.canvas.width;

      ctx.globalCompositeOperation = 'destination-over';

      ctx.lineWidth = settings.lineWidth;
      var rectWidth = settings.rectWidth;

      var colors= ['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 
      'lime', 'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 
      'silver', 'teal', 'white', 'yellow'];

      var origActiveRegion = activeRegion;
      for(i in points){
        activeRegion = i;

        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.strokeStyle = 'rgba(255,0,0,1)';

        if (points[activeRegion].length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[activeRegion][0], points[activeRegion][1]);
          for (var i = 0; i < points[activeRegion].length; i+=2) {
            ctx.fillRect(points[activeRegion][i]-rectWidth, points[activeRegion][i+1]-rectWidth, (rectWidth * 2), (rectWidth * 2));
            ctx.strokeRect(points[activeRegion][i]-rectWidth, points[activeRegion][i+1]-rectWidth, (rectWidth * 2), (rectWidth * 2));
            if (points[activeRegion].length > 2 && i > 1) {
              ctx.lineTo(points[activeRegion][i], points[activeRegion][i+1]);
            }
          }
          ctx.closePath();
          //ctx.fillStyle = 'rgba(255,0,0,0.3)';
          if(activeRegion==origActiveRegion)
            ctx.fill();
          ctx.stroke();
        }
      }
      activeRegion = origActiveRegion;
    };

    record = function() { 
      $(input).val(JSON.stringify(points));
      $(input).trigger({
        type: "pointDataChange",
        points: points
      });
    };    

    $(image).load(resize);
    image.src = settings.imageUrl;
    if (image.loaded) resize();
    $canvas.css('background-image','url("'+image.src+'")');

    $(document).ready( function() {

      if(Object.keys(points).length > 0)
        for(region in points)
          thisInstance.addRegion();
      else
        for(i=0;i<settings.initialRegions;i++)
          thisInstance.addRegion(); 

      if(settings.noRegionsSelector && numRegions==0){
        $(settings.noRegionsSelector).show();
      }  

      $(input).after($canvas);
      if(!settings.addRegionSelector)
        $(input).after($addRegion);
      if(!settings.resetSelector)
        $(input).after($resetSelector);
      if(!settings.regionsSelector)
        $(input).after($regions);

      $reset.click(reset);

      $addRegion.click(self.addRegion);

      $canvas.on('mousedown touchstart', mousedown);
      $canvas.on('contextmenu', rightclick);
      $canvas.on('mouseup touchend', stopdrag);
    });

    $(input).on('change', function() {
      if ( $(this).val().length ) {
        points[activeRegion] = $(this).val().split(',').map(function(point) {
          return parseInt(point, 10);
        });
      } else {
        points[activeRegion] = [];
      }
      draw();
    });

    return this; //end init

  };

  $(document).ready(function() {
    $('.canvas-area[data-image-url]').canvasAreaDraw();
  });

  var dotLineLength = function(x, y, x0, y0, x1, y1, o) {
    function lineLength(x, y, x0, y0){
      return Math.sqrt((x -= x0) * x + (y -= y0) * y);
    }
    if(o && !(o = function(x, y, x0, y0, x1, y1){
      if(!(x1 - x0)) return {x: x0, y: y};
      else if(!(y1 - y0)) return {x: x, y: y0};
      var left, tg = -1 / ((y1 - y0) / (x1 - x0));
      return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * - tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y};
    }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))){
      var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
      return l1 > l2 ? l2 : l1;
    }
    else {
      var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
      return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
    }
  };
})( jQuery );