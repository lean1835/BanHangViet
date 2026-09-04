import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Volume2,
  PackageCheck,
} from "lucide-react";
import { useVoiceSearch, cleanVoiceTranscript } from "@/modules/product/hooks/useVoiceSearch";
import { useLazyVoiceSearchProductsQuery } from "@/modules/product/services/productApi";
import type { IProduct } from "@/modules/product/types/IProduct";
import { VOICE_SEARCH_MESSAGES } from "@/constants/product";
import { formatCurrency } from "@/utils/formatCurrency";

interface IVoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: IProduct) => void;
  groupId?: string;
}

export const VoiceSearchModal: React.FC<IVoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  groupId,
}) => {
  const [manualQuery, setManualQuery] = useState<string>("");
  const manualInputRef = useRef<HTMLInputElement>(null);

  const [
    triggerVoiceSearch,
    { data: searchResults, isFetching: isSearching },
  ] = useLazyVoiceSearchProductsQuery();

  const handleSpeechFinalResult = React.useCallback((finalText: string) => {
    const cleaned = cleanVoiceTranscript(finalText);
    if (cleaned) {
      setManualQuery(cleaned);
      triggerVoiceSearch({
        query: cleaned,
        groupId,
        limit: 20,
      });
    }
  }, [groupId, triggerVoiceSearch]);

  const {
    isListening,
    transcript,
    interimTranscript,
    errorCode,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceSearch({
    onFinalResult: handleSpeechFinalResult,
  });

  // Tự động bắt đầu lắng nghe khi mở modal
  useEffect(() => {
    if (isOpen) {
      setManualQuery("");
      resetTranscript();
      if (isSupported) {
        startListening();
      }
    } else {
      stopListening();
    }
  }, [isOpen, isSupported, resetTranscript, startListening, stopListening]);

  // Phím Esc để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = cleanVoiceTranscript(manualQuery);
    if (query) {
      setManualQuery(query);
      stopListening();
      triggerVoiceSearch({
        query,
        groupId,
        limit: 20,
      });
    }
  };

  const handleSelect = (product: IProduct) => {
    stopListening();
    onSelectProduct(product);
    onClose();
  };

  const handleRetryListening = () => {
    setManualQuery("");
    resetTranscript();
    startListening();
  };

  if (!isOpen) return null;

  const currentDisplaySpeech = transcript || interimTranscript;
  const products = searchResults || [];
  const hasSearched = Boolean(manualQuery.trim() || transcript.trim());

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-search-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl text-white">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                id="voice-search-modal-title"
                className="text-lg font-bold text-white tracking-wide"
              >
                {VOICE_SEARCH_MESSAGES.MODAL_TITLE}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {VOICE_SEARCH_MESSAGES.MODAL_SUBTITLE}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Voice Wave & Interactive Mic Container */}
          <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100/80">
            {/* Big Pulsing Mic Button */}
            <div className="relative mb-4">
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  <span className="absolute -inset-3 rounded-full bg-blue-400/20 animate-pulse" />
                  <span className="absolute -inset-6 rounded-full bg-indigo-300/15" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : handleRetryListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isListening
                    ? "bg-gradient-to-tr from-red-500 to-rose-600 text-white scale-105 ring-4 ring-rose-300"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95"
                }`}
                title={
                  isListening
                    ? "Bấm để dừng thu âm"
                    : "Bấm để bắt đầu đọc tên hàng"
                }
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-bounce" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Bars */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-6 mb-3">
                <span className="w-1 bg-blue-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-5" />
                <span className="w-1 bg-blue-600 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-6" />
                <span className="w-1 bg-indigo-600 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
                <span className="w-1 bg-blue-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-5" />
                <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
              </div>
            )}

            {/* Realtime Transcript / Instruction Status */}
            <div className="text-center px-4 max-w-lg">
              {isListening ? (
                <div>
                  <div className="text-sm font-semibold text-blue-700 mb-1 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {VOICE_SEARCH_MESSAGES.LISTENING}
                  </div>
                  <div className="text-base font-bold text-slate-800 bg-white/80 px-4 py-2 rounded-xl shadow-sm border border-blue-100 min-h-[38px] flex items-center justify-center">
                    {currentDisplaySpeech ? (
                      <span className="text-blue-900 font-extrabold italic">
                        "{currentDisplaySpeech}"
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal text-xs">
                        Hãy đọc to tên hàng hóa (ví dụ: 'Nước mắm Nam Ngư', 'Bia Tiger', 'Rau muống')...
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-700">
                    {hasSearched
                      ? `Đã nhận diện: "${manualQuery || transcript}"`
                      : "Bấm vào nút Micro để đọc tên mặt hàng"}
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryListening}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold mt-1 px-3 py-1 bg-blue-100/70 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {VOICE_SEARCH_MESSAGES.TRY_AGAIN}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner / Alerts (TC-02, TC-03) */}
          {errorCode === "PERMISSION_DENIED" && (
            <div
              className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3"
              role="alert"
            >
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  Chưa cấp quyền Microphone
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  {VOICE_SEARCH_MESSAGES.PERMISSION_DENIED}
                </p>
                <div className="text-[11px] text-amber-600 mt-1">
                  💡 Hướng dẫn: Bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ trình duyệt, chọn Cho phép Microphone và tải lại trang.
                </div>
              </div>
            </div>
          )}

          {(!isSupported || errorCode === "NOT_SUPPORTED") && (
            <div
              className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Trình duyệt không hỗ trợ Web Speech
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {VOICE_SEARCH_MESSAGES.NOT_SUPPORTED}
                </p>
              </div>
            </div>
          )}

          {errorCode === "NO_SPEECH" && !manualQuery && (
            <div
              className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-800 font-medium">
                  {VOICE_SEARCH_MESSAGES.NOT_RECOGNIZED}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRetryListening}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Manual Input Fallback Search Bar */}
          <form onSubmit={handleManualSearch} className="space-y-1.5">
            <label
              htmlFor="manual-voice-search-input"
              className="text-xs font-bold text-slate-600 flex items-center justify-between"
            >
              <span>{VOICE_SEARCH_MESSAGES.SEARCH_MANUAL_HINT}</span>
              {isSearching && (
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {VOICE_SEARCH_MESSAGES.PROCESSING}
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                ref={manualInputRef}
                id="manual-voice-search-input"
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Nhập tên mặt hàng hoặc mã SKU..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!manualQuery.trim() || isSearching}
                className="absolute right-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Search Results List (TC-01) */}
          <div className="space-y-2">
            {hasSearched && (
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>
                  {VOICE_SEARCH_MESSAGES.PRODUCT_FOUND_COUNT(products.length)}
                </span>
                <span className="text-slate-400 font-normal">
                  (Nhấp vào mặt hàng để chọn ngay)
                </span>
              </div>
            )}

            {isSearching ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <div className="text-xs font-semibold">
                  {VOICE_SEARCH_MESSAGES.PROCESSING}
                </div>
              </div>
            ) : hasSearched && products.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <PackageCheck className="w-8 h-8 mx-auto text-slate-400" />
                <div className="text-sm font-bold text-slate-700">
                  {VOICE_SEARCH_MESSAGES.NO_RESULTS}
                </div>
                <p className="text-xs text-slate-500">
                  Vui lòng thử đọc lại tên hàng khác hoặc kiểm tra lại danh mục sản phẩm.
                </p>
                <button
                  type="button"
                  onClick={handleRetryListening}
                  className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đọc lại tên hàng
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {product.sku || "SKU"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>ĐVT: <strong className="text-slate-700">{product.unit}</strong></span>
                        {product.groupName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{product.groupName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-extrabold text-sm text-[#0070f4]">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-[11px] flex items-center gap-1">
                        <span className="text-slate-400">Tồn:</span>
                        <span
                          className={`font-bold ${
                            product.stockQuantity <= 0
                              ? "text-red-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Phím tắt: <strong>F4</strong> hoặc nhấn <strong>Esc</strong> để đóng</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
