import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, Tooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";

interface CostBreakdownChartProps {
  costs: {
    acquisition: number;
    construction: number;
    development: number;
    financing: number;
    marketing: number;
    holding: number;
  };
}

const COLORS = ["#1E3A5F", "#00B8A9", "#10B981", "#F59E0B", "#EF4444", "#64748B"];

const margin = { top: 10, right: 20, bottom: 40, left: 100 };

type DataItem = { name: string; value: number; color: string };

function ChartInner({
  data,
  width,
  height,
}: {
  data: DataItem[];
  width: number;
  height: number;
}) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<DataItem>();

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const yScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => d.name),
        range: [0, innerHeight],
        padding: 0.3,
      }),
    [data, innerHeight]
  );

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 0), [data]);

  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue],
        range: [0, innerWidth],
        nice: true,
      }),
    [maxValue, innerWidth]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGPathElement>, d: DataItem) => {
      const point = localPoint(event);
      if (!point) return;
      showTooltip({
        tooltipData: d,
        tooltipLeft: point.x,
        tooltipTop: point.y,
      });
    },
    [showTooltip]
  );

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  return (
    <div className="relative w-full h-full">
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {data.map((d) => {
            const barWidth = xScale(d.value);
            const barHeight = yScale.bandwidth();
            const barY = yScale(d.name) ?? 0;
            return (
              <Bar
                key={d.name}
                x={0}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx={4}
                onMouseMove={(event) => handleMouseMove(event, d)}
                onMouseLeave={hideTooltip}
              />
            );
          })}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickFormat={(v) => `$${(v as number / 1000).toFixed(0)}k`}
            stroke="#cbd5e1"
            tickStroke="#cbd5e1"
            tickLabelProps={() => ({
              fill: "#64748b",
              fontSize: 11,
              textAnchor: "middle",
            })}
          />
          <AxisLeft
            scale={yScale}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "#334155",
              fontSize: 12,
              textAnchor: "end",
              dx: -8,
            })}
          />
        </g>
      </svg>
      {tooltipOpen && tooltipData && (
        <Tooltip
          left={tooltipLeft}
          top={tooltipTop}
          className="bg-slate-800 text-white text-xs rounded px-2 py-1 pointer-events-none shadow-lg"
        >
          <div className="font-semibold">{tooltipData.name}</div>
          <div>{formatCurrency(tooltipData.value)}</div>
        </Tooltip>
      )}
    </div>
  );
}

export function CostBreakdownChart({ costs }: CostBreakdownChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const raw = [
      { name: "Acquisition", value: costs.acquisition },
      { name: "Construction", value: costs.construction },
      { name: "Development", value: costs.development },
      { name: "Financing", value: costs.financing },
      { name: "Marketing", value: costs.marketing },
      { name: "Holding", value: costs.holding },
    ].filter((d) => d.value > 0);
    return raw.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
  }, [costs]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {mounted ? (
            <ParentSize>
              {({ width, height }) =>
                width > 0 && height > 0 ? (
                  <ChartInner data={data} width={width} height={height} />
                ) : null
              }
            </ParentSize>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Loading chart...
            </div>
          )}
        </div>
        <p className="mt-4 text-right text-sm text-gray-600">
          Total: <span className="font-mono font-semibold">{formatCurrency(total)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
