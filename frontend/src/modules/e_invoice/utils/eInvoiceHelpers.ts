import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import type { TInvoiceStatus } from "../types/IInvoice";

export const getStatusClassName = (status: TInvoiceStatus): string => {
  switch (status) {
    case E_INVOICE_STATUS.ISSUED:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case E_INVOICE_STATUS.CANCELED:
      return "bg-rose-100 text-rose-700 border-rose-200";
    case E_INVOICE_STATUS.WAITING_TAX_CODE:
      return "bg-amber-100 text-amber-700 border-amber-200 animate-pulse";
    case E_INVOICE_STATUS.SEND_ERROR:
      return "bg-red-100 text-red-700 border-red-200";
    case E_INVOICE_STATUS.ADJUSTED:
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export const getStatusLabel = (status: TInvoiceStatus): string => {
  switch (status) {
    case E_INVOICE_STATUS.ISSUED:
      return "ĐÃ CẤP MÃ THUẾ";
    case E_INVOICE_STATUS.CANCELED:
      return "ĐÃ HỦY";
    case E_INVOICE_STATUS.WAITING_TAX_CODE:
      return "CHỜ CẤP MÃ";
    case E_INVOICE_STATUS.SEND_ERROR:
      return "LỖI GỬI THUẾ";
    case E_INVOICE_STATUS.ADJUSTED:
      return "ĐÃ ĐIỀU CHỈNH";
    case E_INVOICE_STATUS.DRAFT:
      return "BẢN NHÁP";
    default:
      return status;
  }
};

export const convertNumberToWords = (amount: number): string => {
  if (amount === 0) return "Không đồng";
  
  if (amount < 0) {
    return "Âm " + convertNumberToWords(Math.abs(amount)).toLowerCase();
  }

  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const unitsTen = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  const readGroup = (group: number, isLeading: boolean): string => {
    let result = "";
    const hundreds = Math.floor(group / 100);
    const tens = Math.floor((group % 100) / 10);
    const ones = group % 10;
    
    if (hundreds > 0) {
      result += units[hundreds] + " trăm ";
    } else if (hundreds === 0 && (tens > 0 || ones > 0) && !isLeading) {
      result += "không trăm ";
    }
    
    if (tens > 0) {
      result += unitsTen[tens] + " ";
    } else if (tens === 0 && ones > 0 && hundreds >= 0 && !isLeading) {
      result += "lẻ ";
    } else if (tens === 0 && ones > 0 && isLeading && group >= 10) {
      result += "lẻ ";
    }
    
    if (ones > 0) {
      if (ones === 1 && tens > 1) {
        result += "mốt";
      } else if (ones === 5 && tens > 0) {
        result += "lăm";
      } else {
        result += units[ones];
      }
    }
    return result.trim();
  };

  const largeUnits = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let numStr = Math.floor(amount).toString();
  const groups: number[] = [];
  while (numStr.length > 0) {
    groups.push(parseInt(numStr.substring(Math.max(0, numStr.length - 3))));
    numStr = numStr.substring(0, Math.max(0, numStr.length - 3));
  }
  
  let result = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp > 0) {
      result += readGroup(grp, i === groups.length - 1) + " " + largeUnits[i] + " ";
    }
  }
  
  const finalStr = result.trim();
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + " đồng chẵn.";
};

export const generateTempId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
