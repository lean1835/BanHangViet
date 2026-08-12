import { baseApi } from "@/stores/baseApi";
import type {
  ISupplier,
  ISupplierFilter,
  ICreateSupplierRequest,
  IUpdateSupplierRequest,
  ISupplierDebtPayment,
} from "../types/supplier";

// Dữ liệu mẫu (Mock Suppliers) tuân thủ dữ liệu KiotViet cho trải nghiệm mượt mà
export const INITIAL_MOCK_SUPPLIERS: ISupplier[] = [
  {
    id: "sup-005",
    code: "NCC0003",
    name: "Công ty Pharmedic",
    phone: "0908123456",
    email: "contact@pharmedic.vn",
    address: "345 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh",
    taxCode: "0109876543",
    groupName: "Hóa mỹ phẩm - Tiêu dùng",
    companyName: "Công ty Cổ phần Pharmedic",
    notes: "Nhà cung cấp dược mỹ phẩm",
    currentDebt: 0,
    totalPurchase: 0,
    totalPurchaseNet: 0,
    status: "ACTIVE",
    createdAt: "2026-05-10T09:00:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-006",
    code: "NCC0004",
    name: "Đại lý Hồng Phúc",
    phone: "0913987654",
    email: "hongphuc.daily@gmail.com",
    address: "12 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh",
    taxCode: "0309876543",
    groupName: "Bánh kẹo - Nước giải khát",
    companyName: "Đại lý Hồng Phúc",
    notes: "Đại lý phân phối nước giải khát",
    currentDebt: 0,
    totalPurchase: 0,
    totalPurchaseNet: 0,
    status: "ACTIVE",
    createdAt: "2026-05-12T10:30:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-007",
    code: "NCC0005",
    name: "Cửa hàng Đại Việt",
    phone: "0937554433",
    email: "daiviet.store@gmail.com",
    address: "56 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",
    taxCode: "0809876543",
    groupName: "Thiết bị - Gia dụng",
    companyName: "Cửa hàng Đại Việt",
    notes: "Gia dụng và thiết bị cửa hàng",
    currentDebt: 0,
    totalPurchase: 0,
    totalPurchaseNet: 0,
    status: "ACTIVE",
    createdAt: "2026-05-15T14:00:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-008",
    code: "NCC0001",
    name: "Công ty TNHH Citigo",
    phone: "0901234567",
    email: "info@citigo.com",
    address: "Tầng 6, Tòa nhà Citigo, Quận Cầu Giấy, Hà Nội",
    taxCode: "0101234567",
    groupName: "Thiết bị - Gia dụng",
    companyName: "Công ty TNHH Citigo Software",
    notes: "Đối tác phần mềm KiotViet & phần cứng POS",
    currentDebt: 0,
    totalPurchase: 0,
    totalPurchaseNet: 0,
    status: "ACTIVE",
    createdAt: "2026-01-10T08:00:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-009",
    code: "NCC0002",
    name: "Công ty Hoàng Gia",
    phone: "0988776655",
    email: "hoanggia.corp@gmail.com",
    address: "89 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
    taxCode: "0301234567",
    groupName: "Nông sản - Thực phẩm",
    companyName: "Công ty Cổ phần Hoàng Gia",
    notes: "Thực phẩm đóng gói Hoàng Gia",
    currentDebt: 0,
    totalPurchase: 0,
    totalPurchaseNet: 0,
    status: "ACTIVE",
    createdAt: "2026-01-12T11:00:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-001",
    code: "NCC00001",
    name: "Công ty TNHH Nông Sản Việt Nam",
    phone: "0912345678",
    email: "nongsanviet@gmail.com",
    address: "123 Đường Lê Lợi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    taxCode: "0102030405",
    groupName: "Nông sản - Thực phẩm",
    companyName: "Công ty TNHH Nông Sản Việt Nam",
    notes: "Giao hàng mỗi sáng thứ 2, 4, 6. Chiết khấu 2% cho đơn > 10 triệu.",
    currentDebt: 15500000,
    totalPurchase: 85000000,
    totalPurchaseNet: 82000000,
    status: "ACTIVE",
    createdAt: "2026-01-15T08:30:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-002",
    code: "NCC00002",
    name: "Đại lý Bánh Kẹo & Nước Giải Khát Minh Phát",
    phone: "0987654321",
    email: "minhphat.candy@yahoo.com",
    address: "456 Quốc lộ 1A, Phường 10, Q. Tân Bình, TP. Hồ Chí Minh",
    taxCode: "0304050607",
    groupName: "Bánh kẹo - Nước giải khát",
    companyName: "DNTN Minh Phát",
    notes: "Nợ gối đầu 15 ngày.",
    currentDebt: 0,
    totalPurchase: 42000000,
    totalPurchaseNet: 42000000,
    status: "ACTIVE",
    createdAt: "2026-02-01T10:00:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-003",
    code: "NCC00003",
    name: "Nhà Phân Phối Hàng Tiêu Dùng Phú Thái",
    phone: "0903112233",
    email: "phuthai.distributor@gmail.com",
    address: "78 Đường 3/2, Phường 12, Quận 10, TP. Hồ Chí Minh",
    taxCode: "0809101112",
    groupName: "Hóa mỹ phẩm - Tiêu dùng",
    companyName: "Tập đoàn Phú Thái",
    notes: "Nhà cung cấp hóa chất & hóa mỹ phẩm uy tín.",
    currentDebt: 8200000,
    totalPurchase: 31500000,
    totalPurchaseNet: 30000000,
    status: "ACTIVE",
    createdAt: "2026-03-10T14:20:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
  {
    id: "sup-004",
    code: "NCC00004",
    name: "Cơ sở Sản xuất Đồ Khô Tấn Tài",
    phone: "0934556677",
    email: "dokhotantai@gmail.com",
    address: "Chợ Bình Tây, Phường 2, Quận 6, TP. Hồ Chí Minh",
    taxCode: "1122334455",
    groupName: "Nông sản - Thực phẩm",
    companyName: "Cơ sở Tấn Tài",
    notes: "Chuyên hải sản khô, tôm khô, mực khô.",
    currentDebt: 2400000,
    totalPurchase: 18000000,
    totalPurchaseNet: 18000000,
    status: "INACTIVE",
    createdAt: "2026-04-05T09:15:00",
    createdByUserName: "Nguyễn Văn A (Chủ hộ)",
  },
];

export const INITIAL_MOCK_PAYMENTS: ISupplierDebtPayment[] = [
  {
    id: "pay-001",
    supplierId: "sup-001",
    paymentCode: "PC00001",
    amount: 10000000,
    paymentMethod: "BANK_TRANSFER",
    paymentDate: "2026-08-01T15:00:00",
    notes: "Chuyển khoản thanh toán đợt 1 phiếu nhập tháng 7",
    createdByName: "Nguyễn Văn A",
  },
  {
    id: "pay-002",
    supplierId: "sup-003",
    paymentCode: "PC00002",
    amount: 5000000,
    paymentMethod: "CASH",
    paymentDate: "2026-08-05T11:30:00",
    notes: "Trả bớt tiền mặt cho lô hàng tiêu dùng",
    createdByName: "Nguyễn Văn A",
  },
];

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      { content: ISupplier[]; totalElements: number; totalPages: number },
      ISupplierFilter | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBaseQuery) {
        const params = arg || {};
        const result = await fetchWithBaseQuery({
          url: "/suppliers",
          method: "GET",
          params,
        });

        let list = (result.data as any)?.content || (result.data as any) || [];
        if (result.error || !Array.isArray(list) || list.length === 0) {
          list = INITIAL_MOCK_SUPPLIERS;
        }

        if (params.searchQuery) {
          const q = params.searchQuery.trim().toLowerCase();
          list = list.filter(
            (s: ISupplier) =>
              s.name.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q) ||
              s.phone.includes(q) ||
              (s.email && s.email.toLowerCase().includes(q)) ||
              (s.groupName && s.groupName.toLowerCase().includes(q))
          );
        }

        if (params.groupName && params.groupName !== "ALL") {
          list = list.filter((s: ISupplier) => s.groupName === params.groupName);
        }

        if (params.debtStatus === "HAS_DEBT") {
          list = list.filter((s: ISupplier) => s.currentDebt > 0);
        } else if (params.debtStatus === "NO_DEBT") {
          list = list.filter((s: ISupplier) => s.currentDebt <= 0);
        }

        if (params.minDebt !== undefined && params.minDebt !== "") {
          list = list.filter((s: ISupplier) => s.currentDebt >= Number(params.minDebt));
        }

        if (params.maxDebt !== undefined && params.maxDebt !== "") {
          list = list.filter((s: ISupplier) => s.currentDebt <= Number(params.maxDebt));
        }

        if (params.status && params.status !== "ALL") {
          list = list.filter((s: ISupplier) => s.status === params.status);
        }

        const page = params.page || 0;
        const size = params.size || 10;
        const totalElements = list.length;
        const totalPages = Math.ceil(totalElements / size);
        const pagedList = list.slice(page * size, (page + 1) * size);

        return {
          data: {
            content: pagedList,
            totalElements,
            totalPages,
          },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({ type: "Supplier" as const, id })),
              { type: "Supplier", id: "LIST" },
            ]
          : [{ type: "Supplier", id: "LIST" }],
    }),

    getSupplierById: builder.query<ISupplier, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery(`/suppliers/${id}`);
        if (result.error || !result.data) {
          const found = INITIAL_MOCK_SUPPLIERS.find((s) => s.id === id) || INITIAL_MOCK_SUPPLIERS[0];
          return { data: found };
        }
        return { data: result.data as ISupplier };
      },
      providesTags: (_result, _error, id) => [{ type: "Supplier", id }],
    }),

    createSupplier: builder.mutation<ISupplier, ICreateSupplierRequest>({
      async queryFn(newSupplier, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery({
          url: "/suppliers",
          method: "POST",
          body: newSupplier,
        });

        if (result.error || !result.data) {
          const mockCreated: ISupplier = {
            id: `sup-${Date.now()}`,
            code: newSupplier.code || `NCC${Math.floor(10000 + Math.random() * 90000)}`,
            name: newSupplier.name,
            phone: newSupplier.phone,
            email: newSupplier.email,
            address: newSupplier.address,
            taxCode: newSupplier.taxCode,
            groupName: newSupplier.groupName || "Nông sản - Thực phẩm",
            companyName: newSupplier.companyName,
            notes: newSupplier.notes,
            currentDebt: newSupplier.initialDebt || 0,
            totalPurchase: 0,
            totalPurchaseNet: 0,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            createdByUserName: "Nguyễn Văn A (Chủ hộ)",
          };
          INITIAL_MOCK_SUPPLIERS.unshift(mockCreated);
          return { data: mockCreated };
        }

        return { data: result.data as ISupplier };
      },
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<ISupplier, IUpdateSupplierRequest>({
      async queryFn({ id, ...patch }, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery({
          url: `/suppliers/${id}`,
          method: "PUT",
          body: patch,
        });

        if (result.error || !result.data) {
          const idx = INITIAL_MOCK_SUPPLIERS.findIndex((s) => s.id === id);
          if (idx !== -1) {
            INITIAL_MOCK_SUPPLIERS[idx] = {
              ...INITIAL_MOCK_SUPPLIERS[idx],
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            return { data: INITIAL_MOCK_SUPPLIERS[idx] };
          }
          const mockUpdated: ISupplier = {
            id,
            code: patch.code || "NCC00001",
            name: patch.name || "Nhà cung cấp",
            phone: patch.phone || "",
            email: patch.email,
            address: patch.address,
            taxCode: patch.taxCode,
            groupName: patch.groupName,
            currentDebt: 0,
            totalPurchase: 0,
            totalPurchaseNet: 0,
            status: patch.status || "ACTIVE",
            createdAt: new Date().toISOString(),
          };
          return { data: mockUpdated };
        }

        return { data: result.data as ISupplier };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<void, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery({
          url: `/suppliers/${id}`,
          method: "DELETE",
        });

        if (result.error) {
          const idx = INITIAL_MOCK_SUPPLIERS.findIndex((s) => s.id === id);
          if (idx !== -1) {
            INITIAL_MOCK_SUPPLIERS[idx].status = "INACTIVE";
          }
          return { data: undefined };
        }

        return { data: undefined };
      },
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    getSupplierPayments: builder.query<ISupplierDebtPayment[], string>({
      async queryFn(supplierId, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery(`/suppliers/${supplierId}/payments`);
        if (result.error || !Array.isArray(result.data)) {
          return { data: INITIAL_MOCK_PAYMENTS.filter((p) => p.supplierId === supplierId) };
        }
        return { data: result.data as ISupplierDebtPayment[] };
      },
      providesTags: (_result, _error, supplierId) => [{ type: "Supplier", id: `PAYMENTS-${supplierId}` }],
    }),

    paySupplierDebt: builder.mutation<
      ISupplierDebtPayment,
      { supplierId: string; amount: number; paymentMethod: "CASH" | "BANK_TRANSFER"; notes?: string }
    >({
      async queryFn({ supplierId, amount, paymentMethod, notes }, _api, _extraOptions, fetchWithBaseQuery) {
        const result = await fetchWithBaseQuery({
          url: `/suppliers/${supplierId}/payments`,
          method: "POST",
          body: { amount, paymentMethod, notes },
        });

        if (result.error || !result.data) {
          const newPayment: ISupplierDebtPayment = {
            id: `pay-${Date.now()}`,
            supplierId,
            paymentCode: `PC${Math.floor(10000 + Math.random() * 90000)}`,
            amount,
            paymentMethod,
            paymentDate: new Date().toISOString(),
            notes,
            createdByName: "Nguyễn Văn A",
          };
          INITIAL_MOCK_PAYMENTS.unshift(newPayment);
          const sup = INITIAL_MOCK_SUPPLIERS.find((s) => s.id === supplierId);
          if (sup) {
            sup.currentDebt = Math.max(0, sup.currentDebt - amount);
          }
          return { data: newPayment };
        }

        return { data: result.data as ISupplierDebtPayment };
      },
      invalidatesTags: (_result, _error, { supplierId }) => [
        { type: "Supplier", id: supplierId },
        { type: "Supplier", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPaymentsQuery,
  usePaySupplierDebtMutation,
} = supplierApi;
