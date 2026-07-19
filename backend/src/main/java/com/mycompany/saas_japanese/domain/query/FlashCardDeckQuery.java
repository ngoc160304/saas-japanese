package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FlashCardDeckQuery extends BaseQuery {
    Long courseId;
    String title;

}
