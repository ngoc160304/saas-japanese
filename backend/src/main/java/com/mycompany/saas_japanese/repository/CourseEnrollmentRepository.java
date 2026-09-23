package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.CourseEnrollment;

import java.util.List;
import java.util.Optional;

@Repository 
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long>, JpaSpecificationExecutor<CourseEnrollment>{

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseEnrollment> findByUserId(Long userId);
}
