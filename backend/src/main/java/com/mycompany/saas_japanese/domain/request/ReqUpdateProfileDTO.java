package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateProfileDTO {
    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String username;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    private String avatarUrl;
}
