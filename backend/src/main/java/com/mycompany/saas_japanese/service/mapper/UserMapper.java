package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.UserProfileResponseDTO;

@Component
public class UserMapper {

    public UserProfileResponseDTO toProfileResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserProfileResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .build();
    }
}
