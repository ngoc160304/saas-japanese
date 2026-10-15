package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamStatsResponse;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import jakarta.persistence.LockModeType;

@Repository
public interface JlptExamRepository extends JpaRepository<JlptExam, Long>, JpaSpecificationExecutor<JlptExam> {
    Optional<JlptExam> findByIdAndIsDeletedFalse(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select exam from JlptExam exam where exam.id = :id and exam.isDeleted = false")
    Optional<JlptExam> findActiveForUpdate(@Param("id") Long id);

    @Query("""
            SELECT new com.mycompany.saas_japanese.domain.response.AdminJlptExamStatsResponse(
                count(exam),
                count(case when exam.isDeleted = false and exam.isPublished = false then 1 end),
                count(case when exam.isDeleted = false and exam.isPublished = true then 1 end),
                count(case when exam.isDeleted = true then 1 end))
            FROM JlptExam exam
            WHERE (:level is null or exam.jlptLevel = :level)
              AND (:search is null
                or lower(exam.title) like lower(concat('%', :search, '%'))
                or lower(exam.description) like lower(concat('%', :search, '%')))
            """)
    AdminJlptExamStatsResponse summarizeAdminExams(
            @Param("search") String search, @Param("level") JlptLevelEnum level);
}
