import React, { useState, useEffect } from "react";
import {
  Store,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  useGetActivePointsOfSaleQuery,
  useGetPosInventoriesQuery,
  useGetPosLowStockWarningsQuery,
  useUpdatePosInventoryMutation,
  useInitPosInventoriesMutation,
} from "../services/pointOfSaleApi";
import type { IPosInventory, IUpdatePosInventoryRequest, IInitPosInventoryItemRequest } from "../types/IPointOfSale";
import { PosInventoryTable } from "../components/PosInventoryTable";
import { UpdatePosInventoryModal } from "../components/UpdatePosInventoryModal";
import { InitPosInventoryModal } from "../components/InitPosInventoryModal";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { USER_ROLES } from "@/constants/roles";

export const PosInventoryPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [selectedPosId, setSelectedPosId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Active Modals
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<IPosInventory | null>(null);

  const [isInitModalOpen, setIsInitModalOpen] = useState(false);

  // Queries
  const { data: activePosList = [], isLoading: isLoadingPosList } =
    useGetActivePointsOfSaleQuery();

  // Auto-select first or default POS
  useEffect(() => {
    if (activePosList.length > 0 && !selectedPosId) {
      const defaultPos = activePosList.find((p) => p.isDefault) || activePosList[0];
      setSelectedPosId(defaultPos.id);
    }
  }, [activePosList, selectedPosId]);

  const selectedPos = activePosList.find((p) => p.id === selectedPosId);

  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    isFetching,
    refetch: refetchInventories,
  } = useGetPosInventoriesQuery(
    {
      posId: selectedPosId,
      params: {
        keyword: searchTerm.trim() || undefined,
        lowStockOnly: lowStockOnly || undefined,
        page: currentPage,
        size: pageSize,
      },
    },
    { skip: !selectedPosId }
  );

  const { data: warningsList = [], refetch: refetchWarnings } = useGetPosLowStockWarningsQuery(selectedPosId, {
    skip: !selectedPosId,
  });

  const [updatePosInventory, { isLoading: isUpdating }] = useUpdatePosInventoryMutation();
  const [initPosInventories, { isLoading: isInitializing }] = useInitPosInventoriesMutation();

  const inventoryList = inventoryData?.content || [];
  const totalElements = inventoryData?.totalElements || 0;
  const totalPages = inventoryData?.totalPages || 1;

  const handleOpenEdit = (inv: IPosInventory) => {
    setEditingInventory(inv);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (formData: IUpdatePosInventoryRequest) => {
    if (!editingInventory || !selectedPosId) return;
    try {
      await updatePosInventory({
        posId: selectedPosId,
        productId: editingInventory.productId,
        body: formData,
      }).unwrap();
      showSuccess(`Cập nhật tồn kho sản phẩm "${editingInventory.productName}" thành công!`);
      setIsUpdateModalOpen(false);
      refetchInventories();
      refetchWarnings();
    } catch (err: any) {
      showError(err?.data?.message || "Không thể cập nhật tồn kho");
    }
  };

  const handleInitSubmit = async (items: IInitPosInventoryItemRequest[]) => {
    if (!selectedPosId) return;
    try {
      await initPosInventories({
        posId: selectedPosId,
        body: { items },
      }).unwrap();
      showSuccess(`Đã khởi tạo tồn kho cho ${items.length} mặt hàng!`);
      setIsInitModalOpen(false);
      refetchInventories();
      refetchWarnings();
    } catch (err: any) {
      showError(err?.data?.message || "Không thể khởi tạo tồn kho");
    }
  };

  const isOwner = currentRole === USER_ROLES.OWNER;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Tồn kho theo Điểm bán
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý số lượng tồn thực tế và định mức cảnh báo riêng biệt cho từng chi nhánh
          </p>
        </div>

        {/* POS Selector & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <Store className="w-4 h-4 text-kv-blue-primary" />
            <span className="text-xs font-semibold text-slate-500">Chi nhánh:</span>
            <select
              value={selectedPosId}
              onChange={(e) => {
                setSelectedPosId(e.target.value);
                setCurrentPage(0);
              }}
              disabled={isLoadingPosList}
              className="bg-transparent font-bold text-xs text-slate-900 outline-none cursor-pointer"
            >
              {activePosList.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name} ({pos.posCode}){pos.isDefault ? " [Mặc định]" : ""}
                </option>
              ))}
            </select>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsInitModalOpen(true)}
              disabled={!selectedPosId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Khởi tạo tồn hàng loạt
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Banner */}
      {warningsList.length > 0 && (
        <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Chi nhánh <strong>{selectedPos?.name}</strong> có{" "}
                <span className="text-rose-600 font-extrabold">{warningsList.length} mặt hàng</span> chạm ngưỡng cảnh báo tồn tối thiểu!
              </p>
              <p className="text-[11px] text-slate-600">
                Hãy tạo phiếu chuyển hàng từ chi nhánh khác hoặc nhập thêm hàng về để đảm bảo hoạt động bán hàng liên tục.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLowStockOnly(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 self-start sm:self-center"
          >
            Lọc xem {warningsList.length} mặt hàng thiếu
          </button>
        </div>
      )}

      {/* Main Table */}
      <PosInventoryTable
        data={inventoryList}
        totalElements={totalElements}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(0);
        }}
        lowStockOnly={lowStockOnly}
        onLowStockOnlyChange={(val) => {
          setLowStockOnly(val);
          setCurrentPage(0);
        }}
        isLoading={isLoadingInventory || isFetching}
        onEdit={handleOpenEdit}
        userRole={currentRole}
      />

      {/* Modals */}
      <UpdatePosInventoryModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSubmit={handleUpdateSubmit}
        inventory={editingInventory}
        isLoading={isUpdating}
      />

      <InitPosInventoryModal
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
        onSubmit={handleInitSubmit}
        pointOfSale={selectedPos}
        isLoading={isInitializing}
      />
    </div>
  );
};

export default PosInventoryPage;
