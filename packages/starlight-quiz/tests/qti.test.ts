import { describe, expect, it } from 'vitest';

import type { QuizManifestEntry } from '../lib/manifest';
import { buildImsManifest, toQtiItem } from '../lib/qti';

const single: QuizManifestEntry = {
  id: 's',
  title: 'Single',
  type: 'single',
  page: '/',
  question: 'Pick B?',
  answers: [
    { text: 'A', correct: false },
    { text: 'B', correct: true },
  ],
};

const multiple: QuizManifestEntry = {
  id: 'm',
  type: 'multiple',
  page: '/',
  question: 'Pick A and C?',
  answers: [
    { text: 'A', correct: true },
    { text: 'B', correct: false },
    { text: 'C', correct: true },
  ],
};

const blank: QuizManifestEntry = {
  id: 'b',
  type: 'blank',
  page: '/',
  question: 'Water is [[H2O]] and salt is [[NaCl]].',
  blanks: ['H2O', 'NaCl'],
};

describe('QTI 2.1', () => {
  it('renders a single-choice item with one correct identifier', () => {
    const xml = toQtiItem(single, '2.1');
    expect(xml).toContain('imsqti_v2p1');
    expect(xml).toContain('cardinality="single"');
    expect(xml).toContain('maxChoices="1"');
    expect(xml).toContain('<value>choice_1</value>');
    expect(xml).toContain('<simpleChoice identifier="choice_1">B</simpleChoice>');
  });

  it('renders a multiple-choice item with all correct identifiers', () => {
    const xml = toQtiItem(multiple, '2.1');
    expect(xml).toContain('cardinality="multiple"');
    expect(xml).toContain('maxChoices="0"');
    expect(xml).toContain('<value>choice_0</value>');
    expect(xml).toContain('<value>choice_2</value>');
  });

  it('renders a fill-in-the-blank item with a text entry per blank', () => {
    const xml = toQtiItem(blank, '2.1');
    expect(xml).toContain('responseIdentifier="RESPONSE_1"');
    expect(xml).toContain('responseIdentifier="RESPONSE_2"');
    expect(xml).toContain('<value>H2O</value>');
    expect(xml).toContain('<value>NaCl</value>');
    expect(xml).toContain('<and>');
  });
});

describe('QTI 1.2', () => {
  it('renders a single-choice item', () => {
    const xml = toQtiItem(single, '1.2');
    expect(xml).toContain('<questestinterop>');
    expect(xml).toContain('rcardinality="Single"');
    expect(xml).toContain('<varequal respident="RESPONSE">choice_1</varequal>');
    expect(xml).toContain('<not><varequal respident="RESPONSE">choice_0</varequal></not>');
  });

  it('renders multiple choice with Multiple cardinality', () => {
    expect(toQtiItem(multiple, '1.2')).toContain('rcardinality="Multiple"');
  });

  it('renders case-insensitive blanks', () => {
    const xml = toQtiItem(blank, '1.2');
    expect(xml).toContain('<varequal respident="RESPONSE_1" case="No">H2O</varequal>');
    expect(xml).toContain('<varequal respident="RESPONSE_2" case="No">NaCl</varequal>');
  });
});

describe('escaping', () => {
  it('escapes XML metacharacters in questions and answers', () => {
    const xml = toQtiItem(
      { id: 'x', type: 'single', page: '/', question: 'a < b & "c"', answers: [{ text: '<i>', correct: true }] },
      '2.1',
    );
    expect(xml).toContain('a &lt; b &amp; &quot;c&quot;');
    expect(xml).toContain('&lt;i&gt;');
  });
});

describe('buildImsManifest', () => {
  it('lists each item as a resource with the version type', () => {
    const xml = buildImsManifest([{ identifier: 's', href: 's.xml' }], '2.1');
    expect(xml).toContain('imsqti_item_xmlv2p1');
    expect(xml).toContain('href="s.xml"');
  });
});
