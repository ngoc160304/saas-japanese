package com.mycompany.saas_japanese.domain.request;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
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
public class ReqUpdateFlashcardUserProgress {

    @NotNull(message = "Progress ID không được để trống khi cập nhật")
    Long progressId;

    @NotNull(message = "Hệ số dễ (Ease Factor) không được để trống")
    Double easeFactor;

    @NotNull(message = "Khoảng thời gian xem lại (Review Interval) không được để trống")
    Integer reviewInterval;

    @NotNull(message = "Số lần lặp lại (Repetitions) không được để trống")
    Integer repetitions;

    @NotNull(message = "Thời gian xem lại tiếp theo không được để trống")
    Instant nextReviewAt;
}
