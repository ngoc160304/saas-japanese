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
        voc.setMediaId(request.getMediaId());
        voc.setTerm(request.getTerm());
        voc.setKanji(request.getKanji());
        voc.setMeaning(request.getMeaning());
        voc.setRomaji(request.getRomaji());
        voc.setExampleSentence(request.getExampleSentence());
        voc.setExampleMeaning(request.getExampleMeaning());
        voc.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        return voc;
    }

    public void updateEntity(Vocabulary voc, ReqUpdateVocabulary request) {
        if (request == null || voc == null) return;
        voc.setLessonId(request.getLessonId());
        voc.setMediaId(request.getMediaId());
        voc.setTerm(request.getTerm());
        voc.setKanji(request.getKanji());
        voc.setMeaning(request.getMeaning());
        voc.setRomaji(request.getRomaji());
        voc.setExampleSentence(request.getExampleSentence());
        voc.setExampleMeaning(request.getExampleMeaning());
        if (request.getSortOrder() != null) {
            voc.setSortOrder(request.getSortOrder());
        }
    }

    public VocabularyResponse toResponse(Vocabulary voc) {
        if (voc == null) return null;
        VocabularyResponse response = new VocabularyResponse();
        response.setId(voc.getId());
        response.setLessonId(voc.getLessonId());
        response.setMediaId(voc.getMediaId());
        response.setTerm(voc.getTerm());
        response.setKanji(voc.getKanji());
        response.setMeaning(voc.getMeaning());
        response.setRomaji(voc.getRomaji());
        response.setExampleSentence(voc.getExampleSentence());
        response.setExampleMeaning(voc.getExampleMeaning());
        response.setSortOrder(voc.getSortOrder());
        response.setCreatedAt(voc.getCreatedAt());
        response.setUpdatedAt(voc.getUpdatedAt());
        return response;
    }
}
