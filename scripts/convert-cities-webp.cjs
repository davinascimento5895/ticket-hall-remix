const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertDir(dir) {
  const files = fs.readdirSync(dir);
  const imgs = files.filter(f => /\.(png|jpe?g)$/i.test(f));
  if (imgs.length === 0) {
    console.log('Nenhum arquivo .png ou .jpg encontrado em', dir);
    return;
  }

  await Promise.all(imgs.map(async (file) => {
    const input = path.join(dir, file);
    const outName = file.replace(/\.(png|jpe?g)$/i, '.webp');
    const output = path.join(dir, outName);
    try {
      await sharp(input)
        .webp({ quality: 80 })
        .toFile(output);
      console.log('Convertido:', file, '→', outName);
    } catch (err) {
      console.error('Erro convertendo', file, err.message);
    }
  }));
}

const target = path.resolve(process.cwd(), 'public', 'images', 'cities');
convertDir(target).catch(err => {
  console.error(err);
  process.exit(1);
});
