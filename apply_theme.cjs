const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // 1. Core Palette Replacement
  content = content.replace(/#FEFAEE/gi, '#FAF8F5');
  content = content.replace(/#FDF5D6/gi, '#F4F0E8');
  content = content.replace(/#FCEEBB/gi, '#EBE7DF');
  
  // 2. Typography Replacement
  content = content.replace(/#3d3520/gi, '#050505');
  content = content.replace(/#6b5e42/gi, '#292524');
  content = content.replace(/#9a8d72/gi, '#707070');
  
  // 3. Border Replacement
  content = content.replace(/#e8dfc8/gi, '#e7e5e4');
  
  // 4. Emerald (Green) to Forest Green (#0D5C3A)
  content = content.replace(/emerald-100/g, '[#e8f5e9]'); // Light green bg
  content = content.replace(/emerald-300/g, '[#0D5C3A]');
  content = content.replace(/emerald-400/g, '[#0D5C3A]');
  content = content.replace(/emerald-500/g, '[#0D5C3A]');
  content = content.replace(/emerald-600/g, '[#0D5C3A]');
  content = content.replace(/emerald-700/g, '[#0D5C3A]');
  content = content.replace(/emerald-800/g, '[#0D5C3A]');
  content = content.replace(/emerald-850/g, '[#0D5C3A]');
  content = content.replace(/emerald-900/g, '[#0D5C3A]');
  content = content.replace(/emerald-950/g, '[#0D5C3A]');
  
  // 5. Amber (Yellow) to Dark Stone (#0c0a09)
  content = content.replace(/amber-400/g, '[#0c0a09]');
  content = content.replace(/amber-500/g, '[#0c0a09]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
