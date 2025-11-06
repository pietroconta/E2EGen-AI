import fs from "fs";
import { readdir, unlink } from "fs/promises";

export class Cleaner {
  constructor(options = {}) {
    this.stepsPack = options.stepsPack; // <-- added
    this.path = `./stepspacks/${this.stepsPack}/generated/`;
    this.toClean = options.toClean || [];
    this.steps = options.steps || [];
  }

  clean() {
    if (this.toClean.includes("orphans") && fs.existsSync(this.path)) {
      this._removeOrphansCodes();
    }
  }

  async _removeOrphansCodes() {
    const ids = this.steps.map(step => step.id);
    const stepFiles = await this._getStepsCodeIdArr();

    for (const filename of stepFiles) {
      const match = filename.match(/^step-([a-z0-9]+)\.js$/i);
      if (!match) continue; // Skip anything not matching step-<id>.js

      const id = match[1];
      if (!ids.includes(id)) {
        const filePath = `${this.path}step-${id}.js`;
        try {
          await unlink(filePath);
          console.log(`🗑 Deleted orphan step file: ${filePath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`❌ Failed to delete ${filePath}:`, err);
          } else {
            console.warn(`⚠️ File already missing: ${filePath}`);
          }
        }
      }
    }
  }

  async _getStepsCodeIdArr() {
    try {
      const files = await readdir(this.path);
      return files.filter(filename => /^step-[a-z0-9]+\.js$/i.test(filename));
    } catch (err) {
      console.error("Failed to read directory:", this.path, err);
      return [];
    }
  }
}
