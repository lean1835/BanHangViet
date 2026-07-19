import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { POS_COPY } from "@/constants/pos";
import { PosPlaceholder } from "../components/PosPlaceholder";

const PosSidebar = () => (
  <>
    <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
      {POS_COPY.SIDEBAR_TITLE}
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {POS_COPY.SIDEBAR_SECTION}
      </span>
      <span className="bg-kv-blue-light text-kv-blue-primary font-bold px-3 py-2 rounded-md">
        {POS_COPY.SIDEBAR_ITEM}
      </span>
    </div>
  </>
);

export const PosPage = () => (
  <DashboardWorkspaceLayout sidebar={<PosSidebar />}>
    <PosPlaceholder />
  </DashboardWorkspaceLayout>
);

export default PosPage;
