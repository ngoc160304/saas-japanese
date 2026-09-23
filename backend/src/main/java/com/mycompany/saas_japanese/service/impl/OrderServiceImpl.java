package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.CartItem;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.Order;
import com.mycompany.saas_japanese.domain.OrderItem;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqCreateOrder;
import com.mycompany.saas_japanese.domain.response.OrderResponse;
import com.mycompany.saas_japanese.repository.CartItemRepository;
import com.mycompany.saas_japanese.repository.OrderItemRepository;
import com.mycompany.saas_japanese.repository.OrderRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.OrderService;
import com.mycompany.saas_japanese.service.SePayService;
import com.mycompany.saas_japanese.service.mapper.OrderMapper;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults (level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor 
@Service 
@Transactional 
public class OrderServiceImpl implements OrderService{

    OrderRepository orderRepository;

    OrderItemRepository orderItemRepository;

    CartItemRepository cartItemRepository;

    UserRepository userRepository;

    OrderMapper orderMapper;

    SePayService sePayService;

    @Override 
    @Transactional
    public OrderResponse createOrder(ReqCreateOrder request){
        
        User user = getCurrentUser();

        List<CartItem> cartItems = cartItemRepository.findAllById(
            request.getCartItemIds());

        if(cartItems.isEmpty()){
            throw new BadRequestException(
                "Giỏ hàng không có sản phẩm");
        }

        for (CartItem cartItem : cartItems) {
        if (cartItem.getCart() == null
            || cartItem.getCart().getUser() == null
            || !cartItem.getCart().getUser().getId()
                    .equals(user.getId())) {

                throw new BadRequestException(
                    "Sản phẩm trong giỏ hàng không hợp lệ");
            }
        }
        
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(generateOrderNumber());
        order.setTotalAmoun(BigDecimal.ZERO);
        order.setOrderStatus(OrderStatusEnum.PENDING);
        order.setPaymentStatus(PaymentStatusEnum.PENDING);
        order.setPaymentMethod(request.getPaymentMethod());
        Order saveOrder = orderRepository.save(order);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {

            Course course = cartItem.getCourse();

            if (course == null) {
                continue;
            }

            BigDecimal price =course.getPrice();

            if (price == null) {
                price = BigDecimal.ZERO;
            }

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(saveOrder);
            orderItem.setCourse(course);
            orderItem.setUnitPrice(price);
            orderItem.setSubtotal(price);

            orderItemRepository.save(orderItem);
            totalAmount = totalAmount.add(price);
            cartItemRepository.delete(cartItem);
        }

        saveOrder.setTotalAmoun(totalAmount);

        
        Order updateOrder = orderRepository.save(saveOrder);
        List<OrderItem> orderItems =orderItemRepository
            .findByOrderId(
            updateOrder.getId());

        
        OrderResponse response = orderMapper.toResponse(updateOrder, orderItems);

        if (PaymentMethodEnum.BANK_TRANSFER.equals(request.getPaymentMethod())) {
            Map<String, String> checkoutFields = sePayService.createCheckout(
                    updateOrder.getOrderNumber(),
                    updateOrder.getTotalAmoun(),
                    "Thanh toan don hang " + updateOrder.getOrderNumber()
            );

        response.setCheckoutUrl(checkoutFields.remove("checkout_url"));
        response.setCheckoutFields(checkoutFields);
        }

        return response;
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(){

        User user = getCurrentUser();

        List<Order> orders = orderRepository.findByUserId(user.getId());

        return orders.stream()
                .map(order -> {
                    List<OrderItem> orderItems = orderItemRepository
                        .findByOrderId(
                        order.getId());
                    return orderMapper.toResponse(order,orderItems);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getDetail(Long orderId){

        User user = getCurrentUser();

        Order order =orderRepository
            .findByIdAndUserId(orderId,user.getId())
            .orElseThrow(() ->new NotFoundException(
                 "Không tìm thấy đơn hàng"));

        List<OrderItem> orderItems =orderItemRepository
            .findByOrderId(order.getId());

        return orderMapper.toResponse(order, orderItems);
    }

    private User getCurrentUser() {

    String email = SecurityUtil
            .getCurrentUserLogin()
            .orElseThrow(
                    () -> new BadRequestException(
                            "Người dùng chưa đăng nhập"));

    return userRepository
            .findByEmail(email)
            .orElseThrow(
                    () -> new NotFoundException(
                            "Người dùng không tồn tại"));
}
}
