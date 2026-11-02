// "Build" step for the frontend: prepares the files that the browser gets.
// Real projects use a tool such as Vite or webpack; this script does a small
// version of the same job with Node.js only, so it needs no npm install.
//   node build.js   ->   creates the folder dist/
const fs = require('fs');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');

// 1. app.js without comment lines and empty lines (a tiny "minify")
const js = fs.readFileSync('app.js', 'utf8')
  .split('\n')
  .filter(line => line.trim() !== '' && !line.trim().startsWith('//'))
  .join('\n');
fs.writeFileSync('dist/app.js', js + '\n');

// 2. style.css as is
fs.copyFileSync('style.css', 'dist/style.css');

// 3. index.html with the build time at the bottom of the page
const builtAt = new Date().toISOString();
const html = fs.readFileSync('index.html', 'utf8')
  .replace('</body>', `  <p class="hint">Build: ${builtAt}</p>\n</body>`);
fs.writeFileSync('dist/index.html', html);

for (const f of fs.readdirSync('dist')) {
  console.log(`dist/${f}  ${fs.statSync(`dist/${f}`).size} bytes`);
}
console.log(`build finished at ${builtAt}`);
