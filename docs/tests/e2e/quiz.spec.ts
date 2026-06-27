import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('demo/');
  // Wait for the custom elements to upgrade (the JS rewrites the task list into inputs).
  await page.locator('#demo-single input[type="radio"]').first().waitFor();
});

test('single-choice: auto-submits and marks a correct answer', async ({ page }) => {
  const quiz = page.locator('#demo-single');
  // Auto-submit is on by default for single-choice: clicking grades immediately.
  await expect(quiz.locator('.sl-quiz-submit')).toBeHidden();
  await quiz.getByText('Mars', { exact: true }).click();

  await expect(quiz.locator('.sl-quiz-answer--correct')).toBeVisible();
  await expect(quiz.locator('.sl-quiz-feedback')).toContainText('Correct!');
  await expect(quiz.locator('input[value="1"]')).toBeDisabled();
});

test('single-choice: a wrong answer reveals the correct one', async ({ page }) => {
  const quiz = page.locator('#demo-single');
  await quiz.getByText('Venus', { exact: true }).click();

  await expect(quiz.locator('.sl-quiz-answer--wrong')).toBeVisible();
  await expect(quiz.locator('.sl-quiz-answer--correct')).toBeVisible();
});

test('multiple-choice: requires every correct answer and keeps a Submit button', async ({ page }) => {
  const quiz = page.locator('#demo-multiple');
  await expect(quiz.locator('.sl-quiz-submit')).toBeVisible();
  await quiz.getByText('2', { exact: true }).click();
  await quiz.getByText('7', { exact: true }).click();
  await quiz.locator('.sl-quiz-submit').click();

  await expect(quiz.locator('.sl-quiz-feedback')).toContainText('Correct!');
});

test('fill-in-the-blank: grades case-insensitively', async ({ page }) => {
  const quiz = page.locator('#demo-blank');
  await quiz.locator('input.sl-quiz-blank').fill('h2o');
  await quiz.locator('.sl-quiz-submit').click();

  await expect(quiz.locator('.sl-quiz-blank--correct')).toBeVisible();
});

test('opting out of auto-submit keeps the Submit button and reveals the explanation', async ({ page }) => {
  const quiz = page.locator('#demo-feedback');
  await expect(quiz.locator('.sl-quiz-submit')).toBeVisible();
  await quiz.getByText('JavaScript', { exact: true }).click();
  await quiz.locator('.sl-quiz-submit').click();

  await expect(quiz.locator('.sl-quiz-content')).toBeVisible();
  await expect(quiz.locator('.sl-quiz-content')).toContainText('browsers execute directly');
});

test('progress persists across a reload', async ({ page }) => {
  const quiz = page.locator('#demo-single');
  await quiz.getByText('Mars', { exact: true }).click();
  await expect(quiz.locator('.sl-quiz-answer--correct')).toBeVisible();

  await page.reload();
  await page.locator('#demo-single input[value="1"]').waitFor({ state: 'attached' });

  await expect(quiz.locator('input[value="1"]')).toBeChecked();
  await expect(quiz.locator('.sl-quiz-answer--correct')).toBeVisible();
});

test('results panel completes when every quiz is answered', async ({ page }) => {
  await page.locator('#demo-single').getByText('Mars', { exact: true }).click();

  await page.locator('#demo-multiple').getByText('2', { exact: true }).click();
  await page.locator('#demo-multiple').getByText('7', { exact: true }).click();
  await page.locator('#demo-multiple .sl-quiz-submit').click();

  await page.locator('#demo-blank input.sl-quiz-blank').fill('H2O');
  await page.locator('#demo-blank .sl-quiz-submit').click();

  await page.locator('#demo-feedback').getByText('JavaScript', { exact: true }).click();
  await page.locator('#demo-feedback .sl-quiz-submit').click();

  const results = page.locator('.sl-quiz-results-complete');
  await expect(results).toBeVisible();
  await expect(results.locator('.sl-quiz-results-score-value')).toHaveText('100');
});

test('reset all clears progress', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());

  const quiz = page.locator('#demo-single');
  await quiz.getByText('Mars', { exact: true }).click();
  await expect(quiz.locator('.sl-quiz-answer--correct')).toBeVisible();

  // Answer the rest so the results panel (with its reset-all button) is shown.
  await page.locator('#demo-multiple').getByText('2', { exact: true }).click();
  await page.locator('#demo-multiple').getByText('7', { exact: true }).click();
  await page.locator('#demo-multiple .sl-quiz-submit').click();
  await page.locator('#demo-blank input.sl-quiz-blank').fill('H2O');
  await page.locator('#demo-blank .sl-quiz-submit').click();
  await page.locator('#demo-feedback').getByText('JavaScript', { exact: true }).click();
  await page.locator('#demo-feedback .sl-quiz-submit').click();

  await page.locator('.sl-quiz-results-reset').click();

  await expect(quiz.locator('.sl-quiz-answer--correct')).toHaveCount(0);
  await expect(quiz.locator('input[value="1"]')).not.toBeChecked();
});
