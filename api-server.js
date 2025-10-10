const express = require("express");
const {JSDOM} = require("jsdom");
const juice = require("juice");
const MarkdownIt = require("markdown-it");
const markdownItDeflist = require("markdown-it-deflist");
const markdownItImplicitFigures = require("markdown-it-implicit-figures");
const markdownItTableOfContents = require("markdown-it-table-of-contents");
const markdownItRuby = require("markdown-it-ruby");
const markdownItImsize = require("markdown-it-imsize");
const highlightjs = require("highlight.js");

const app = express();
app.use(express.json({limit: "10mb"}));

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

// API endpoint to convert markdown to HTML
app.post("/api/convert", (req, res) => {
  try {
    const {markdown, platform = "wechat", theme = {}} = req.body;

    if (!markdown) {
      return res.status(400).json({error: "Markdown content is required"});
    }

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

    res.json({
      success: true,
      html: resultHtml,
      platform,
    });
  } catch (error) {
    console.error("Error converting markdown:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({status: "ok"});
});

// Get API documentation
app.get("/api", (req, res) => {
  res.json({
    name: "Markdown Nice API",
    version: "1.0.0",
    endpoints: {
      "POST /api/convert": {
        description: "Convert markdown to platform-specific HTML",
        body: {
          markdown: "string (required) - The markdown content to convert",
          platform: "string (optional) - Target platform: 'wechat' (default), 'zhihu'",
          theme: {
            basicStyle: "string (optional) - Basic CSS styles",
            markdownStyle: "string (optional) - Markdown-specific CSS styles",
            codeStyle: "string (optional) - Code block CSS styles",
            fontStyle: "string (optional) - Font CSS styles",
          },
        },
        response: {
          success: "boolean",
          html: "string - The converted HTML content",
          platform: "string - The platform used for conversion",
        },
      },
      "GET /api/health": {
        description: "Health check endpoint",
        response: {
          status: "string - 'ok' if the service is running",
        },
      },
    },
    example: {
      request: {
        markdown: "# Hello World\n\nThis is a **test**.",
        platform: "wechat",
      },
    },
  });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Markdown Nice API server is running on port ${PORT}`);
    console.log(`API documentation: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Convert endpoint: POST http://localhost:${PORT}/api/convert`);
  });
}

module.exports = app;
