package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.service.SePayService;

@Service
public class SePayServiceImpl implements SePayService {

    @Value("${sepay.merchant-id}")
    private String merchantId;

    @Value("${sepay.secret-key}")
    private String secretKey;

    @Value("${sepay.checkout-url}")
    private String checkoutUrl;

    @Override
public Map<String, String> createCheckout(
        String orderNumber,
        BigDecimal amount,
        String description) {

    Map<String, String> fields = new LinkedHashMap<>();

    fields.put("order_amount", amount.setScale(0).toPlainString());
    fields.put("merchant", merchantId);
    fields.put("currency", "VND");
    fields.put("operation", "PURCHASE");
    fields.put("order_description", description);
    fields.put("order_invoice_number", orderNumber);

    String signature = generateSignature(fields);

    fields.put("signature", signature);

    fields.put("checkout_url", checkoutUrl);

    return fields;
}

    private String generateSignature(Map<String, String> fields) {

    String[] signedFields = {
        "order_amount",
        "merchant",
        "currency",
        "operation",
        "order_description",
        "order_invoice_number",
        "customer_id",
        "payment_method",
        "success_url",
        "error_url",
        "cancel_url"
    };

    StringBuilder signedString = new StringBuilder();

    for (String field : signedFields) {

        if (!fields.containsKey(field)) {
            continue;
        }

        if (signedString.length() > 0) {
            signedString.append(",");
        }

        signedString
            .append(field)
            .append("=")
            .append(fields.get(field));
    }

    try {
        Mac mac = Mac.getInstance("HmacSHA256");

        SecretKeySpec secretKeySpec =
            new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
            );

        mac.init(secretKeySpec);

        byte[] hash = mac.doFinal(
            signedString
                .toString()
                .getBytes(StandardCharsets.UTF_8)
        );

        return Base64.getEncoder()
                .encodeToString(hash);

    } catch (Exception e) {
        throw new RuntimeException(
            "Không thể tạo SePay signature", e);
    }
}
}