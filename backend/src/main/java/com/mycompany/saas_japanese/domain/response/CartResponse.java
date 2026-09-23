package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter 
public class CartResponse {
    
    private Long id;

    private List<CartItemResponse> items;
    
    private BigDecimal totalAmount;
    
}
