(function( $ ){

  $.fn.canvasAreaDraw = function(options) {

    this.each(function(index, element) {
      init.apply(element, [index, element, options]);
    });

  }

  var init = function(index, input, options) {

    var points, activePoint, settings, activeRegion, maxRegion;
    var $reset, $canvas, ctx, image;
    var draw, mousedown, stopdrag, move, resize, reset, rightclick, record;

    settings = $.extend({
      imageUrl: $(this).attr('data-image-url')
    }, options);

    activeRegion = 0;

    points = {};
    if ( $(this).val().length ) {
      alert('not implemented');
      /*
      points = $(this).val().split(',').map(function(point) {
        return parseInt(point, 10);
      });
      */
    }/* else {
      points = { 0 : [] };
    }*/
    maxRegion = (-1);
    for(i in points)
      maxRegion = i;

    $addRegion = $('<button type="button" class="addRegion btn"><i class="icon-plus"></i>Add Region</button>');
    $reset = $('<button type="button" class="btn"><i class="icon-trash"></i>Clear</button>');
    $canvas = $('<canvas>');
    ctx = $canvas[0].getContext('2d');

    image = new Image();
    resize = function() {
      $canvas.attr('height', image.height).attr('width', image.width);
      draw();
    };
    $(image).load(resize);
    image.src = settings.imageUrl;
    if (image.loaded) resize();
    $canvas.css({background: 'url('+image.src+')'});

    $(document).ready( function() {
      if(maxRegion > (-1)){
        for(region in points){
          addRegion(region);
        }
      } else {
        addRegion(0);
      }

      /*for(region in points){
        selected = (activeRegion==region) ? ' btn-success' : '';
        $regionSelect = $('<button type="button" class="btn regionSelect' + selected +'" data-region="' + region + '"><i class="icon-square"></i>Region #' + region + '</button>');
        $(input).after($regionSelect);
      }*/
      

      $(input).after('<br>', $canvas, '<br>', $reset, '<br>', $addRegion);
      $reset.click(reset);
      $addRegion.click(addRegion);
      $canvas.on('mousedown touchstart', mousedown);
      $canvas.on('contextmenu', rightclick);
      $canvas.on('mouseup touchend', stopdrag);
    });

    addRegion = function() {

      maxRegion++;
      activeRegion = maxRegion;
      $('button.regionSelect').removeClass('btn-success');
      $regionSelect = $('<button type="button" class="btn btn-success regionSelect" data-region="' + maxRegion + '"><i class="icon-square"></i>Region #' + maxRegion + '</button>');
      $(input).after($regionSelect);

      $regionSelect.on('click',function(){
        $('button.regionSelect').removeClass('btn-success');
        $(this).addClass('btn-success');
        activeRegion = $(this).data('region');
        activePoint = null;
        draw();
      });

      points[maxRegion] = [];
      draw();

    }

    reset = function() {
      points = { 0 : [] };
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
        if ( dis < 6 ) {
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

      if (points[activeRegion].length < 2) {
        return false;
      }

      ctx.canvas.width = ctx.canvas.width;

      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'rgb(255,255,255)'
      ctx.strokeStyle = 'rgb(255,20,20)';
      ctx.lineWidth = 1;

      var origActiveRegion = activeRegion;
      for(i in points){
        activeRegion = i;
        ctx.beginPath();
        ctx.moveTo(points[activeRegion][0], points[activeRegion][1]);
        for (var i = 0; i < points[activeRegion].length; i+=2) {
          ctx.fillRect(points[activeRegion][i]-2, points[activeRegion][i+1]-2, 4, 4);
          ctx.strokeRect(points[activeRegion][i]-2, points[activeRegion][i+1]-2, 4, 4);
          if (points[activeRegion].length > 2 && i > 1) {
            ctx.lineTo(points[activeRegion][i], points[activeRegion][i+1]);
          }
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        if(activeRegion==origActiveRegion)
          ctx.fill();
        ctx.stroke();
      }
      activeRegion = origActiveRegion;

    };

    record = function() { 
      $(input).val(JSON.stringify(points));
      /*$(input).val(points[activeRegion].join(','));*/
    };

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