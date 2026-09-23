package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;

import lombok.*;

@Getter
@Setter
public class OrderResponse {

    private Long id;

    private String orderNumber;

    private BigDecimal totalAmount;

    private OrderStatusEnum status;

    private PaymentMethodEnum paymentMethod;

    private PaymentStatusEnum paymentStatus;

    private Instant paidAt;

    private Instant confirmedAt;

    private Instant createdAt;

    private List<OrderItemResponse> items;

    private String checkoutUrl;

    private Map<String, String> checkoutFields;
}
