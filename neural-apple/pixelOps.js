((window)=> {

  const clone = item => {
    return JSON.parse(JSON.stringify(item));
  };

  function range(from, to){
    return new Array(to).fill();
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

  window.pixelOps = {
    clone,
    range,
    spread,
    shrink,
    intToBitArray,
    intToOneBitInArray,
    getXBeforeBalance,
    getYBeforeBalance,
    getLeftUpDiagBalance,
    getRightUpDiagBalance
  };

})(window)