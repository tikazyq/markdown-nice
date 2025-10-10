#!/usr/bin/env node
/**
 * Example script demonstrating how to use the Markdown Nice CLI
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Markdown Nice CLI Examples');
console.log('='.repeat(60));
console.log();

// Example markdown content
const exampleMarkdown = `# CLI Example Article

This demonstrates the Markdown Nice CLI tool.

## Features

- **Easy to use**: Simple command-line interface
- **Multiple platforms**: Support for WeChat and Zhihu
- **Flexible input**: Read from files or stdin

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Markdown Nice"));
\`\`\`

## Table

| Feature | CLI | API |
|---------|-----|-----|
| Convert | ✓   | ✓   |
| Fast    | ✓   | ✓   |
| Easy    | ✓   | ✓   |

## Blockquote

> The CLI tool makes it easy to integrate Markdown Nice
> into your workflow or build process.

Visit [Markdown Nice](https://mdnice.com/) to try the online editor!
`;

// Create temporary input file
const tmpDir = '/tmp/mdnice-cli-examples';
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, {recursive: true});
}

const inputFile = path.join(tmpDir, 'example-input.md');
const wechatOutput = path.join(tmpDir, 'wechat-output.html');
const zhihuOutput = path.join(tmpDir, 'zhihu-output.html');

fs.writeFileSync(inputFile, exampleMarkdown, 'utf8');

console.log('Example 1: Convert to WeChat HTML');
console.log('-'.repeat(60));
console.log(`Command: node cli.js ${inputFile} -o ${wechatOutput}`);
try {
  execSync(`node cli.js "${inputFile}" -o "${wechatOutput}"`, {
    cwd: __dirname,
    encoding: 'utf8',
  });
  const stats = fs.statSync(wechatOutput);
  console.log(`✓ Success! Output: ${wechatOutput} (${stats.size} bytes)`);
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}
console.log();

console.log('Example 2: Convert to Zhihu HTML');
console.log('-'.repeat(60));
console.log(`Command: node cli.js ${inputFile} -p zhihu -o ${zhihuOutput}`);
try {
  execSync(`node cli.js "${inputFile}" -p zhihu -o "${zhihuOutput}"`, {
    cwd: __dirname,
    encoding: 'utf8',
  });
  const stats = fs.statSync(zhihuOutput);
  console.log(`✓ Success! Output: ${zhihuOutput} (${stats.size} bytes)`);
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}
console.log();

console.log('Example 3: Using stdin (pipe from echo)');
console.log('-'.repeat(60));
console.log('Command: echo "# Test" | node cli.js');
try {
  const result = execSync('printf "# Test\\n\\nPiped **content**." | node cli.js', {
    cwd: __dirname,
    encoding: 'utf8',
  });
  console.log('✓ Success! Output:');
  console.log(result.substring(0, 200) + '...');
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}
console.log();

console.log('Example 4: Show help');
console.log('-'.repeat(60));
console.log('Command: node cli.js --help');
try {
  const result = execSync('node cli.js --help', {
    cwd: __dirname,
    encoding: 'utf8',
  });
  console.log(result);
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}

console.log('='.repeat(60));
console.log('All examples completed!');
console.log('Output files are in:', tmpDir);
console.log('='.repeat(60));
