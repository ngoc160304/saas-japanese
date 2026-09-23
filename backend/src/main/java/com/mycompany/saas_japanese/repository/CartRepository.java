package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Cart;


@Repository 
public interface CartRepository extends JpaRepository<Cart, Long>{
    
    Optional<Cart> findByUserId(Long userId);
    
}
