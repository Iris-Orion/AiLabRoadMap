const fs = require('fs');

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  const bare = [];
  lines.forEach((line, idx) => {
    // Check if line contains https://github.com/google-deepmind without subsequent repo slash
    if (/https:\/\/github\.com\/google-deepmind(?![a-zA-Z0-9_\-\/])/.test(line) ||
        /https:\/\/github\.com\/google-deepmind["'`\s]/.test(line) ||
        line.trim().endsWith('https://github.com/google-deepmind') ||
        line.trim().endsWith('https://github.com/google-deepmind"') ||
        line.trim().endsWith("https://github.com/google-deepmind'")) {
      bare.push(`${idx + 1}: ${line.trim()}`);
    }
  });
  return bare;
}

const files = [
  'frontend/show_result.ts',
  'frontend/index.html',
  'data/graph_data.json',
  'data/deepmind_publications_analysis.json'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const res = checkFile(f);
    console.log(`[Check] ${f}: ${res.length} bare org links`);
    if (res.length > 0) {
      console.log(res.slice(0, 10));
    }
  }
});
