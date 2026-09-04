import { useState, useEffect, useRef, useCallback } from "react";
import { VOICE_SEARCH_CONFIG, VOICE_SEARCH_MESSAGES } from "@/constants/product";

// Định nghĩa kiểu dữ liệu cho Web Speech API
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): {
      isFinal: boolean;
      length: number;
      item(index: number): {
        transcript: string;
        confidence: number;
      };
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    [index: number]: {
      isFinal: boolean;
      length: number;
      item(index: number): {
        transcript: string;
        confidence: number;
      };
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: {
    new (): SpeechRecognitionLike;
  };
  webkitSpeechRecognition?: {
    new (): SpeechRecognitionLike;
  };
}

export type TVoiceSearchErrorCode =
  | "NOT_SUPPORTED"
  | "PERMISSION_DENIED"
  | "NO_SPEECH"
  | "AUDIO_CAPTURE"
  | "NETWORK"
  | "UNKNOWN";

export interface IUseVoiceSearchOptions {
  lang?: string;
  onFinalResult?: (transcript: string) => void;
  onError?: (errorCode: TVoiceSearchErrorCode, rawError?: string) => void;
}

export interface IUseVoiceSearchResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  errorCode: TVoiceSearchErrorCode | null;
  errorMessage: string | null;
  isSupported: boolean;
  permissionStatus: "prompt" | "granted" | "denied";
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const cleanVoiceTranscript = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[.,?!;:…]+$/g, "") // Loại bỏ các dấu câu kết thúc câu: ., !, ?, ;, :, …
    .replace(/^[.,?!;:…]+/g, "") // Loại bỏ dấu câu ở đầu chuỗi nếu có
    .replace(/\s+/g, " ")
    .trim();
};

export const useVoiceSearch = (
  options: IUseVoiceSearchOptions = {}
): IUseVoiceSearchResult => {
  const {
    lang = VOICE_SEARCH_CONFIG.LANGUAGE,
    onFinalResult,
    onError,
  } = options;

  // Kiểm tra hỗ trợ Web Speech API
  const win = typeof window !== "undefined" ? (window as unknown as IWindowWithSpeech) : null;
  const SpeechRecognitionConstructor =
    win?.SpeechRecognition || win?.webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognitionConstructor);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorCode, setErrorCode] = useState<TVoiceSearchErrorCode | null>(
    !isSupported ? "NOT_SUPPORTED" : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    !isSupported ? VOICE_SEARCH_MESSAGES.NOT_SUPPORTED : null
  );
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const onFinalResultRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
    onErrorRef.current = onError;
  }, [onFinalResult, onError]);

  // Khởi tạo và kiểm tra quyền ban đầu
  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupported) {
      setErrorCode("NOT_SUPPORTED");
      setErrorMessage(VOICE_SEARCH_MESSAGES.NOT_SUPPORTED);
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permission) => {
          if (isMountedRef.current) {
            setPermissionStatus(permission.state);
            permission.onchange = () => {
              if (isMountedRef.current) {
                setPermissionStatus(permission.state);
              }
            };
          }
        })
        .catch(() => {
          // Bỏ qua lỗi nếu query permission không được hỗ trợ cho micro
        });
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [isSupported]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setErrorCode(!isSupported ? "NOT_SUPPORTED" : null);
    setErrorMessage(!isSupported ? VOICE_SEARCH_MESSAGES.NOT_SUPPORTED : null);
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    resetTranscript();

    if (!isSupported || !SpeechRecognitionConstructor) {
      setErrorCode("NOT_SUPPORTED");
      setErrorMessage(VOICE_SEARCH_MESSAGES.NOT_SUPPORTED);
      onErrorRef.current?.("NOT_SUPPORTED");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }

      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setIsListening(true);
        setErrorCode(null);
        setErrorMessage(null);
        setPermissionStatus("granted");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        if (!isMountedRef.current) return;
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || "";
          if (result.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) {
          setInterimTranscript(cleanVoiceTranscript(interim));
        }

        if (final) {
          const cleanedFinal = cleanVoiceTranscript(final);
          setTranscript(cleanedFinal);
          setInterimTranscript("");
          onFinalResultRef.current?.(cleanedFinal);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (!isMountedRef.current) return;
        setIsListening(false);

        let mappedCode: TVoiceSearchErrorCode = "UNKNOWN";
        let msg: string = VOICE_SEARCH_MESSAGES.NOT_RECOGNIZED;

        if (event.error === "not-allowed" || event.error === "permission-denied") {
          mappedCode = "PERMISSION_DENIED";
          msg = VOICE_SEARCH_MESSAGES.PERMISSION_DENIED;
          setPermissionStatus("denied");
        } else if (event.error === "no-speech") {
          mappedCode = "NO_SPEECH";
          msg = VOICE_SEARCH_MESSAGES.NOT_RECOGNIZED;
        } else if (event.error === "audio-capture") {
          mappedCode = "AUDIO_CAPTURE";
          msg = "Không tìm thấy thiết bị thu âm (Microphone). Vui lòng kiểm tra lại thiết bị của bạn.";
        } else if (event.error === "network") {
          mappedCode = "NETWORK";
          msg = "Lỗi kết nối mạng khi xử lý giọng nói. Vui lòng thử lại.";
        }

        setErrorCode(mappedCode);
        setErrorMessage(msg);
        onErrorRef.current?.(mappedCode, event.error);
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      const errString = err instanceof Error ? err.message : String(err);
      setErrorCode("UNKNOWN");
      setErrorMessage(VOICE_SEARCH_MESSAGES.NOT_RECOGNIZED);
      onErrorRef.current?.("UNKNOWN", errString);
    }
  }, [
    isSupported,
    SpeechRecognitionConstructor,
    lang,
    resetTranscript,
  ]);

  return {
    isListening,
    transcript,
    interimTranscript,
    errorCode,
    errorMessage,
    isSupported,
    permissionStatus,
    startListening,
    stopListening,
    resetTranscript,
  };
};
