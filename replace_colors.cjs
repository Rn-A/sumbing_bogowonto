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
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/dark:bg-\[#1a1a14\]/g, 'dark:bg-[#FEFAEE]');
  content = content.replace(/dark:bg-\[#232318\]/g, 'dark:bg-[#FDF5D6]');
  content = content.replace(/dark:bg-\[#2d2d22\]/g, 'dark:bg-[#FCEEBB]');
  content = content.replace(/dark:bg-\[#151510\]/g, 'dark:bg-[#FDF5D6]');
  
  content = content.replace(/dark:text-\[#f5f0e0\]/g, 'dark:text-[#3d3520]');
  content = content.replace(/dark:text-\[#b8ae94\]/g, 'dark:text-[#6b5e42]');
  content = content.replace(/dark:text-\[#7d7460\]/g, 'dark:text-[#9a8d72]');
  
  content = content.replace(/dark:border-\[#3d3a2e\]/g, 'dark:border-[#e8dfc8]');
  content = content.replace(/dark:hover:bg-\[#2d2d22\]/g, 'dark:hover:bg-[#FCEEBB]');
  
  content = content.replace(/dark:bg-slate-950/g, 'dark:bg-[#FEFAEE]');
  content = content.replace(/dark:bg-slate-900\/30/g, 'dark:bg-[#FDF5D6]\/50');
  content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#FDF5D6]');
  content = content.replace(/dark:bg-slate-850/g, 'dark:bg-[#FDF5D6]');
  content = content.replace(/dark:bg-slate-800/g, 'dark:bg-[#FCEEBB]');
  content = content.replace(/dark:border-slate-900/g, 'dark:border-[#e8dfc8]');
  content = content.replace(/dark:border-slate-850/g, 'dark:border-[#e8dfc8]');
  content = content.replace(/dark:border-slate-800/g, 'dark:border-[#e8dfc8]');
  content = content.replace(/dark:border-slate-700/g, 'dark:border-[#e8dfc8]');
  content = content.replace(/dark:text-slate-400/g, 'dark:text-[#9a8d72]');
  content = content.replace(/dark:text-slate-350/g, 'dark:text-[#9a8d72]');
  content = content.replace(/dark:text-slate-300/g, 'dark:text-[#6b5e42]');
  content = content.replace(/dark:text-white/g, 'dark:text-[#3d3520]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
