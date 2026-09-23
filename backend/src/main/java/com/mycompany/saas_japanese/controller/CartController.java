package com.mycompany.saas_japanese.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.response.CartResponse;
import com.mycompany.saas_japanese.service.CartService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;


@RestController 
@RequestMapping ("/cart")
@FieldDefaults (level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor 
public class CartController {
    
    CartService cartService;

    @PostMapping("/add/{courseId}")
    public ResponseEntity<CartResponse> addToCart(
        @PathVariable("courseId") Long courseId) {

        return ResponseEntity.ok(cartService.addToCart(courseId));
    }
    
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<String> deleteCartItem(
      @PathVariable("cartItemId") Long cartItemId) {

        cartService.deleteCartItem(cartItemId);

        return ResponseEntity.ok("Xóa thành công");
  }

  @GetMapping
  public ResponseEntity<CartResponse> getDetailCart() {

    return ResponseEntity.ok(cartService.getDetailCart());
}


}
