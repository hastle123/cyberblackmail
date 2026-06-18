import { editorial } from "@/lib/editorial";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="mb-8 border-b border-white/[0.07] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={editorial.pageTitle}>{title}</h1>
          {subtitle && <p className={`mt-2 ${editorial.body}`}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
