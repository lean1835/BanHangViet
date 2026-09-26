import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { useBarcodeScanner } from "@/modules/barcode/hooks/useBarcodeScanner";

const TestBarcodeComponent: React.FC<{ onScan: (barcode: string) => void }> = ({ onScan }) => {
  useBarcodeScanner({ onScan });
  return (
    <div>
      <input id="normal-input" type="text" placeholder="Normal input" />
      <textarea id="test-textarea" placeholder="Note textarea" />
      <div id="chatbot-window">
        <input id="chatbot-text-input" type="text" placeholder="Hỏi trợ lý AI..." />
      </div>
      <div role="dialog">
        <input id="modal-input" type="text" placeholder="Modal input" />
      </div>
    </div>
  );
};

describe("useBarcodeScanner: Phát hiện máy quét mã vạch và chống bắt nhầm phím Enter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("quét mã vạch phần cứng USB/Bluetooth thành công khi nhận chuỗi ký tự nhanh và phím Enter", () => {
    let now = 10000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 5));

    const onScanMock = vi.fn();
    render(<TestBarcodeComponent onScan={onScanMock} />);

    // Mô phỏng máy quét mã vạch bắn 13 ký tự EAN-13 cực nhanh (< 20ms)
    const barcodeChars = "8934567890123".split("");
    for (const char of barcodeChars) {
      fireEvent.keyDown(window, { key: char });
    }
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScanMock).toHaveBeenCalledTimes(1);
    expect(onScanMock).toHaveBeenCalledWith("8934567890123");
  });

  it("TUYỆT ĐỐI KHÔNG bắt nhầm phím Enter khi người dùng gõ trong khung Chatbot AI", () => {
    const onScanMock = vi.fn();
    render(<TestBarcodeComponent onScan={onScanMock} />);

    const chatbotInput = screen.getByPlaceholderText("Hỏi trợ lý AI...");
    chatbotInput.focus();

    // Người dùng gõ tin nhắn trong chatbot
    fireEvent.keyDown(chatbotInput, { key: "c" });
    fireEvent.keyDown(chatbotInput, { key: "o" });
    fireEvent.keyDown(chatbotInput, { key: "n" });
    fireEvent.keyDown(chatbotInput, { key: "Enter" });

    // Không được kích hoạt máy quét mã vạch
    expect(onScanMock).not.toHaveBeenCalled();
  });

  it("TUYỆT ĐỐI KHÔNG bắt nhầm phím Enter khi người dùng gõ tiếng Việt có dấu (Telex/VNI)", () => {
    const onScanMock = vi.fn();
    render(<TestBarcodeComponent onScan={onScanMock} />);

    // Giả lập gõ Telex tạo ra ký tự '- êu' như trong thực tế
    fireEvent.keyDown(window, { key: "-" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "ê" }); // Ký tự có dấu tiếng Việt
    fireEvent.keyDown(window, { key: "u" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScanMock).not.toHaveBeenCalled();
  });

  it("TUYỆT ĐỐI KHÔNG bắt nhầm khi bộ gõ đang trong trạng thái composition (isComposing)", () => {
    const onScanMock = vi.fn();
    render(<TestBarcodeComponent onScan={onScanMock} />);

    // IME composition event
    fireEvent.keyDown(window, { key: "e", isComposing: true });
    fireEvent.keyDown(window, { key: "e", isComposing: true });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScanMock).not.toHaveBeenCalled();
  });

  it("TUYỆT ĐỐI KHÔNG can thiệp khi người dùng gõ trong textarea hoặc modal dialog", () => {
    const onScanMock = vi.fn();
    render(<TestBarcodeComponent onScan={onScanMock} />);

    const textarea = screen.getByPlaceholderText("Note textarea");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "a" });
    fireEvent.keyDown(textarea, { key: "b" });
    fireEvent.keyDown(textarea, { key: "c" });
    fireEvent.keyDown(textarea, { key: "d" });
    fireEvent.keyDown(textarea, { key: "Enter" });

    const modalInput = screen.getByPlaceholderText("Modal input");
    modalInput.focus();
    fireEvent.keyDown(modalInput, { key: "1" });
    fireEvent.keyDown(modalInput, { key: "2" });
    fireEvent.keyDown(modalInput, { key: "3" });
    fireEvent.keyDown(modalInput, { key: "4" });
    fireEvent.keyDown(modalInput, { key: "Enter" });

    expect(onScanMock).not.toHaveBeenCalled();
  });
});
