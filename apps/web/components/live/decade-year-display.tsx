function decadeFromYear(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function formatDecadeShort(decade: number): string {
  return `${String(decade % 100).padStart(2, "0")}s`;
}

function ScoreCard({
  label,
  pointsLabel,
  revealValue,
}: {
  label: string;
  pointsLabel: string;
  revealValue: string | null;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-border bg-card px-6 py-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-5xl font-black uppercase tracking-wider">
        {revealValue ?? "?"}
      </p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {pointsLabel}
      </p>
    </div>
  );
}

export function DecadeYearDisplay({
  correctYear,
  decadeLabel,
  decadePointsLabel,
  exactYearLabel,
  exactYearPointsLabel,
  promptLabel,
  questionText,
  reveal,
}: {
  correctYear: number | null;
  decadeLabel: string;
  decadePointsLabel: string;
  exactYearLabel: string;
  exactYearPointsLabel: string;
  promptLabel: string;
  questionText: string;
  reveal: boolean;
}) {
  const correctDecade = correctYear === null ? null : decadeFromYear(correctYear);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {promptLabel}
        </p>
        <h2 className="font-heading text-5xl font-black uppercase tracking-wider md:text-6xl">
          {questionText}
        </h2>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
        <ScoreCard
          label={decadeLabel}
          pointsLabel={decadePointsLabel}
          revealValue={
            reveal && correctDecade !== null
              ? formatDecadeShort(correctDecade)
              : null
          }
        />
        <ScoreCard
          label={exactYearLabel}
          pointsLabel={exactYearPointsLabel}
          revealValue={reveal && correctYear !== null ? String(correctYear) : null}
        />
      </div>
    </div>
  );
}
