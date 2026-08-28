package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.mycompany.saas_japanese.domain.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
  Optional<Course> findByIdAndIsDeletedFalse(Long id);

  boolean existsByCategoryIdAndIsDeletedFalse(Long categoryId);

  long countByCategoryIdAndIsDeletedFalse(Long categoryId);
}
