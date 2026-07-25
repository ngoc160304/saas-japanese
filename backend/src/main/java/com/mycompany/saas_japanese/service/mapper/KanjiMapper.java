package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.request.ReqCreateKanji;
import com.mycompany.saas_japanese.domain.request.ReqUpdateKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import org.springframework.stereotype.Component;

@Component
public class KanjiMapper {

    public Kanji toEntity(ReqCreateKanji request) {
        if (request == null) return null;
        Kanji kanji = new Kanji();
        kanji.setLessonId(request.getLessonId());
        kanji.setKanji(request.getKanji());
        kanji.setOnyomi(request.getOnyomi());
        kanji.setKunyomi(request.getKunyomi());
        kanji.setMeaningVi(request.getMeaningVi());
        kanji.setStrokeCount(request.getStrokeCount());
        kanji.setExampleWords(request.getExampleWords());
        return kanji;
    }

    public void updateEntity(Kanji kanji, ReqUpdateKanji request) {
        if (request == null || kanji == null) return;
        kanji.setLessonId(request.getLessonId());
        kanji.setKanji(request.getKanji());
        kanji.setOnyomi(request.getOnyomi());
        kanji.setKunyomi(request.getKunyomi());
        kanji.setMeaningVi(request.getMeaningVi());
        kanji.setStrokeCount(request.getStrokeCount());
        kanji.setExampleWords(request.getExampleWords());
    }

    public KanjiResponse toResponse(Kanji kanji) {
        if (kanji == null) return null;
        KanjiResponse response = new KanjiResponse();
        response.setId(kanji.getId());
        response.setLessonId(kanji.getLessonId());
        response.setKanji(kanji.getKanji());
        response.setOnyomi(kanji.getOnyomi());
        response.setKunyomi(kanji.getKunyomi());
        response.setMeaningVi(kanji.getMeaningVi());
        response.setStrokeCount(kanji.getStrokeCount());
        response.setExampleWords(kanji.getExampleWords());
        response.setCreatedAt(kanji.getCreatedAt());
        response.setUpdatedAt(kanji.getUpdatedAt());
        return response;
    }
}
