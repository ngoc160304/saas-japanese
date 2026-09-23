package com.mycompany.saas_japanese.service;

import java.math.BigDecimal;
import java.util.Map;

public interface SePayService {

    Map<String, String> createCheckout(String orderNumber, BigDecimal amount, String description);
    
}
