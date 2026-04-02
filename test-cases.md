## [TC001_01] Verify AI-Likeness Score Display for AI-Generated Text
**Preconditions:** User is on the text submission page.

**Steps:**
1. Enter a known AI-generated text into the input field.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** The system displays an 'AI-likeness score' (e.g., 85/100, indicating high AI likeness).

---

## [TC001_02] Verify AI-Likeness Score Display for Human-Generated Text
**Preconditions:** User is on the text submission page.

**Steps:**
1. Enter a known human-written text into the input field.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** The system displays an 'AI-likeness score' (e.g., 15/100, indicating low AI likeness).

---

## [TC001_03] Verify Highlighting of Suspicious Sentences (AI Text)
**Preconditions:** User is on the text submission page.

**Steps:**
1. Enter a known AI-generated text with clear AI patterns into the input field.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** Suspicious sentences that exhibit AI patterns are highlighted visually (e.g., with a different background color or underline).

---

## [TC001_04] Verify Absence of Highlighting (Human Text)
**Preconditions:** User is on the text submission page.

**Steps:**
1. Enter a known human-written text into the input field.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** No sentences are highlighted as suspicious.

---

## [TC001_05] Verify Display of Analysis Metrics (Burstiness, Perplexity, Sentence Variance)
**Preconditions:** User is on the text submission page.

**Steps:**
1. Enter any valid text into the input field.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** The analysis result prominently displays metrics for burstiness, perplexity, and sentence variance with numerical values.

---

## [TC001_06] Verify Analysis for Empty Input
**Preconditions:** User is on the text submission page.

**Steps:**
1. Leave the input field empty.
2. Click 'Analyze' or 'Submit'.

**Expected Result:** An appropriate error message is displayed, indicating that text input is required.

---

## [TC002_01] Transform to 'Casual' Style
**Preconditions:** User is on the text humanization page with a text input field.

**Steps:**
1. Enter a neutral, AI-like text.
2. Select 'Casual' from the writing style options.
3. Initiate transformation.

**Expected Result:** The output text is transformed to a casual tone, using informal language, contractions, and a relaxed structure (e.g., "Hey there! How's it going?").

---

## [TC002_02] Transform to 'Professional' Style
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a casual or AI-like text.
2. Select 'Professional' from the writing style options.
3. Initiate transformation.

**Expected Result:** The output text is transformed to a professional tone, using formal language, complete sentences, and a structured approach (e.g., "We would like to inform you...").

---

## [TC002_03] Transform to 'Storytelling' Style
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a factual or AI-like text.
2. Select 'Storytelling' from the writing style options.
3. Initiate transformation.

**Expected Result:** The output text incorporates narrative elements, descriptive language, and a flowing structure suitable for storytelling (e.g., "Once upon a time...", "Imagine a world where...").

---

## [TC002_04] Transform to 'Opinionated' Style
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a neutral or AI-like text.
2. Select 'Opinionated' from the writing style options.
3. Initiate transformation.

**Expected Result:** The output text expresses strong opinions, uses subjective language, and might include argumentative phrasing (e.g., "Clearly, this is the best approach...", "It's simply unacceptable that...").

---

## [TC002_05] Transform to 'Messy Human' Style
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a polished, AI-like text.
2. Select 'Messy Human' from the writing style options.
3. Initiate transformation.

**Expected Result:** The output text includes elements of human imperfections, such as slight grammatical errors, sentence fragments, and less formal structure, making it feel less polished (e.g., "So, I went to the store. And, like, got some milk. Kinda forgot eggs though.").

---

## [TC003_01] Verify Injection of Grammar Looseness
**Preconditions:** User is on the text humanization page. An option to apply 'human imperfections' is available and selected.

**Steps:**
1. Enter a grammatically correct, AI-like text.
2. Select the 'Apply Human Imperfections' option.
3. Initiate transformation.

**Expected Result:** The output text contains subtle grammatical looseness or slight informalities (e.g., subject-verb disagreement in casual context, minor punctuation errors).

---

## [TC003_02] Verify Incorporation of Intentional Sentence Fragments
**Preconditions:** User is on the text humanization page. An option to apply 'human imperfections' is available and selected.

**Steps:**
1. Enter a text composed of full, well-structured sentences.
2. Select the 'Apply Human Imperfections' option.
3. Initiate transformation.

**Expected Result:** The output text includes intentional sentence fragments to mimic natural speech or informal writing (e.g., "Pretty good.", "Just saying.").

