package com.mycompany.saas_japanese.service;

import java.util.Optional;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqUpdateProfileDTO;
import com.mycompany.saas_japanese.domain.response.UserProfileResponseDTO;


public interface UserService {
  User getUserByEmail(String email);
  UserProfileResponseDTO getMyProfile();
  UserProfileResponseDTO updateMyProfile(ReqUpdateProfileDTO request);
}
