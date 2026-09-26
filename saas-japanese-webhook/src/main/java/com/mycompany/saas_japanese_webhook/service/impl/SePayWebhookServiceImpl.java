package com.mycompany.saas_japanese_webhook.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese_webhook.dto.ReqSePayWebhook;
import com.mycompany.saas_japanese_webhook.service.SePayWebhookService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SePayWebhookServiceImpl implements SePayWebhookService{

    private final JdbcTemplate jdbcTemplate;

    public void handleWebhook(ReqSePayWebhook request) {

        if (request == null
                || request.getOrder() == null
                || request.getTransaction() == null) {

            throw new IllegalArgumentException(
                    "Webhook request không hợp lệ");
        }

        String orderNumber =
                request.getOrder().getOrderInvoiceNumber();

        if (orderNumber == null || orderNumber.isBlank()) {

            throw new IllegalArgumentException(
                    "Order invoice number không được để trống");
        }

        String sqlFindOrder = """
                SELECT id,
                       user_id,
                       order_number,
                       total_amoun,
                       order_status,
                       payment_status
                FROM orders
                WHERE order_number = ?
                """;

        List<Map<String, Object>> orders =
                jdbcTemplate.queryForList(
                        sqlFindOrder,
                        orderNumber
                );

        if (orders.isEmpty()) {

            throw new IllegalArgumentException(
                    "Không tìm thấy order: " + orderNumber);
        }

        Map<String, Object> order = orders.get(0);

        Long orderId =
                ((Number) order.get("id")).longValue();

        Long userId =
                ((Number) order.get("user_id")).longValue();

        BigDecimal totalAmount =
                (BigDecimal) order.get("total_amoun");

        String paymentStatus =
                (String) order.get("payment_status");

        if ("SUCCESS".equals(paymentStatus)) {

            System.out.println(
                    "Order đã thanh toán: " + orderNumber);

            return;
        }

        BigDecimal transactionAmount =
                request.getTransaction()
                       .getTransactionAmount();

        if (transactionAmount == null) {

            throw new IllegalArgumentException(
                    "Transaction amount không được để trống");
        }

        if (totalAmount.compareTo(transactionAmount) != 0) {

            throw new IllegalArgumentException(
                    "Số tiền thanh toán không khớp");
        }

        String transactionStatus =
                request.getTransaction()
                       .getTransactionStatus();

        if (!"APPROVED".equals(transactionStatus)) {

            System.out.println(
                    "Transaction chưa APPROVED: "
                    + transactionStatus);

            return;
        }

        String transactionCode =
                request.getTransaction()
                       .getTransactionId();

        LocalDateTime now = LocalDateTime.now();

        String sqlUpdateOrder = """
                UPDATE orders
                SET payment_status = 'SUCCESS',
                    order_status = 'CONFIRMED',
                    transaction_code = ?,
                    paid_at = ?,
                    confirmed_at = ?,
                    updated_at = ?
                WHERE id = ?
                """;

        jdbcTemplate.update(
                sqlUpdateOrder,
                transactionCode,
                now,
                now,
                now,
                orderId
        );

        System.out.println(
                "Đã cập nhật order: " + orderNumber);

        String sqlFindItems = """
                SELECT course_id
                FROM order_items
                WHERE order_id = ?
                """;

        List<Map<String, Object>> orderItems =
                jdbcTemplate.queryForList(
                        sqlFindItems,
                        orderId
                );

        for (Map<String, Object> item : orderItems) {

            Long courseId =
                    ((Number) item.get("course_id"))
                            .longValue();

            createEnrollment(
                    userId,
                    courseId,
                    now
            );
        }
    }

    private void createEnrollment(
            Long userId,
            Long courseId,
            LocalDateTime now) {

        // Kiểm tra đã đăng ký chưa
        String checkSql = """
                SELECT COUNT(*)
                FROM user_course_enrollments
                WHERE user_id = ?
                  AND course_id = ?
                """;

        Integer count =
                jdbcTemplate.queryForObject(
                        checkSql,
                        Integer.class,
                        userId,
                        courseId
                );

        if (count != null && count > 0) {

            System.out.println(
                    "Course đã được đăng ký. userId="
                    + userId
                    + ", courseId="
                    + courseId);

            return;
        }

        // Tạo enrollment
        String insertSql = """
                INSERT INTO user_course_enrollments
                (
                    user_id,
                    course_id,
                    enrolled_at,
                    progress_percent,
                    completed_at,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(
                insertSql,
                userId,
                courseId,
                now,
                BigDecimal.ZERO,
                null,
                now,
                now
        );

        System.out.println(
                "Đã tạo enrollment. userId="
                + userId
                + ", courseId="
                + courseId);
    }
}
