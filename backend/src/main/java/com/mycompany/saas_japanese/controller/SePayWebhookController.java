package com.mycompany.saas_japanese.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.request.ReqSePayWebhook;
import com.mycompany.saas_japanese.service.SePayWebhookService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/sepay")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class SePayWebhookController {

    SePayWebhookService sePayWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody ReqSePayWebhook request) {

                System.out.println("========== WEBHOOK DTO ==========");

    System.out.println("request = " + request);

    System.out.println("order = " + request.getOrder());

    if (request.getOrder() != null) {
        System.out.println(
                "invoice = "
                + request.getOrder().getOrderInvoiceNumber());
    }

    if (request.getTransaction() != null) {
        System.out.println(
                "transactionId = "
                + request.getTransaction().getTransactionId());

        System.out.println(
                "transactionAmount = "
                + request.getTransaction().getTransactionAmount());

        System.out.println(
                "transactionStatus = "
                + request.getTransaction().getTransactionStatus());
    }

    System.out.println("================================");

        sePayWebhookService.handleWebhook(request);

        return ResponseEntity.ok("OK");
    }
}