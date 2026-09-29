import type { LessonGrammarPreview } from '../types/grammar';

export const newGrammarPointEditorMock = `<h3>Ý nghĩa</h3>
<p>Dùng để diễn đạt ý nghĩa hoặc cách dùng của mẫu ngữ pháp.</p>
<h3>Cấu trúc</h3>
<ul>
  <li>V / A-i / A-na / N + mẫu ngữ pháp</li>
</ul>
<h3>Ví dụ</h3>
<p>ここに例文を入力してください。</p>`;

export const lessonGrammarMock: LessonGrammarPreview = {
  courseTitle: 'Tiếng Nhật Trung Cấp N3 Soumatome',
  title: 'Cấu trúc ~わけがない & ~わけではない',
  durationMinutes: 45,
  video: {
    fileName: 'video_n3_lesson_1_wakeganai.mp4',
    duration: '45:12',
    url: 'https://cdn.studyjlpt.com/videos/n3/lesson_1_wakeganai.mp4',
  },
  points: [
    {
      id: 'wakeganai',
      title: '~わけがない (Tuyệt đối không / Làm sao mà...)',
      explanation: `**Ý nghĩa**: Biểu thị sự khẳng định chắc chắn của người nói rằng không thể có chuyện đó xảy ra, dựa trên căn cứ hoặc lý do xác thực.

**Cấu trúc**:
- V / A-i / A-na / N + わけがない (A-na な, N の)

**Ví dụ**:
1. こんなに難しい問題、彼に解けるわけがない。(Bài toán khó thế này, làm sao cậu ấy giải được!)
2. 褒められて、嬉しくないわけがない。(Được khen như thế thì làm sao mà không vui cho được!)`,
      editorContent: `<h3>Ý nghĩa</h3>
<p>Biểu thị sự khẳng định chắc chắn của người nói rằng không thể có chuyện đó xảy ra, dựa trên căn cứ hoặc lý do xác thực.</p>
<h3>Cấu trúc</h3>
<ul>
  <li>V / A-i / A-na / N + わけがない (A-na な, N の)</li>
</ul>
<h3>Ví dụ</h3>
<ol>
  <li>こんなに難しい問題、彼に解けるわけがない。(Bài toán khó thế này, làm sao cậu ấy giải được!)</li>
  <li>褒められて、嬉しくないわけがない。(Được khen như thế thì làm sao mà không vui cho được!)</li>
</ol>`,
    },
    {
      id: 'wakedehanai',
      title: '~わけではない (Không hẳn là / Không có nghĩa là...)',
      explanation: `**Ý nghĩa**: Phủ định một phần hoặc làm giảm mức độ khẳng định (không phải 100% như vậy).

**Cấu trúc**:
- Thể thông thường (A-na な, N な/の) + わけではない

**Ví dụ**:
1. 日本料理が嫌いなわけではないが、納豆は食べられない。(Không hẳn là ghét đồ ăn Nhật, nhưng tôi không ăn được Natto).`,
      editorContent: `<h3>Ý nghĩa</h3>
<p>Phủ định một phần hoặc làm giảm mức độ khẳng định (không phải 100% như vậy).</p>
<h3>Cấu trúc</h3>
<ul>
  <li>Thể thông thường (A-na な, N な/の) + わけではない</li>
</ul>
<h3>Ví dụ</h3>
<ol>
  <li>日本料理が嫌いなわけではないが、納豆は食べられない。(Không hẳn là ghét đồ ăn Nhật, nhưng tôi không ăn được Natto).</li>
</ol>`,
    },
  ],
};
