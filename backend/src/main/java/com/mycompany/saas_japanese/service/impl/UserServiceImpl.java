package com.mycompany.saas_japanese.service.impl;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqUpdateProfileDTO;
import com.mycompany.saas_japanese.domain.response.UserProfileResponseDTO;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.UserService;
import com.mycompany.saas_japanese.service.mapper.UserMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import org.springframework.security.core.Authentication;

@Service
public class UserServiceImpl implements UserService {

  private final UserMapper userMapper;
  private final UserRepository userRepository;

  UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;

  }

  @Override
  public User getUserByEmail(String email) {
    return userRepository.findByEmail(email).map(user -> user)
        .orElseThrow(() -> new BadRequestException("User not found"));
  }

  @Override
  public UserProfileResponseDTO getMyProfile() {
    String email = getCurrentUserEmail();
    User user = getUserByEmail(email);
    return userMapper.toProfileResponse(user);
  }

  @Override
  public UserProfileResponseDTO updateMyProfile(ReqUpdateProfileDTO request) {
    String email = getCurrentUserEmail();
    User user = getUserByEmail(email);

    user.setUsername(request.getUsername());
    user.setPhone(request.getPhone());
    user.setAvatarUrl(request.getAvatarUrl());

    User updatedUser = userRepository.save(user);
    return userMapper.toProfileResponse(updatedUser);
  }

  private String getCurrentUserEmail() {
    Authentication authentication = SecurityContextHolder
        .getContext()
        .getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw new BadRequestException("Unauthenticated");
    }
    // Kiểm tra xem Principal có phải là Jwt không
    if (authentication.getPrincipal() instanceof Jwt jwt) {
      // Lấy chính xác claim "sub" từ Payload JWT
      String email = jwt.getSubject(); // Trả về "test@gmail.com"
      if (email != null) {
        return email.trim(); // .trim() để xóa khoảng trắng thừa nếu có
      }
    }
    return authentication.getName();
  }

}