---

## [TC003_03] Verify Injection of Personal Bias/Micro Contradictions
**Preconditions:** User is on the text humanization page. An option to apply 'human imperfections' is available and selected.

**Steps:**
1. Enter a neutral, objective text.
2. Select the 'Apply Human Imperfections' option.
3. Initiate transformation.

**Expected Result:** The output text subtly injects personal bias, subjective opinions, or minor, non-critical contradictions (e.g., "I generally like this, though it has one small issue...", "It's great, but sometimes I find it a bit... meh.").

---

## [TC003_04] Verify Combined Imperfections
**Preconditions:** User is on the text humanization page. An option to apply 'human imperfections' is available and selected.

**Steps:**
1. Enter a standard, AI-like paragraph.
2. Select the 'Apply Human Imperfections' option.
3. Initiate transformation.

**Expected Result:** The output text exhibits a combination of slight grammar looseness, sentence fragments, and subtle biases/contradictions, making it noticeably less "perfect" than the original.

---

## [TC004_01] Personalize with General Human Experiences (Default Settings)
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a factual, impersonal text.
2. Select a "Personalize Text" option without specifying audience/platform/slider (using default or general personalization).
3. Initiate transformation.

**Expected Result:** The output text incorporates general personal elements (e.g., "I've found that...", "It feels like...", "My take on this is...").

---

## [TC004_02] Personalize for Specific Target Audience (e.g., 'Beginners')
**Preconditions:** User is on the text humanization page. Options for personalization are available.

**Steps:**
1. Enter a technical text.
2. Specify 'Beginners' as the target audience.
3. Initiate transformation.

**Expected Result:** The output text is simplified and includes personal elements relevant to beginners (e.g., "I wouldn’t recommend this for beginners," "When I first started, I struggled with this too...").

---

## [TC004_03] Personalize for Specific Platform (e.g., 'TikTok')
**Preconditions:** User is on the text humanization page. Options for personalization are available.

**Steps:**
1. Enter a factual text.
2. Specify 'TikTok' as the platform.
3. Initiate transformation.

**Expected Result:** The output text includes short, engaging, and personal remarks suitable for TikTok (e.g., "kinda frustrating tbh," "Saw this, had to share!").

---

## [TC004_04] Personalize with High 'Personality Slider' Value
**Preconditions:** User is on the text humanization page. A 'Personality Slider' (e.g., 0-100%) is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Personality Slider' to a high value (e.g., 80-100%).
3. Initiate transformation.

**Expected Result:** The output text is heavily infused with strong personal opinions, emotions, and specific experiences (e.g., "Honestly, I tried this last week and it was a total game-changer, couldn't believe it!").

---

## [TC004_05] Verify Absence of Personalization with Low 'Personality Slider' Value
**Preconditions:** User is on the text humanization page. A 'Personality Slider' (e.g., 0-100%) is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Personality Slider' to a low value (e.g., 0-10%).
3. Initiate transformation.

**Expected Result:** The output text contains minimal to no personal elements, maintaining a largely objective or neutral tone.

---

## [TC005_01] Optimize for Facebook
**Preconditions:** User is on the text humanization page. Platform selection options are available.

**Steps:**
1. Enter a neutral text.
2. Select 'Facebook' from the platform options.
3. Initiate transformation.

**Expected Result:** The output text is conversational, might include slightly longer paragraphs, uses friendly language, and possibly encourages comments or shares, typical for Facebook posts.

---

## [TC005_02] Optimize for TikTok
**Preconditions:** User is on the text humanization page. Platform selection options are available.

**Steps:**
1. Enter a neutral text.
2. Select 'TikTok' from the platform options.
3. Initiate transformation.

**Expected Result:** The output text is short, punchy, attention-grabbing, uses current internet slang/phrasing, and is suitable for a visual context, typical for TikTok captions.

---

## [TC005_03] Optimize for LinkedIn
**Preconditions:** User is on the text humanization page. Platform selection options are available.

**Steps:**
1. Enter a neutral text.
2. Select 'LinkedIn' from the platform options.
3. Initiate transformation.

**Expected Result:** The output text is professional, focused on business/career insights, uses formal or semi-formal language, and avoids overly casual or sensationalist elements, typical for LinkedIn posts.

---

## [TC005_04] Optimize for Twitter/X
**Preconditions:** User is on the text humanization page. Platform selection options are available.

