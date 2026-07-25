package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.domain.request.ReqCreateVocabulary;
import com.mycompany.saas_japanese.domain.request.ReqUpdateVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import org.springframework.stereotype.Component;

@Component
public class VocabularyMapper {

    public Vocabulary toEntity(ReqCreateVocabulary request) {
        if (request == null) return null;
        Vocabulary voc = new Vocabulary();
        voc.setLessonId(request.getLessonId());
        voc.setWord(request.getWord());
        voc.setReading(request.getReading());
        voc.setMeaningVi(request.getMeaningVi());
        voc.setExampleSentenceJp(request.getExampleSentenceJp());
        voc.setExampleSentenceVi(request.getExampleSentenceVi());
        voc.setPartOfSpeech(request.getPartOfSpeech());
        return voc;
    }

    public void updateEntity(Vocabulary voc, ReqUpdateVocabulary request) {
        if (request == null || voc == null) return;
        voc.setLessonId(request.getLessonId());
        voc.setWord(request.getWord());
        voc.setReading(request.getReading());
        voc.setMeaningVi(request.getMeaningVi());
        voc.setExampleSentenceJp(request.getExampleSentenceJp());
        voc.setExampleSentenceVi(request.getExampleSentenceVi());
        voc.setPartOfSpeech(request.getPartOfSpeech());
    }

    public VocabularyResponse toResponse(Vocabulary voc) {
        if (voc == null) return null;
        VocabularyResponse response = new VocabularyResponse();
        response.setId(voc.getId());
        response.setLessonId(voc.getLessonId());
        response.setWord(voc.getWord());
        response.setReading(voc.getReading());
        response.setMeaningVi(voc.getMeaningVi());
        response.setExampleSentenceJp(voc.getExampleSentenceJp());
        response.setExampleSentenceVi(voc.getExampleSentenceVi());
        response.setPartOfSpeech(voc.getPartOfSpeech());
        response.setCreatedAt(voc.getCreatedAt());
        response.setUpdatedAt(voc.getUpdatedAt());
        return response;
    }
}
