#!/usr/bin/env node
/**
 * Example script demonstrating how to use the Markdown Nice API
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

const exampleMarkdown = `# My Article

This is a demonstration of the Markdown Nice API.

## Features

- **Bold text**
- *Italic text*
- \`inline code\`

### Code Block

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet("Markdown Nice");
\`\`\`

### Table

| Feature | Supported |
|---------|-----------|
| Headers | ✓ |
| Lists   | ✓ |
| Code    | ✓ |

### Quote

> This is a quote block.

### Link

Visit [Markdown Nice](https://mdnice.com/) for more information!
`;

async function convertMarkdown() {
  console.log('Converting markdown to WeChat HTML...\n');
  
  try {
    const response = await axios.post(`${API_URL}/api/convert`, {
      markdown: exampleMarkdown,
      platform: 'wechat',
    });

    if (response.data.success) {
      console.log('✓ Conversion successful!');
      console.log(`  Platform: ${response.data.platform}`);
      console.log(`  HTML length: ${response.data.html.length} characters`);
      
      // Save to file
      const fs = require('fs');
      const filename = 'example-output.html';
      fs.writeFileSync(filename, response.data.html, 'utf8');
      console.log(`  Output saved to: ${filename}\n`);
      
      console.log('You can now copy this HTML and paste it into WeChat Official Account editor!');
      return true;
    } else {
      console.error('✗ Conversion failed:', response.data.error);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Cannot connect to API server.');
      console.error('  Please make sure the server is running:');
      console.error('  npm run api-server\n');
    } else {
      console.error('✗ Error:', error.response?.data || error.message);
    }
    return false;
  }
}

// Run the example
console.log('='.repeat(50));
console.log('Markdown Nice API Example');
console.log('='.repeat(50));
console.log(`API URL: ${API_URL}\n`);

convertMarkdown().then(success => {
  process.exit(success ? 0 : 1);
});
