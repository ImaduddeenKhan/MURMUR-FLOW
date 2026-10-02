import { groqService } from './groqService.js';
import { geminiService } from './geminiService.js';
import { storage } from './storageService.js';

export class ZeroEditEngine {
  /**
   * Check if the spoken text triggers any user snippets.
   */
  checkSnippets(text) {
    const snippets = storage.getSnippets();
    const lower = text.toLowerCase().trim();

    for (const snippet of snippets) {
      const trigger = snippet.trigger.toLowerCase().trim();
      // Match exact or trigger phrase embedded in speech
      if (lower === trigger || lower.includes(`insert ${trigger}`) || lower.includes(trigger)) {
        return {
          matched: true,
          snippet
        };
      }
    }
    return { matched: false };
  }

  /**
   * Build the specialized prompt based on active tone, app name, and user dictionary.
   */
  buildSystemPrompt(options = {}) {
    const tone = options.tone || storage.getSettings().defaultTone || 'casual';
    const appName = options.appName || 'General';
    const dictionary = storage.getDictionary().map(d => d.word);

    let toneInstruction = '';
    switch (tone) {
      case 'casual':
        toneInstruction = `Tone: Casual, natural, concise for messaging apps (Slack, Discord, WhatsApp). Keep informal phrasing where appropriate, but strip verbal clutter.`;
        break;
      case 'formal':
        toneInstruction = `Tone: Professional, well-structured, polished for business emails (Gmail, Outlook). Use complete sentences, proper capitalization, and email paragraphing.`;
        break;
      case 'executive':
        toneInstruction = `Tone: Executive Leadership. Ultra-crisp, high-impact, decisive tone. Start directly with the core message or decision, eliminate pleasantries, and highlight bottom-line impact.`;
        break;
      case 'code':
        toneInstruction = `Tone: Developer & Technical (VS Code, Cursor, Windsurf, Terminal). 
- Preserve programming terms, camelCase (e.g. "user profile" -> "userProfile" when indicated), snake_case, CLI flags (--verbose, -rf), and wrap code identifiers in backticks.
- Understand developer tool names (Supabase, Vercel, Docker, Git, Next.js, PyTorch).`;
        break;
      case 'bullet':
        toneInstruction = `Tone: Structured Bullet Points. Break key points into clean, readable Markdown bullet lists with clear bold headings if multi-topic.`;
        break;
      case 'standup':
        toneInstruction = `Tone: Daily Engineering Standup. Format speech into clear sections:
**Yesterday:** What was accomplished
**Today:** What is in progress
**Blockers:** Any impediments (or None)`;
        break;
      case 'social':
        toneInstruction = `Tone: High-Engagement LinkedIn / Social Post.
- Hook in the first line that grabs attention.
- Clean 1-2 sentence paragraphs with whitespace.
- Bullet points for key takeaways.
- Conclude with an engaging question and 3 relevant hashtags.`;
        break;
      case 'prompt':
        toneInstruction = `Tone: Meta Prompt Engineering Optimizer.
Transform the spoken brain-dump into a production-grade, highly structured LLM prompt featuring:
- Role & Objective
- Detailed Context & Constraints
- Step-by-Step Instructions
- Expected Output Format & Examples`;
        break;
      case 'support':
        toneInstruction = `Tone: Customer Support & Client Success. Warm, deeply empathetic, highly courteous, with numbered step-by-step guidance and reassurance.`;
        break;
      case 'academic':
        toneInstruction = `Tone: Scholarly & Academic. Formal vocabulary, objective third-person analysis, clear logical transitions.`;
        break;
      case 'translate_es':
        toneInstruction = `Tone: Accurate, natural Spanish translation. Translate the spoken input into fluent Spanish while removing all filler words and stutters.`;
        break;
      case 'translate_fr':
        toneInstruction = `Tone: Elegant, fluent French translation. Translate the spoken input into natural French with proper grammar and accents.`;
        break;
      case 'translate_de':
        toneInstruction = `Tone: Clear, precise German translation. Translate the spoken input into fluent, professional German.`;
        break;
      case 'translate_hi':
        toneInstruction = `Tone: Fluent Hindi translation. Translate the spoken input into clear, natural Hindi (Devanagari script with natural phrasing).`;
        break;
      case 'translate_ja':
        toneInstruction = `Tone: Polite, natural Japanese translation (Teineigo). Translate the spoken input into clear, fluent Japanese (Kanji/Kana).`;
        break;
      case 'raw':
        toneInstruction = `Tone: Verbatim. Do minimal changes, only fixing obvious punctuation and capitalization.`;
        break;
      case 'custom':
        toneInstruction = `Tone Custom Request: ${options.customPrompt || 'Custom user instruction applied with high fidelity.'}`;
        break;
      default:
        toneInstruction = `Tone: Balanced and clear.`;
    }

    return `You are WhisperFlow Zero-Edit Engine, an AI that transforms spoken voice transcripts into polished, ready-to-send writing.

CONTEXT:
- Target Environment: ${appName}
- Requested Style: ${toneInstruction}
${dictionary.length > 0 ? `- Personal Dictionary (Always prioritize these exact spellings): ${dictionary.join(', ')}` : ''}

CRITICAL RULES:
1. PRESERVE INTENT: Keep the speaker's original ideas, facts, and voice intact. Never fabricate or extrapolate.
2. REMOVE FILLER WORDS: Erase all verbal fillers: "um", "uh", "er", "ah", "you know", meaningless "like", "so yeah", "basically".
3. RESOLVE SELF-CORRECTIONS: When the speaker changes their mind or restarts mid-sentence, keep ONLY their final corrected thought.
   - Example: "Let's meet at 5... wait, 6pm works better" -> "Let's meet at 6pm."
   - Example: "Send the email to Mark no sorry send it to Lisa" -> "Send the email to Lisa."
   - Example: "We need three... actually four licenses" -> "We need four licenses."
4. REMOVE STUTTERS: "the the launch is" -> "the launch is".
5. STRUCTURE AUTOMATICALLY:
   - Insert paragraph breaks for multi-thought text.
   - Format numbered lists if sequential steps are spoken.
6. IF CODE TONE:
   - Format identifiers like getUserById, api_endpoint, --port 3000.

OUTPUT RESTRICTION:
Output ONLY the transformed, polished text. Do NOT add conversational replies, explanations, quotes, or preamble.`;
  }

