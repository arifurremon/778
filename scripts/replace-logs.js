const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '..', 'src', 'app', 'api'), function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove console.log
    content = content.replace(/console\.log\(.*\);?/g, '');

    // Replace console.error("[route]", error) with logErrorToSentry
    if (content.includes('console.error')) {
      content = content.replace(/console\.error\(\s*"(.*?)",\s*(.*?)\s*\);?/g, (match, route, errorVar) => {
        return `logErrorToSentry(${errorVar}, { route: "${route}" });`;
      });
      content = content.replace(/console\.error\(\s*(.*?)\s*\);?/g, (match, arg) => {
        if (arg.includes('logErrorToSentry')) return match;
        return `logErrorToSentry(${arg});`;
      });

      if (!content.includes('import { logErrorToSentry }')) {
        content = `import { logErrorToSentry } from "@/lib/error-handler";\n` + content;
      }
    }

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
