package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promotion_product_groups", uniqueConstraints = {
    @UniqueConstraint(name = "uq_promo_product_group", columnNames = {"promotion_id", "product_group_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PromotionProductGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @ToString.Exclude
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_group_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Include
    private ProductGroup productGroup;
}
