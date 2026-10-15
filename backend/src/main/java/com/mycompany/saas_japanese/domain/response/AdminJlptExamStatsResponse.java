package com.mycompany.saas_japanese.domain.response;

public record AdminJlptExamStatsResponse(
    long totalExams, long draftExams, long publishedExams, long archivedExams) {
}
