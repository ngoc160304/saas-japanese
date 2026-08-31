package com.mycompany.saas_japanese.domain;

import lombok.*;
import jakarta.persistence.*;

import java.time.Instant;

import com.mycompany.saas_japanese.util.constant.FileTypeEnum;

@Entity
@Table(name = "media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(length = 255)
    private String originalName;

    @Column(nullable = true, length = 500)
    private String filePath;

    @Column(nullable = false, length = 255)
    private String publicId;

    @Column(nullable = false, length = 500)
    private String secureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileTypeEnum fileType;

    @Column(length = 100)
    private String mimeType;

    private Long fileSize;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant deletedAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isDeleted = false;

    @Column(nullable = false)
    private Boolean isUsed;

    @PrePersist
    protected void onCreate() {

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (isDeleted == null) {
            isDeleted = false;
        }

        if (isUsed == null) {
            isUsed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
