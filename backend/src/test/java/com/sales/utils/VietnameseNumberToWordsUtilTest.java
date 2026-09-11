package com.sales.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VietnameseNumberToWordsUtilTest {

    @Test
    @DisplayName("Test 0 đồng")
    void testZero() {
        assertEquals("Không đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.ZERO));
        assertEquals("Không đồng", VietnameseNumberToWordsUtil.convert((BigDecimal) null));
    }

    @Test
    @DisplayName("Test số nhỏ hàng chục và đơn vị")
    void testSmallNumbers() {
        assertEquals("Năm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(5)));
        assertEquals("Mười đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(10)));
        assertEquals("Mười một đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(11)));
        assertEquals("Mười lăm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(15)));
        assertEquals("Hai mươi mốt đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(21)));
        assertEquals("Hai mươi lăm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(25)));
    }

    @Test
    @DisplayName("Test hàng trăm")
    void testHundreds() {
        assertEquals("Một trăm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(100)));
        assertEquals("Một trăm lẻ một đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(101)));
        assertEquals("Một trăm lẻ năm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(105)));
        assertEquals("Một trăm mười đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(110)));
        assertEquals("Một trăm mười lăm đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(115)));
    }

    @Test
    @DisplayName("Test hàng nghìn và triệu theo thực tế hóa đơn PR #165")
    void testInvoiceAmounts() {
        assertEquals("Năm mươi nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(50000)));
        assertEquals("Năm mươi lăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(55000)));
        assertEquals("Một trăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(100000)));
        assertEquals("Một trăm mười nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(110000)));
        assertEquals("Hai trăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(200000)));
        assertEquals("Năm trăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(500000)));
        assertEquals("Năm trăm năm mươi nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(550000)));
        assertEquals("Bảy trăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(700000)));
        assertEquals("Bảy trăm bảy mươi nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(770000)));
        assertEquals("Một triệu năm trăm nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(1500000)));
        assertEquals("Hai triệu bốn trăm hai mươi nghìn đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(2420000)));
    }

    @Test
    @DisplayName("Test hàng tỷ")
    void testBillions() {
        assertEquals("Một tỷ đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(1000000000L)));
        assertEquals("Một nghìn tỷ đồng", VietnameseNumberToWordsUtil.convert(BigDecimal.valueOf(1000000000000L)));
    }
}
