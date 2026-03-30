import fs from 'fs';
import path from 'path';

// ====================== 在这里配置你的路径 ======================
// 可以写相对路径，例如：./imgs 、 ../images
const targetDir = './'; // 默认当前文件夹
// ===============================================================

// 支持的图片格式
const allowExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

async function renameFiles() {
  const dir = path.resolve(path.dirname(import.meta.url).replace('file://', ''), targetDir);

  try {
    let files = fs.readdirSync(dir);
    files = files.filter(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) return false;
      const ext = path.extname(file).toLowerCase();
      return allowExt.includes(ext);
    });

    if (files.length === 0) {
      console.log('❌ 未找到任何图片文件');
      return;
    }

    files.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    console.log(`✅ 找到 ${files.length} 张图片，开始重命名...\n`);

    files.forEach((file, index) => {
      const seq = index + 1;
      const ext = path.extname(file);
      const newName = `frame-${seq}${ext}`;

      const oldPath = path.join(dir, file);
      const newPath = path.join(dir, newName);

      fs.renameSync(oldPath, newPath);
      console.log(`✅ ${file} → ${newName}`);
    });

    console.log('\n🎉 全部重命名完成！');
  } catch (err) {
    console.error('❌ 出错：', err.message);
  }
}

renameFiles();