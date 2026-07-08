package com.mycompany.saas_japanese.service.impl;


// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.UserService;
import com.mycompany.saas_japanese.util.error.BadRequestException;

@Service
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;

  UserServiceImpl(UserRepository userRepository) {
    this.userRepository = userRepository;

  }

  @Override
  public User getUserByEmail(String email) {
    return userRepository.findByEmail(email).map(user -> user)
        .orElseThrow(() -> new BadRequestException("User not found"));
  }
}
