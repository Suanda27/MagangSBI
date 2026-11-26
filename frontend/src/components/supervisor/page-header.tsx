const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="fx-reveal relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={dl(0)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && <p className="text-[13.5px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
