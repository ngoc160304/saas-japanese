package com.mycompany.saas_japanese.domain.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqCreateFlashCardDeck {

    @NotBlank(message = "Tiêu đề bộ flashcard không được để trống")
    String title;
    String description;
    @NotNull(message = "ID cấp độ (Level) không được để trống")
    Long levelId;
    Boolean isTemplate;
    Long createdByUserId; 
}
