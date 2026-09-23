package com.mycompany.saas_japanese.util.constant;

import java.math.BigDecimal;
import java.util.List;

public enum JlptScoringRule {
    N1(100, separateScoringSections()),
    N2(90, separateScoringSections()),
    N3(95, separateScoringSections()),
    N4(90, combinedScoringSections()),
    N5(80, combinedScoringSections());

    private final BigDecimal overallPassScore;
    private final List<ScoringSectionRule> scoringSections;

    JlptScoringRule(int overallPassScore, List<ScoringSectionRule> scoringSections) {
        this.overallPassScore = BigDecimal.valueOf(overallPassScore);
        this.scoringSections = scoringSections;
    }

    public static JlptScoringRule forLevel(JlptLevelEnum level) {
        return valueOf(level.name());
    }

    public BigDecimal getOverallPassScore() {
        return overallPassScore;
    }

    public List<ScoringSectionRule> getScoringSections() {
        return List.copyOf(scoringSections);
    }

    private static List<ScoringSectionRule> separateScoringSections() {
        return List.of(
                new ScoringSectionRule(
                        "Language Knowledge",
                        sectionPassScore(),
                        JlptSessionEnum.language_knowledge,
                        null),
                new ScoringSectionRule(
                        "Reading",
                        sectionPassScore(),
                        JlptSessionEnum.reading,
                        null),
                new ScoringSectionRule(
                        "Listening",
                        sectionPassScore(),
                        JlptSessionEnum.listening,
                        null));
    }

    private static List<ScoringSectionRule> combinedScoringSections() {
        return List.of(
                new ScoringSectionRule(
                        "Language Knowledge + Reading",
                        combinedSectionPassScore(),
                        JlptSessionEnum.language_knowledge,
                        JlptSessionEnum.reading),
                new ScoringSectionRule(
                        "Listening",
                        sectionPassScore(),
                        JlptSessionEnum.listening,
                        null));
    }

    private static BigDecimal sectionPassScore() {
        return BigDecimal.valueOf(19);
    }

    private static BigDecimal combinedSectionPassScore() {
        return BigDecimal.valueOf(38);
    }

    public record ScoringSectionRule(
            String name,
            BigDecimal minimumPassScore,
            JlptSessionEnum primarySessionType,
            JlptSessionEnum secondarySessionType) {

        public boolean includes(JlptSessionEnum sessionType) {
            return sessionType == primarySessionType || sessionType == secondarySessionType;
        }
    }
}
