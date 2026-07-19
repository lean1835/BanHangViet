import type { FormEvent } from "react";
import {
  getNextStockEntryId,
  PRODUCT_LOG_ACTIONS,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_STOCK_ENTRY_CONFIG,
  PRODUCT_STOCK_ENTRY_FORM_FIELDS,
} from "@/constants/product";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { StockEntryForm } from "@/modules/product/components/StockEntryForm";
import { StockEntryHistoryTable } from "@/modules/product/components/StockEntryHistoryTable";
import {
  useGetProductsQuery,
  useUpdateProductMutation,
} from "@/modules/product/services/productApi";
import type { IStockEntry } from "@/modules/product/types/IStockEntry";
import { getProductApiErrorMessage } from "@/modules/product/utils/getProductApiErrorMessage";
import { formatActivityTimestamp } from "@/utils/dateFormatter";

export const StockEntryPage = () => {
  const { currentRole, stockEntries, setStockEntries, addLogEntry } = useDashboardDemo();
  const { data: productsData } = useGetProductsQuery({
    size: PRODUCT_STOCK_ENTRY_CONFIG.PRODUCT_QUERY_SIZE,
  });
  const products = productsData?.content || [];
  const [updateProduct] = useUpdateProductMutation();

  const handleAddStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawProductId = data.get(PRODUCT_STOCK_ENTRY_FORM_FIELDS.PRODUCT_ID);
    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const quantity = Number(
      data.get(PRODUCT_STOCK_ENTRY_FORM_FIELDS.QUANTITY),
    );
    const importPrice = Number(
      data.get(PRODUCT_STOCK_ENTRY_FORM_FIELDS.IMPORT_PRICE),
    );
    const rawNotes = data.get(PRODUCT_STOCK_ENTRY_FORM_FIELDS.NOTES);
    const selectedProduct = products.find((product) => product.id === productId);

    if (!selectedProduct) return;

    const newEntry: IStockEntry = {
      id: getNextStockEntryId(stockEntries.length),
      time: formatActivityTimestamp(new Date()),
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      qty: quantity,
      importPrice,
      total: quantity * importPrice,
      notes: typeof rawNotes === "string" ? rawNotes : "",
    };

    try {
      await updateProduct({
        id: selectedProduct.id,
        data: {
          sku: selectedProduct.sku,
          name: selectedProduct.name,
          unit: selectedProduct.unit,
          price: selectedProduct.price,
          stockQuantity: selectedProduct.stockQuantity + quantity,
          taxRateId: selectedProduct.taxRateId,
          status: selectedProduct.status,
        },
      }).unwrap();

      setStockEntries((currentEntries) => [newEntry, ...currentEntries]);
      addLogEntry(
        PRODUCT_LOG_ACTIONS.STOCK_ENTRY,
        PRODUCT_MESSAGE_BUILDERS.STOCK_ENTRY_TARGET(
          selectedProduct.name,
          quantity,
          selectedProduct.unit,
        ),
      );
      alert(PRODUCT_MESSAGES.STOCK_UPDATE_SUCCESS);
      form.reset();
    } catch (error: unknown) {
      alert(
        PRODUCT_MESSAGE_BUILDERS.STOCK_ENTRY_ERROR(
          getProductApiErrorMessage(
            error,
            PRODUCT_MESSAGES.STOCK_UPDATE_FAILED,
          ),
        ),
      );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <StockEntryHistoryTable stockEntries={stockEntries} />
      <StockEntryForm
        currentRole={currentRole}
        products={products}
        onSubmit={handleAddStock}
      />
    </div>
  );
};

export default StockEntryPage;
