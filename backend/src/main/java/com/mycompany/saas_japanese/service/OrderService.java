package com.mycompany.saas_japanese.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.request.ReqCreateOrder;
import com.mycompany.saas_japanese.domain.response.OrderResponse;

@Service 
public interface OrderService {

    OrderResponse createOrder(Long userid, ReqCreateOrder request);

    List<OrderResponse> getMyOrders(Long userId);

    OrderResponse getDetail(Long userId, Long orderId);
    
}
