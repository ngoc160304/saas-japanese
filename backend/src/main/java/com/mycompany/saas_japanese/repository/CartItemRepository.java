package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.CartItem;

@Repository 
public interface CartItemRepository extends JpaRepository<CartItem, Long>{
    
    List<CartItem> findByCartId(Long cartId);

    boolean existsByCartIdAndCourseId(Long cartId, Long courseId);

    Optional<CartItem> findByIdAndCartUserId(Long cartItemId, Long userId);
}
