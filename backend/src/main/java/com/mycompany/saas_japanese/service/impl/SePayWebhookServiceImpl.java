package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Order;
import com.mycompany.saas_japanese.domain.OrderItem;
import com.mycompany.saas_japanese.domain.request.ReqSePayWebhook;
import com.mycompany.saas_japanese.repository.OrderItemRepository;
import com.mycompany.saas_japanese.repository.OrderRepository;
import com.mycompany.saas_japanese.service.CourseEnrollmentService;
import com.mycompany.saas_japanese.service.SePayWebhookService;
import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SePayWebhookServiceImpl implements SePayWebhookService {

    private final OrderRepository orderRepository;

    private final OrderItemRepository orderItemRepository;

    private final CourseEnrollmentService courseEnrollmentService;

    @Override
    @Transactional
    public void handleWebhook( ReqSePayWebhook request) {

        if (request.getOrder().getOrderInvoiceNumber() == null
                || request.getOrder().getOrderInvoiceNumber().isBlank()) {
            throw new BadRequestException("Order invoice number không được để trống");
        }

        Order order = orderRepository
                .findByOrderNumber(
                        request.getOrder().getOrderInvoiceNumber())
                .orElseThrow(
                        () -> new NotFoundException("Không tìm thấy Order"));


        if (PaymentStatusEnum.SUCCESS
                .equals(order.getPaymentStatus())) {
            return;
        }

        BigDecimal webhookAmount = request.getTransaction().getTransactionAmount();

        if (webhookAmount == null) {
            throw new BadRequestException(
                    "Số tiền thanh toán không được để trống");
        }

        if (order.getTotalAmoun() == null
                || order.getTotalAmoun()
                        .compareTo(webhookAmount) != 0) {

            throw new BadRequestException(
                    "Số tiền thanh toán không khớp");
        }

        String transactionStatus = request.getTransaction().getTransactionStatus();

        if (!"APPROVED".equals(transactionStatus)) {
            return;
        }

        String transactionCode = request.getTransaction().getTransactionId();
        
        order.setPaymentStatus(PaymentStatusEnum.SUCCESS);
        order.setOrderStatus(OrderStatusEnum.CONFIRMED);
        order.setTransactionCode(transactionCode);
        order.setPaidAt(Instant.now());
        order.setConfirmedAt(Instant.now());

        orderRepository.save(order);

        List<OrderItem> orderItems =orderItemRepository.findByOrderId(order.getId());

        for (OrderItem orderItem : orderItems) {

            if (orderItem.getCourse() == null) {
                continue;
            }

            courseEnrollmentService.createEnrollmentAfterPayment(
                order.getUser().getId(),
                orderItem.getCourse().getId());
        }
    }
}