import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/stores";
import { AnnualRevenueKpiCards } from "../components/AnnualRevenueKpiCards";
import { AnnualRevenueProgressBar } from "../components/AnnualRevenueProgressBar";
import { AnnualRevenueWarningAlert } from "../components/AnnualRevenueWarningAlert";
import { MonthlyRevenueBreakdownTable } from "../components/MonthlyRevenueBreakdownTable";
import { WarningThresholdConfigModal } from "../components/WarningThresholdConfigModal";
import type { IAnnualRevenueTrackingResponse } from "../types/IAnnualRevenueTracking";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

const mockTrackingNormal: IAnnualRevenueTrackingResponse = {
  year: 2026,
  householdId: "hh-001",
  householdName: "Tạp Hóa Bình An",
  taxCode: "0312345678",
  mandatoryThreshold: 1000000000,
  warningThresholdPercentage: 80,
  warningRevenueAmount: 800000000,
  cumulativeRevenue: 450000000,
  cumulativeTaxAmount: 6750000,
  validInvoiceCount: 620,
  thresholdPercentage: 45.0,
  averageMonthlyRevenue: 50000000,
  elapsedMonths: 9,
  projectedReachDate: "2026-11-15",
  projectedInCurrentYear: true,
  remainingRevenueToThreshold: 550000000,
  warningStatus: "BELOW_WARNING",
  isMandatory: false,
  isMandatoryFromBeginning: false,
  shouldShowWarning: false,
  warningMessage: null,
  legalObligationNotice: null,
  monthlyBreakdown: [
    {
      month: 1,
      revenue: 45000000,
      taxAmount: 675000,
      validInvoiceCount: 65,
      cumulativeRevenue: 45000000,
      percentageOfThreshold: 4.5,
    },
    {
      month: 2,
      revenue: 55000000,
      taxAmount: 825000,
      validInvoiceCount: 75,
      cumulativeRevenue: 100000000,
      percentageOfThreshold: 10.0,
    },
  ],
};

const mockTrackingWarningTriggered: IAnnualRevenueTrackingResponse = {
  ...mockTrackingNormal,
  cumulativeRevenue: 850000000,
  thresholdPercentage: 85.0,
  remainingRevenueToThreshold: 150000000,
  warningStatus: "WARNING_TRIGGERED",
  shouldShowWarning: true,
  warningMessage:
    "Doanh thu lũy kế năm 2026 đã đạt 850.000.000 VNĐ (vượt mức cảnh báo 80.0% so với ngưỡng 1 tỷ đồng).",
  legalObligationNotice:
    "Căn cứ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC, hộ kinh doanh có doanh thu trong năm đạt từ 1 tỷ đồng trở lên bắt buộc phải áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền.",
};

const mockTrackingAlreadyMandatory: IAnnualRevenueTrackingResponse = {
  ...mockTrackingNormal,
  cumulativeRevenue: 300000000,
  thresholdPercentage: 30.0,
  warningStatus: "ALREADY_MANDATORY",
  isMandatory: true,
  isMandatoryFromBeginning: true,
  shouldShowWarning: false,
};

const mockTrackingExceeded: IAnnualRevenueTrackingResponse = {
  ...mockTrackingNormal,
  cumulativeRevenue: 1050000000,
  thresholdPercentage: 105.0,
  remainingRevenueToThreshold: 0,
  warningStatus: "EXCEEDED",
  isMandatory: true,
  shouldShowWarning: true,
  warningMessage:
    "Doanh thu lũy kế năm 2026 đã vượt ngưỡng bắt buộc 1 tỷ đồng (1.050.000.000 VNĐ).",
  legalObligationNotice:
    "Căn cứ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC, hộ kinh doanh có doanh thu trong năm đạt từ 1 tỷ đồng trở lên bắt buộc phải chuyển sang áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền.",
};

