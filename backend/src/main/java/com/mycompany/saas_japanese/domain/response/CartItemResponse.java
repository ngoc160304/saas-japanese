package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter 
public class CartItemResponse {
    
    private Long id;

    private Long courseId;

    private String courseTitle;

    private BigDecimal price;

    private String thumbnailUrl;
    
}
