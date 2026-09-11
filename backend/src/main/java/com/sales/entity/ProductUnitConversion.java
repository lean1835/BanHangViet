package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "product_unit_conversions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_product_unit_name", columnNames = {"product_id", "unit_name"})
        },
        indexes = {
                @Index(name = "idx_puc_product_id", columnList = "product_id"),
                @Index(name = "idx_puc_barcode", columnList = "barcode")
        }
)
@Getter
@Setter
@ToString(exclude = "product")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUnitConversion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "unit_name", nullable = false, length = 50)
    private String unitName;

    @Column(name = "conversion_factor", nullable = false, precision = 12, scale = 3)
    private BigDecimal conversionFactor;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Column(length = 100)
    private String barcode;

    @Column(name = "is_default_import", nullable = false)
    @Builder.Default
    private Boolean isDefaultImport = false;

    @Column(name = "is_default_sale", nullable = false)
    @Builder.Default
    private Boolean isDefaultSale = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