**Steps:**
1. Enter a neutral text.
2. Select 'Twitter/X' from the platform options.
3. Initiate transformation.

**Expected Result:** The output text is concise, direct, uses hashtags appropriately, and respects character limits (if applied), typical for Twitter/X posts.

---

## [TC005_05] Verify Output with Multiple Platform Selections (Error/Priority)
**Preconditions:** User is on the text humanization page. Platform selection options are available.

**Steps:**
1. Enter a neutral text.
2. Attempt to select multiple conflicting platforms (e.g., Facebook and LinkedIn simultaneously).
3. Initiate transformation.

**Expected Result:** The system either prevents multiple selections, displays an error message, or clearly applies a priority rule (e.g., uses the last selected platform, or a defined default).

---

## [TC006_01] Apply Defined Favorite Phrases
**Preconditions:** User is on the text humanization page. An option to define 'writing quirks' is available.

**Steps:**
1. Enter a neutral text.
2. Define specific favorite phrases (e.g., add "lol", "ngl", "fr" to a list of quirks).
3. Initiate transformation.

**Expected Result:** The output text subtly incorporates the defined favorite phrases naturally within the content.

---

## [TC006_02] Simulate Specific Emoji Habits
**Preconditions:** User is on the text humanization page. An option to define 'writing quirks' (including emoji habits) is available.

**Steps:**
1. Enter a neutral text.
2. Configure an emoji habit (e.g., "use 😄 at the end of positive sentences", "add 🤔 to reflective statements").
3. Initiate transformation.

**Expected Result:** The output text includes emojis according to the defined habits, enriching the tone.

---

## [TC006_03] Simulate Specific Punctuation Styles
**Preconditions:** User is on the text humanization page. An option to define 'writing quirks' (including punctuation styles) is available.

**Steps:**
1. Enter a neutral text.
2. Configure a punctuation style (e.g., "excessive use of ellipses...", "frequent exclamation marks!").
3. Initiate transformation.

**Expected Result:** The output text reflects the chosen punctuation style, making it feel more unique.

---

## [TC006_04] Simulate Variations in Sentence Rhythm
**Preconditions:** User is on the text humanization page. An option to define 'writing quirks' (including sentence rhythm) is available.

**Steps:**
1. Enter a text with consistent sentence length and structure.
2. Configure a sentence rhythm variation (e.g., "mix short, punchy sentences with longer, more descriptive ones").
3. Initiate transformation.

**Expected Result:** The output text shows a noticeable variation in sentence length and structure, breaking up monotony and creating a more dynamic rhythm.

---

## [TC006_05] Apply a Combination of Writing Quirks
**Preconditions:** User is on the text humanization page. Options for defining multiple 'writing quirks' are available.

**Steps:**
1. Enter a neutral text.
2. Define a set of quirks: favorite phrases, emoji habit, and a punctuation style.
3. Initiate transformation.

**Expected Result:** The output text incorporates all defined quirks, creating a distinct and personalized "fingerprint" style.

---

## [TC007_01] Verify Increased Randomness in Phrasing (using external AI detector)
**Preconditions:** User is on the text humanization page. An option for "Evade AI Detection" is available and selected. Access to an external AI detection tool.

**Steps:**
1. Enter a known AI-generated text.
2. Select the 'Evade AI Detection' humanization option.
3. Initiate transformation.
4. Copy the output text and paste it into a reputable external AI detection tool.

**Expected Result:** The external AI detection tool reports a significantly lower probability of the output text being AI-generated compared to the original input text. The phrasing in the output text appears less predictable and more varied.

---

## [TC007_02] Verify Breaking Predictable Token Flow Patterns (linguistic analysis)
**Preconditions:** User is on the text humanization page. An option for "Evade AI Detection" is selected.

**Steps:**
1. Enter an AI-generated text that typically has predictable word choices and sequences.
2. Select the 'Evade AI Detection' option.
3. Initiate transformation.
4. Manually review the output text, or use an internal linguistic tool if available, to observe token flow.

**Expected Result:** The output text uses a wider variety of synonyms, rephrases common constructions, and avoids highly probable word sequences often found in AI-generated content, breaking predictable patterns.

---

## [TC007_03] Verify Semantic Variation
**Preconditions:** User is on the text humanization page. An option for "Evade AI Detection" is selected.

