# Round-2 Arabic copy and typesetting specification

**Status:** copy specification only; no revised pixels reviewed or approved

**Scope:** candidates `01`, `02`, `03`, `04`, `06`, `09`, `10`, and `11`

**Language:** Modern Standard Arabic, Arabic-first, RTL

## Global production rules

- Set the Arabic export document and main canvas to `lang="ar"` and `dir="rtl"`.
- Treat every line shown below as authored. Do not auto-wrap display copy. If a line does not fit, recompose the layout; do not shrink the whole hierarchy.
- Use the renderer's approved Ghroob Arabic files only after their exact weight and load state are verified. Bind every Arabic role, including metadata, to that family; never apply the Latin `.micro` role or accept browser fallback for Arabic.
- Apply no letter spacing to connected Arabic. Use size, weight, color, and placement for emphasis.
- Preserve Arabic punctuation: `،` and `؟`. Keep punctuation attached to its phrase.
- Use Arabic-Indic numerals in Arabic metadata: `٠١`, `٠٢`, and so on.
- Write carousel counters as `١ من ٣`, `٢ من ٣`, and `٣ من ٣` in one explicit RTL run. Do not use an unisolated slash counter.
- Isolate Latin technical names such as `RAG` with a dedicated LTR directional span. Do not let surrounding punctuation enter that span.
- Position process arrows and stages explicitly in the composition. Do not depend on Unicode bidi reordering to choose arrow direction.
- Preserve every diacritic shown in the final strings. Critical readings include `تُسلِّم`, `تُصلِح`, `حدِّد`, and `وثِّق`; do not add full vocalization. Confirm all marks are present and unclipped in the final raster.
- Critical evidence and capability boundaries must appear in readable Arabic. Optional English may be subordinate; it must not carry meaning absent from the Arabic.

## 01 — Context handoff

Metadata:

```text
منظومة، لا مجرّد أداة · ٠١
```

Headline:

```text
لا تحتاج شركتك
إلى مزيد من الأدوات
```

Support:

```text
بل تحتاج إلى سياق يظلّ متصلًا
من القرار إلى التنفيذ.
```

Typesetting notes:

- The headline is two lines; keep `إلى مزيد من الأدوات` intact.
- The support is a separate second beat and must remain readable at `324×405`.
- Use a verified Arabic metadata role or omit the metadata.

Avoid:

- `أدوات أكثر` as the final cover wording.
- Dropping `بل`, which weakens the contrast between the two statements.
- Reintroducing tiny fallback metadata.

## 02 — RAG evidence archive

Metadata:

```text
RAG · مسار الدليل · ٠٢
```

Render `RAG` as an isolated LTR run; keep the Arabic phrase and number in RTL.

Headline:

```text
الإجابة وحدها
لا تكفي
```

Support:

```text
المهم أن تعود
ومعها أدلّتها.
```

Arabic process label, if retained:

```text
اسأل ← استرجع ← وثِّق
```

Place the three Arabic verbs as separate RTL stages moving physically from right to left; do not typeset the arrows as one exporter-dependent bidi string.

Technical expansion, only if needed in caption or a readable third role:

```text
التوليد المعزّز بالاسترجاع
```

Typesetting notes:

- Keep `الإجابة وحدها` together. `وحدها` must never become an orphan line.
- Keep the support clear of the archive edge and high-frequency shelving detail.
- The Arabic headline remains primary even when `RAG` appears.

Avoid:

- `ليست الإجابة / وحدها`.
- `الاسترجاع المعزّز بالمصادر` as an expansion of `RAG`.
- An English-only `ASK → RETRIEVE → CITE` evidence line.

## 03 — Automation relay

Metadata:

```text
سلوك، لا تميمة · ٠٣
```

Headline:

```text
الأتمتة الموثوقة
تُسلِّم المسؤولية بوضوح
```

Capability boundary:

```text
خطوة محددة · انتقال واضح · إيقاف ممكن
```

Typesetting notes:

- Retain the selective vocalization in `تُسلِّم` so the verb cannot be mistaken for another form.
- The capability boundary is required Arabic content, not disposable footer metadata.
- If the full boundary cannot remain readable on one line, use two balanced groups:

```text
خطوة محددة · انتقال واضح
إيقاف ممكن
```

Avoid:

- Unvocalized `تسلم المسؤولية`.
- Making the capability boundary English-only.
- `ولا تتظاهر بالسحر.`; it is not idiomatic enough for the final Arabic.

## 04 — Decision question

