import { Chess } from "chess.js";

const values = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };

/** @param {Chess} game */
function evaluatePosition(game) {
  if (game.isCheckmate()) return game.turn() === "w" ? -100000 : 100000;
  if (game.isDraw()) return 0;
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece) score += (piece.color === "w" ? 1 : -1) * (values[piece.type] ?? 0);
    }
  }
  return score;
}

/**
 * Minimax with alpha-beta pruning. Scores are always from White's perspective.
 * @param {Chess} game
 * @param {number} depth
 * @param {number} alpha
 * @param {number} beta
 */
function search(game, depth, alpha, beta) {
  if (depth === 0 || game.isGameOver()) return evaluatePosition(game);
  const moves = game.moves({ verbose: true });

  if (game.turn() === "w") {
    let best = -Infinity;
    for (const move of moves) {
      const next = new Chess(game.fen());
      next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
      best = Math.max(best, search(next, depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = new Chess(game.fen());
    next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
    best = Math.min(best, search(next, depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Choose a legal move for the Black-side starter AI.
 * @param {Chess} game
 * @param {"easy" | "medium" | "hard"} difficulty
 * @param {() => number} random
 */
export function chooseAiMove(game, difficulty, random = Math.random) {
  if (game.turn() !== "b" || game.isGameOver()) return null;
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  if (difficulty === "easy") return moves[Math.floor(random() * moves.length)];

  const depth = difficulty === "hard" ? 3 : 2;
  let bestScore = Infinity;
  let bestMoves = [];
  for (const move of moves) {
    const next = new Chess(game.fen());
    next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
    const score = search(next, depth - 1, -Infinity, Infinity);
    if (score < bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }
  return bestMoves[Math.floor(random() * bestMoves.length)] ?? moves[0];
}
