import { BLANK_PATTERN } from './parse.ts';
import type { ManifestAnswer, QuizManifestEntry } from './manifest.ts';

/** Supported QTI specification versions. */
export type QtiVersion = '1.2' | '2.1';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function choiceId(index: number): string {
  return `choice_${index}`;
}

/** Replace `[[answer]]` tokens in a question with a placeholder, returning the answers. */
function splitBlanks(question: string): { text: (string | number)[]; answers: string[] } {
  const text: (string | number)[] = [];
  const answers: string[] = [];
  let last = 0;
  BLANK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLANK_PATTERN.exec(question)) !== null) {
    if (match.index > last) text.push(question.slice(last, match.index));
    text.push(answers.length); // index of the blank
    answers.push((match[1] ?? '').trim());
    last = match.index + match[0].length;
  }
  if (last < question.length) text.push(question.slice(last));
  return { text, answers };
}

// --- QTI 2.1 ---------------------------------------------------------------

function qti21Choice(quiz: QuizManifestEntry, answers: ManifestAnswer[]): string {
  const multiple = quiz.type === 'multiple';
  const correct = answers.map((a, i) => [a, i] as const).filter(([a]) => a.correct).map(([, i]) => choiceId(i));
  const choices = answers.map((a, i) => `      <simpleChoice identifier="${choiceId(i)}">${esc(a.text)}</simpleChoice>`);
  return `  <responseDeclaration identifier="RESPONSE" cardinality="${multiple ? 'multiple' : 'single'}" baseType="identifier">
    <correctResponse>
${correct.map((id) => `      <value>${id}</value>`).join('\n')}
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"><defaultValue><value>0</value></defaultValue></outcomeDeclaration>
  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="${multiple ? 0 : 1}">
      <prompt>${esc(quiz.question)}</prompt>
${choices.join('\n')}
    </choiceInteraction>
  </itemBody>
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>`;
}

function qti21Blank(quiz: QuizManifestEntry): string {
  const { text, answers } = splitBlanks(quiz.question);
  const declarations = answers
    .map(
      (answer, i) =>
        `  <responseDeclaration identifier="RESPONSE_${i + 1}" cardinality="single" baseType="string"><correctResponse><value>${esc(answer)}</value></correctResponse></responseDeclaration>`,
    )
    .join('\n');
  const body = text
    .map((part) =>
      typeof part === 'number'
        ? `<textEntryInteraction responseIdentifier="RESPONSE_${part + 1}" expectedLength="${Math.max(answers[part]?.length ?? 8, 8)}"/>`
        : esc(part),
    )
    .join('');
  const matches = answers
    .map((_, i) => `        <match><variable identifier="RESPONSE_${i + 1}"/><correct identifier="RESPONSE_${i + 1}"/></match>`)
    .join('\n');
  return `${declarations}
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"><defaultValue><value>0</value></defaultValue></outcomeDeclaration>
  <itemBody>
    <p>${body}</p>
  </itemBody>
  <responseProcessing>
    <responseCondition>
      <responseIf>
        <and>
${matches}
        </and>
        <setOutcomeValue identifier="SCORE"><baseValue baseType="float">1</baseValue></setOutcomeValue>
      </responseIf>
    </responseCondition>
  </responseProcessing>`;
}

function toQti21(quiz: QuizManifestEntry): string {
  const inner = quiz.type === 'blank' ? qti21Blank(quiz) : qti21Choice(quiz, quiz.answers ?? []);
  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd" identifier="${esc(quiz.id)}" title="${esc(quiz.title ?? quiz.id)}" adaptive="false" timeDependent="false">
${inner}
</assessmentItem>
`;
}

// --- QTI 1.2 ---------------------------------------------------------------

function qti12Choice(quiz: QuizManifestEntry, answers: ManifestAnswer[]): string {
  const multiple = quiz.type === 'multiple';
  const labels = answers
    .map(
      (a, i) =>
        `          <response_label ident="${choiceId(i)}"><material><mattext texttype="text/plain">${esc(a.text)}</mattext></material></response_label>`,
    )
    .join('\n');
  const conditions = answers
    .map((a, i) =>
      a.correct
        ? `        <varequal respident="RESPONSE">${choiceId(i)}</varequal>`
        : `        <not><varequal respident="RESPONSE">${choiceId(i)}</varequal></not>`,
    )
    .join('\n');
  return `    <presentation>
      <material><mattext texttype="text/plain">${esc(quiz.question)}</mattext></material>
      <response_lid ident="RESPONSE" rcardinality="${multiple ? 'Multiple' : 'Single'}">
        <render_choice shuffle="No">
${labels}
        </render_choice>
      </response_lid>
    </presentation>
    <resprocessing>
      <outcomes><decvar vartype="Decimal" defaultval="0" minvalue="0" maxvalue="1"/></outcomes>
      <respcondition continue="No">
        <conditionvar>
          <and>
${conditions}
          </and>
        </conditionvar>
        <setvar action="Set" varname="SCORE">1</setvar>
      </respcondition>
    </resprocessing>`;
}

function qti12Blank(quiz: QuizManifestEntry): string {
  const { text, answers } = splitBlanks(quiz.question);
  const prompt = text.map((part) => (typeof part === 'number' ? '______' : part)).join('');
  const responses = answers
    .map(
      (_, i) =>
        `      <response_str ident="RESPONSE_${i + 1}"><render_fib><response_label ident="A_${i + 1}"/></render_fib></response_str>`,
    )
    .join('\n');
  const conditions = answers
    .map(
      (answer, i) =>
        `          <varequal respident="RESPONSE_${i + 1}" case="No">${esc(answer)}</varequal>`,
    )
    .join('\n');
  return `    <presentation>
      <material><mattext texttype="text/plain">${esc(prompt)}</mattext></material>
${responses}
    </presentation>
    <resprocessing>
      <outcomes><decvar vartype="Decimal" defaultval="0" minvalue="0" maxvalue="1"/></outcomes>
      <respcondition continue="No">
        <conditionvar>
          <and>
${conditions}
          </and>
        </conditionvar>
        <setvar action="Set" varname="SCORE">1</setvar>
      </respcondition>
    </resprocessing>`;
}

function toQti12(quiz: QuizManifestEntry): string {
  const inner = quiz.type === 'blank' ? qti12Blank(quiz) : qti12Choice(quiz, quiz.answers ?? []);
  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop>
  <item ident="${esc(quiz.id)}" title="${esc(quiz.title ?? quiz.id)}">
${inner}
  </item>
</questestinterop>
`;
}

/** Render a single quiz as a QTI assessment item in the requested version. */
export function toQtiItem(quiz: QuizManifestEntry, version: QtiVersion): string {
  return version === '2.1' ? toQti21(quiz) : toQti12(quiz);
}

/** Build the `imsmanifest.xml` for an IMS Content Package of QTI items. */
export function buildImsManifest(items: { identifier: string; href: string }[], version: QtiVersion): string {
  const type =
    version === '2.1' ? 'imsqti_item_xmlv2p1' : 'imsqti_xmlv1p2';
  const resources = items
    .map(
      (item) =>
        `    <resource identifier="${esc(item.identifier)}" type="${type}" href="${esc(item.href)}"><file href="${esc(item.href)}"/></resource>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="starlight-quiz-export" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1">
  <organizations/>
  <resources>
${resources}
  </resources>
</manifest>
`;
}
