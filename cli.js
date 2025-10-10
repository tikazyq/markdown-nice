#!/usr/bin/env node
/**
 * Markdown Nice CLI
 * 
 * Convert markdown to platform-specific HTML from the command line
 */

const fs = require("fs");
const {JSDOM} = require("jsdom");
const juice = require("juice");
const MarkdownIt = require("markdown-it");
const markdownItDeflist = require("markdown-it-deflist");
const markdownItImplicitFigures = require("markdown-it-implicit-figures");
const markdownItTableOfContents = require("markdown-it-table-of-contents");
const markdownItRuby = require("markdown-it-ruby");
const markdownItImsize = require("markdown-it-imsize");
const highlightjs = require("highlight.js");

// Constants
const BASIC_THEME_ID = "basic-theme";
const CODE_THEME_ID = "code-theme";
const MARKDOWN_THEME_ID = "markdown-theme";
const FONT_THEME_ID = "font-theme";
const LAYOUT_ID = "nice";
const BOX_ID = "nice-rich-text-box";
const MJX_DATA_FORMULA = "data-formula";

// Setup markdown parser with highlight
const markdownParser = new MarkdownIt({
  html: true,
  highlight: (str, lang) => {
    if (lang === undefined || lang === "") {
      lang = "bash";
    }
    if (lang && highlightjs.getLanguage(lang)) {
      try {
        const formatted = highlightjs
          .highlight(str, {language: lang, ignoreIllegals: true})
          .value.replace(/\n/g, "<br/>")
          .replace(/\s/g, "&nbsp;")
          .replace(/span&nbsp;/g, "span ");
        return '<pre class="custom"><code class="hljs">' + formatted + "</code></pre>";
      } catch (e) {
        console.error("Highlight error:", e.message);
      }
    }
    return '<pre class="custom"><code class="hljs">' + markdownParser.utils.escapeHtml(str) + "</code></pre>";
  },
});

// Apply markdown-it plugins
markdownParser
  .use(markdownItTableOfContents, {
    transformLink: () => "",
    includeLevel: [2, 3],
    markerPattern: /^\[toc\]/im,
  })
  .use(markdownItRuby)
  .use(markdownItImplicitFigures, {figcaption: true})
  .use(markdownItDeflist)
  .use(markdownItImsize);

// Default theme styles (empty by default, user can provide their own)
const defaultBasicStyle = ``;
const defaultMarkdownStyle = ``;
const defaultCodeStyle = ``;
const defaultFontStyle = ``;

function solveWeChatMath(document) {
  const layout = document.getElementById(LAYOUT_ID);
  if (!layout) return;
  
  const mjxs = layout.getElementsByTagName("mjx-container");
  for (let i = 0; i < mjxs.length; i++) {
    const mjx = mjxs[i];
    if (!mjx.hasAttribute("jax")) {
      break;
    }

    mjx.removeAttribute("jax");
    mjx.removeAttribute("display");
    mjx.removeAttribute("tabindex");
    mjx.removeAttribute("ctxtmenu_counter");
    const svg = mjx.firstChild;
    if (svg) {
      const width = svg.getAttribute("width");
      const height = svg.getAttribute("height");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = width;
      svg.style.height = height;
    }
  }
}

function solveZhihuMath(document) {
  const layout = document.getElementById(LAYOUT_ID);
  if (!layout) return;
  
  const mjxs = layout.getElementsByTagName("mjx-container");
  while (mjxs.length > 0) {
    const mjx = mjxs[0];
    let data = mjx.getAttribute(MJX_DATA_FORMULA);
    if (!data) {
      mjx.remove();
      continue;
    }

    if (mjx.hasAttribute("display") && data.indexOf("\\tag") === -1) {
      data += "\\\\";
    }

    mjx.outerHTML = '<img class="Formula-image" data-eeimg="true" src="" alt="' + data + '">';
  }
}