**Steps:**
1. Enter an AI-generated text with consistent terminology and phrasing.
2. Select the 'Evade AI Detection' option.
3. Initiate transformation.

**Expected Result:** The output text introduces semantic variation by using different ways to express the same or similar ideas, varying sentence structure, and perhaps introducing slight rephrasing without changing the core meaning.

---

## [TC008_01] Verify Side-by-Side Display
**Preconditions:** User has submitted text for humanization and a transformation has occurred.

**Steps:**
1. Navigate to the comparison view (or it appears automatically after transformation).

**Expected Result:** The UI displays two distinct panes, clearly labeled "Original Text" and "Humanized Text".

---

## [TC008_02] Verify Highlighting of Changes (Additions)
**Preconditions:** User has submitted text, and the humanization process added new words/phrases.

**Steps:**
1. View the side-by-side comparison.

**Expected Result:** Newly added words or phrases in the humanized text pane are clearly highlighted (e.g., green highlight).

---

## [TC008_03] Verify Highlighting of Changes (Deletions)
**Preconditions:** User has submitted text, and the humanization process removed some words/phrases.

**Steps:**
1. View the side-by-side comparison.

**Expected Result:** Removed words or phrases from the original text (or their corresponding gaps in the humanized text) are clearly indicated (e.g., red strikethrough in original pane, or empty space where it was expected).

---

## [TC008_04] Verify Highlighting of Changes (Modifications)
**Preconditions:** User has submitted text, and the humanization process modified existing words/phrases.

**Steps:**
1. View the side-by-side comparison.

**Expected Result:** Modified words or phrases are clearly highlighted, showing both the original and the new version (e.g., "original word" struck out with "new word" next to it, or distinct highlights).

---

## [TC008_05] Verify No Changes if No Humanization Applied
**Preconditions:** User has submitted text, but no humanization options were selected, resulting in identical or near-identical output.

**Steps:**
1. View the side-by-side comparison.

**Expected Result:** The original and humanized text panes are displayed, but no highlights for changes are present, or a message indicates no significant changes were made.

---

## [TC009_01] Adjust Slider to 0% (Robotic Neutral)
**Preconditions:** User is on the text humanization page. An 'Emotional Depth' slider is available.

**Steps:**
1. Enter a text with some potential for emotion.
2. Set the 'Emotional Depth' slider to 0% (robotic neutral).
3. Initiate transformation.

**Expected Result:** The output text is devoid of strong emotional language, remaining objective, factual, and neutral in tone.

---

## [TC009_02] Adjust Slider to 50% (Moderate Emotion)
**Preconditions:** User is on the text humanization page. An 'Emotional Depth' slider is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Emotional Depth' slider to approximately 50%.
3. Initiate transformation.

**Expected Result:** The output text incorporates a moderate level of emotional expression, subtle sentiment, or empathetic phrasing, but avoids extreme language.

---

## [TC009_03] Adjust Slider to 100% (Highly Emotional/Rant)
**Preconditions:** User is on the text humanization page. An 'Emotional Depth' slider is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Emotional Depth' slider to 100% (emotional/storytelling/rant).
3. Initiate transformation.

**Expected Result:** The output text is highly emotional, uses strong adjectives, expresses clear sentiment (e.g., excitement, frustration, passion), and might adopt a storytelling or rant-like tone.

---

## [TC009_04] Verify Gradual Change with Incremental Slider Adjustments
**Preconditions:** User is on the text humanization page. An 'Emotional Depth' slider is available.

**Steps:**
1. Enter a neutral text.
2. Adjust the 'Emotional Depth' slider incrementally (e.g., 20%, 40%, 60%, 80%).
3. Observe the output text after each adjustment.

**Expected Result:** The emotional tone of the output text visibly and gradually increases or decreases with each incremental slider adjustment, reflecting a smooth transition in emotional depth.

---

## [TC010_01] Verify Injection of Hesitation Phrases
**Preconditions:** User is on the text humanization page. An option to inject 'subtle human signals' is available and selected.

**Steps:**
1. Enter a direct, assertive text.
2. Select the 'Inject Human Signals' option.
3. Initiate transformation.

**Expected Result:** The output text incorporates phrases like "kind of," "maybe," "I guess," "sort of," or similar expressions to simulate human hesitation.

---

## [TC010_02] Verify Injection of Correction/Tone Shift Phrases
**Preconditions:** User is on the text humanization page. An option to inject 'subtle human signals' is available and selected.

