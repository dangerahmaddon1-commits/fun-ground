import type { Metadata } from "next";
import OnlineChessMatch from "@/components/OnlineChessMatch";

export const metadata: Metadata = {
  title: "Online Chess Match",
  description: "Play a server-validated Chess match on Fun Ground.",
  robots: { index: false, follow: false },
};

export default async function OnlineChessMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <OnlineChessMatch matchId={matchId} />;
}
