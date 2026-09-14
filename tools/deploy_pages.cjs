const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const git = 'C:\\Coding\\Git\\cmd\\git.exe';
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'frontend', 'dist');
const tempDir = path.join(os.tmpdir(), 'gh-pages-deploy-' + Date.now());

console.log('Deploying from:', distDir);
try {
  // Create worktree
  execSync(`"${git}" worktree add "${tempDir}" gh-pages`, { cwd: repoRoot, stdio: 'inherit' });

  // Copy dist files to tempDir
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyRecursive(distDir, tempDir);

  // Commit and push
  execSync(`"${git}" add -A`, { cwd: tempDir, stdio: 'inherit' });
  try {
    execSync(`"${git}" commit -m "deploy: update GitHub Pages with core pseudocode and github links"`, { cwd: tempDir, stdio: 'inherit' });
    execSync(`"${git}" push origin gh-pages`, { cwd: tempDir, stdio: 'inherit' });
    console.log('Successfully pushed to gh-pages!');
  } catch (e) {
    console.log('Commit/push result:', e.message);
  }
} finally {
  try {
    execSync(`"${git}" worktree remove "${tempDir}" --force`, { cwd: repoRoot, stdio: 'inherit' });
  } catch (e) {}
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
