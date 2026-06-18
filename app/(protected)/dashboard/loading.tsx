import { PageHeader } from "@/components/ui/PageHeader";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral das horas registradas no período."
      />

      <div className="mb-6 h-32 animate-pulse rounded-2xl border border-[#D6EEF8] bg-white" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-[#D6EEF8] bg-white"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-[#D6EEF8] bg-white"
          />
        ))}
      </div>

      <div className="mt-6 h-64 animate-pulse rounded-2xl border border-[#D6EEF8] bg-white" />
    </>
  );
}
