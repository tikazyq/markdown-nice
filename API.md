# Markdown Nice API & CLI

This package provides both an API server and a CLI tool to convert markdown content to WeChat Official Account compatible HTML and other platforms without using the web UI.

## CLI vs API Server

**Use the CLI when:**
- Converting markdown files locally or in scripts
- Integrating into build processes
- One-off conversions
- No need for a running server

**Use the API Server when:**
- Building web services or applications
- Need remote access to conversion
- Multiple concurrent conversions
- RESTful API integration

## Quick Start

### Installation

Install the required dependencies:

```bash
pnpm install
```

### Starting the Server

```bash
pnpm api-server
```

Or directly:

```bash
node api-server.js
```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 node api-server.js
```

### Using the CLI

```bash
# Show help
npm run cli -- --help

# Or directly
node cli.js --help

# Convert a markdown file to WeChat HTML
npm run cli -- input.md -o output.html

# Convert to Zhihu format
npm run cli -- input.md -p zhihu -o output.html

# Read from stdin
cat input.md | npm run cli -- -o output.html
```

## CLI Usage

The CLI tool provides a simple command-line interface to convert markdown files without starting a server.

### Basic Usage

```bash
cli.js [options] <input-file>
```

### Options

- `-o, --output <file>` - Output file (default: stdout)
- `-p, --platform <name>` - Target platform: `wechat` (default), `zhihu`
- `-h, --help` - Show help message

### Examples

**Convert a file to WeChat HTML:**
```bash
node cli.js README.md -o output.html
```

**Convert to Zhihu format:**
```bash
node cli.js article.md -p zhihu -o zhihu-output.html
```

**Read from stdin and write to stdout:**
```bash
cat article.md | node cli.js
```

**Pipeline usage:**
```bash
cat article.md | node cli.js -o output.html
```

**Using npm script:**
```bash
npm run cli -- input.md -o output.html
```

## API Endpoints

### POST /api/convert

Convert markdown to platform-specific HTML.

**Request Body:**

```json
{
  "markdown": "# Hello World\n\nThis is **bold** text.",
  "platform": "wechat",
  "theme": {
    "basicStyle": "/* optional CSS */",
    "markdownStyle": "/* optional CSS */",
    "codeStyle": "/* optional CSS */",
    "fontStyle": "/* optional CSS */"
  }
}
```

**Parameters:**

- `markdown` (string, required): The markdown content to convert
- `platform` (string, optional): Target platform. Options:
  - `"wechat"` (default): WeChat Official Account
  - `"zhihu"`: Zhihu
- `theme` (object, optional): Custom CSS styles for different parts of the output

**Response:**

```json
{
  "success": true,
  "html": "<section>...</section>",
  "platform": "wechat"
}
```

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### GET /api

Get API documentation and metadata.

## Usage Examples

### cURL Example

```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Hello World\n\nThis is a **test** with `code`.",
    "platform": "wechat"
  }'
```

### Node.js Example

```javascript
const axios = require('axios');

async function convertMarkdown(markdown) {
  try {
    const response = await axios.post('http://localhost:3001/api/convert', {
      markdown: markdown,
      platform: 'wechat'
    });
    
    console.log('Converted HTML:', response.data.html);
    return response.data.html;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example usage
const markdown = `
# My Article

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`
`;

convertMarkdown(markdown);
```

### Python Example

```python
import requests

def convert_markdown(markdown, platform='wechat'):
    url = 'http://localhost:3001/api/convert'
    payload = {
        'markdown': markdown,
        'platform': platform
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        if result['success']:
            return result['html']
        else:
            print(f"Error: {result['error']}")
    else:
        print(f"HTTP Error: {response.status_code}")
    
    return None

# Example usage
markdown = """
# My Article

This is **bold** and *italic* text.
"""

html = convert_markdown(markdown)
if html:
    print("Successfully converted!")
    with open('output.html', 'w', encoding='utf-8') as f:
        f.write(html)
```

## Supported Markdown Features

- Headers (H1-H6)
- Bold and italic text
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Inline code
- Links
- Images (with size control)
- Tables
- Blockquotes
- Horizontal rules
- Strikethrough
- Table of Contents ([TOC])
- Ruby annotations
- Definition lists

## Custom Themes

Provide custom CSS styles through the `theme` parameter:

```javascript
const response = await axios.post('http://localhost:3001/api/convert', {
  markdown: '# Hello World',
  platform: 'wechat',
  theme: {
    markdownStyle: `
      h1 {
        color: #ff6b6b;
        font-size: 28px;
        text-align: center;
      }
      p {
        line-height: 1.8;
        font-size: 16px;
      }
    `
  }
});
```

## Production Deployment

For production use:

1. **Use a process manager** like PM2:
   ```bash
   pnpm install -g pm2
   pm2 start api-server.js --name markdown-api
   ```

2. **Add authentication** if needed
3. **Set up rate limiting** to prevent abuse
4. **Use HTTPS** with a reverse proxy like nginx

## Environment Variables

- `PORT`: Server port (default: 3001)

## License

GPL-3.0
