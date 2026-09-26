package com.mycompany.saas_japanese_webhook.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mycompany.saas_japanese_webhook.dto.ReqSePayWebhook;
import com.mycompany.saas_japanese_webhook.service.SePayWebhookService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/order")
@RequiredArgsConstructor
public class SePayWebhookController {

    private final SePayWebhookService sePayWebhookService;

    @PostMapping("/payment")
    public ResponseEntity<String> paymentWebhook(
            @RequestBody ReqSePayWebhook request) {

        System.out.println("========== SEPAY WEBHOOK ==========");
        System.out.println("Order invoice: "
                + request.getOrder().getOrderInvoiceNumber());

        System.out.println("Transaction ID: "
                + request.getTransaction().getTransactionId());

        System.out.println("Amount: "
                + request.getTransaction().getTransactionAmount());

        System.out.println("Status: "
                + request.getTransaction().getTransactionStatus());

        System.out.println("===================================");

        sePayWebhookService.handleWebhook(request);

        return ResponseEntity.ok("Webhook received");
    }
}