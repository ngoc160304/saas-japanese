package com.mycompany.saas_japanese.service;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.response.CartResponse;

@Service 
public interface CartService {
    
    CartResponse addToCart(Long userId, Long courseId);

    void deleteCartItem(Long userId,Long cartItemId);

    CartResponse getDetailCart(Long userId);
    
}
