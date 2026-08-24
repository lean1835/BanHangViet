const defaultDigits = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function readTriple(triple: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(triple / 100);
  const ten = Math.floor((triple % 100) / 10);
  const unit = triple % 10;
  let result = "";

  if (hundred > 0 || showZeroHundred) {
    result += ` ${defaultDigits[hundred]} trăm`;
    if (ten === 0 && unit > 0) {
      result += " lẻ";
    }
  }

  if (ten > 0 && ten !== 1) {
    result += ` ${defaultDigits[ten]} mươi`;
  } else if (ten === 1) {
    result += " mười";
  }

  switch (unit) {
    case 1:
      if (ten > 1) {
        result += " mốt";
      } else {
        result += ` ${defaultDigits[unit]}`;
      }
      break;
    case 5:
      if (ten > 0) {
        result += " lăm";
      } else {
        result += ` ${defaultDigits[unit]}`;
      }
      break;
    default:
      if (unit !== 0) {
        result += ` ${defaultDigits[unit]}`;
      }
      break;
  }

  return result;
}

export function numberToVietnameseWords(n: number): string {
  if (isNaN(n) || n === 0) return "Không đồng";
  const absNumber = Math.abs(Math.round(n));

  const scales = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
  let numStr = absNumber.toString();
  const triples: number[] = [];

  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    triples.push(parseInt(chunk, 10));
    numStr = numStr.slice(0, -3);
  }

  let result = "";
  for (let i = triples.length - 1; i >= 0; i--) {
    const triple = triples[i];
    if (triple > 0) {
      const showZeroHundred = i < triples.length - 1;
      result += readTriple(triple, showZeroHundred) + scales[i];
    }
  }

  result = result.trim();
  if (!result) return "Không đồng";

  // Viết hoa chữ cái đầu tiên
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
  return capitalized;
}