**Steps:**
1. Enter a consistent, straightforward text.
2. Select the 'Inject Human Signals' option.
3. Initiate transformation.

**Expected Result:** The output text includes phrases indicating a correction, rephrasing, or slight tone shift, such as "actually," "wait," "on second thought," or "let me rephrase that."

---

## [TC010_03] Verify Combined Hesitation and Correction Signals
**Preconditions:** User is on the text humanization page. An option to inject 'subtle human signals' is available and selected.

**Steps:**
1. Enter a standard paragraph.
2. Select the 'Inject Human Signals' option.
3. Initiate transformation.

**Expected Result:** The output text demonstrates a mix of hesitation phrases and correction/tone shift phrases, making the narrative feel more natural and less polished, akin to spoken language.

---

## [TC010_04] Verify Absence of Signals when Option Not Selected
**Preconditions:** User is on the text humanization page.

**Steps:**
1. Enter a text.
2. Ensure the 'Inject Human Signals' option is NOT selected.
3. Initiate transformation.

**Expected Result:** The output text does not contain explicit hesitation or correction phrases, maintaining a more direct style.

---

## [TC011_01] Rewrite from 'Beginner' Persona
**Preconditions:** User is on the text humanization page. Persona selection options are available.

**Steps:**
1. Enter a technical or complex text.
2. Select 'Beginner' as the persona.
3. Initiate transformation.

**Expected Result:** The output text is simplified, uses basic vocabulary, asks clarifying questions, and expresses a curious or learning tone, consistent with a beginner's perspective.

---

## [TC011_02] Rewrite from 'Expert' Persona
**Preconditions:** User is on the text humanization page. Persona selection options are available.

**Steps:**
1. Enter a general or slightly simplified text.
2. Select 'Expert' as the persona.
3. Initiate transformation.

**Expected Result:** The output text uses specialized vocabulary, demonstrates in-depth knowledge, offers nuanced insights, and adopts an authoritative yet informative tone, consistent with an expert's perspective.

---

## [TC011_03] Rewrite from 'Influencer' Persona
**Preconditions:** User is on the text humanization page. Persona selection options are available.

**Steps:**
1. Enter a neutral product description or factual text.
2. Select 'Influencer' as the persona.
3. Initiate transformation.

**Expected Result:** The output text is enthusiastic, uses engaging language, includes calls to action, personal anecdotes, and trendy phrasing, characteristic of an influencer.

---

## [TC011_04] Rewrite from 'Skeptic' Persona
**Preconditions:** User is on the text humanization page. Persona selection options are available.

**Steps:**
1. Enter a promotional or overly positive text.
2. Select 'Skeptic' as the persona.
3. Initiate transformation.

**Expected Result:** The output text questions claims, expresses doubt, points out potential flaws or downsides, and uses a cautious or critical tone, consistent with a skeptic.

---

## [TC011_05] Verify Persona Consistency Across Different Inputs
**Preconditions:** User is on the text humanization page. Persona selection options are available.

**Steps:**
1. Enter Text A, select 'Expert' persona, transform. Note the output.
2. Enter Text B (different topic), select 'Expert' persona, transform. Note the output.

**Expected Result:** Both Text A and Text B outputs, when transformed by the 'Expert' persona, consistently display expert-like vocabulary, tone, and viewpoint, demonstrating the persona's persistent characteristics.

---

## [TC012_01] Humanize with 'US Tone' (General)
**Preconditions:** User is on the text humanization page. Cultural tone selection options are available.

**Steps:**
1. Enter a neutral, globally-oriented text.
2. Specify 'US Tone' (or American English default if implied).
3. Initiate transformation.

**Expected Result:** The output text uses common American idioms, slang (e.g., "cool," "awesome"), and references culturally relevant to a general US audience.

---

## [TC012_02] Humanize with 'Vietnamese Tone' (Slang & References)
**Preconditions:** User is on the text humanization page. Cultural tone selection options are available.

**Steps:**
1. Enter a neutral text.
2. Specify 'Vietnamese Tone'.
3. Initiate transformation.

**Expected Result:** The output text incorporates appropriate Vietnamese slang (e.g., "trời ơi", "ghệ", "đi bão") and cultural references (e.g., Tết, phở, cà phê sữa đá), while maintaining the original meaning.

---

## [TC012_03] Verify Nuance of Cultural References (e.g., US vs. UK)
**Preconditions:** User is on the text humanization page. Cultural tone selection options are available (e.g., 'US Tone', 'UK Tone').

