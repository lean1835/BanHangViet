package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "goods_receipt_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private GoodsReceipt receipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "unit_conversion_id", length = 36)
    private String unitConversionId;

    @Column(name = "unit_name", length = 50)
    private String unitName;

    @Column(name = "conversion_factor", precision = 12, scale = 3)
    private BigDecimal conversionFactor;

    @Column(name = "base_quantity", precision = 12, scale = 3)
    private BigDecimal baseQuantity;

    @Column(name = "base_purchase_price", precision = 15, scale = 2)
    private BigDecimal basePurchasePrice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
