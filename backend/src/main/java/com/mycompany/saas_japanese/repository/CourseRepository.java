package com.mycompany.saas_japanese.repository;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.mycompany.saas_japanese.domain.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
  @EntityGraph(attributePaths = {"category", "thumbnailMedia"})
  Optional<Course> findByIdAndIsDeletedFalse(Long id);

  boolean existsByCategoryIdAndIsDeletedFalse(Long categoryId);

  long countByCategoryIdAndIsDeletedFalse(Long categoryId);
  @Override
  @EntityGraph(attributePaths = {"category", "thumbnailMedia"})
  Page<Course> findAll(Specification<Course> spec, Pageable pageable);

  @Query("select c.category.id as parentId, count(c) as total from Course c "
      + "where c.isDeleted = false and c.category.id in :ids group by c.category.id")
  List<ParentCount> countByCategoryIds(@Param("ids") List<Long> ids);
}
