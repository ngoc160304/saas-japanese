package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;

import lombok.*;

@Getter
@Setter
public class OrderItemResponse {

    private Long id;

    private Long courseId;

    private String courseTitle;

    private String thumbnailUrl;

    private BigDecimal unitPrice;

    private BigDecimal subtotal;
}
