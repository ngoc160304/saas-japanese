package com.mycompany.saas_japanese.service.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Order;
import com.mycompany.saas_japanese.domain.OrderItem;
import com.mycompany.saas_japanese.domain.response.OrderItemResponse;
import com.mycompany.saas_japanese.domain.response.OrderResponse;

@Component 
public class OrderMapper {
    public OrderItemResponse toItemResponse(OrderItem orderItem){

        if(orderItem == null){
            return null;
        }

        OrderItemResponse response = new OrderItemResponse();

        response.setId(orderItem.getId());
        if(orderItem.getCourse() != null){
            response.setCourseId(
                orderItem.getCourse().getId());
            response.setCourseTitle(
                orderItem.getCourse().getTitle());
            if(orderItem.getCourse().getThumbnailMedia() != null){
                response.setThumbnailUrl(
                    orderItem.getCourse().getThumbnailMedia().getSecureUrl());
            }
        }
        response.setUnitPrice(orderItem.getUnitPrice());
        response.setSubtotal(orderItem.getSubtotal());

        return response;
    }

    public OrderResponse toResponse(Order order, List<OrderItem> orderItems){
        if(order == null){
            return null;
        }

        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderNumber(order.getOrderNumber());
        response.setTotalAmount(order.getTotalAmoun());
        response.setStatus(order.getOrderStatus());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setPaidAt(order.getPaidAt());
        response.setConfirmedAt(order.getConfirmedAt());
        response.setCreatedAt(order.getCreatedAt());
        List<OrderItemResponse> items = orderItems.stream()
            .map(this::toItemResponse)
            .toList();

        response.setItems(items);
        return response;
    }

}
