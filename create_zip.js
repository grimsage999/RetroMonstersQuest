const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'dist', 'game_build.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archive created successfully');
});

// This event is fired when the data source is drained no matter what was the data source
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files from the public directory to the archive
const publicDir = path.join(__dirname, 'dist', 'public');
function addDirectoryToArchive(dirPath, archivePath = '') {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(archivePath, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      addDirectoryToArchive(fullPath, relativePath);
    } else {
      archive.file(fullPath, { name: relativePath });
    }
  }
}

addDirectoryToArchive(publicDir);

// Finalize the archive
archive.finalize();