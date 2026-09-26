package com.mycompany.saas_japanese_webhook.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSePayWebhook {

    private Long timestamp;

    @JsonProperty("notification_type")
    private String notificationType;

    private OrderData order;
    private TransactionData transaction;

    @Getter
    @Setter
    public static class OrderData {

        private String id;

        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("order_status")
        private String orderStatus;

        @JsonProperty("order_currency")
        private String orderCurrency;

        @JsonProperty("order_amount")
        private BigDecimal orderAmount;

        @JsonProperty("order_invoice_number")
        private String orderInvoiceNumber;

        @JsonProperty("order_description")
        private String orderDescription;
    }

    @Getter
    @Setter
    public static class TransactionData {

        private String id;

        @JsonProperty("payment_method")
        private String paymentMethod;

        @JsonProperty("transaction_id")
        private String transactionId;

        @JsonProperty("transaction_type")
        private String transactionType;

        @JsonProperty("transaction_date")
        private String transactionDate;

        @JsonProperty("transaction_status")
        private String transactionStatus;

        @JsonProperty("transaction_amount")
        private BigDecimal transactionAmount;

        @JsonProperty("transaction_currency")
        private String transactionCurrency;
    }
}
