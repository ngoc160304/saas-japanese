package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.Specification;

import com.mycompany.saas_japanese.domain.Order;
import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;

public class OrderSpecs {

    public static Specification<Order> hasStatus(OrderStatusEnum status) {
        return (root, query, builder) -> {
            if (status == null) {
                return builder.conjunction();
            }

            return builder.equal(root.get("orderStatus"), status);
        };
    }

    public static Specification<Order> hasPaymentStatus(
            PaymentStatusEnum paymentStatus) {

        return (root, query, builder) -> {
            if (paymentStatus == null) {
                return builder.conjunction();
            }

            return builder.equal(
                    root.get("paymentStatus"),
                    paymentStatus
            );
        };
    }

    public static Specification<Order> hasPaymentMethod(
            PaymentMethodEnum paymentMethod) {

        return (root, query, builder) -> {
            if (paymentMethod == null) {
                return builder.conjunction();
            }

            return builder.equal(
                    root.get("paymentMethod"),
                    paymentMethod
            );
        };
    }

    public static Specification<Order> hasSearch(String search) {

        if (search == null || search.isBlank()) {
            return (root, query, builder) ->
                    builder.conjunction();
        }

        String keyword = "%" + search.trim().toLowerCase() + "%";

        return (root, query, builder) -> builder.or(
                builder.like(
                        builder.lower(root.get("orderNumber")),
                        keyword
                ),
                builder.like(
                        builder.lower(root.get("paymentReference")),
                        keyword
                ),
                builder.like(
                        builder.lower(root.get("transactionCode")),
                        keyword
                ),
                builder.like(
                        builder.lower(root.get("user").get("email")),
                        keyword
                ),
                builder.like(
                        builder.lower(root.get("user").get("username")),
                        keyword
                )
        );
    }
}