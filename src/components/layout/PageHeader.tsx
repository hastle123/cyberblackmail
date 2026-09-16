import { editorial } from "@/lib/editorial";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="mb-10 border-b border-line pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h1 className={editorial.pageTitle}>{title}</h1>
          {subtitle && <p className={`mt-3 ${editorial.body} text-fg-3`}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
