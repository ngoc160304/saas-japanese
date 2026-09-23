package com.mycompany.saas_japanese.domain.request;

import java.util.List;

import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter 
public class ReqCreateOrder {
    
    @NotEmpty (message = "Cart tiem Id không được để trống")
    private List<Long> cartItemIds;

    @NotNull (message = "không được để trống phương thức thanh toán")
    private PaymentMethodEnum paymentMethod;
}
