package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Long>,
    JpaSpecificationExecutor<CourseCategory> {

  Optional<CourseCategory> findByIdAndIsDeletedFalse(Long id);

}
