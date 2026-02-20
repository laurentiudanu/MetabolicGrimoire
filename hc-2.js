#!/usr/bin/env node

const readline = require("readline");
const { webcrypto } = require("crypto");
const crypto = webcrypto;

// ===============================
// Secure Random
// ===============================

function secureRandomInt(max) {
  const maxUint32 = 0xFFFFFFFF;
  const limit = Math.floor(maxUint32 / max) * max;

  while (true) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    if (array[0] < limit) return array[0] % max;
  }
}

// ===============================
// Hypercube Engine
// ===============================

class Hypercube {
  constructor(size = 4) {
    this.size = size;
    this.turn = 0;
    this.exit = this.getCenter();
    this.position = this.randomStart();
    this.visited = new Map();
  }

  getCenter() {
    const mid = Math.floor(this.size / 2);
    return { x: mid, y: mid, z: mid, w: mid };
  }

  randomStart() {
    return {
      x: secureRandomInt(this.size),
      y: secureRandomInt(this.size),
      z: secureRandomInt(this.size),
      w: secureRandomInt(this.size),
    };
  }

  key(c) {
    return `${c.x},${c.y},${c.z},${c.w}`;
  }

  isInside(c) {
    return ["x","y","z","w"].every(a => c[a] >= 0 && c[a] < this.size);
  }

  isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  // Time-shifting traps
  isTrap(c) {
    const val =
      c.x * 7 +
      c.y * 11 +
      c.z * 13 +
      c.w * 17 +
      this.turn * 19;

    return this.isPrime(val % 97);
  }

  isExit(c) {
    return (
      c.x === this.exit.x &&
      c.y === this.exit.y &&
      c.z === this.exit.z &&
      c.w === this.exit.w
    );
  }

  move(dir) {
    const deltas = {
      xp: { x: 1 }, xn: { x: -1 },
      yp: { y: 1 }, yn: { y: -1 },
      zp: { z: 1 }, zn: { z: -1 },
      wp: { w: 1 }, wn: { w: -1 }
    };

    if (!deltas[dir]) return { error: "Invalid direction." };

    const next = { ...this.position };
    for (let axis in deltas[dir]) {
      next[axis] += deltas[dir][axis];
    }

    if (!this.isInside(next)) {
      return { error: "You hit the boundary wall." };
    }

    this.turn++;
    this.position = next;

    const trap = this.isTrap(next);

    this.visited.set(this.key(next), {
      trap,
      turn: this.turn
    });

    return {
      position: this.position,
      trap,
      exit: this.isExit(next),
      turn: this.turn
    };
  }

  // ===============================
  // ASCII 3D Slice Viewer
  // ===============================
  // Shows 3D cube at current W level

  renderSlice() {
    const wLevel = this.position.w;

    console.log(`\n🧊 3D Slice at W = ${wLevel}`);
    console.log("Z increases downward. X increases right. Y layers separated.\n");

    for (let y = 0; y < this.size; y++) {
      console.log(`--- Y = ${y} ---`);
      for (let z = 0; z < this.size; z++) {
        let row = "";
        for (let x = 0; x < this.size; x++) {
          const coord = { x, y, z, w: wLevel };
          const key = this.key(coord);

          if (
            this.position.x === x &&
            this.position.y === y &&
            this.position.z === z &&
            this.position.w === wLevel
          ) {
            row += " P ";
          } else if (this.isExit(coord)) {
            row += " E ";
          } else if (this.visited.has(key)) {
            row += this.visited.get(key).trap ? " X " : " . ";
          } else {
            row += " ? ";
          }
        }
        console.log(row);
      }
      console.log("");
    }

    console.log("Legend:");
    console.log(" P = You");
    console.log(" E = Exit (center)");
    console.log(" X = Known trap (when discovered)");
    console.log(" . = Known safe");
    console.log(" ? = Unvisited (unknown)");
  }

  printHelp() {
    console.log("\nMovement Commands:");
    console.log(" xp → +X (right)");
    console.log(" xn → -X (left)");
    console.log(" yp → +Y (forward layer)");
    console.log(" yn → -Y (back layer)");
    console.log(" zp → +Z (down)");
    console.log(" zn → -Z (up)");
    console.log(" wp → +W (next 3D slice)");
    console.log(" wn → -W (previous 3D slice)");
    console.log("\nOther Commands:");
    console.log(" map → show visited memory");
    console.log(" view → render 3D slice");
    console.log(" help → show commands");
    console.log(" exit → quit\n");
  }

  printMemory() {
    console.log("\n🌫 Memory:");
    for (let [coord, data] of this.visited.entries()) {
      console.log(` ${coord} → ${data.trap ? "💀 trap" : "safe"} (turn ${data.turn})`);
    }
  }
}

// ===============================
// CLI
// ===============================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cube = new Hypercube(4);

console.log("\n🔲 You awaken inside a shifting hypercube.");
cube.printHelp();
cube.renderSlice();

function prompt() {
  rl.question("\n> ", (cmd) => {
    cmd = cmd.trim();

    if (cmd === "exit") process.exit(0);
    if (cmd === "help") { cube.printHelp(); return prompt(); }
    if (cmd === "view") { cube.renderSlice(); return prompt(); }
    if (cmd === "map") { cube.printMemory(); return prompt(); }

    const result = cube.move(cmd);

    if (result.error) {
      console.log("⚠️", result.error);
      return prompt();
    }

    console.log(`\n⏳ Turn ${result.turn}`);
    console.log("📍 Position:", result.position);

    if (result.trap) {
      console.log("💀 The room shifted into a lethal state.");
      process.exit(0);
    }

    if (result.exit) {
      console.log("🚪 You found the exit at the center!");
      process.exit(0);
    }

    cube.renderSlice();
    prompt();
  });
}

prompt();