Metadata:

```text
ملاحظة ميدانية · ٠٤
```

Headline:

```text
الأتمتة لا تُصلِح
قرارًا غامضًا
```

Support:

```text
حدِّد القرار قبل أن تبني المسار.
```

Typesetting notes:

- Keep `لا تُصلِح` and its subject on the first line; keep the complete object on the second.
- Preserve the damma and kasra in `تُصلِح` and the shadda/kasra in `حدِّد`.
- The Arabic question mark may remain a compositional object, but it does not replace the punctuation and meaning of the sentence.

Avoid:

- `الأتمتة / لا تصلح / قراراً غامضاً`.
- Leaving `تصلح` unvocalized in this construction.
- Adding a second unrelated punctuation dot or decorative circle.

## 06 — Four places to one path

Metadata:

```text
نمط تشغيلي · ٠٦
```

Right-hand state:

```text
٤
أماكن لتعرف
ما الذي حدث
```

Left-hand state:

```text
١
مسار يريك
الخطوة التالية
```

Qualification:

```text
مثال توضيحي · وليس من نتائج عملائنا
```

Direction notes:

- The physical transition must run from the `٤` state on the right to the `١` state on the left.
- Isolate each large numeral in its own stable span or vector object; do not let paragraph direction reorder the comparison.
- The qualification must remain legible at mobile size.

Avoid:

- `ما التالي`.
- `ليس نتيجة عميل`.
- Any arrow pointing from `١` toward `٤`.

## 09 — Carousel 1 of 3: locate the decision

Metadata:

```text
قبل الأتمتة · ١ من ٣
```

Headline:

```text
قبل أن تؤتمت،
اسأل: أين القرار؟
```

Mechanism caption:

```text
القرار الذي يغيّر سير العمل
```

Typesetting notes:

- Keep the Arabic comma attached to `تؤتمت،`.
- Keep `اسأل: أين القرار؟` as one line.
- The mechanism caption is supporting evidence and must remain readable without zooming.

Avoid:

- `١ / ٣` without explicit directional isolation.
- `حالة العمل` for a general business audience unless a technical state-machine meaning is intentional.
- Using a plus-like symbol whose meaning depends entirely on the caption.

## 10 — Carousel 2 of 3: inputs, outputs, and boundaries

Metadata:

```text
قبل الأتمتة · ٢ من ٣
```

Right input panel:

```text
ما الذي
يدخل؟
```

Required input evidence:

```text
طلب جديد
```

Left output panel:

```text
ما الذي
يخرج؟
```

Required output evidence:

```text
ملف مراجعة موثّق
```

Headline:

```text
حدِّد المدخلات والمخرجات
قبل أن تبني المسار
```

Typesetting notes:

- Compose the process as right input → center boundary → left output.
- Preserve the shadda/kasra in `حدِّد`.
- Keep `طلب جديد` and `ملف مراجعة موثّق` subordinate to the questions but readable at mobile size; they are the concrete transformation evidence.
- Keep both question marks attached and optically aligned inside their panels.

Avoid:

- An unisolated `٢ / ٣` counter.
- `سمِّ الحدود` or `عرّف حدود النظام` as the final line; both are less concrete for this general business audience.
- Empty input/output panels with no concept-specific evidence.

## 11 — Carousel 3 of 3: human stop

Metadata:

```text
قبل الأتمتة · ٣ من ٣
```

Headline:

```text
ومن المسؤول
عن إيقاف النظام؟
```

Mechanism callout:

```text
نقطة إيقاف بشرية
```

Support:

```text
الموثوقية تبدأ
حين يستطيع الإنسان إيقاف النظام.
```

Typesetting notes:

- The opening `و` is intentional because this is the final carousel step; omit it only if the slide must stand alone.
- Keep `عن إيقاف النظام؟` and `حين يستطيع الإنسان إيقاف النظام.` intact as authored lines.
- The callout must be large enough to function as evidence, not decorative annotation.
- The physical sequence must enter from the right, move left, and stop at the human control. Do not preserve the current left-to-right implication.

Avoid:

- `صلاحية إيقاف واضحة`.
- `ومن يوقف / النظام؟`; the break strands the object and weakens the question.
- An unisolated `٣ / ٣` counter.
- A static toggle-like form that does not visibly interrupt a process.

## Re-review trigger

Any change to these strings, line breaks, font files, weight, direction handling, counters, or rendered pixels requires new original, mobile, and feed renders with new hashes. This document does not approve any future render.