function solveHtml(document, basicStyle = "", markdownStyle = "", codeStyle = "", fontStyle = "") {
  const element = document.getElementById(BOX_ID);
  if (!element) {
    throw new Error("Unable to find content box");
  }

  const inner = element.children[0]?.children;
  if (inner) {
    for (const item of inner) {
      item.setAttribute("data-tool", "mdnice编辑器");
    }
  }
  
  let html = element.innerHTML;
  html = html.replace(/<mjx-container (class="inline.+?)<\/mjx-container>/g, "<span $1</span>");
  html = html.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
  html = html.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
  html = html.replace(/mjx-container/g, "section");
  html = html.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
  html = html.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
  
  let res = "";
  try {
    res = juice.inlineContent(html, basicStyle + markdownStyle + codeStyle + fontStyle, {
      inlinePseudoElements: true,
      preserveImportant: true,
    });
  } catch (e) {
    console.error("Error inlining CSS:", e.message);
    res = html;
  }

  return res;
}

function convertMarkdown(markdown, platform = "wechat", theme = {}) {
  try {
    // Parse markdown to HTML
    const parsedHtml = markdownParser.render(markdown);

    // Create a JSDOM instance
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style id="${BASIC_THEME_ID}">${theme.basicStyle || defaultBasicStyle}</style>
          <style id="${MARKDOWN_THEME_ID}">${theme.markdownStyle || defaultMarkdownStyle}</style>
          <style id="${CODE_THEME_ID}">${theme.codeStyle || defaultCodeStyle}</style>
          <style id="${FONT_THEME_ID}">${theme.fontStyle || defaultFontStyle}</style>
        </head>
        <body>
          <div id="${LAYOUT_ID}">
            <div id="${BOX_ID}">
              <section>${parsedHtml}</section>
            </div>
          </div>
        </body>
      </html>
    `);

    const {document} = dom.window;

    // Apply platform-specific transformations
    if (platform === "wechat") {
      solveWeChatMath(document);
    } else if (platform === "zhihu") {
      solveZhihuMath(document);
    }

    // Get the final HTML with inlined CSS
    const resultHtml = solveHtml(
      document,
      theme.basicStyle || defaultBasicStyle,
      theme.markdownStyle || defaultMarkdownStyle,
      theme.codeStyle || defaultCodeStyle,
      theme.fontStyle || defaultFontStyle
    );

    return resultHtml;
  } catch (error) {
    console.error("Error converting markdown:", error.message);
    throw error;
  }
}

function showHelp() {
  console.log(`
Markdown Nice CLI - Convert markdown to platform-specific HTML

Usage:
  cli.js [options] <input-file>
  cat input.md | cli.js [options]

Options:
  -o, --output <file>     Output file (default: stdout)
  -p, --platform <name>   Target platform: wechat (default), zhihu
  -h, --help              Show this help message

Examples:
  # Convert markdown file to WeChat HTML
  cli.js input.md -o output.html

  # Convert to Zhihu format
  cli.js input.md -p zhihu -o output.html

  # Read from stdin and write to stdout
  cat input.md | cli.js

  # Read from stdin and write to file
  cat input.md | cli.js -o output.html
`);
}

function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    platform: "wechat",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "-h" || arg === "--help") {
      showHelp();
      process.exit(0);
    } else if (arg === "-o" || arg === "--output") {
      options.output = args[++i];
    } else if (arg === "-p" || arg === "--platform") {
      options.platform = args[++i];
    } else if (!arg.startsWith("-")) {
      options.input = arg;
    }
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 && process.stdin.isTTY) {
    showHelp();
    process.exit(1);
  }

  const options = parseArgs(args);

  try {
    let markdown = "";

    // Read input from file or stdin
    if (options.input) {
      if (!fs.existsSync(options.input)) {
        console.error(`Error: Input file '${options.input}' not found`);
        process.exit(1);
      }
      markdown = fs.readFileSync(options.input, "utf8");
    } else {
      // Read from stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      markdown = Buffer.concat(chunks).toString("utf8");
    }

    if (!markdown.trim()) {
      console.error("Error: No markdown content provided");
      process.exit(1);
    }

    // Convert markdown
    const html = convertMarkdown(markdown, options.platform);

    // Write output to file or stdout
    if (options.output) {
      fs.writeFileSync(options.output, html, "utf8");
      console.error(`✓ Converted ${options.platform} HTML saved to: ${options.output}`);
    } else {
      process.stdout.write(html);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {convertMarkdown};
