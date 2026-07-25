package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    Media findByFileKey(String fileKey); // Tìm media theo public_id Cloudinary
}