import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { isSameChessMoveRequest } from "../src/lib/chess/move-idempotency.mjs";
import { getDrawOfferDecision, getRematchLockDecision, getRematchRequestDecision } from "../src/lib/chess/rematch-consent.mjs";

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


test("detects a claimable fifty-move draw", () => {
  const game = new Chess("7k/8/8/8/8/8/8/R6K w - - 100 51");
  assert.equal(game.isDrawByFiftyMoves(), true);
});


test("accepts an exact retry of a persisted Chess move", () => {
  assert.equal(isSameChessMoveRequest(
    { uid: "player-1", from: "e2", to: "e4", promotion: null },
    "player-1",
    { from: "e2", to: "e4" },
  ), true);
});

test("rejects reuse of a Chess move ID for a different move", () => {
  const previous = { uid: "player-1", from: "e2", to: "e4", promotion: null };
  assert.equal(isSameChessMoveRequest(previous, "player-1", { from: "e2", to: "e3" }), false);
  assert.equal(isSameChessMoveRequest(previous, "player-2", { from: "e2", to: "e4" }), false);
  assert.equal(isSameChessMoveRequest(previous, "player-1", { from: "e2", to: "e4", promotion: "q" }), false);
});


test("Chess rematch requires both original players to consent", () => {
  const first = getRematchRequestDecision(["white", "black"], [], "white");
  assert.deepEqual(first, { status: "waiting", requestedBy: ["white"] });
  const second = getRematchRequestDecision(["white", "black"], first.requestedBy, "black");
  assert.deepEqual(second, { status: "ready", requestedBy: ["white", "black"] });
});

test("Chess rematch consent is idempotent and rejects outsiders", () => {
  assert.deepEqual(
    getRematchRequestDecision(["white", "black"], ["white"], "white"),
    { status: "waiting", requestedBy: ["white"] },
  );
  assert.deepEqual(
    getRematchRequestDecision(["white", "black"], [], "spectator"),
    { status: "forbidden" },
  );
});

test("Chess rematch refuses to create a second active match for a locked player", () => {
  assert.deepEqual(
    getRematchLockDecision(["white", "black"], ["black"]),
    { status: "conflict", uid: "black" },
  );
});

test("Chess rematch can replace stale locks but rejects invalid player pairs", () => {
  assert.deepEqual(getRematchLockDecision(["white", "black"], []), { status: "ready" });
  assert.deepEqual(getRematchLockDecision(["white", "white"], []), { status: "invalid" });
});


test("starter AI returns only legal Black moves and does not mutate the position", async () => {
  const { chooseAiMove } = await import("../src/lib/chess/ai.mjs");
  const game = new Chess();
  game.move("e4");
  const before = game.fen();
  for (const difficulty of ["easy", "medium", "hard"]) {
    const move = chooseAiMove(game, difficulty, () => 0);
    assert.ok(move);
    assert.ok(game.moves({ verbose: true }).some(legal => legal.from === move.from && legal.to === move.to));
    assert.equal(game.fen(), before);
  }
});

test("starter AI refuses to move for White or after the game has ended", async () => {
  const { chooseAiMove } = await import("../src/lib/chess/ai.mjs");
  assert.equal(chooseAiMove(new Chess(), "medium", () => 0), null);
  const finished = new Chess();
  for (const move of ["f3", "e5", "g4", "Qh4#"]) finished.move(move);
  assert.equal(chooseAiMove(finished, "hard", () => 0), null);
});

test("Advanced starter AI takes an immediate checkmate when available", async () => {
  const { chooseAiMove } = await import("../src/lib/chess/ai.mjs");
  const game = new Chess();
  for (const move of ["f3", "e5", "g4"]) game.move(move);
  const move = chooseAiMove(game, "hard", () => 0);
  assert.ok(move);
  game.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
  assert.equal(game.isCheckmate(), true);
});


test("draw offer can be offered and accepted only by the other participant", () => {
  assert.deepEqual(getDrawOfferDecision(["white", "black"], null, "white", "offer"), {
    status: "offered", offer: { byUid: "white" },
  });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], { byUid: "white" }, "black", "accept"), { status: "accepted" });
});

test("draw offer can be declined or cancelled by the correct participant", () => {
  assert.deepEqual(getDrawOfferDecision(["white", "black"], { byUid: "white" }, "black", "decline"), { status: "declined" });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], { byUid: "white" }, "white", "cancel"), { status: "cancelled" });
});

test("draw offer rejects outsiders, self-acceptance and invalid transitions", () => {
  assert.deepEqual(getDrawOfferDecision(["white", "black"], null, "spectator", "offer"), { status: "forbidden" });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], { byUid: "white" }, "white", "accept"), { status: "conflict" });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], null, "black", "accept"), { status: "conflict" });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], { byUid: "white" }, "black", "offer"), { status: "conflict" });
  assert.deepEqual(getDrawOfferDecision(["white", "black"], null, "black", "invalid"), { status: "invalid" });
});
