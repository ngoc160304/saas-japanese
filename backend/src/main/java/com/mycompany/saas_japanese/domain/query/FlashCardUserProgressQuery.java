package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FlashCardUserProgressQuery extends BaseQuery {
    Long userId;
    Long deckId;
    Boolean isDueOnly;
    
}
