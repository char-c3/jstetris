(function() {

// const
var BLOCK_SIZE = 20;
var FPS = 60;
var colors = ["gray", "red", "blue", "green", "orange", "cyan", "purple", "yellow"];

// class Mino
var Mino = (function() {
  function Mino(seq, color) {
    this.x = 5;
    this.y = 1;
    this.seq = seq;
    this.color = color;
  }

  Mino.prototype.rotation = function() {
    return this.seq.map(function (v) { return [-v[1], v[0]]; });
  };

  Mino.prototype.draw = function(ctx) {
    ctx.fillStyle = colors[this.color];
    this.seq.forEach(function(v) {
      var mx = v[0], my = v[1], size = BLOCK_SIZE;
      ctx.fillRect((this.x + mx) * size, (this.y + my) * size, size, size);
    }, this);
  };

  Mino.prototype.clone = function() {
    return new Mino(this.seq, this.color);
  };

  return Mino;
})();

var minoTemplate = [
  new Mino([[-1, 0], [ 0, 0], [1, 0], [ 2, 0]], 1), // bar
  new Mino([[-1, 0], [ 0, 0], [1, 0], [ 0, 1]], 2), // T
  new Mino([[0,  0], [ 0, 1], [1, 0], [ 1, 1]], 3),  // square
  new Mino([[1, -1], [ 1, 0], [1, 1], [ 0, 1]], 4),// reverseL
  new Mino([[0, -1], [ 0, 0], [0, 1], [ 1, 1]], 5), //L
  new Mino([[0,  0], [ 1, 0], [0, 1], [-1, 1]], 6), // key1
  new Mino([[1,  0], [ 0, 0], [1, 1], [ 2, 1]], 7) // key2
];

var field = {
  x: 0, y: 0, // fieldを配置するcanvas上の座標
  width: 10,  // 横のブロック数
  height: 20, // 縦のブロック数
  widthPx: this.width * BLOCK_SIZE,
  heightPx: this.height * BLOCK_SIZE,
  blocks: null,
  currentMino: null,
  lastMinoPos: [0, 0],
  count: 0,
  generateMino: function() {
    var idx = Math.floor(Math.random() * minoTemplate.length);
    return minoTemplate[idx].clone();
  },
  getMovableMino: function() {
  },
  canMove: function(dx, dy) {
    var mino = this.currentMino;
    for (var i = 0, len = mino.seq.length; i < len; i++) {
      var x = mino.x + mino.seq[i][0], y = mino.y + mino.seq[i][1];
      if (this.blocks[y + dy][x + dx] !== 0) {
        return false;
      }
    }
    return true;
  },
  left: function() {
    if (this.canMove(-1, 0)) {
      this.currentMino.x--;
    }
  },
  right: function() {
    if (this.canMove(1, 0)) {
      this.currentMino.x++;
    }
  },
  down: function(autoFlag) {
    if (!autoFlag) {
      this.count = 0;
    }

    if (!this.canMove(0, 1)) {
      if (this.currentMino.x === this.lastMinoPos[0]
          && this.currentMino.y === this.lastMinoPos[1]) {
        this.currentMino.seq.forEach(function (v){
          var x = this.currentMino.x + v[0],
              y = this.currentMino.y + v[1];
          this.blocks[y][x] = this.currentMino.color;
        }, this);
        this.currentMino = null;
        this.lastMinoPos = [0, 0];
        return;
      }
    } else {
      this.currentMino.y++;
    }
    this.lastMinoPos = [this.currentMino.x, this.currentMino.y];
  },
  autoDown: function() {
    while(this.currentMino) {
      this.down(false);
    }
  },
  spin: function() {
    var newSeq = this.currentMino.rotation();
    var mino = this.currentMino;
    for (var i = 0, len = mino.seq.length; i < len; i++) {
      var x = mino.x + newSeq[i][0], y = mino.y + newSeq[i][1];
      if (this.blocks[y][x] !== 0) {
        return;
      }
    }
    this.currentMino.seq = newSeq;
  },
  delete: function() {
    var line = height;
    while(line) {
      // 非0になるには、一つでも0のマスがあってはいけない
      if (this.blocks[line].reduce(function(a, b) { return a * b; })) {
        for (var y = line; y > 1; y--) {
          for (var x = 1; x <= this.width; x++) {
            this.blocks[y][x] = this.blocks[y - 1][x];
          }
        }
        // this.blocks[1] = this.blocks[1].map(function() { return 0; });
        for (var x = 1; x <= this.width; x++) {
          this.blocks[1][x] = 0;
        }
      } else {
        line--;
      }
    }
  },
  setup: function() {
    this.blocks = [];
    for (var y = 0; y <= this.height + 1; y++) {
      this.blocks.push([]);
      var b = this.blocks[y];
      for (var x = 0; x <= this.width + 1; x++) {
        b.push(0);
      }
      b[0] = b[this.width + 1] = -1;
    }
    for (var x = 1; x <= this.width; x++) { 
      this.blocks[this.height + 1][x] = -1;
    }
  },
  update: function() {
    this.count = (this.count + 1) % FPS;
    if (!this.currentMino) {
      var next = this.generateMino();

      // おくことができなかったらゲームオーバー
      var mino = next;
      for (var i = 0, len = mino.seq.length; i < len; i++) {
        var x = mino.x + mino.seq[i][0], y = mino.y + mino.seq[i][1];
        if (this.blocks[y][x] !== 0) {
          return;
        }
      }

      this.currentMino = next;
    }

    if (this.count === 0) {
      this.down(true);
    }

    this.delete();
  },
  draw: function(ctx) {
    if (!this.blocks) {
      return;
    }

    for (var y = 1; y <= this.height; y++) {
      for (var x = 1; x <= this.width; x++) {
        ctx.fillStyle = colors[this.blocks[y][x]];
        ctx.fillRect(this.x + x * BLOCK_SIZE, this.y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    if (this.currentMino) {
      this.currentMino.draw(ctx);
    }
  },
  dump: function() {
    console.log(this.blocks);
  }
};

var canvas;
var ctx;
function setup() {
  canvas = document.getElementById("main-canvas");
  if (!canvas || !canvas.getContext) {
    return false;
  }

  ctx = canvas.getContext("2d");
  field.setup();
  field.dump();
  return true;
}

function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(field.x, field.y, field.widthPx, field.heightPx);
  field.update();
  field.draw(ctx);
}

document.addEventListener("keydown", function(e) {
  if (e.keyIdentifier === "Down") {
    console.log(e.keyIdentifier);
    field.down(false);
  }
  if (e.keyIdentifier === "Left") {
    console.log(e.keyIdentifier);
    field.left();
  }
  if (e.keyIdentifier === "Right") {
    console.log(e.keyIdentifier);
    field.right();
  }
  if (e.code === "Space") {
    console.log(e.code);
    field.autoDown();
  }
  if (e.code === "KeyZ") {
    console.log(e.code);
    field.spin();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  if (setup()) {
    draw();
  }
});

})();
