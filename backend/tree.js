const fs = require("fs");
const path = require("path");

function print(dir, prefix = "") {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const isDir = fs.statSync(full).isDirectory();
    console.log(prefix + file);
    if (isDir) print(full, prefix + "  ");
  }
}

print(".");
