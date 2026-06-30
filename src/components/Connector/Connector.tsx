import type { Edge } from "../../layout/polar";
import { RadialLine, AxialLine } from "../lines/lines";

type Props = {
  edge: Edge;
  isHighlighted: boolean;
  isAdvanced: boolean;
};

export function Connector({ edge, isHighlighted, isAdvanced }: Props) {
  const stroke = isHighlighted
    ? "rgba(255,200,50,0.85)"
    : isAdvanced
      ? "rgba(255,255,255,0.75)"
      : "rgba(255,255,255,0.1)";
  const strokeWidth = isHighlighted ? 1.5 : isAdvanced ? 1.5 : 1;
  const radialStrokeWidth = strokeWidth;

  return (
    <g>
      <AxialLine
        radius={edge.arc.radius}
        fromDegree={edge.arc.fromDegree}
        toDegree={edge.arc.toDegree}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <RadialLine
        degree={edge.spoke.degree}
        fromRadius={edge.spoke.fromRadius}
        toRadius={edge.spoke.toRadius}
        stroke={stroke}
        strokeWidth={radialStrokeWidth}
      />
    </g>
  );
}
