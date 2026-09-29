package com.mycompany.saas_japanese.domain.query;

import com.mycompany.saas_japanese.util.constant.OrderStatusEnum;
import com.mycompany.saas_japanese.util.constant.PaymentMethodEnum;
import com.mycompany.saas_japanese.util.constant.PaymentStatusEnum;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderQuery extends BaseQuery {

    private OrderStatusEnum status;

    private PaymentStatusEnum paymentStatus;

    private PaymentMethodEnum paymentMethod;
}
