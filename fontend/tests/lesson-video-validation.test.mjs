import assert from 'node:assert/strict';
import test from 'node:test';
import { validateVideoFile } from '../features/lesson/hooks/videoUpload.ts';

test('video selection validates backend size and MIME policy', () => {
  assert.equal(validateVideoFile({ name: 'lesson.mp4', type: 'video/mp4', size: 12 }), null);
  assert.equal(validateVideoFile({ name: 'lesson.webm', type: 'video/webm', size: 12 }), null);
  assert.equal(validateVideoFile({ name: 'lesson.mov', type: 'video/quicktime', size: 12 }), null);
  assert.match(validateVideoFile({ name: 'lesson.mp4', type: 'image/png', size: 12 }), /MP4/);
  assert.match(validateVideoFile({ name: 'lesson.mp4', type: 'video/mp4', size: 0 }), /trống/);
  assert.match(validateVideoFile({ name: 'lesson.mp4', type: 'video/mp4', size: 100 * 1024 * 1024 + 1 }), /100 MB/);
});
