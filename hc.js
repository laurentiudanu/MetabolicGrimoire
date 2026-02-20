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

    if (array[0] < limit) {
      return array[0] % max;
    }
  }
}

// ===============================
// Hypercube Engine
// ===============================

class Hypercube {
  constructor(size = 5) {
    this.size = size;
    this.visited = new Set();
    this.exit = this.getCenter();
    this.position = this.randomStart();
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

  coordinateKey(c) {
    return `${c.x},${c.y},${c.z},${c.w}`;
  }

  isInside(c) {
    return ["x","y","z","w"].every(a => c[a] >= 0 && c[a] < this.size);
  }

  isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  isTrap(c) {
    const sum = c.x + c.y + c.z + c.w;
    return this.isPrime(sum);
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

    const newPos = { ...this.position };
    for (let axis in deltas[dir]) {
      newPos[axis] += deltas[dir][axis];
    }

    if (!this.isInside(newPos)) {
      return { error: "You hit a wall of the hypercube." };
    }

    this.position = newPos;
    this.visited.add(this.coordinateKey(newPos));

    return {
      position: this.position,
      trap: this.isTrap(newPos),
      exit: this.isExit(newPos)
    };
  }
}

// ===============================
// CLI Interface
// ===============================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cube = new Hypercube(5);

console.log("\n🔲 You awaken inside a shifting hypercube...");
console.log("Type: xp xn yp yn zp zn wp wn");
console.log("Type: exit to quit\n");

function prompt() {
  rl.question("> ", (input) => {
    if (input === "exit") {
      console.log("You surrender to the maze.");
      process.exit(0);
    }

    const result = cube.move(input.trim());

    if (result.error) {
      console.log("⚠️", result.error);
      return prompt();
    }

    console.log("📍 Position:", result.position);

    if (result.trap) {
      console.log("💀 The room was trapped. You did not survive.");
      process.exit(0);
    }

    if (result.exit) {
      console.log("🚪 You found the exit at the center of the hypercube!");
      process.exit(0);
    }

    prompt();
  });
}

console.log("Starting position:", cube.position);
prompt();