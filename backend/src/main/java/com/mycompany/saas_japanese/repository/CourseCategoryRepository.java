package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Long>,
    JpaSpecificationExecutor<CourseCategory> {

  @EntityGraph(attributePaths = {"media"})
  Optional<CourseCategory> findByIdAndIsDeletedFalse(Long id);

  @Override
  @EntityGraph(attributePaths = {"media"})
  Page<CourseCategory> findAll(Specification<CourseCategory> spec, Pageable pageable);

  boolean existsBySlugAndIdNot(String slug, Long id);
}
