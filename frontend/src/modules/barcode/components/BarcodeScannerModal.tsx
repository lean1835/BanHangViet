import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  Keyboard,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  FlipHorizontal,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  HTMLCanvasElementLuminanceSource,
} from "@zxing/library";
import Quagga from "@ericblade/quagga2";
import { playBarcodeBeepSound } from "../utils/barcodeAudio";

interface IBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<IBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [manualCode, setManualCode] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isScreenMode, setIsScreenMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isDecodingFile, setIsDecodingFile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isScannedRef = useRef<boolean>(false);
  const zoomLevelRef = useRef<number>(1.5);
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<any>(null);

  // Sync zoom ref for real-time scan loop
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Initialize ZXing MultiFormatReader and optional native BarcodeDetector
  useEffect(() => {
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);
    zxingReaderRef.current = reader;

    // Check if native BarcodeDetector is available
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const DetectorClass = (window as any).BarcodeDetector;
        nativeDetectorRef.current = new DetectorClass({
          formats: [
            "code_128",
            "ean_13",
            "code_39",
            "qr_code",
          ],
        });
      } catch {
        nativeDetectorRef.current = null;
      }
    }
  }, []);

  // Handle successful barcode scan
  const handleScanSuccess = useCallback(
    (detectedBarcode: string) => {
      const cleanCode = detectedBarcode.trim();
      if (!cleanCode || isScannedRef.current) return;

      isScannedRef.current = true;
      setLastScannedCode(cleanCode);
      playBarcodeBeepSound("success");

      onScan(cleanCode);
      onClose();
    },
    [onScan, onClose]
  );

  // Stop camera stream & scan loop
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Helper to decode canvas using ZXing (Multi-Binarizer engine)
  const decodeCanvasWithZXing = (canvas: HTMLCanvasElement): string | null => {
    if (!zxingReaderRef.current) return null;
    try {
      const lum = new HTMLCanvasElementLuminanceSource(canvas);

      // Pass 1A: GlobalHistogramBinarizer (Best for 1D barcodes like Code-128, EAN-13)
      try {
        const bitmap1 = new BinaryBitmap(new GlobalHistogramBinarizer(lum));
        const res1 = zxingReaderRef.current.decode(bitmap1);
        if (res1?.getText()) return res1.getText();
      } catch {
        // Continue to Hybrid
      }

      // Pass 1B: HybridBinarizer (Best for QR codes & complex lighting)
      try {
        const bitmap2 = new BinaryBitmap(new HybridBinarizer(lum));
        const res2 = zxingReaderRef.current.decode(bitmap2);
        if (res2?.getText()) return res2.getText();
      } catch {
        // Not found
      }

      return null;
    } catch {
      return null;
    }
  };

  // Helper to decode canvas using Inverted ZXing
  const decodeCanvasWithInverted = (canvas: HTMLCanvasElement): string | null => {
    if (!zxingReaderRef.current) return null;
    try {
      const lum = new HTMLCanvasElementLuminanceSource(canvas, true);

      try {
        const bitmap1 = new BinaryBitmap(new GlobalHistogramBinarizer(lum));
        const res1 = zxingReaderRef.current.decode(bitmap1);
        if (res1?.getText()) return res1.getText();
      } catch {
        // Fallback to Hybrid
      }

      try {
        const bitmap2 = new BinaryBitmap(new HybridBinarizer(lum));
        const res2 = zxingReaderRef.current.decode(bitmap2);
        if (res2?.getText()) return res2.getText();
      } catch {
        // Not found
      }

      return null;
    } catch {
      return null;
    }
  };

  // Helper to decode canvas using Quagga2 (Specialized 1D Barcode pattern locator)
  const decodeWithQuagga = useCallback((canvas: HTMLCanvasElement): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        Quagga.decodeSingle(
          {
            src: dataUrl,
            numOfWorkers: 0,
            inputStream: {
              size: 800,
            },
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
              ],
            },
            locate: true,
            locator: {
              halfSample: false,
              patchSize: "medium",
            },
          },
          (result) => {
            if (result && result.codeResult && result.codeResult.code) {
              resolve(result.codeResult.code);
            } else {
              resolve(null);
            }
          }
        );
      } catch {
        resolve(null);
      }
    });
  }, []);

  // High-performance continuous multi-pass scan loop
  const startScanLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const scanFrame = async () => {
      if (isScannedRef.current) return;

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          const currentZoom = zoomLevelRef.current || 1;
          const cropW = Math.round(vw / currentZoom);
          const cropH = Math.round(vh / currentZoom);
          const cropX = Math.round((vw - cropW) / 2);
          const cropY = Math.round((vh - cropH) / 2);

          canvas.width = cropW;
          canvas.height = cropH;

          // PASS 0: High-Resolution 1:1 Center Target with GPU Contrast Acceleration
          ctx.filter = "contrast(1.4) brightness(1.05) grayscale(0.5)";
          ctx.drawImage(
            video,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
          );
          ctx.filter = "none";

          // 0A. Native BarcodeDetector (Fastest GPU accelerated)
          if (nativeDetectorRef.current) {
            try {
              const barcodes = await nativeDetectorRef.current.detect(canvas);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleScanSuccess(barcodes[0].rawValue);
                return;
              }
            } catch {
              // ignore
            }
          }

          // 0B. ZXing MultiFormat (GlobalHistogram + Hybrid)
          let detected = decodeCanvasWithZXing(canvas);
          if (detected) {
            handleScanSuccess(detected);
            return;
          }

          // 0C. Quagga 1D Pattern Locator (Extreme tilt & barcode angle tolerance)
          const quaggaCode = await decodeWithQuagga(canvas);
          if (quaggaCode) {
            handleScanSuccess(quaggaCode);
            return;
          }

          // PASS 1: Full Uncropped Frame (Catches wide barcodes/outer edges)
          if (currentZoom > 1) {
            canvas.width = vw;
            canvas.height = vh;
            ctx.filter = "contrast(1.4) brightness(1.05) grayscale(0.5)";
            ctx.drawImage(video, 0, 0, vw, vh);
            ctx.filter = "none";

            detected = decodeCanvasWithZXing(canvas);
            if (detected) {
              handleScanSuccess(detected);
              return;
            }

            const quaggaFull = await decodeWithQuagga(canvas);
            if (quaggaFull) {
              handleScanSuccess(quaggaFull);
              return;
            }
          }

          // PASS 2: Horizontally Flipped Frame (Webcam mirror auto-compensation)
          if (!flipCanvasRef.current) {
            flipCanvasRef.current = document.createElement("canvas");
          }
          const flipCanvas = flipCanvasRef.current;
          flipCanvas.width = canvas.width;
          flipCanvas.height = canvas.height;
          const flipCtx = flipCanvas.getContext("2d", { willReadFrequently: true });
          if (flipCtx) {
            flipCtx.save();
            flipCtx.translate(flipCanvas.width, 0);
            flipCtx.scale(-1, 1);
            flipCtx.drawImage(canvas, 0, 0);
            flipCtx.restore();

            detected = decodeCanvasWithZXing(flipCanvas);
            if (detected) {
              handleScanSuccess(detected);
              return;
            }

            const quaggaFlip = await decodeWithQuagga(flipCanvas);
            if (quaggaFlip) {
              handleScanSuccess(quaggaFlip);
              return;
            }
          }

          // PASS 3: Inverted Colors (Phone screen glare)
          detected = decodeCanvasWithInverted(canvas);
          if (detected) {
            handleScanSuccess(detected);
            return;
          }
        }
      }

      if (!isScannedRef.current) {
        timeoutRef.current = setTimeout(() => {
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }, 30);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleScanSuccess, decodeWithQuagga]);

  // Start Camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopCamera();
      setCameraError(null);
      isScannedRef.current = false;
      setLastScannedCode(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError("Trình duyệt không hỗ trợ truy cập máy ảnh trực tiếp.");
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : { ideal: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: { ideal: "environment" } },
            audio: false,
          });
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);

        const activeTrack = stream.getVideoTracks()[0];
        const activeDeviceId = activeTrack?.getSettings()?.deviceId;
        if (!deviceId && activeDeviceId) {
          setSelectedDeviceId(activeDeviceId);
        }

        // Start multi-pass decoding loop immediately
        startScanLoop();
      } catch (err: any) {
        console.warn("Camera start failed", err);
        const errStr = String(err?.message || err || "");
        if (
          errStr.includes("NotAllowedError") ||
          errStr.includes("Permission") ||
          errStr.includes("denied")
        ) {
          setCameraError(
            "Quyền truy cập máy ảnh bị từ chối. Vui lòng cấp quyền máy ảnh cho trình duyệt."
          );
        } else {
          setCameraError(
            "Không thể khởi động máy ảnh. Vui lòng kiểm tra webcam hoặc nhập mã thủ công."
          );
        }
      }
    },
    [stopCamera, startScanLoop]
  );

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && "applyConstraints" in track) {
      try {
        const nextState = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      } catch {
        // Torch not supported
      }
    }
  };

  // Decode from file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !zxingReaderRef.current) return;

    setIsDecodingFile(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        let text = decodeCanvasWithZXing(canvas);
        if (!text) {
          text = decodeCanvasWithInverted(canvas);
        }
        URL.revokeObjectURL(img.src);
        if (text) {
          handleScanSuccess(text);
          return;
        }
      }
      alert("Không tìm thấy mã vạch rõ nét trong hình ảnh vừa chọn. Vui lòng thử ảnh khác.");
    } catch {
      alert("Không thể đọc ảnh mã vạch. Vui lòng thử ảnh khác.");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Lifecycle on modal open/close
  useEffect(() => {
    if (isOpen) {
      setManualCode("");
      startCamera(selectedDeviceId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId, startCamera, stopCamera]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0070f4] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl shadow-inner">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight leading-snug flex items-center gap-1.5">
                <span>Quét Mã Vạch Hàng Hóa</span>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  HD Scanner 2.0
                </span>
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Tự động nhận diện Code 128 (SP0019...), EAN-13, QR code...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-colors"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewfinder Box */}
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-xs flex flex-col items-center">
              <AlertCircle size={38} className="text-amber-400 mb-2.5" />
              <p className="text-xs font-semibold mb-4 leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId || undefined)}
                className="flex items-center gap-1.5 bg-[#0070f4] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
              >
                <RefreshCw size={13} />
                Thử lại máy ảnh
              </button>
            </div>
          ) : (
            <>
              {/* Main Camera Video Feed */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: "transform 0.2s ease-out",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isMirrored ? "-scale-x-100" : "scale-x-100"
                  } ${
                    isScreenMode
                      ? "contrast-150 brightness-110 saturate-150"
                      : ""
                  }`}
                />
              </div>

              {/* Viewfinder Target Frame Overlay (Wide 1D Aspect Ratio) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-3 sm:p-4">
                <div
                  className={`relative w-[340px] sm:w-[390px] max-w-[92%] h-36 border-2 rounded-2xl shadow-2xl backdrop-blur-[0.5px] flex flex-col justify-between p-2.5 transition-all duration-300 ${
                    lastScannedCode
                      ? "border-emerald-400 bg-emerald-500/20 scale-105"
                      : "border-emerald-400/90 bg-emerald-500/5"
                  }`}
                >
                  {/* 4 Corner Markers */}
                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl -mt-2.5 -ml-2.5" />
                    <span className="w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr -mt-2.5 -mr-2.5" />
                  </div>

                  {/* Red Laser Scan Line Animation */}
                  {lastScannedCode ? (
                    <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-500 text-white rounded-full mx-auto text-xs font-extrabold shadow-lg animate-bounce">
                      <CheckCircle2 size={15} />
                      <span>{lastScannedCode}</span>
                    </div>
                  ) : (
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_14px_#f43f5e] animate-pulse" />
                  )}

                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl -mb-2.5 -ml-2.5" />
                    <span className="w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br -mb-2.5 -mr-2.5" />
                  </div>
                </div>
              </div>

              {/* Tips & Instruction Bar */}
              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none px-4">
                <span className="inline-flex items-center gap-1.5 bg-slate-900/85 text-slate-200 text-[11px] font-semibold px-3.5 py-1 rounded-full backdrop-blur-md border border-slate-700/60 shadow-lg">
                  <Sparkles size={11} className="text-amber-400 shrink-0" />
                  <span>
                    {zoomLevel > 1
                      ? `Phóng to ${zoomLevel}x — Giữ cách camera 30 - 50cm`
                      : "Giữ toàn bộ chiều dài mã vạch (cả 2 đầu) nằm trong khung xanh"}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quick Controls Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Camera Switch, Mirror & Zoom Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 max-w-[120px] truncate"
                title="Chọn Camera"
              >
                {devices.map((d, index) => (
                  <option key={d.deviceId || index} value={d.deviceId}>
                    {d.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Mirror Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMirrored(!isMirrored)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition-all text-[11px] ${
                isMirrored
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
              title="Đảo chiều camera gương / tự nhiên để canh chỉnh thuận tay"
            >
              <FlipHorizontal size={12} />
              <span>{isMirrored ? "Gương: BẬT" : "Tự nhiên"}</span>
            </button>

            {/* Digital Zoom Presets (Crucial for Far-distance Scanning) */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
              <span className="text-[10px] text-slate-400 px-1 font-bold">Zoom:</span>
              {[1, 1.5, 2, 3].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoomLevel(z)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    zoomLevel === z
                      ? "bg-[#0070f4] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title={`Phóng to ${z}x để quét mã từ xa`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          {/* Right: Screen Mode, Flashlight & Upload Image */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Screen Contrast Boost */}
            <button
              type="button"
              onClick={() => setIsScreenMode(!isScreenMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition-all text-[11px] ${
                isScreenMode
                  ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
              title="Tăng độ tương phản khử bóng lóa khi quét từ màn hình điện thoại"
            >
              <Sliders size={12} />
              <span>{isScreenMode ? "Tương phản: BẬT" : "Quét màn hình"}</span>
            </button>

            {/* Flashlight */}
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition-all text-[11px] ${
                torchEnabled
                  ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
              title="Bật/Tắt đèn Flash"
            >
              <Zap size={12} className={torchEnabled ? "fill-amber-500" : ""} />
              <span className="hidden sm:inline">Đèn Flash</span>
            </button>

            {/* Upload image file */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDecodingFile}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all text-[11px]"
              title="Tải ảnh chứa mã vạch để quét"
            >
              <ImageIcon size={12} className="text-emerald-600" />
              <span>{isDecodingFile ? "Đang đọc..." : "Tải ảnh"}</span>
            </button>
          </div>
        </div>

        {/* Manual Barcode Entry Fallback Form */}
        <form
          onSubmit={handleManualSubmit}
          className="p-4 bg-white flex flex-col gap-2"
        >
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Keyboard size={14} className="text-[#0070f4]" />
              <span>Hoặc nhập mã vạch / SKU thủ công:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Nhấn Enter để gửi)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Nhập mã vạch / SKU (VD: 8934567890123)..."
              className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-[#0070f4] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-extrabold px-5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
            >
              Thêm vào đơn
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
