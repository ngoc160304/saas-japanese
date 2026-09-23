package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonGrammarVideoResponse {

    private String grammar;
    private String videoUrl;
}
