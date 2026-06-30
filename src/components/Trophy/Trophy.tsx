import { CENTER } from "../../layout/constants";

export function Trophy() {
  const { x, y } = CENTER;
  const glowId = "trophy-glow";

  return (
    <g>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,180,0,0.35)" />
          <stop offset="100%" stopColor="rgba(255,180,0,0)" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={55} fill={`url(#${glowId})`} />
      {/* Inline trophy polygon */}
      <g transform={`translate(${x}, ${y})`}>
        {/* Cup body */}
        <path
          d="M-14,-24 L-16,-8 Q-16,8 0,14 Q16,8 16,-8 L14,-24 Z"
          fill="#f5c518"
        />
        {/* Handles */}
        <path
          d="M-16,-20 Q-28,-20 -28,-10 Q-28,0 -16,-4"
          fill="none"
          stroke="#f5c518"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16,-20 Q28,-20 28,-10 Q28,0 16,-4"
          fill="none"
          stroke="#f5c518"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Stem */}
        <rect x="-4" y="14" width="8" height="10" fill="#f5c518" />
        {/* Base */}
        <rect x="-12" y="24" width="24" height="4" rx="2" fill="#f5c518" />
      </g>
    </g>
  );
}