**Steps:**
1. Enter a text that could have different cultural nuances (e.g., sports, food terms).
2. Select 'US Tone', transform.
3. Select 'UK Tone', transform.

**Expected Result:** The 'US Tone' output uses American English terms (e.g., "soccer," "fries"), while the 'UK Tone' output uses British English terms (e.g., "football," "chips"), demonstrating appropriate cultural tailoring beyond just slang.

---

## [TC012_04] Handle Non-Existent/Invalid Cultural Tone
**Preconditions:** User is on the text humanization page. Cultural tone selection options are available.

**Steps:**
1. Attempt to specify an invalid or unsupported cultural tone (e.g., "Martian Tone").

**Expected Result:** The system prevents selection, displays an error message, or defaults to a general tone, indicating the input is not recognized.

---

## [TC013_01] Apply 'Make it Sound Human' One-Click Mode
**Preconditions:** User is on the text humanization page. 'One-click modes' are available.

**Steps:**
1. Enter a known AI-generated text.
2. Click the 'Make it Sound Human' one-click mode.

**Expected Result:** The output text is transformed, exhibiting characteristics of human writing (e.g., varied sentence structure, natural phrasing, less formal tone), making it less robotic without requiring further user adjustments.

---

## [TC013_02] Apply 'Make it Viral' One-Click Mode
**Preconditions:** User is on the text humanization page. 'One-click modes' are available.

**Steps:**
1. Enter a neutral, informational text.
2. Click the 'Make it Viral' one-click mode.

**Expected Result:** The output text is transformed to include elements that encourage sharing and engagement (e.g., strong hooks, curiosity gaps, emotional triggers, clear CTAs - potentially combining elements from US018).

---

## [TC013_03] Apply 'Make it Controversial' One-Click Mode
**Preconditions:** User is on the text humanization page. 'One-click modes' are available.

**Steps:**
1. Enter a neutral or generally accepted factual text.
2. Click the 'Make it Controversial' one-click mode.

**Expected Result:** The output text is transformed to include statements that challenge norms, express strong opinions, or use provocative language designed to spark debate or disagreement.

---

## [TC013_04] Apply 'Make it Relatable' One-Click Mode
**Preconditions:** User is on the text humanization page. 'One-click modes' are available.

**Steps:**
1. Enter a formal or academic text.
2. Click the 'Make it Relatable' one-click mode.

**Expected Result:** The output text is transformed to use simpler language, incorporate common experiences, and express ideas in a way that resonates with a broad audience, fostering empathy or understanding.

---

## [TC013_05] Verify No Further User Input Required
**Preconditions:** User is on the text humanization page. 'One-click modes' are available.

**Steps:**
1. Select any one-click mode (e.g., 'Make it sound human').
2. Observe the interaction.

**Expected Result:** The text transformation begins immediately upon clicking the mode, and no additional prompts, sliders, or selections are required from the user to initiate the process.

---

## [TC014_01] Verify Red Underline for Robotic Sentences
**Preconditions:** User has submitted an AI-generated text containing identifiable robotic sentences for analysis.

**Steps:**
1. View the analyzed text.

**Expected Result:** Sentences identified as AI-like are visibly highlighted, for example, with a red underline.

---

## [TC014_02] Verify Suggestion Display on Hover
**Preconditions:** User has submitted AI-generated text. Robotic sentences are underlined.

**Steps:**
1. Hover the mouse cursor over a red-underlined robotic sentence.

**Expected Result:** A tooltip or pop-up appears, displaying a suggested human alternative for the hovered sentence. The suggestion is grammatically correct and sounds more natural.

---

## [TC014_03] Verify Suggestion Display on Click
**Preconditions:** User has submitted AI-generated text. Robotic sentences are underlined.

**Steps:**
1. Click on a red-underlined robotic sentence.

**Expected Result:** A suggestion for a more human alternative is displayed, possibly within an editable field or a clear pop-up.

---

## [TC014_04] Verify No Underlining for Human-Like Text
**Preconditions:** User has submitted a known human-written text that is not AI-like.

**Steps:**
1. View the analyzed text.

**Expected Result:** No sentences are underlined in red, indicating no robotic patterns were detected.

---

## [TC014_05] Verify Multiple Suggestions for Complex Sentences (if applicable)
**Preconditions:** User has submitted AI-generated text. Robotic sentences are underlined. The system might offer multiple suggestions.

