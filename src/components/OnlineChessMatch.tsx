"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Chess, type Square } from "chess.js";
import { auth } from "@/lib/firebase";

type MatchState = {
  matchId: string;
  status: "active" | "completed";
  whiteUid: string;
  blackUid: string;
  turnUid: string | null;
  fen: string;
  pgn: string;
  moveCount: number;
  lastMove: { from: Square; to: Square; san: string } | null;
  result: { winnerUid: string | null; reason: string; outcome: "win" | "draw" } | null;
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const symbols: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

export default function OnlineChessMatch({ matchId }: { matchId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoaded(true);
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, current => {
      setUser(current);
      setAuthLoaded(true);
      if (!current) setLoading(false);
    });
  }, []);

  const refresh = useCallback(async (currentUser: User) => {
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/chess/matches/" + encodeURIComponent(matchId), {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load this match.");
    setMatch(data as MatchState);
    setNotice("");
  }, [matchId]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        await refresh(user);
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : "Could not load this match.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => { if (active) void load(); }, 1800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user, refresh]);

  useEffect(() => {
    setSelected(null);
  }, [match?.fen]);

  const game = useMemo(() => {
    try { return new Chess(match?.fen); }
    catch { return new Chess(); }
  }, [match?.fen]);
  const isWhite = Boolean(user && match?.whiteUid === user.uid);
  const isBlack = Boolean(user && match?.blackUid === user.uid);
  const myColor = isWhite ? "w" : isBlack ? "b" : null;
  const canMove = Boolean(match && user && match.status === "active" && match.turnUid === user.uid && !busy);
  const legalTargets = selected && canMove
    ? game.moves({ square: selected, verbose: true }).map(move => move.to)
    : [];
  const rows = game.board();
  const displayRows = isBlack ? rows.slice().reverse().map(row => row.slice().reverse()) : rows;

  async function submitMove(from: Square, to: Square) {
    if (!user || !match || !canMove) return;
    setBusy(true);
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/chess/matches/" + encodeURIComponent(matchId) + "/moves", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          clientMoveId: crypto.randomUUID(),
          from,
          to,
          promotion: "q",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That move could not be submitted.");
      await refresh(user);
      setSelected(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That move could not be submitted.");
      try { await refresh(user); } catch {}
    } finally {
      setBusy(false);
    }
  }

  function playSquare(square: Square) {
    if (!canMove || !myColor || game.turn() !== myColor) return;
    const piece = game.get(square);
    if (selected && legalTargets.includes(square)) {
      void submitMove(selected, square);
      return;
    }
    if (piece?.color === myColor) {
      setSelected(square);
      setNotice("");
    } else {
      setSelected(null);
    }
  }

  async function resign() {
    if (!user || !match || match.status !== "active" || !window.confirm("Resign this Chess match?")) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/chess/matches/" + encodeURIComponent(matchId) + "/resign", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not resign.");
      await refresh(user);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not resign.");
    } finally {
      setBusy(false);
    }
  }

  if (!authLoaded || loading) return <main className="page-container chess-page"><div className="account-card"><p>Loading Chess match…</p></div></main>;
  if (!user) return <main className="page-container chess-page"><div className="account-card"><h1>Sign in to continue</h1><p>This match is available only to its two players.</p><Link className="primary-button" href="/sign-in">Sign in</Link></div></main>;
  if (!match) return <main className="page-container chess-page"><div className="account-card"><h1>Match unavailable</h1><p>{notice || "This Chess match could not be found."}</p><Link className="primary-button" href="/chess">Back to Chess</Link></div></main>;

  const finished = match.status === "completed";
  const status = finished
    ? match.result?.outcome === "draw"
      ? "Game drawn"
      : match.result?.winnerUid === user.uid ? "You won the match!" : "You lost the match"
    : canMove ? "Your move" : "Opponent's turn";
  const opponent = isWhite ? "Black" : "White";

  return <main className="page-container chess-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/chess">Chess</Link><span>/</span><strong>Online Match</strong></div>
    <section className="chess-layout" aria-label="Online Fun Ground Chess match">
      <div className="chess-main-panel">
        <div className="chess-board-topline">
          <div><span className="chess-live-dot" /> ONLINE MATCH</div>
          <span className="chess-opponent">♟ &nbsp; {opponent} is your opponent</span>
        </div>
        <div className="chess-board-wrap">
          <div className="chess-board" role="grid" aria-label="Online chess board">
            {displayRows.map((row, rowIndex) => row.map((piece, colIndex) => {
              const square = isBlack
                ? (files[7 - colIndex] + (rowIndex + 1)) as Square
                : (files[colIndex] + (8 - rowIndex)) as Square;
              const isLight = ((Number(square[1]) + files.indexOf(square[0])) % 2) === 0;
              const isSelected = selected === square;
              const isTarget = legalTargets.includes(square);
              return <button key={square} type="button" role="gridcell"
                aria-label={square + (piece ? ", " + (piece.color === "w" ? "white" : "black") + " " + piece.type : "")}
                aria-pressed={isSelected}
                className={"chess-square " + (isLight ? "is-light" : "is-dark") + (isSelected ? " is-selected" : "") + (isTarget ? " is-target" : "")}
                onClick={() => playSquare(square)}
                disabled={!canMove || game.turn() !== myColor}>
                {colIndex === 0 && <span className="chess-rank-label">{square[1]}</span>}
                {rowIndex === 7 && <span className="chess-file-label">{square[0]}</span>}
                {piece && <span className={"chess-piece " + (piece.color === "w" ? "white-piece" : "black-piece")}>{symbols[piece.color + piece.type]}</span>}
                {isTarget && !piece && <span className="chess-target-dot" />}
                {isTarget && piece && <span className="chess-capture-ring" />}
              </button>;
            }))}
          </div>
        </div>
        <div className={"chess-status " + (finished ? "is-finished" : "")} role="status">
          <span className="chess-status-icon">{finished ? "🏁" : "♟"}</span><span>{status}</span>
        </div>
      </div>
      <aside className="chess-side-panel">
        <span className="eyebrow">FUN GROUND CHESS</span>
        <h1>Online <em>Match</em></h1>
        <p className="chess-intro">Your moves are checked and saved by the Fun Ground server.</p>
        <div className="chess-info-card">
          <h2>Match details</h2>
          <p>You are playing as <strong>{isWhite ? "White" : "Black"}</strong>.</p>
          <p>Moves played: <strong>{match.moveCount}</strong></p>
          <p>Match status: <strong>{match.status}</strong></p>
          {finished && <p>Result: <strong>{match.result?.reason || "completed"}</strong></p>}
          {finished && match.result?.winnerUid && <p>{match.result.winnerUid === user.uid ? "You are the winner." : "Your opponent won."}</p>}
          {!finished && <button type="button" className="secondary-button" onClick={resign} disabled={busy}>Resign</button>}
        </div>
        {notice && <p className="chess-notice" role="status">{notice}</p>}
        <div className="chess-coming-card"><span>RECONNECT SUPPORT</span><strong>Match state is saved</strong><p>Reloading this page restores the latest server-verified board position.</p></div>
        <Link className="secondary-button" href="/chess">Back to Chess</Link>
      </aside>
    </section>
  </main>;
}
