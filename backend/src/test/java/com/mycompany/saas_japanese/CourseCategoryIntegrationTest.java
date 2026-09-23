package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.domain.query.CourseCategoryQuery;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourseCategory;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.service.CourseCategoryService;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

@Transactional
class CourseCategoryIntegrationTest extends AuthTestSupport {
    @Autowired private CourseCategoryService categories;
    @Autowired private CourseService courses;
    @Autowired private CourseCategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private MediaRepository mediaRepository;

    @Test
    void detailCountsOnlyActiveCoursesAndLessonsAndRejectsMissingCategories() {
        CourseCategory category = category("Kanji");
        Course active = course(category, "Kanji N5", true, false, BigDecimal.ZERO);
        Course removed = course(category, "Removed", true, true, BigDecimal.TEN);
        lessonRepository.save(Lesson.builder().course(active).title("One").slug("one").build());
        lessonRepository.save(Lesson.builder().course(active).title("Deleted").slug("deleted")
            .isDeleted(true).build());
        lessonRepository.save(Lesson.builder().course(removed).title("Hidden").slug("hidden").build());
        var detail = categories.findById(category.getId());
        assertThat(detail.getCourseCount()).isEqualTo(1L);
        assertThat(detail.getLessonCount()).isEqualTo(1L);
        assertThat(detail.getName()).isEqualTo("Kanji");
        assertThatThrownBy(() -> categories.findById(Long.MAX_VALUE)).isInstanceOf(NotFoundException.class);
        category.setIsDeleted(true);
        assertThatThrownBy(() -> categories.findById(category.getId())).isInstanceOf(NotFoundException.class);
    }

    @Test
    void deletionRejectsUsedCategoryAndSoftDeletesEmptyCategory() {
        CourseCategory used = category("Used");
        course(used, "Existing", false, false, BigDecimal.ZERO);
        assertThatThrownBy(() -> categories.delete(used.getId()))
            .isInstanceOf(BadRequestException.class).hasMessageContaining("đang có khóa học");
        assertThat(used.getIsDeleted()).isFalse();
        CourseCategory empty = category("Empty");
        course(empty, "Removed", false, true, BigDecimal.ZERO);
        categories.delete(empty.getId());
        assertThat(empty.getIsDeleted()).isTrue();
        assertThat(empty.getDeletedAt()).isNotNull();
        assertThat(categoryRepository.findById(empty.getId())).isPresent();
        CourseCategoryQuery query = new CourseCategoryQuery();
        query.setSearch("Empty");
        assertThat(categories.findAll(query).getTotalElements()).isZero();
    }

    @Test
    void courseFiltersCombineWithSearchPaginationAndExcludeSoftDeletes() {
        CourseCategory category = category("Vocabulary");
        course(category, "Japanese free", true, false, BigDecimal.ZERO);
        course(category, "Japanese paid", true, false, BigDecimal.TEN);
        course(category, "Japanese draft", false, false, BigDecimal.TEN);
        course(category, "Japanese removed", true, true, BigDecimal.TEN);
        course(category("Other"), "Japanese other", true, false, BigDecimal.TEN);
        CourseQuerry query = new CourseQuerry();
        query.setCategoryId(category.getId());
        query.setSearch("Japanese");
        query.setPublished(true);
        query.setPricing("paid");
        query.setSize(1);
        var result = courses.fetchAllCourse(query);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Japanese paid");
        assertThat(result.getContent().get(0).getCreatedAt()).isNotNull();
        assertThat(result.getContent().get(0).getLessonCount()).isZero();
        query.setPricing(null);
        query.setPage(1);
        assertThat(courses.fetchAllCourse(query).getTotalElements()).isEqualTo(2);
        assertThat(courses.fetchAllCourse(query).getContent()).hasSize(1);
        query.setCategoryId(Long.MAX_VALUE);
        assertThatThrownBy(() -> courses.fetchAllCourse(query)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateWithoutExistingImageWorksAndSlugDoesNotCollide() {
        var first = categories.create(request("Repeated", null));
        var second = categories.create(request("Repeated", null));
        assertThat(second.getSlug()).isNotEqualTo(first.getSlug());
        var updated = categories.update(first.getId(), request("Renamed", null));
        assertThat(updated.getName()).isEqualTo("Renamed");
        assertThat(updated.getMediaId()).isNull();
    }

    @Test
    void mediaReplacementRemovalAndDeletionKeepUsageConsistent() {
        Media first = media("first");
        Media second = media("second");
        var category = categories.create(request("Images", first.getId()));
        assertThat(first.getIsUsed()).isTrue();
        ReqCreateCourseCategory withoutMedia = new ReqCreateCourseCategory();
        withoutMedia.setName("Images");
        assertThat(categories.update(category.getId(), withoutMedia).getMediaId()).isEqualTo(first.getId());
        categories.update(category.getId(), request("Images", first.getId()));
        assertThat(first.getIsUsed()).isTrue();
        categories.update(category.getId(), request("Images", second.getId()));
        assertThat(first.getIsUsed()).isFalse();
        assertThat(second.getIsUsed()).isTrue();
        categories.update(category.getId(), request("Images", null));
        assertThat(second.getIsUsed()).isFalse();
        categories.update(category.getId(), request("Images", first.getId()));
        categories.delete(category.getId());
        assertThat(first.getIsUsed()).isFalse();
    }

    private Media media(String name) {
        return mediaRepository.save(Media.builder().fileName(name).publicId(name)
            .secureUrl("https://example.test/" + name).fileType(FileTypeEnum.IMAGE).isUsed(false).build());
    }

    private ReqCreateCourseCategory request(String name, Long mediaId) {
        ReqCreateCourseCategory request = new ReqCreateCourseCategory();
        request.setName(name);
        request.setMediaId(mediaId);
        return request;
    }

    private CourseCategory category(String name) {
        return categoryRepository.save(CourseCategory.builder().name(name).slug(name.toLowerCase(Locale.ROOT)).build());
    }

    private Course course(CourseCategory category, String title, boolean published,
            boolean deleted, BigDecimal price) {
        return courseRepository.save(Course.builder().category(category).title(title).slug(title.replace(' ', '-'))
            .price(price).isPublished(published).isDeleted(deleted).build());
    }
}