  /**
   * Rule-based fallback cleaner when no API keys are configured,
   * allowing zero-config instant testing.
   */
  localHeuristicCleanup(text, options = {}) {
    let cleaned = text;

    // 1. Remove filler words (case-insensitive word boundary)
    const fillers = [
      /\b(um|uh|erm|ah|you know|so yeah|like literally)\b,?\s*/gi,
      /\b(basically|sort of|kind of like)\b\s*/gi
    ];
    for (const f of fillers) {
      cleaned = cleaned.replace(f, '');
    }

    // 2. Remove duplicate words (stutters)
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 3. Simple self-correction heuristic ("X ... wait / actually / no sorry Y")
    cleaned = cleaned.replace(/\b(.+?)\s+(wait|actually|no wait|sorry|no sorry|I mean)\s+(.+)/i, '$3');

    // 4. Capitalize first letter of sentences
    cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

    // 5. Trim excess whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    // 6. Tone-specific formatting for instant zero-config feedback
    if (options.tone === 'bullet') {
      const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
      if (sentences.length > 1) {
        cleaned = sentences.map(s => `- ${s}`).join('\n');
      } else {
        cleaned = `- ${cleaned}`;
      }
    } else if (options.tone === 'standup') {
      cleaned = `**Yesterday:** ${cleaned}\n**Today:** In progress\n**Blockers:** None`;
    } else if (options.tone === 'social') {
      cleaned = `🚀 Key Update:\n\n${cleaned}\n\nWhat are your thoughts on this?\n\n#Productivity #VoiceAI #OpenSource`;
    } else if (options.tone === 'executive') {
      cleaned = `EXECUTIVE SUMMARY:\n${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Main pipeline: process raw transcript into zero-edit output.
   */
  async process(rawTranscript, options = {}) {
    const startTime = Date.now();

    if (!rawTranscript || !rawTranscript.trim()) {
      return {
        rawTranscript: '',
        processedText: '',
        latencyMs: 0,
        provider: 'none'
      };
    }

    const text = rawTranscript.trim();

    // 1. Check Snippets first
    const snippetCheck = this.checkSnippets(text);
    if (snippetCheck.matched) {
      return {
        rawTranscript: text,
        processedText: snippetCheck.snippet.content,
        isSnippet: true,
        snippetTrigger: snippetCheck.snippet.trigger,
        latencyMs: Date.now() - startTime,
        provider: 'snippet-engine'
      };
    }

    // 2. If 'raw' tone requested, return lightly trimmed text
    if (options.tone === 'raw') {
      return {
        rawTranscript: text,
        processedText: text,
        latencyMs: Date.now() - startTime,
        provider: 'raw'
      };
    }

    const systemPrompt = this.buildSystemPrompt(options);
    const provider = options.llmProvider || storage.getSettings().llmProvider || 'groq';

    let result;
    try {
      if (provider === 'gemini') {
        result = await geminiService.processZeroEdit(systemPrompt, text, options);
      } else {
        // Default to Groq
        result = await groqService.processZeroEdit(systemPrompt, text, options);
      }
    } catch (apiError) {
      console.warn(`⚠️ LLM Provider (${provider}) failed: ${apiError.message}. Using rule-based zero-edit heuristic.`);
      const fallbackText = this.localHeuristicCleanup(text, options);
      return {
        rawTranscript: text,
        processedText: fallbackText,
        latencyMs: Date.now() - startTime,
        provider: 'heuristic-fallback',
        warning: `API key error: ${apiError.message}. Cleaned using local heuristic.`
      };
    }

    const totalElapsed = Date.now() - startTime;
    return {
      rawTranscript: text,
      processedText: result.text,
      latencyMs: totalElapsed,
      provider: result.provider,
      model: result.model
    };
  }
}

export const zeroEditEngine = new ZeroEditEngine();
