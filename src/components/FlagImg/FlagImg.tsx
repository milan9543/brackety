import { useState } from "react";
import type { Team } from "../../types";

type Props = {
  team: Team | null;
  size?: number;
  faded?: boolean;
};

export function FlagImg({ team, size = 20, faded = false }: Props) {
  const [error, setError] = useState(false);

  if (!team) return <span style={{ width: size, height: size }} className="shrink-0 rounded-full bg-white/10" />;

  const src = `${import.meta.env.BASE_URL}${team.badgeUrl.replace(/^\//, "")}`;

  return error || !team.badgeUrl ? (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] font-mono font-semibold leading-none text-white/70 ${faded ? "opacity-40" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {team.shortName.slice(0, 3)}
    </span>
  ) : (
    <img
      src={src}
      alt={team.shortName}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ring-1 ring-white/15 ${faded ? "opacity-40 grayscale" : ""}`}
      onError={() => setError(true)}
    />
  );
}
