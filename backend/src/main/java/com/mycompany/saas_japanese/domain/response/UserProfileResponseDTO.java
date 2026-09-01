package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Builder
public class UserProfileResponseDTO {
    
     private Long id;

    private String username;

    private String email;

    private String avatarUrl;

    private String phone;
}
