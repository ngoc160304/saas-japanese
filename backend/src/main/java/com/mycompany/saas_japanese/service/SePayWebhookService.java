package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.request.ReqSePayWebhook;

public interface SePayWebhookService {
    
    void handleWebhook(ReqSePayWebhook request);

}
