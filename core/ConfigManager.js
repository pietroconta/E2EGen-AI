// ============================================
// FILE: core/ConfigManager.js (BONUS)
// ============================================

import fs from "fs";
import dotenv from "dotenv";
import { deprecate } from "util";

/**
 * Gestisce il caricamento e validazione della configurazione
 * Supporta sia modalità standard che StepsPack
 */
export class ConfigManager {
  constructor(options = {}) {
    this.options = options;
    this.stepsPackPath = null;
    this.outputDir = null;
    this.settings = null;
  }

  /**
   * Carica configurazione da file o StepsPack
   */
  load() {
    if (this.options.stepspack) {
      return this._loadStepsPack();
    } else {
      return this._loadStandard();
    }
  }

  /**
   * Carica configurazione da StepsPack
   */
  _loadStepsPack() {
    const packName = this.options.stepspack;
    this.stepsPackPath = `./stepspacks/${packName}`;

    // Valida esistenza pack
    if (!fs.existsSync(this.stepsPackPath)) {
      this._throwPackNotFound(packName);
    }

    // ⚠️ NUOVO: Carica .env SOLO se NON siamo in CI/CD
    const packEnvPath = `${this.stepsPackPath}/.env`;
    if (fs.existsSync(packEnvPath) && !process.env.CI) {
      // ← Aggiunto check
      dotenv.config({ path: packEnvPath });
      console.log("🔑 API key caricata da StepsPack .env (locale)");
    } else if (process.env.OPENAI_API_KEY) {
      console.log("🔑 API key caricata da environment (CI/CD)");
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY.trim();
    }else{
      console.log("API key non esiste su env");
      process.exit(1);
    }
    console.log(`setted api key length: ${process.env.OPENAI_API_KEY.length}`);
   /* const packName = this.options.stepspack;
    this.stepsPackPath = `./stepspacks/${packName}`;

    // Valida esistenza pack
    if (!fs.existsSync(this.stepsPackPath)) {
      this._throwPackNotFound(packName);
    }

    // Carica .env del pack (opzionale)
    const packEnvPath = `${this.stepsPackPath}/.env`;
    if (fs.existsSync(packEnvPath)) {
      dotenv.config({ path: packEnvPath });

      console.log("🔑 API key caricata da StepsPack .env");
    }*/

    // Carica settings.json del pack
    const settingsPath = `${this.stepsPackPath}/settings.json`;
    if (!fs.existsSync(settingsPath)) {
      throw new Error(
        `File settings.json non trovato in ${this.stepsPackPath}`
      );
    }

    this.settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    // Override paths per il pack
    this.settings.execution.steps_file = `${this.stepsPackPath}/steps.json`;
    this.outputDir = `${this.stepsPackPath}/generated`;

    this.globalExpectations = this.settings.execution.global_expectations;

    console.log(`📦 StepsPack: ${packName}`);
    console.log(`📁 Output: ${this.outputDir}`);

    return this.settings;
  }

  /**
   * Carica configurazione standard
   */
  _loadStandard() {
    const settingsFile = this.options.mock
      ? "aidriven-settings.mock.json"
      : "aidriven-settings.json";

    if (!fs.existsSync(settingsFile)) {
      throw new Error(`File di configurazione non trovato: ${settingsFile}`);
    }

    this.settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    this.outputDir = "./generated/aidriven";

    return this.settings;
  }

  //deprecated
  validateStrength = deprecate(function (strength) {
    const valid = ["onlycache", "medium", "high"];

    if (!valid.includes(strength)) {
      throw new Error(
        `Strength non valido: ${strength}. Usa: ${valid.join(", ")}`
      );
    }

    return true;
  }, "validateStrength è deprecato, utilizza validateSpecifiedItems(standardValidItems = [], items = [], option)");

  /**
   * Valida configurazione delle opzioni
   */
  validateSpecifiedItems(standardValidItems = [], items = [], option) {
    if (!standardValidItems.includes(items)) {
      throw new Error(
        `${option} non valido: Usa: ${standardValidItems.join(", ")}`
      );
    }
    return true;
  }

  /**
   * Valida compatibilità opzioni
   */
  validateOptions() {
    const { strength, nocache, mock, stepspack, clean } = this.options;

    if (nocache && strength === "onlycache") {
      throw new Error("--nocache e --strength onlycache sono incompatibili");
    }

    if (mock && stepspack) {
      throw new Error("--mock e --stepspack sono incompatibili");
    }

    return true;
  }

  /**
   * Carica e valida steps dal file
   */
  loadSteps() {
    const stepsFile = this.settings.execution.steps_file;

    if (!fs.existsSync(stepsFile)) {
      throw new Error(`File steps non trovato: ${stepsFile}`);
    }

    const data = JSON.parse(fs.readFileSync(stepsFile, "utf8"));

    if (!data.steps || !Array.isArray(data.steps)) {
      throw new Error("Formato steps.json non valido: manca array 'steps'");
    }

    return data.steps;
  }

  /**
   * Valida cache per modalità onlycache
   */
  validateCache(steps) {
    const missingCache = steps.filter((step) => !step.cache);

    if (missingCache.length > 0) {
      console.error("\n❌ Cache mancante per i seguenti step:");
      missingCache.forEach((step) => {
        console.error(`   - Step ${step.index}: "${step.subPrompt}"`);
        console.error(`     File: ${this.outputDir}/step-${step.id}.js`);
      });

      console.error(
        "\n💡 Esegui con --strength medium/high per generare cache"
      );

      return false;
    }

    console.log("✅ Cache completa validata");
    return true;
  }

  /**
   * Ottiene directory di output
   */
  getOutputDir() {
    return this.outputDir;
  }

  /**
   * Ottiene settings caricati
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Genera summary della configurazione
   */
  getSummary() {
    console.log("---");
    return {
      stepspack: this.options.stepspack || null,
      outputDir: this.outputDir,
      strength: this.options.strength,
      cacheEnabled: !this.options.nocache,
      mockMode: this.options.mock || false,
      entryUrl: this.settings?.execution?.entrypoint_url,
      clean: this.options.clean || null,
    };
  }

  /**
   * Helper: errore pack non trovato
   */
  _throwPackNotFound(packName) {
    console.error(`❌ StepsPack non trovato: ${packName}`);

    if (fs.existsSync("./stepspacks")) {
      const available = fs
        .readdirSync("./stepspacks")
        .filter((f) => fs.statSync(`./stepspacks/${f}`).isDirectory());

      if (available.length > 0) {
        console.error("\nStepsPacks disponibili:");
        available.forEach((p) => console.error(`   - ${p}`));
      } else {
        console.error("\n(Nessun pack disponibile in ./stepspacks/)");
      }
    }

    throw new Error(`StepsPack non trovato: ${packName}`);
  }
}
