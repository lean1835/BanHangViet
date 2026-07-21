import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ActivityLogTable } from "../components/ActivityLogTable";

export const ActivityLogPage = () => {
  const { logs } = useDashboardDemo();
  return <ActivityLogTable logs={logs} />;
};

export default ActivityLogPage;