**Steps:**
1. Hover/click on a complex robotic sentence.

**Expected Result:** If applicable, multiple distinct human alternative suggestions are presented, allowing the user to choose the best fit.

---

## [TC015_01] Verify Real-Time Update for Basic Transformation
**Preconditions:** User is on the text humanization page. A real-time preview feature is active.

**Steps:**
1. Enter a short text.
2. Select a simple humanization option (e.g., 'Casual' style).
3. Observe the output text area.

**Expected Result:** The output text in the display area updates almost immediately, showing the transformation applying as the settings are changed or after a brief processing delay (e.g., a fraction of a second).

---

## [TC015_02] Verify Real-Time Update for Slider Adjustments
**Preconditions:** User is on the text humanization page. A real-time preview feature is active.

**Steps:**
1. Enter a text.
2. Adjust a slider (e.g., 'Emotional Depth', 'Humor', 'Formality') incrementally.
3. Observe the output text area.

**Expected Result:** The output text visually changes and refines continuously as the slider is dragged, providing immediate feedback on the tonal adjustments.

---

## [TC015_03] Verify Performance with Longer Texts (Perceivable Delay)
**Preconditions:** User is on the text humanization page. A real-time preview feature is active.

**Steps:**
1. Enter a long text (e.g., several paragraphs).
2. Apply a humanization setting or adjust a slider.
3. Observe the output text area.

**Expected Result:** While there might be a very slight delay for longer texts, the transformation process should still be perceivable and complete within a few seconds, not causing significant frustration. The UI should not freeze.

---

## [TC015_04] Verify UI Responsiveness During Real-Time Updates
**Preconditions:** User is on the text humanization page. A real-time preview feature is active.

**Steps:**
1. Enter text and apply a humanization setting.
2. While the text is transforming, attempt to interact with other UI elements (e.g., click another option, type more text).

**Expected Result:** The UI remains responsive during the transformation. Other elements can be interacted with, or the system queues updates gracefully without freezing the interface.

---

## [TC016_01] Adjust 'Humor' Slider (Low to High)
**Preconditions:** User is on the text humanization page. 'Humor' slider is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Humor' slider to 0% (no humor). Observe output.
3. Set the 'Humor' slider to 100% (high humor). Observe output.

**Expected Result:** The output text initially remains serious/neutral. When set to 100%, it incorporates jokes, witty remarks, or lighthearted phrasing.

---

## [TC016_02] Adjust 'Formality' Slider (Low to High)
**Preconditions:** User is on the text humanization page. 'Formality' slider is available.

**Steps:**
1. Enter a neutral text.
2. Set the 'Formality' slider to 0% (informal). Observe output.
3. Set the 'Formality' slider to 100% (highly formal). Observe output.

**Expected Result:** The output text initially becomes casual with contractions and simple syntax. When set to 100%, it uses formal vocabulary, complex sentence structures, and a polite tone.

---

## [TC016_03] Adjust 'Emotion' Slider (Low to High)
**Preconditions:** User is on the text humanization page. 'Emotion' slider is available (potentially overlapping with US009, but US016 refers to a general 'emotion' slider alongside humor and formality).

**Steps:**
1. Enter a neutral text.
2. Set the 'Emotion' slider to 0% (neutral/objective). Observe output.
3. Set the 'Emotion' slider to 100% (highly emotional). Observe output.

**Expected Result:** The output text initially remains objective. When set to 100%, it expresses strong feelings, uses emotive language, and conveys a passionate or dramatic tone.

---

## [TC016_04] Combine Slider Adjustments (e.g., High Humor, Low Formality)
**Preconditions:** User is on the text humanization page. All three sliders are available.

**Steps:**
1. Enter a neutral text.
2. Set 'Humor' to High, 'Formality' to Low, 'Emotion' to Medium.
3. Initiate transformation.

**Expected Result:** The output text is transformed to be funny and informal, with a moderate emotional resonance, reflecting the combined effect of the slider settings.

---

## [TC016_05] Verify Dynamic Change with Slider Interaction
**Preconditions:** User is on the text humanization page. All three sliders are available.

**Steps:**
1. Enter a text.
2. Drag each slider back and forth individually.
3. Observe the output text.

**Expected Result:** The tone of the output text (humor, formality, emotion) dynamically updates in real-time or near real-time as each slider is adjusted.

---

