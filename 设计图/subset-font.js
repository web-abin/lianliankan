import Fontmin from 'fontmin';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 获取当前脚本所在的文件夹绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. 准备要提取的文字
const str = "设置商店主题排行榜";
const myText = str.split('');

// 3. 锁定文件路径（使用 path.join 确保路径正确）
const sourceFont = path.join(__dirname, 'font.ttf'); 
const destPath = path.join(__dirname, 'dist');

const fontmin = new Fontmin()
    .src(sourceFont)
    .use(Fontmin.glyph({
        text: Array.from(new Set(myText)).join(''),
        hinting: false
    }))
    .dest(destPath);

fontmin.run((err, files) => {
    if (err) {
        // 如果依然报错，这里会打印出程序实际尝试读取的完整路径，方便你核对
        console.error('压缩失败，请检查路径是否正确：', sourceFont);
        console.error('错误详情：', err);
    } else {
        console.log('✅ 字体提取成功！');
        console.log('📂 原始文件：', sourceFont);
        console.log('🚀 输出目录：', destPath);
    }
});