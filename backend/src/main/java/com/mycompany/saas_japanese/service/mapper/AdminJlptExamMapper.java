package com.mycompany.saas_japanese.service.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamSummaryResponse;
import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;

@Component
public class AdminJlptExamMapper {
  public AdminJlptExamSummaryResponse toSummary(JlptExam exam, boolean hasAttempts) {
    return AdminJlptExamSummaryResponse.builder()
        .id(exam.getId())
        .level(exam.getJlptLevel())
        .title(exam.getTitle())
        .description(exam.getDescription())
        .totalTimeMinutes(exam.getTotalTimeMinutes())
        .status(statusOf(exam))
        .hasAttempts(hasAttempts)
        .createdAt(exam.getCreatedAt())
        .updatedAt(exam.getUpdatedAt())
        .build();
  }

  public AdminJlptExamDetailResponse toDetail(
      JlptExam exam,
      boolean hasAttempts,
      List<AdminJlptExamDetailResponse.SessionResponse> sessions) {
    return AdminJlptExamDetailResponse.builder()
        .id(exam.getId())
        .level(exam.getJlptLevel())
        .title(exam.getTitle())
        .description(exam.getDescription())
        .totalTimeMinutes(exam.getTotalTimeMinutes())
        .status(statusOf(exam))
        .hasAttempts(hasAttempts)
        .contentLocked(hasAttempts || Boolean.TRUE.equals(exam.getIsPublished())
            || Boolean.TRUE.equals(exam.getIsDeleted()))
        .createdAt(exam.getCreatedAt())
        .updatedAt(exam.getUpdatedAt())
        .sessions(sessions)
        .build();
  }

  public AdminJlptExamDetailResponse.SessionResponse toSession(
      JlptExamSession session,
      List<AdminJlptExamDetailResponse.PartResponse> parts) {
    return AdminJlptExamDetailResponse.SessionResponse.builder()
        .id(session.getId())
        .name(session.getName())
        .sessionType(session.getSessionType())
        .timeLimitMinutes(session.getTimeLimitMinutes())
        .sortOrder(session.getSortOrder())
        .parts(parts)
        .build();
  }

  public AdminJlptExamDetailResponse.PartResponse toPart(
      JlptExamPart part,
      Media audio,
      List<AdminJlptExamDetailResponse.QuestionResponse> questions) {
    return AdminJlptExamDetailResponse.PartResponse.builder()
        .id(part.getId())
        .name(part.getName())
        .instructions(part.getInstructions())
        .sortOrder(part.getSortOrder())
        .audio(toMedia(audio))
        .questions(questions)
        .build();
  }

  public AdminJlptExamDetailResponse.QuestionResponse toQuestion(
      JlptExamQuestion question,
      Media image,
      List<AdminJlptExamDetailResponse.AnswerResponse> answers) {
    return AdminJlptExamDetailResponse.QuestionResponse.builder()
        .id(question.getId())
        .questionText(question.getQuestionText())
        .passageText(question.getPassageText())
        .questionType(question.getQuestionType())
        .explanation(question.getExplanation())
        .points(question.getPoints())
        .sortOrder(question.getSortOrder())
        .image(toMedia(image))
        .answers(answers)
        .build();
  }

  public AdminJlptExamDetailResponse.AnswerResponse toAnswer(JlptExamAnswer answer) {
    return AdminJlptExamDetailResponse.AnswerResponse.builder()
        .id(answer.getId())
        .answerText(answer.getAnswerText())
        .isCorrect(answer.getIsCorrect())
        .sortOrder(answer.getSortOrder())
        .build();
  }

  private AdminJlptExamDetailResponse.MediaSummaryResponse toMedia(Media media) {
    if (media == null) {
      return null;
    }
    return AdminJlptExamDetailResponse.MediaSummaryResponse.builder()
        .id(media.getId())
        .originalName(media.getOriginalName())
        .secureUrl(media.getSecureUrl())
        .fileType(media.getFileType())
        .build();
  }

  private AdminJlptExamStatus statusOf(JlptExam exam) {
    if (Boolean.TRUE.equals(exam.getIsDeleted())) {
      return AdminJlptExamStatus.ARCHIVED;
    }
    return Boolean.TRUE.equals(exam.getIsPublished())
        ? AdminJlptExamStatus.PUBLISHED
        : AdminJlptExamStatus.DRAFT;
  }
}
