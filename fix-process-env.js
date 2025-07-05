const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir process.env.NODE_ENV === 'development'
    content = content.replace(/process\.env\.NODE_ENV === 'development'/g, "import.meta.env?.DEV");
    
    // Substituir outras referências a process
    content = content.replace(/process\.env\./g, "import.meta.env.");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error in ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  });
}

// Executar apenas na pasta src
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  walkDir(srcDir);
  console.log('🎉 Process.env replacements completed!');
} else {
  console.error('❌ src directory not found!');
}
