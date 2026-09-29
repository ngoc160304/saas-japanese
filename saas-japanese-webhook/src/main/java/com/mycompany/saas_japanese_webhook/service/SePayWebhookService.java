package com.mycompany.saas_japanese_webhook.service;

import com.mycompany.saas_japanese_webhook.dto.ReqSePayWebhook;

public interface SePayWebhookService {

    void handleWebhook(ReqSePayWebhook request);
    
}
