/**
 * Text & Article Content Formatting Utility
 * Converts human-friendly plain text (paragraphs, headings, bullet lists) to clean HTML and vice versa.
 */

/**
 * Converts rich plain text / markdown-like syntax to clean HTML for display.
 */
export function formatPlainTextToHtml(text: string): string {
  if (!text) return '';

  // If text already contains full HTML structure (e.g. legacy articles with <p> or <div>)
  // and has no raw markdown headings, check if we should keep it or format clean blocks
  const trimmed = text.trim();

  // Split into raw paragraph blocks separated by double or more newlines
  const rawBlocks = trimmed.split(/\n\s*\n+/);

  const htmlBlocks: string[] = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Check if the block is a Heading (starts with # or ### or ## or H3:)
    const firstLine = lines[0];
    if (/^(#{1,3}|H[1-3]:)\s+/i.test(firstLine)) {
      const headingText = firstLine.replace(/^(#{1,3}|H[1-3]:)\s+/i, '');
      htmlBlocks.push(`<h3>${formatInlineStyles(headingText)}</h3>`);
      if (lines.length > 1) {
        const remainingLines = lines.slice(1).map(formatInlineStyles).join('<br/>');
        htmlBlocks.push(`<p>${remainingLines}</p>`);
      }
      continue;
    }

    // Check if the block is a Blockquote (starts with >)
    if (firstLine.startsWith('>')) {
      const quoteText = lines.map((l) => l.replace(/^>\s*/, '')).map(formatInlineStyles).join('<br/>');
      htmlBlocks.push(
        `<blockquote class="p-4 my-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-[#0D5C3A] rounded-r-xl italic text-slate-700 dark:text-stone-300 font-medium">${quoteText}</blockquote>`
      );
      continue;
    }

    // Check if the block is a Bullet List (starts with - or * or •)
    const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l));
    if (isBulletList) {
      const listItems = lines
        .map((l) => l.replace(/^[-*•]\s+/, ''))
        .map(formatInlineStyles)
        .map((item) => `<li>${item}</li>`)
        .join('');
      htmlBlocks.push(`<ul class="list-disc pl-5 space-y-1 my-3">${listItems}</ul>`);
      continue;
    }

    // Check if the block is a Numbered List (starts with 1. 2. etc)
    const isNumberedList = lines.every((l) => /^\d+[\.\)]\s+/.test(l));
    if (isNumberedList) {
      const listItems = lines
        .map((l) => l.replace(/^\d+[\.\)]\s+/, ''))
        .map(formatInlineStyles)
        .map((item) => `<li>${item}</li>`)
        .join('');
      htmlBlocks.push(`<ol class="list-decimal pl-5 space-y-1 my-3">${listItems}</ol>`);
      continue;
    }

    // If block starts with existing HTML tag (e.g. <p, <h3, <ul, <div), preserve clean
    if (/^<[a-z0-9]+/i.test(firstLine)) {
      htmlBlocks.push(rawBlock);
      continue;
    }

    // Regular Paragraph
    const formattedParagraph = lines.map(formatInlineStyles).join('<br/>');
    htmlBlocks.push(`<p>${formattedParagraph}</p>`);
  }

  return htmlBlocks.join('\n\n');
}

/**
 * Formats inline bold (**text**), italics (*text*), and links [text](url).
 */
function formatInlineStyles(text: string): string {
  let res = text;
  // Bold: **text** or __text__
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (ensure not matching HTML tags)
  res = res.replace(/(?<!<[^>]*)\*([^*]+)\*(?![^<]*>)/g, '<em>$1</em>');

  return res;
}

/**
 * Converts existing HTML (like <p>, <h3>, <ul>, <li>) into natural human plain text
 * for easy editing in the admin textarea without messy tags.
 */
export function formatHtmlToCleanPlainText(html: string): string {
  if (!html) return '';

  // Check if string contains any HTML tags
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  let text = html;

  // Replace block tags with appropriate newlines
  text = text.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n\n### $1\n\n');
  text = text.replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, '\n\n#### $1\n\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1');
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n\n> $1\n\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Convert bold and italic tags to markdown-like formatting
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');

  // Strip all other remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up excessive blank lines (more than 2 consecutive newlines)
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}
