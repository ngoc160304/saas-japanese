package com.mycompany.saas_japanese.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @SuppressWarnings("rawtypes")
    public Map uploadFile(MultipartFile file, String folderName, String fileType) throws IOException {
        String resourceType = "video";
        if ("IMAGE".equalsIgnoreCase(fileType)) {
            resourceType = "image";
        } else if ("DOCUMENT".equalsIgnoreCase(fileType)) {
            resourceType = "raw";
        }

        Map options = ObjectUtils.asMap(
                "folder", "saas_japanese/" + folderName,
                "resource_type", resourceType);

        return cloudinary.uploader().upload(file.getBytes(), options);
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    public Map uploadFile(File file, String folderName, String fileType, Long lessonId) throws IOException {
        String resourceType = "video";
        if ("IMAGE".equalsIgnoreCase(fileType))
            resourceType = "image";
        else if ("DOCUMENT".equalsIgnoreCase(fileType))
            resourceType = "raw";

        Map options = ObjectUtils.asMap(
                "folder", "saas_japan/" + folderName,
                "resource_type", resourceType,
                "context", "lesson_id=" + lessonId);

        log.info("Đang upload file {} lên Cloudinary folder: {}", file.getName(), folderName);
        return cloudinary.uploader().upload(file, options);
    }

    public String getFullUrl(String publicId, String fileType) {
        if (publicId == null || publicId.isEmpty())
            return null;

        String resourceType = "video";
        if ("IMAGE".equalsIgnoreCase(fileType))
            resourceType = "image";
        if ("DOCUMENT".equalsIgnoreCase(fileType))
            resourceType = "raw";

        return cloudinary.url()
                .resourceType(resourceType)
                .generate(publicId);
    }
}