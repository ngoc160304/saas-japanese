package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.OrderItem;

@Repository 
public interface OrderItemRepository extends JpaRepository<OrderItem, Long>{
    
    List<OrderItem> findByOrderId(Long orderId);

}
