import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://muncak.id/jalur-pendakian/gunung-sindoro-via-kledung/segmentasi';
  console.log('Fetching', url);
  const res = await fetch(url);
  const text = await res.text();
  const filePath = path.join(process.cwd(), 'scratch', 'sindoro-page.html');
  fs.writeFileSync(filePath, text);
  console.log('Saved to', filePath);
}

main().catch(console.error);
