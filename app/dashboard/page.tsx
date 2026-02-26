import {DashboardLayout} from "@/features/dashboard-layout";
import {DataTable} from "@/features/data-table/components/DataTable";
import {MetricsOverview} from "@/features/metrics/components/MetricsOverview";

export default function DashboardPage()
{
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        <MetricsOverview />
        <DataTable />
      </div>
    </DashboardLayout>
  );
}
