import { renderFile } from "ejs";
import {
  closeSync,
  mkdirSync,
  openSync,
  realpathSync,
  writeFile,
  writeSync,
} from "fs";
import { dirname, join } from "path";

export interface GeneratorSettings {
  projectName?: string;
  version?: string;
  description?: string;
  author?: string;
  gitRepo?: string;
  keywords?: string;
  license?: string;
  backend?: "go" | "none";
  clientFolder?: string;
}

export default class Generator {
  settings: GeneratorSettings;

  base = {
    gitignore: ".gitignore",
    "package.json": "package.json",
    "postcss.config.js": "postcss.config.js",
    Procfile: "Procfile",
    "tailwind.config.js": "tailwind.config.js",
    "webpack.common.js": "webpack.common.js",
    "webpack.dev.js": "webpack.dev.js",
    "webpack.prod.js": "webpack.prod.js",
  };

  constructor(settings: GeneratorSettings) {
    this.settings = settings;
  }

  async generate() {
    try {
      for (const [template, outFile] of Object.entries(this.base)) {
        const content = await this.renderTemplate(template);
        await this.writeFile(outFile, content);
      }
      this.generateReactApp();
      if (this.settings.backend == "go") {
        this.generateGoApp();
      }
    } catch (err) {
      console.log("Failed to generate files", err);
    }
  }

  private generateReactApp() {
    if (this.settings.clientFolder) {
      mkdirSync(join("./", this.settings.clientFolder));
      this.writeFile(
        join("./", this.settings.clientFolder, "index.ts"),
        `import "./css/styles.css";`
      );
      mkdirSync(join("./", this.settings.clientFolder, "css"));
      if (this.settings.backend) {
        mkdirSync(join("./", this.settings.clientFolder, "src"));
      }
      mkdirSync(join("./", this.settings.clientFolder, "test"));

      this.writeFile(
        join("./", this.settings.clientFolder, "css", "styles.css"),
        `@tailwind base;
@tailwind components;
@tailwind utilities;`
      );
    }
  }

  private generateGoApp() {}

  update() {}

  private renderTemplate(template: string): Promise<string> {
    const templateDir = join(dirname(realpathSync(__filename)), "./templates");
    const filename = join(templateDir, `${template}.ejs`);
    return new Promise((resolve, reject) => {
      renderFile(filename, this.settings, (err, str: string) => {
        if (err) {
          return reject(err);
        }
        return resolve(str);
      });
    });
  }

  private writeFile(filename: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      writeFile(`./${filename}`, content, (err) => {
        if (err) {
          return reject();
        }
        return resolve();
      });
    });
  }
}
