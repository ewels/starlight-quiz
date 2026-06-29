import { getTracker } from './tracker';

/**
 * Wire a widget's reset button (a `<button>` matching `selector` inside `host`)
 * to clear every quiz on the page, confirming first via the host's
 * `data-confirm-label` when present. Shared by the results, progress and intro
 * widgets, which differ only in the button's class. No-op if the button is
 * absent.
 */
export function wireResetButton(host: HTMLElement, selector: string): void {
  const resetButton = host.querySelector<HTMLButtonElement>(selector);
  resetButton?.addEventListener('click', () => {
    const confirmMessage = host.dataset['confirmLabel'];
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    getTracker().resetAll();
  });
}

/**
 * Set `textContent` on every descendant of `host` matching `selector`. The
 * progress, badge and results widgets each fill several such count slots from
 * the progress snapshot the tracker hands them.
 */
export function setTextAll(host: HTMLElement, selector: string, value: string): void {
  for (const element of host.querySelectorAll(selector)) {
    element.textContent = value;
  }
}
