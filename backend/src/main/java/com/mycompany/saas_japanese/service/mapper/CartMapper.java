package com.mycompany.saas_japanese.service.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Cart;
import com.mycompany.saas_japanese.domain.CartItem;
import com.mycompany.saas_japanese.domain.response.CartItemResponse;
import com.mycompany.saas_japanese.domain.response.CartResponse;

@Component 
public class CartMapper {
    
    public CartItemResponse toItemResponse(CartItem cartItem){

        if (cartItem == null) {
            return null;
        }

        CartItemResponse response = new CartItemResponse();
        
        response.setId(cartItem.getId());

        if(cartItem.getCourse() != null){
            response.setCourseId(
                cartItem.getCourse().getId());

            response.setCourseTitle(
                cartItem.getCourse().getTitle());

            response.setPrice(
                cartItem.getCourse().getPrice());

            if(cartItem.getCourse().getThumbnailMedia() != null){
                response.setThumbnailUrl(
                    cartItem.getCourse().getThumbnailMedia().getSecureUrl());
            }
        }
        return response;
    }

    public CartResponse toResponse(Cart cart, List<CartItem> cartItems){

        if(cart == null){
            return null;
        }

        CartResponse response = new CartResponse();

        response.setId(cart.getId());
        List<CartItemResponse> items = cartItems.stream()
            .map(this::toItemResponse)
            .toList();
        response.setItems(items);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            if (cartItem.getCourse() != null 
                    && cartItem.getCourse().getPrice() != null) {
                        totalAmount = totalAmount.add(
                            cartItem.getCourse().getPrice());}}
                              
        response.setTotalAmount(totalAmount);
        return response;
    }
}
