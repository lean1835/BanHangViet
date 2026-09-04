import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, Home, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const message = error?.message || "";
    const isChunk =
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("error loading dynamically imported module") ||
      message.includes("Loading chunk");

    return {
      hasError: true,
      error,
      isChunkError: isChunk,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by GlobalErrorBoundary:", error, errorInfo);

    // Tự động tải lại trang nếu lỗi do bản deploy mới thay thế các chunk cũ (chỉ thử 1 lần để tránh reload loop)
    const message = error?.message || "";
    const isChunk =
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("error loading dynamically imported module") ||
      message.includes("Loading chunk");

    if (isChunk) {
      const hasAutoReloaded = sessionStorage.getItem("chunk_auto_reloaded");
      if (!hasAutoReloaded) {
        sessionStorage.setItem("chunk_auto_reloaded", "true");
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem("chunk_auto_reloaded");
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem("chunk_auto_reloaded");
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError, error } = this.state;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 text-slate-800 font-sans select-none">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              {isChunkError ? (
                <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: "3s" }} />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-500" />
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {isChunkError
                ? "Hệ thống đã cập nhật phiên bản mới"
                : "Đã xảy ra sự cố hiển thị"}
            </h1>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {isChunkError
                ? "Ứng dụng vừa được cập nhật. Vui lòng tải lại trang để nhận giao diện và dữ liệu mới nhất."
                : "Trang không thể tải đúng cách. Vui lòng tải lại trang hoặc quay về trang chủ."}
            </p>

            {error && !isChunkError && (
              <div className="mb-6 p-3 bg-slate-100 rounded-lg text-left text-xs text-slate-600 font-mono overflow-auto max-h-32">
                {error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang ngay
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
