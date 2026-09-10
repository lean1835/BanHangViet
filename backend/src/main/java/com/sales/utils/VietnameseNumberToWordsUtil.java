package com.sales.utils;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

public class VietnameseNumberToWordsUtil {

    private static final String[] DIGITS = {
            "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"
    };

    private static final String[] SCALE_NAMES = {
            "", "nghìn", "triệu", "tỷ"
    };

    private VietnameseNumberToWordsUtil() {
        // utility class
    }

    /**
     * Chuyển đổi số tiền thành chữ Tiếng Việt theo quy chuẩn kế toán Việt Nam.
     * Ví dụ:
     * 0 -> "Không đồng"
     * 110,000 -> "Một trăm mười nghìn đồng"
     * 1,500,000 -> "Một triệu năm trăm nghìn đồng"
     * 2,420,000 -> "Hai triệu bốn trăm hai mươi nghìn đồng"
     */
    public static String convert(BigDecimal amount) {
        if (amount == null) {
            return "Không đồng";
        }
        return convert(amount.toBigInteger());
    }

    public static String convert(long amount) {
        return convert(BigInteger.valueOf(amount));
    }

    public static String convert(BigInteger amount) {
        if (amount == null || amount.equals(BigInteger.ZERO)) {
            return "Không đồng";
        }

        boolean isNegative = amount.signum() < 0;
        BigInteger positiveAmount = amount.abs();

        // Split into groups of 3 digits (chunks of thousands)
        List<Integer> groups = new ArrayList<>();
        BigInteger thousand = BigInteger.valueOf(1000);
        BigInteger temp = positiveAmount;

        while (temp.compareTo(BigInteger.ZERO) > 0) {
            BigInteger[] divRem = temp.divideAndRemainder(thousand);
            groups.add(divRem[1].intValue());
            temp = divRem[0];
        }

        List<String> parts = new ArrayList<>();
        int totalGroups = groups.size();

        for (int i = totalGroups - 1; i >= 0; i--) {
            int groupValue = groups.get(i);
            if (groupValue > 0) {
                boolean isHighestGroup = (i == totalGroups - 1);
                String groupWords = readThreeDigits(groupValue, isHighestGroup);
                parts.add(groupWords);

                int scaleIndex = i % 3;
                if (scaleIndex == 1) {
                    parts.add("nghìn");
                } else if (scaleIndex == 2) {
                    parts.add("triệu");
                }
            }

            // At the boundary of every billion block (group 3, 6, 9...), append "tỷ"
            // if any group in this block or any higher block is non-zero
            if (i % 3 == 0 && i > 0 && isAnyHigherOrCurrentNonZero(groups, i)) {
                parts.add("tỷ");
            }
        }

        String result = String.join(" ", parts).replaceAll("\\s+", " ").trim();
        if (result.isEmpty()) {
            result = "không";
        }

        result = (isNegative ? "Âm " : "") + result + " đồng";
        // Capitalize the first letter
        return Character.toUpperCase(result.charAt(0)) + result.substring(1);
    }

    private static boolean isAnyHigherOrCurrentNonZero(List<Integer> groups, int currentIndex) {
        for (int i = currentIndex; i < groups.size(); i++) {
            if (groups.get(i) > 0) {
                return true;
            }
        }
        return false;
    }

    private static String readThreeDigits(int number, boolean isHighestGroup) {
        int hundreds = number / 100;
        int remainder = number % 100;
        int tens = remainder / 10;
        int units = remainder % 10;

        List<String> words = new ArrayList<>();

        if (hundreds > 0 || !isHighestGroup) {
            words.add(DIGITS[hundreds]);
            words.add("trăm");
        }

        if (tens > 1) {
            words.add(DIGITS[tens]);
            words.add("mươi");
            if (units == 1) {
                words.add("mốt");
            } else if (units == 4) {
                words.add("bốn");
            } else if (units == 5) {
                words.add("lăm");
            } else if (units > 0) {
                words.add(DIGITS[units]);
            }
        } else if (tens == 1) {
            words.add("mười");
            if (units == 1) {
                words.add("một");
            } else if (units == 5) {
                words.add("lăm");
            } else if (units > 0) {
                words.add(DIGITS[units]);
            }
        } else {
            // tens == 0
            if (units > 0) {
                if (hundreds > 0 || !isHighestGroup) {
                    words.add("lẻ");
                }
                words.add(DIGITS[units]);
            }
        }

        return String.join(" ", words);
    }
}
