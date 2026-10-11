export interface DraftState {
  draft: string;
  baseline: string;
  server: string;
}

export type DraftAction =
  | { type: 'edit'; value: string }
  | { type: 'sync'; value: string }
  | { type: 'saved'; submitted: string; saved: string }
  | { type: 'discard' };

export function comparableGrammar(html: string): string {
  if (typeof DOMParser === 'undefined') return html.trim();
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  if (!parsed.body.textContent?.replaceAll('\u00a0', ' ').trim()) return '';
  if (parsed.body.childNodes.length === 1 && parsed.body.firstChild?.nodeType === 3) {
    return `<p>${parsed.body.innerHTML.trim()}</p>`;
  }
  return parsed.body.innerHTML.trim();
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'edit':
      return { ...state, draft: action.value };
    case 'sync':
      if (action.value === state.server) return state;
      return comparableGrammar(state.draft) === comparableGrammar(state.baseline)
        ? { draft: action.value, baseline: action.value, server: action.value }
        : { ...state, server: action.value };
    case 'saved':
      return {
        server: action.saved,
        baseline: action.saved,
        draft: comparableGrammar(state.draft) === comparableGrammar(action.submitted)
          ? action.saved
          : state.draft,
      };
    case 'discard':
      return { draft: state.server, baseline: state.server, server: state.server };
  }
}