## [TC017_01] Verify 'Human Score' Display for Highly Humanized Text
**Preconditions:** User has submitted text and applied extensive humanization options (e.g., style, imperfections, quirks, high emotional depth).

**Steps:**
1. View the results after humanization.

**Expected Result:** A 'Human Score' (e.g., 80-100/100) is prominently displayed, indicating a high level of human-likeness.

---

## [TC017_02] Verify 'Human Score' Display for Minimally Humanized Text
**Preconditions:** User has submitted text and applied minimal or no humanization options.

**Steps:**
1. View the results after processing.

**Expected Result:** A 'Human Score' (e.g., 0-30/100) is displayed, indicating a low level of human-likeness.

---

## [TC017_03] Verify 'AI Detectability' for Evaded Text
**Preconditions:** User has applied the 'Evade AI Detection' humanization option (US007).

**Steps:**
1. View the results after humanization.

**Expected Result:** The 'AI Detectability' is indicated as 'Low', suggesting the text is difficult for AI detectors to flag.

---

## [TC017_04] Verify 'AI Detectability' for Non-Evaded AI Text
**Preconditions:** User submitted a known AI-generated text without applying 'Evade AI Detection'.

**Steps:**
1. View the results after processing.

**Expected Result:** The 'AI Detectability' is indicated as 'High', suggesting the text is easily detectable as AI.

---

## [TC017_05] Verify 'Engagement Potential' for Viral Text (US018 linkage)
**Preconditions:** User has applied humanization options geared towards virality (e.g., 'Make it Viral' one-click mode, US018).

**Steps:**
1. View the results after humanization.

**Expected Result:** The 'Engagement Potential' is rated as 'High', reflecting the content's potential for user interaction and sharing.

---

## [TC017_06] Verify 'Engagement Potential' for Neutral/Low-Engagement Text
**Preconditions:** User has applied minimal humanization or a style not aimed at high engagement (e.g., 'Professional' for a niche audience).

**Steps:**
1. View the results after humanization.

**Expected Result:** The 'Engagement Potential' is rated as 'Moderate' or 'Low', reflecting the content's expected level of user interaction.

---

## [TC018_01] Verify Engaging Hook in Output Text
**Preconditions:** User is on the text humanization page. The 'Optimize for Facebook' and/or 'Make it Viral' options are selected.

**Steps:**
1. Enter a neutral informational text.
2. Apply humanization for viral Facebook potential.

**Expected Result:** The output text starts with an engaging hook designed to capture immediate attention (e.g., "You won't believe what happened next...", "This is the one thing no one tells you about...").

---

## [TC018_02] Verify Curiosity Gap in Output Text
**Preconditions:** User is on the text humanization page. The 'Optimize for Facebook' and/or 'Make it Viral' options are selected.

**Steps:**
1. Enter a neutral informational text.
2. Apply humanization for viral Facebook potential.

**Expected Result:** The output text includes phrasing that creates a "curiosity gap," making the reader want to continue reading to find out more (e.g., "The secret to this isn't what you think...", "Why this simple change changed everything...").

---

## [TC018_03] Verify Utilization of Emotional Triggers
**Preconditions:** User is on the text humanization page. The 'Optimize for Facebook' and/or 'Make it Viral' options are selected.

**Steps:**
1. Enter a neutral informational text.
2. Apply humanization for viral Facebook potential.

**Expected Result:** The output text uses language that evokes strong emotions (e.g., joy, anger, surprise, empathy) to increase reader engagement and sharing.

---

## [TC018_04] Verify Clear Call to Action (CTA)
**Preconditions:** User is on the text humanization page. The 'Optimize for Facebook' and/or 'Make it Viral' options are selected.

**Steps:**
1. Enter a neutral informational text.
2. Apply humanization for viral Facebook potential.

**Expected Result:** The output text concludes with a clear and concise Call to Action (e.g., "Share your thoughts below!", "Tag a friend who needs this!", "Click the link in bio to learn more!").

---

## [TC018_05] Verify Combination of All Viral Elements
**Preconditions:** User is on the text humanization page. The 'Optimize for Facebook' and/or 'Make it Viral' options are selected.

**Steps:**
1. Enter a neutral story idea or factual statement.
2. Apply humanization for viral Facebook potential.

**Expected Result:** The output text successfully combines an engaging hook, a curiosity gap, emotional triggers, and a clear CTA, creating a post highly optimized for Facebook virality.