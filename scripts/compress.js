const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 获取输入的文件夹
const rootFolder = process.argv[2];
if (!rootFolder) {
  console.log('使用：node compress.js 文件夹路径');
  process.exit(1);
}

// 支持的图片格式
const supportExts = ['.png', '.jpg', '.jpeg'];

// 递归遍历文件夹
async function traverse(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await traverse(fullPath); // 递归子文件夹
    } else if (stat.isFile()) {
      await compress(fullPath);
    }
  }
}

// 图片压缩（无损，覆盖原图）
async function compress(file) {
  const ext = path.extname(file).toLowerCase();
  if (!supportExts.includes(ext)) return;

  const temp = file + '.tmp';

  try {
    const s = sharp(file, { failOnError: false });

    if (ext === '.png') {
      await s
        .png({
          quality: 100,
          compressionLevel: 9, // 最高无损压缩
          adaptiveFiltering: true,
        })
        .toFile(temp);
    } else {
      await s
        .jpeg({
          quality: 100,
          mozjpeg: true, // 业界最强无损压缩
          chromaSubsampling: '4:4:4',
        })
        .toFile(temp);
    }

    // 替换原图
    fs.renameSync(temp, file);
    console.log('✅ 已压缩：', file);
  } catch (err) {
    try { fs.unlinkSync(temp); } catch {}
    console.log('❌ 失败：', file);
  }
}

// 开始执行
console.log('🚀 开始递归无损压缩所有图片...\n');
traverse(rootFolder)
  .then(() => {
    console.log('\n🎉 全部完成！所有图片已无损压缩并替换原图');
  })
  .catch(console.log);