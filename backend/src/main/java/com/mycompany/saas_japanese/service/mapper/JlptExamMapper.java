package com.mycompany.saas_japanese.service.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamPartResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;

@Component
public class JlptExamMapper {
        public JlptExamResponse toResponse(JlptExam exam) {

                return JlptExamResponse.builder()
                                .id(exam.getId())
                                .jlptLevel(exam.getJlptLevel())
                                .title(exam.getTitle())
                                .description(exam.getDescription())
                                .totalTimeMinutes(exam.getTotalTimeMinutes())
                                .isPublished(exam.getIsPublished())
                                .build();
        }

        public JlptExamDetailResponse toDetailResponse(
                        JlptExam entity,
                        List<JlptExamSessionResponse> sessions) {

                return JlptExamDetailResponse.builder()
                                .id(entity.getId())
                                .title(entity.getTitle())
                                .jlptLevel(entity.getJlptLevel())
                                .description(entity.getDescription())
                                .totalTimeMinutes(entity.getTotalTimeMinutes())
                                .isPublished(entity.getIsPublished())
                                .sessions(sessions)
                                .build();
        }

        public JlptExamSessionResponse toSessionResponse(
                        JlptExamSession entity,
                        List<JlptExamPartResponse> parts,
                        int questionCount) {

                return JlptExamSessionResponse.builder()
                                .id(entity.getId())
                                .name(entity.getName())
                                .sessionType(entity.getSessionType())
                                .timeLimitMinutes(entity.getTimeLimitMinutes())
                                .sortOrder(entity.getSortOrder())
                                .questionCount(questionCount)
                                .parts(parts)
                                .build();
        }

        public JlptExamPartResponse toPartResponse(
                        JlptExamPart entity) {

                int questionCount = entity.getQuestions() == null
                                ? 0
                                : entity.getQuestions().size();

                return JlptExamPartResponse.builder()
                                .id(entity.getId())
                                .name(entity.getName())
                                .instructions(entity.getInstructions())
                                .sortOrder(entity.getSortOrder())
                                .audioMediaId(entity.getAudioMediaId())
                                .questionCount(questionCount)
                                .build();
        }
}
