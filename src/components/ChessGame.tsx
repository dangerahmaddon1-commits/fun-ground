"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import ChessMatchmaking from "@/components/ChessMatchmaking";
import { chooseAiMove } from "@/lib/chess/ai.mjs";

type Mode = "casual" | "training";
type Difficulty = "easy" | "medium" | "hard";
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const symbols: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

function getStatus(game: Chess, thinking: boolean): string {
  if (game.isCheckmate()) return game.turn() === "w" ? "Checkmate — AI wins" : "Checkmate — you win!";
  if (game.isStalemate()) return "Draw by stalemate";
  if (game.isThreefoldRepetition()) return "Draw by threefold repetition";
  if (game.isInsufficientMaterial()) return "Draw — insufficient material";
  if (game.isDraw()) return "Game drawn";
  if (thinking) return "AI is thinking…";
  if (game.isCheck()) return game.turn() === "w" ? "Your king is in check" : "AI is in check";
  return game.turn() === "w" ? "Your move — White" : "AI to move — Black";
}

export default function ChessGame() {
  const [mode, setMode] = useState<Mode>("casual");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [pgn, setPgn] = useState("");
  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState("");
  const game = useMemo(() => {
    const instance = new Chess();
    if (pgn) instance.loadPgn(pgn);
    return instance;
  }, [pgn]);
  const legalTargets = useMemo(() => selected
    ? game.moves({ square: selected, verbose: true }).map(move => move.to)
    : [], [game, selected]);
  const finished = game.isGameOver();
  const status = getStatus(game, thinking);

  useEffect(() => {
    if (game.turn() !== "b" || game.isGameOver()) return;
    setThinking(true);
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(game, difficulty);
      if (move) {
        const next = new Chess(game.fen());
        next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
        setPgn(next.pgn());
      }
      setThinking(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [game, difficulty]);

  function playSquare(square: Square) {
    if (thinking || finished || game.turn() !== "w") return;
    const piece = game.get(square);
    if (selected && legalTargets.includes(square)) {
      const next = new Chess(game.fen());
      try {
        next.move({ from: selected, to: square, promotion: "q" });
        setPgn(next.pgn());
        setSelected(null);
        setNotice("");
      } catch {
        setNotice("That move is not legal.");
      }
      return;
    }
    if (piece?.color === "w") {
      setSelected(square);
      setNotice("");
    } else {
      setSelected(null);
    }
  }

  function undoTurn() {
    const next = new Chess();
    if (pgn) next.loadPgn(pgn);
    if (next.history().length) next.undo();
    if (next.history().length && next.turn() === "b") next.undo();
    setPgn(next.pgn());
    setSelected(null);
    setNotice("Last turn taken back.");
  }

  function restart() {
    setPgn("");
    setSelected(null);
    setThinking(false);
    setNotice("");
  }

  return (
    <section className="chess-layout" aria-label="Fun Ground Chess game">
      <div className="chess-main-panel">
        <div className="chess-board-topline">
          <div><span className="chess-live-dot" /> {mode === "training" ? "TRAINING ROOM" : "CASUAL GAME"}</div>
          <span className="chess-opponent">♟ &nbsp; Fun Ground AI</span>
        </div>
        <div className="chess-board-wrap">
          <div className="chess-board" role="grid" aria-label="Chess board">
            {game.board().map((row, rowIndex) => row.map((piece, colIndex) => {
              const square = `${files[colIndex]}${8 - rowIndex}` as Square;
              const isLight = (rowIndex + colIndex) % 2 === 1;
              const isSelected = selected === square;
              const isTarget = legalTargets.includes(square);
              return <button
                key={square}
                type="button"
                role="gridcell"
                aria-label={`${square}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                aria-pressed={isSelected}
                className={`chess-square ${isLight ? "is-light" : "is-dark"}${isSelected ? " is-selected" : ""}${isTarget ? " is-target" : ""}`}
                onClick={() => playSquare(square)}
                disabled={thinking || finished || game.turn() !== "w"}
              >
                {colIndex === 0 && <span className="chess-rank-label">{8 - rowIndex}</span>}
                {rowIndex === 7 && <span className="chess-file-label">{files[colIndex]}</span>}
                {piece && <span className={`chess-piece ${piece.color === "w" ? "white-piece" : "black-piece"}`}>{symbols[piece.color + piece.type]}</span>}
                {isTarget && !piece && <span className="chess-target-dot" />}
                {isTarget && piece && <span className="chess-capture-ring" />}
              </button>;
            }))}
          </div>
        </div>
        <div className={`chess-status ${finished ? "is-finished" : ""}`} role="status">
          <span className="chess-status-icon">{finished ? "🏁" : thinking ? "…" : "♟"}</span>
          <span>{status}</span>
        </div>
      </div>
      <aside className="chess-side-panel">
        <span className="eyebrow">YOUR FIRST ORIGINAL GAME</span>
        <h1>Fun Ground <em>Chess</em></h1>
        <p className="chess-intro">Sharpen your strategy, practise your openings and challenge the board.</p>
        <div className="chess-mode-switch" aria-label="Game mode">
          <button type="button" className={mode === "casual" ? "active" : ""} onClick={() => { setMode("casual"); restart(); }}>Casual</button>
          <button type="button" className={mode === "training" ? "active" : ""} onClick={() => { setMode("training"); restart(); }}>Training</button>
        </div>
        <label className="chess-setting-label" htmlFor="chess-difficulty">AI difficulty</label>
        <select id="chess-difficulty" className="chess-difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as Difficulty)}>
          <option value="easy">Beginner</option>
          <option value="medium">Intermediate</option>
          <option value="hard">Advanced</option>
        </select>
        <div className="chess-actions">
          <button type="button" className="primary-button" onClick={restart}>New game <span>↻</span></button>
          <button type="button" className="secondary-button" onClick={undoTurn} disabled={!pgn || thinking}>Undo turn</button>
        </div>
        {notice && <p className="chess-notice" role="status">{notice}</p>}
        <ChessMatchmaking />
        <div className="chess-info-card">
          <h2>How to play</h2>
          <ul>
            <li>You play as White. The AI plays as Black.</li>
            <li>Select a piece, then choose a highlighted legal square.</li>
            <li>Promotion is automatic to a queen in this first build.</li>
            <li>All standard chess moves are handled by the chess rules library.</li>
          </ul>
        </div>
        <div className="chess-coming-card">
          <span>COMING NEXT</span>
          <strong>Online Chess Battles</strong>
          <p>Real-player matchmaking, reconnect support and verified match results are being built separately.</p>
        </div>
      </aside>
    </section>
  );
}
