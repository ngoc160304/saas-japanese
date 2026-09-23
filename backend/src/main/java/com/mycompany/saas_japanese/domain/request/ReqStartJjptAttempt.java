package com.mycompany.saas_japanese.domain.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqStartJjptAttempt {

    
    @NotNull
    private Long userId;

    @NotBlank
    private String mode;

    private Long sessionId;
}