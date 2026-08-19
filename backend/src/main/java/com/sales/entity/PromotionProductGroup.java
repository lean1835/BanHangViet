package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promotion_product_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionProductGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_group_id", nullable = false)
    private ProductGroup productGroup;
}