describe("NCL-12-CN-005: Theo dõi doanh thu lũy kế năm và cảnh báo ngưỡng bắt buộc", () => {
  afterEach(() => {
    cleanup();
  });

  // TC-01: Luồng thành công - Hiển thị đầy đủ số lũy kế, % so với ngưỡng 1 tỷ và ngày dự kiến
  it("NCL-12-CN-005-TC-01: Render đúng số liệu lũy kế năm, ngưỡng 1 tỷ, % tiến độ và dự kiến thời điểm chạm ngưỡng", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnnualRevenueKpiCards data={mockTrackingNormal} />
          <AnnualRevenueProgressBar data={mockTrackingNormal} />
          <MonthlyRevenueBreakdownTable
            breakdown={mockTrackingNormal.monthlyBreakdown}
            year={mockTrackingNormal.year}
          />
        </MemoryRouter>
      </Provider>
    );

    // Kiểm tra hiển thị số lũy kế và ngưỡng
    expect(screen.getByText(/Doanh thu lũy kế năm 2026/i)).toBeInTheDocument();
    expect(screen.getByText("450.000.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("1.000.000.000 ₫")).toBeInTheDocument();

    // Kiểm tra hiển thị số HĐ hợp lệ và % tiến độ
    expect(screen.getByText("620")).toBeInTheDocument();
    expect(screen.getAllByText("45.00%").length).toBeGreaterThan(0);

    // Kiểm tra tốc độ trung bình và ngày dự kiến
    expect(screen.getByText("50.000.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("15/11/2026")).toBeInTheDocument();

    // Kiểm tra bảng phân rã 12 tháng
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
  });

  // TC-02: Ngoại lệ - Lũy kế vượt mức cảnh báo do chủ hộ đặt -> Hệ thống hiện cảnh báo
  it("NCL-12-CN-005-TC-02: Hiển thị banner cảnh báo và trích dẫn nghĩa vụ pháp lý khi lũy kế chạm mức cảnh báo (WARNING_TRIGGERED)", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnnualRevenueWarningAlert data={mockTrackingWarningTriggered} />
          <AnnualRevenueProgressBar data={mockTrackingWarningTriggered} />
        </MemoryRouter>
      </Provider>
    );

    // Kiểm tra tiêu đề và nội dung cảnh báo
    expect(
      screen.getByText(/Cảnh báo: Doanh thu năm 2026 sắp chạm ngưỡng 1 tỷ đồng/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mức cảnh báo 80%/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chủ động chuẩn bị nghĩa vụ hóa đơn điện tử/i)
    ).toBeInTheDocument();
  });

  // TC-03: Sai trạng thái - Hộ đã thuộc diện bắt buộc từ đầu năm -> Không hiện cảnh báo ngưỡng
  it("NCL-12-CN-005-TC-03: Không hiện cảnh báo ngưỡng khi hộ đã thuộc diện bắt buộc từ đầu năm (ALREADY_MANDATORY)", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnnualRevenueWarningAlert data={mockTrackingAlreadyMandatory} />
          <AnnualRevenueKpiCards data={mockTrackingAlreadyMandatory} />
        </MemoryRouter>
      </Provider>
    );

    // Không được xuất hiện text cảnh báo sắp chạm mốc
    expect(
      screen.queryByText(/Cảnh báo: Doanh thu năm 2026 sắp chạm ngưỡng 1 tỷ đồng/i)
    ).not.toBeInTheDocument();

    // Hiển thị badge và thông tin xác nhận diện bắt buộc từ đầu năm
    expect(
      screen.getByText(/Hộ kinh doanh thuộc diện áp dụng HĐĐT máy tính tiền từ đầu năm 2026/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Diện bắt buộc từ đầu năm/i)
    ).toBeInTheDocument();
  });

  // Kiểm tra trường hợp vượt ngưỡng bắt buộc 1 tỷ (EXCEEDED)
  it("Hiển thị cảnh báo cấp độ cao khi doanh thu vượt ngưỡng bắt buộc 1 tỷ đồng (EXCEEDED)", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnnualRevenueWarningAlert data={mockTrackingExceeded} />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText(/Doanh thu năm 2026 đã vượt ngưỡng 1 tỷ đồng/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bắt buộc áp dụng HĐĐT/i)
    ).toBeInTheDocument();
  });

  // Kiểm tra Modal Cấu hình Ngưỡng Cảnh báo (WarningThresholdConfigModal)
  it("Modal Cấu hình Ngưỡng: Kiểm tra validation form tỷ lệ từ 50% đến 99% và nút chọn nhanh", () => {
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <WarningThresholdConfigModal
            isOpen={true}
            onClose={onClose}
            currentPercentage={80}
            isOwner={true}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/Cấu hình mức cảnh báo ngưỡng/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("80")).toBeInTheDocument();

    // Thử chọn nhanh 85%
    const btn85 = screen.getByRole("button", { name: "85%" });
    fireEvent.click(btn85);
    expect(screen.getByDisplayValue("85")).toBeInTheDocument();
    expect(screen.getByText("850.000.000 ₫")).toBeInTheDocument();

    // Thử nhập tỷ lệ không hợp lệ (< 50%)
    const input = screen.getByLabelText(/Tỷ lệ phần trăm cảnh báo/i);
    fireEvent.change(input, { target: { value: "40" } });
    const btnSubmit = screen.getByRole("button", { name: /Lưu cấu hình/i });
    fireEvent.click(btnSubmit);

    expect(
      screen.getByText(/Tỷ lệ cảnh báo hợp lệ phải từ 50.0% đến 99.0%/i)
    ).toBeInTheDocument();
  });

  // Kiểm tra phân quyền: Kế toán (VT-03) không có nút Lưu cấu hình
  it("Modal Cấu hình Ngưỡng: Kế toán (không phải Owner) bị vô hiệu hóa form và không có nút Lưu", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <WarningThresholdConfigModal
            isOpen={true}
            onClose={() => {}}
            currentPercentage={80}
            isOwner={false}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText(/chỉ Chủ hộ \(VT-01\) mới có quyền chỉnh sửa tỷ lệ cảnh báo/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lưu cấu hình/i })).not.toBeInTheDocument();
  });
});
