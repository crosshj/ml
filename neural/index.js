((window)=> {

  const {Architect, Trainer} = synaptic;

  var results = [];

  const clone = item => {
    return JSON.parse(JSON.stringify(item));
  };

  const intToBitArray = (number, len) => {
    function padLeft(nr, n, str){
      return Array(n-String(nr).length+1).join(str||'0')+nr;
    }

    return padLeft((number).toString(2), len).split('').map(val=>parseInt(val));
  };

  const intToOneBitInArray = (number, parentSize) => {
    var array = new Array(parentSize).fill(0);
    array[number] = 1;
    return array;
  }

  function range(from, to){
    return new Array(to).fill();
  }

  function getYBeforeBalance(id, x, y, width){
    if (y===0){
      return 0.5;
    }
    const before = [];
    range(1, y).forEach((unused, offsetBefore) => {
      const offset = width*(y-offsetBefore-1)*4 + x*4;
      before.push(id.data[offset+1/*green*/]/255);
    });
    const balance = before.reduce((x,y)=>x+y,0)/before.length;
    return balance;
  }

  function getXBeforeBalance(id, x, y, width){
    if (x===0){
      return 0.5;
    }
    const before = [];
    range(1, x).forEach((unused, offsetBefore) => {
      const offset = width*y*4 + (x-offsetBefore-1)*4;
      before.push(id.data[offset+1/*green*/]/255);
    });
    const balance = before.reduce((x,y)=>x+y,0)/before.length;
    return balance;
  }

  function getLeftUpDiagBalance(id, x, y, width){
    if (x===0 || y===0){
      return 0.5;
    }
    const before = [];
    const max = x > y ? x : y;
    range(1, max).forEach((unused, offsetBefore) => {
      if(y-offsetBefore-1 < 0) return;
      if(x-offsetBefore-1 < 0) return;
      const offset = width*(y-offsetBefore-1)*4 + (x-offsetBefore-1)*4;
      before.push(id.data[offset+1/*green*/]/255);
    });
    const balance = before.reduce((x,y)=>x+y,0)/before.length;
    return balance;
  }

  function getRightUpDiagBalance(id, x, y, width){
    if (y===0 || x===(width-1)){
      return 0.5;
    }
    const before = [];
    const max = (width-1) > y ? (width-1) : y;
    range(1, max).forEach((unused, offsetBefore) => {
      if(y-offsetBefore-1 < 0) return;
      if(x+offsetBefore >= width) return;
      const offset = width*(y-offsetBefore-1)*4 + (x+offsetBefore)*4;
      before.push(id.data[offset+1/*green*/]/255);
    });
    const balance = before.reduce((x,y)=>x+y,0)/before.length;
    return balance;
  }

  function getInputs(id, x, y, xmax, ymax){
    //position metrics
    const xyInputs = intToBitArray(y,8).concat(intToBitArray(x,8));
    //other metrics
    const yBefore = getYBeforeBalance(id, x, y, xmax);
    const xBefore = getXBeforeBalance(id, x, y, xmax);
    const leftUp = getLeftUpDiagBalance(id, x, y, xmax);
    const rightUp = getRightUpDiagBalance(id, x, y, xmax);

    const inputs = xyInputs.concat([yBefore, xBefore, leftUp, rightUp]);

    return inputs;
  }

  var _max = 255;
  var _min = 0;
  function spread(val, max, min){
    _max = max;
    _min = min;
    return (val-min)*(255/(max-min));
  }
  function shrink(val){
    return (val * ((_max-_min)/255))+_min;
  }

  function trainingSetFromImageData(id, xmax, ymax){
    var results = [];
    var max = 0;
    var min = 255;
    id.data.forEach((x,i)=>{
      if(i%4-1===0){ //green
        if(max < x){ max = x; }
        if(min > x){ min = x; }
      }
    });


    range(0, xmax).forEach((unused_x, x) => {
      range(0, ymax).forEach((unused_y, y) => {
        const offset = xmax*y*4 + x*4;
        results.push({
          input: getInputs(id, x, y, xmax, ymax),
          output: [
            spread(id.data[offset + 1],max,min)/255
          ]
        });

      });
    });

    return results;
  }

  function imageFromNet(id, setter, xmax, ymax, nt){
    range(0, xmax).forEach((unused_x, x) => {
      range(0, ymax).forEach((unused_y, y) => {
        const offset = xmax*y*4 + x*4;
        var greenOutput = nt.activate(
          getInputs(id, x, y, xmax, ymax)
        )[0];
        greenOutput = shrink(greenOutput * 255)
        var _color = {
          r: 0,
          g: greenOutput,
          b: 0,
          a: 255
        };
        setter(id, _color, {x, y, xmax});
      });
    });
    return id;
  }

  function neuralize(setter){
    //init.bind(this)(setter);
    const ctx = this.canvas.getContext('2d');
    gridProcess(ctx, setter, this.dimensions.x, this.dimensions.y);
  }

  function gridProcess(ctx, setter, xmax, ymax){
    const GRID_SIZE = 10;

    var input = 20;
    var pool = 20;
    var output = 1;
    var connections = 30;
    var gates = 10;

    const liqNetOptions = [input, pool, output, connections, gates];

    var tasksArray = [];
    const tOptions = {
      rate: .1,
      iterations: 13500,
      error: .15,
      shuffle: true,
      log: 0
    };
    const allowError = 0.05;
    const netOptions = [20, 15, 1];
    // const net = new Architect.Perceptron(...netOptions);
    // //const net = new Architect.Liquid(...liqNetOptions);
    // const trainer = new Trainer(net);

    range(0, xmax/GRID_SIZE).forEach((unused_x, x) => {
      range(0, ymax/GRID_SIZE).forEach((unused_y, y) => {
        tasksArray.push((callback) => {
          const id = ctx.getImageData(x*GRID_SIZE, y*GRID_SIZE, GRID_SIZE, GRID_SIZE);
          const set = trainingSetFromImageData(id, GRID_SIZE, GRID_SIZE);

          // requestAnimationFrame(() => {
          //   ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);
          // });
          const net = new Architect.Perceptron(...netOptions);
          //const net = new Architect.Liquid(...liqNetOptions);
          const trainer = new Trainer(net);

          tOptions.iterations = 1;
          function train(){
            //trainer.trainAsync(set, tOptions)
            Promise.resolve(trainer.train(set, tOptions))
              .then(results => {
                //console.log(results);
                imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);
                // // make it light while thinking

                // id.data.forEach((x,i) => {
                //   if(i%4==0 && id.data[i+1] < 255){
                //     return;
                //   }
                //   if(i%4-2==0 && id.data[i-1] < 255){
                //     return;
                //   }
                //   if(i%4-1==0 && id.data[i] < 255){
                //     id.data[i] = x+30;
                //     return;
                //   }
                //   id.data[i] = x<255 ? 255 : x;
                // });
                requestAnimationFrame(() => {
                  ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);
                 //tOptions.rate = 0.1; //results.error;
                  if(results.error < tOptions.error){
                    callback();
                  } else {
                    train();
                  }
                 }); //req anim frame

              }); //then
            }; //train
            train();
          });// tasks array push

      });
    });

    var task = 0;
    var taskCallback = ()=>{
      task+=1;
      if(task >= tasksArray.length){ return; }
      tasksArray[task](taskCallback);
    };
    tasksArray[task](taskCallback);
  }


  var randomImageData;
  function init(setter){
    if (!setter) return;

    var ctx = this.canvas.getContext('2d');

    // http://stackoverflow.com/a/23095731/1627873
    function randomRGB(){
      var num = Math.round(0xffffff * Math.random());
      var r = num >> 16;
      var g = num >> 8 & 255;
      var b = num & 255;
      return { r, g, b };
    }

    function randomPixel(setter, xmax, ymax){
      range(0, xmax).forEach((unused_x, x) => {
        range(0, ymax).forEach((unused_y, y) => {
          var _color = randomRGB();
          _color.r = _color.b = 0;
          //_color.r = Math.round(Math.random()) * 255;
          //_color.b = Math.round(Math.random()) * 255;

          _color.g = Math.round(Math.random()) * 255;
          setter(_color, {x, y, xmax});
        });
      });
    }

    randomImageData = randomImageData
      ? randomImageData
      : ctx.createImageData(this.dimensions.x, this.dimensions.y);

    randomPixel(
      (color, pos) => { setter(randomImageData, color, pos)},
      this.dimensions.x,
      this.dimensions.y
    );

    ctx.putImageData( randomImageData, 0, 0 );
  }

  function filter(setter){
    this.canvas.style.filter = this.canvas.style.filter
      ? ''
      : 'url(#myFilter)';
  }

  function lenna(setter){
    if (!setter) return;
    var ctx = this.canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.setAttribute('crossOrigin', 'Anonymous');

    imageObj.onload = function() {
      ctx.drawImage(imageObj, 0, 0);
    };
    imageObj.src = 'https://crosshj.com/sandbox/src/canvas/Lenna.png';
  }

  function vader(setter){
    if (!setter) return;
    var ctx = this.canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.setAttribute('crossOrigin', 'Anonymous');

    imageObj.onload = function() {
      ctx.drawImage(imageObj, 0, 0);
    };
    imageObj.src = 'https://crosshj.com/sandbox/src/canvas/vader.png';
  }

  var buttons = [{
    text: 'random',
    onClick: init
  },{
    text: 'lenna',
    onClick: lenna
  },{
    text: 'vader',
    onClick: vader
  },{
    text: 'filter',
    onClick: filter
  }, {
    text: 'neural',
    onClick: neuralize
  }];


  var options = {
    init,
    buttons
  };


  function ready(){
    var cv = new CanvasPlus(options);
    cv.start();
  }

  document.addEventListener('DOMContentLoaded', ready, false);

})(window)
