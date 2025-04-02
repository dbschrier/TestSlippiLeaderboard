import { useEffect, useState } from "react";
import { rate, Rating } from "openskill";

const ORDINAL_SCALING = 25;
const ORDINAL_OFFSET = 1100;
const SLIPPI_API = "https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql";

// Converts mu/sigma to Slippi-style ordinal
const slippiOrdinal = (r: Rating): number =>
  ORDINAL_SCALING * (r.mu - 3 * r.sigma) + ORDINAL_OFFSET;

// Parse query params from hash
function getOpponentCodeFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash; // e.g. "#/GmRank?opponent=MEOW%2383"
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return null;

  const queryString = hash.slice(queryIndex + 1); // remove everything before `?`
  const params = new URLSearchParams(queryString);
  const raw = params.get("opponent");
  return raw ? decodeURIComponent(raw).toUpperCase() : null;
}

// Fetch Slippi profile data from connect code
const fetchSlippiProfile = async (code: string) => {
  const query = `
    query {
      getConnectCode(code: "${code.toUpperCase()}") {
        user {
          displayName
          rankedNetplayProfile {
            ratingMu
            ratingSigma
            ratingOrdinal
          }
        }
      }
    }`;

  const res = await fetch("https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  const user = json?.data?.getConnectCode?.user;
  if (!user || !user.rankedNetplayProfile) {
    throw new Error(`Ranked profile not found for code: ${code}`);
  }

  const { ratingMu, ratingSigma, ratingOrdinal } = user.rankedNetplayProfile;

  return {
    mu: ratingMu,
    sigma: ratingSigma,
    ordinal: ratingOrdinal,
    name: user.displayName,
  };
};

export default function PredictTextOnly() {
  const [text, setText] = useState("Loading...");

  useEffect(() => {
    const run = async () => {
      try {
        const opponentCode = getOpponentCodeFromHash();
        const playerCode = "MNCH#724";

        if (!opponentCode || !opponentCode.includes("#")) {
          setText("Error: Opponent connect code missing or invalid (use ?opponent=TAG#123)");
          return;
        }

        const [player, opponent] = await Promise.all([
          fetchSlippiProfile(playerCode),
          fetchSlippiProfile(opponentCode),
        ]);

        const [[win]] = rate([[{ mu: player.mu, sigma: player.sigma }], [{ mu: opponent.mu, sigma: opponent.sigma }]]);
        const [, [loss]] = rate([[{ mu: opponent.mu, sigma: opponent.sigma }], [{ mu: player.mu, sigma: player.sigma }]]);

        const winOrdinal = slippiOrdinal(win);
        const lossOrdinal = slippiOrdinal(loss);

        const deltaWin = winOrdinal - player.ordinal;
        const deltaLoss = lossOrdinal - player.ordinal;

        setText(`Predicted Points vs ${opponent.name} | +${deltaWin.toFixed(1)} | ${deltaLoss.toFixed(1)}`);
      } catch (err: any) {
        setText(`Error: ${err.message}`);
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: "2rem", fontSize: "1.5rem", fontFamily: "monospace" }}>
      {text}
    </div>
  );
}
