package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.mycompany.saas_japanese.domain.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

}
