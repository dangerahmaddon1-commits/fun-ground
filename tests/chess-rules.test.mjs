import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Chess } from "chess.js";

test("standard starting position has 20 legal moves", () => {
  const game = new Chess();
  assert.equal(game.moves().length, 20);
});

test("rejects an illegal pawn move", () => {
  const game = new Chess();
  assert.throws(() => game.move({ from: "e2", to: "e5" }));
  assert.equal(game.fen(), new Chess().fen());
});

test("supports castling and moves the rook", () => {
  const game = new Chess();
  for (const move of ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "O-O"]) game.move(move);
  assert.equal(game.get("g1")?.type, "k");
  assert.equal(game.get("f1")?.type, "r");
  assert.equal(game.get("h1"), undefined);
});

test("supports en passant captures", () => {
  const game = new Chess();
  for (const move of ["e4", "a6", "e5", "d5", "exd6"]) game.move(move);
  assert.equal(game.get("d5"), undefined);
  assert.deepEqual(game.get("d6"), { color: "w", type: "p" });
});

test("supports pawn promotion", () => {
  const game = new Chess("8/P7/8/8/8/7k/8/7K w - - 0 1");
  game.move({ from: "a7", to: "a8", promotion: "q" });
  assert.deepEqual(game.get("a8"), { color: "w", type: "q" });
});

test("detects checkmate", () => {
  const game = new Chess();
  for (const move of ["f3", "e5", "g4", "Qh4#"]) game.move(move);
  assert.equal(game.isCheckmate(), true);
});

test("detects stalemate", () => {
  const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  assert.equal(game.isStalemate(), true);
});

test("detects threefold repetition", () => {
  const game = new Chess();
  for (const move of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]) game.move(move);
  assert.equal(game.isThreefoldRepetition(), true);
});

test("detects insufficient mating material", () => {
  const game = new Chess("8/8/8/8/8/8/4k3/7K w - - 0 1");
  assert.equal(game.isInsufficientMaterial(), true);
});


test("chess board keeps all 64 squares equal and square-shaped", () => {
  const cssPath = fileURLToPath(new URL("../src/app/globals.css", import.meta.url));
  const css = readFileSync(cssPath, "utf8");
  const boardRule = css.match(/\.chess-board\s*\{([^}]+)\}/);
  assert.ok(boardRule, "chess board CSS rule exists");
  assert.match(boardRule[1], /grid-template-columns:\s*repeat\(8,minmax\(0,1fr\)\)/);
  assert.match(boardRule[1], /grid-template-rows:\s*repeat\(8,minmax\(0,1fr\)\)/);
  assert.match(boardRule[1], /aspect-ratio:\s*1/);
});


test("reloading PGN preserves move history and threefold repetition", () => {
  const game = new Chess();
  for (const move of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]) game.move(move);
  const restored = new Chess();
  restored.loadPgn(game.pgn());
  assert.equal(restored.fen(), game.fen());
  assert.equal(restored.history().length, game.history().length);
  assert.equal(restored.isThreefoldRepetition(), true);
});
