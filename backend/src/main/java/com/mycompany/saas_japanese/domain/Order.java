package com.mycompany.saas_japanese.domain;

import java.math.BigDecimal;
import java.time.Instant;


import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity 
@Table (name = "orders")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
public class Order {
    
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmoun;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatusEnum orderStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatusEnum paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodEnum paymentMethod;

    private String paymentReference;

    private String transactionCode;

    private Instant paidAt;

    private Instant confirmedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (orderStatus == null) {
            orderStatus = orderStatus.PENDING;
        }

        if (paymentStatus == null) {
            paymentStatus = paymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
