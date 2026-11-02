import type { Metadata } from "next";
import ChessGame from "@/components/ChessGame";

export const metadata: Metadata = {
  title: "Fun Ground Chess",
  description: "Play Fun Ground Chess against AI. Choose Casual or Training mode and practise your chess strategy.",
  alternates: { canonical: "/chess" },
};

export default function ChessPage() {
  return <main className="page-container chess-page">
    <div className="breadcrumbs"><a href="/">Home</a><span>/</span><strong>Fun Ground Chess</strong></div>
    <ChessGame />
  </main>;
}
