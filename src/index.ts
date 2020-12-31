import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import * as inquirer from "inquirer";
import { basename, join, sep } from "path";

import Generator, { GeneratorSettings } from "./generator";

class ImotheeGenerateWebapp extends Command {
  static description = "Generates or updates a new webapp";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    // flag with no value (-f, --force)
    update: flags.boolean({ char: "u" }),
  };

  static args = [{ name: "folder" }];

  async run() {
    const { args, flags } = this.parse(ImotheeGenerateWebapp);

    const folder = args.folder ?? "./";

    // We only prompt for settings if we're not updating
    if (flags.update) {
      const settings = this.loadSettings(folder);
      const generator = new Generator(settings);
      generator.update();
    } else {
      const settings = await this.promptSettings(folder);
      const generator = new Generator(settings);
      generator.generate();
    }
  }

  async getPromptOrDefault(
    prompt: string,
    defaultValue: string
  ): Promise<string> {
    const value = await cli.prompt(`${prompt}`, {
      required: false,
      default: defaultValue,
    });
    return value;
  }

  loadSettings(folderName: string): GeneratorSettings {
    const settings: GeneratorSettings = {};

    const packageJSON = require(join(process.cwd(), "package.json"));

    settings.projectName = packageJSON.name;
    settings.version = packageJSON.version;
    settings.description = packageJSON.description;
    settings.author = packageJSON.author;
    settings.gitRepo = packageJSON.repository.url;
    settings.keywords = packageJSON.keywords.join(", ");
    settings.license = packageJSON.license;
    settings.clientFolder = packageJSON.main.split(sep).shift();
    if (packageJSON["com_imothee"]) {
      settings.backend = packageJSON["com_imothee"].backend;
    } else {
      settings.backend = "none";
    }

    return settings;
  }

  async promptSettings(folderName: string): Promise<GeneratorSettings> {
    const settings: GeneratorSettings = {};

    // ProjectName
    const defaultProjectName =
      folderName === "./" ? basename(process.cwd()) : folderName;
    settings.projectName = await this.getPromptOrDefault(
      "Project Name",
      defaultProjectName
    );

    // Version
    settings.version = await this.getPromptOrDefault("Version", "1.0.0");

    // Description
    settings.description = await this.getPromptOrDefault("Description", "");

    // Author
    settings.author = await this.getPromptOrDefault("Author", "");

    // Git Repo
    settings.gitRepo = await this.getPromptOrDefault("Git Repository", "");

    // Keywords
    settings.keywords = await this.getPromptOrDefault("Keywords", "");

    // License
    settings.license = await this.getPromptOrDefault("License", "private");

    // Backend
    let responses: any = await inquirer.prompt([
      {
        name: "backend",
        message: "Select a backend",
        type: "list",
        choices: [{ name: "none" }, { name: "go" }],
      },
    ]);
    settings.backend = responses.backend;

    if (settings.backend !== "none") {
      settings.clientFolder = await this.getPromptOrDefault(
        "Client folder",
        ""
      );
    } else {
      settings.clientFolder = "src";
    }

    return settings;
  }
}

export = ImotheeGenerateWebapp;
