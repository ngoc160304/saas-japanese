import assert from 'node:assert/strict';
import test from 'node:test';
import { draftReducer } from '../features/lesson/hooks/grammarDraft.ts';

test('background refetch preserves an unsaved grammar draft', () => {
  const initial = { draft: '<p>Original</p>', baseline: '<p>Original</p>', server: '<p>Original</p>' };
  const edited = draftReducer(initial, { type: 'edit', value: '<p>Local edit</p>' });
  const refetched = draftReducer(edited, { type: 'sync', value: '<p>Remote edit</p>' });
  assert.equal(refetched.draft, '<p>Local edit</p>');
  assert.equal(refetched.baseline, '<p>Original</p>');
  assert.equal(refetched.server, '<p>Remote edit</p>');
  assert.deepEqual(draftReducer(refetched, { type: 'discard' }), {
    draft: '<p>Remote edit</p>', baseline: '<p>Remote edit</p>', server: '<p>Remote edit</p>',
  });
});

test('save response keeps edits made after submission dirty', () => {
  const submitted = '<p>First edit</p>';
  const pending = { draft: '<p>Second edit</p>', baseline: '<p>Original</p>', server: '<p>Original</p>' };
  const saved = draftReducer(pending, { type: 'saved', submitted, saved: submitted });
  assert.equal(saved.draft, '<p>Second edit</p>');
  assert.equal(saved.baseline, submitted);
  assert.notEqual(saved.draft, saved.baseline);
});

test('successful save updates draft and baseline when nothing newer was typed', () => {
  const submitted = '<p>Edited</p>';
  const pending = { draft: submitted, baseline: '<p>Original</p>', server: '<p>Original</p>' };
  assert.deepEqual(draftReducer(pending, { type: 'saved', submitted, saved: '<p>Edited</p>' }), {
    draft: '<p>Edited</p>', baseline: '<p>Edited</p>', server: '<p>Edited</p>',
  });
});
