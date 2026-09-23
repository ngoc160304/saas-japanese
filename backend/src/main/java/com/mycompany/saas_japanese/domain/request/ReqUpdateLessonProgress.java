package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateLessonProgress {

    @NotNull(message = "Watch duration không được để trống")
    @Min(value = 0,message = "Watch duration không hợp lệ")
    private Integer watchDuration;

    @NotNull(message = "Video duration không được để trống")
    @Min(value = 1,message = "Video duration không hợp lệ")
    private Integer videoDuration;
}



