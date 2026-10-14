package com.mycompany.saas_japanese.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.StudentDashboardResponse;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.StudentDashboardService;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.error.ForbiddenException;
import com.mycompany.saas_japanese.util.error.NotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentDashboardServiceImpl implements StudentDashboardService {
  private final CourseEnrollmentRepository enrollments;
  private final UserRepository users;

  @Override
  public StudentDashboardResponse getCurrent() {
    String email = SecurityUtil.getCurrentUserLogin()
        .orElseThrow(() -> new ForbiddenException("Authentication required"));
    User user = users.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    return enrollments.summarizeForUser(user.getId());
  }
}

