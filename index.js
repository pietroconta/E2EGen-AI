//TODO gestire l'esecuzione con più stepspack (Valutazione: autovalutaz - valutaz - colloquio - commenti)
// ============================================
// FILE: index.js (VERSIONE FINALE)
// ============================================

import OpenAI from "openai";
import { program } from "commander";

// Core components
import { Step } from "./models/Step.js";
import { TestExecutor } from "./core/TestExecutor.js";
import { CodeGenerator } from "./core/CodeGenerator.js";
import { RetryManager } from "./core/RetryManager.js";
import { TestReporter } from "./core/TestReporter.js";
import { TestRunner } from "./core/TestRunner.js";
import { ConfigManager } from "./core/ConfigManager.js";
import { MockOpenAI } from "./mock-openai.js";
import { Cleaner } from "./utils/Cleaner.js";
/* -----------------------------------------------
   CLI CONFIGURATION
-------------------------------------------------- */
program
  .name("aidriven-test")
  .description("AI-Driven Playwright Test Executor")
  .version("2.0.0")
  .option("--mock", "Use mock OpenAI (debug mode)")
  .option(
    "--strength <level>",
    "AI strength: onlycache, medium, high",
    "medium"
  )
  .option(
    "--htmlclean-remove <items>",
    "Comma-separated elements to remove from HTML",
    "comments,script,style,svg,img,attributes,longtext"
  )
  .option("--htmlclean-keep <items>", "Comma-separated elements to keep", "")
  .option("--nocache", "Disable cache usage")
  .option("--stepspack <name>", "Use steps pack from ./stepspacks/<name>")
  .option("--html-report", "Generate HTML report")
  .option("--screenshot", "Generate screenshot report")
  .option(
    "--clean <items>",
    "To be able to clean: only orphans for now",
    "orphans"
  );
//.option("--stop-on-error", "Stop execution on first critical error");

program.parse();
const options = program.opts();

/* -----------------------------------------------
   CONFIGURATION LOADING
-------------------------------------------------- */
const configManager = new ConfigManager(options);

try {
  // Validate options compatibility
  configManager.validateOptions();
  //configManager.validateStrength(options.strength);
  configManager.validateSpecifiedItems(
    ["onlycache", "medium", "high"],
    options.strength,
    "strength"
  );
  configManager.validateSpecifiedItems(["orphans"], options.clean, "clean");
  const toClean = options.clean.trim().split(",");
  // Load configuration
  const settings = configManager.load();
  const { execution, ai_agent } = settings;

  const globalExpectationsPrompt = execution.global_expectations;

  /* -----------------------------------------------
     STEP CONFIGURATION
  -------------------------------------------------- */
  const strengthConfig = {
    onlycache: { maxAttempts: 1, cacheFirst: true },
    medium: { maxAttempts: 2, cacheFirst: true },
    high: { maxAttempts: 3, cacheFirst: true },
  };

  const strengthSettings = strengthConfig[options.strength];

  // FIX: Imposta outputDir PRIMA di creare gli step
  Step.outputDir = configManager.getOutputDir();
  Step.maxAttempts = strengthSettings.maxAttempts;
  Step.cacheFirst = options.nocache ? false : strengthSettings.cacheFirst;

  /* -----------------------------------------------
     OPENAI CLIENT INITIALIZATION
  -------------------------------------------------- */
  const client = options.mock
    ? new MockOpenAI({
        apiKey: "mock-key",
        baseURL: "mock-url",
        hardCode: settings.hc_code,
      })
    : new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: ai_agent.endpoint,
        defaultQuery: { "api-version": "2024-12-01-preview" },
      });

      console.log("Setted LLM endpoint: " + ai_agent.endpoint);

  /* -----------------------------------------------
     HTML CLEANING CONFIGURATION
  -------------------------------------------------- */
  const removeItems = options.htmlcleanRemove
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  const keepItems = options.htmlcleanKeep
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  /* -----------------------------------------------
     COMPONENT INITIALIZATION
  -------------------------------------------------- */
  const executor = new TestExecutor({
    outputDir: configManager.getOutputDir(),
    removeItems,
    screenshot: options.screenshot,
    keepItems,
  });

  const codeGenerator = new CodeGenerator(client, {
    model: ai_agent.model || "gpt-4o",
  });

  const retryManager = new RetryManager({
    strategy: options.strength,
  });

  const reporter = new TestReporter({
    outputDir: configManager.getOutputDir(),
    stepsPack: options.stepspack || null,
  });
  var stepspack = options.stepspack;
  const runner = new TestRunner({
    executor,
    stepspack,
    codeGenerator,
    retryManager,
    reporter,
    headless: execution.headless,
    strength: options.strength,
    noCache: options.nocache,
    mockMode: options.mock,
    stopOnError: options.stopOnError,
    generateHtmlReport: options.htmlReport,
    costConfig: {
      input: ai_agent.cost_input_token || 0,
      output: ai_agent.cost_output_token || 0,
      cached: ai_agent.cost_cached_token || 0,
    },
  });

  /* -----------------------------------------------
     LOAD STEPS 
  -------------------------------------------------- */
  const stepsData = configManager.loadSteps();
  /* -----------------------------------------------
     VALIDATE STEPS
  -------------------------------------------------- */

  const steps = stepsData.map((s, i) => {
    let expectations = [];

    try {
      if (Array.isArray(s.expectations)) {
        expectations = s.expectations;
      } else if (typeof s.expectations === "string") {
        expectations = JSON.parse(s.expectations);
      }
    } catch (err) {
      console.warn("⚠️ expectations parse error:", err);
    }
    const stepExpectations = [...expectations];
    /*if (gloabExpectPrompt && !expectations.includes(gloabExpectPrompt))
      expectations.push(gloabExpectPrompt);*/

    if (globalExpectationsPrompt && Array.isArray(globalExpectationsPrompt)) {
      globalExpectationsPrompt.forEach((element) => {
        if(!expectations.includes(element)){
          expectations.push(element);
        }
      });
    }

    return new Step({
      index: i + 1,
      subPrompt: s.sub_prompt,
      timeout: s.timeout || 10000,
      totalSteps: stepsData.length,
      stepsPack: options.stepspack,
      expectations: expectations,
      stepExpectations: stepExpectations,
    });
  });

  /* -----------------------------------------------
     CLEAN /generated orphans
  -------------------------------------------------- */
  /*if(options.clean.includes("orphans")){
    console.log("orphans cleaning");
    steps.map((value)=>{
      console.log(value.id);
    })
  }*/
  const cleaner = new Cleaner({
    stepsPack: options.stepspack,
    toClean: toClean,
    steps: steps,
  });

  cleaner.clean();

  /* -----------------------------------------------
     CACHE VALIDATION (onlycache mode)
  -------------------------------------------------- */
  if (options.strength === "onlycache") {
    if (!configManager.validateCache(steps)) {
      process.exit(1);
    }
  }

  /* -----------------------------------------------
     EXECUTION SUMMARY
  -------------------------------------------------- */
  const summary = configManager.getSummary();
  console.log("\n" + "=".repeat(50));
  console.log("🚀 AI-DRIVEN TEST EXECUTION");
  console.log("=".repeat(50));
  console.log(`📦 StepsPack: ${summary.stepspack || "Standard"}`);
  console.log(`🌐 Entry URL: ${summary.entryUrl}`);
  console.log(`📋 Total Steps: ${steps.length}`);
  console.log(`⚙️  Strength: ${summary.strength}`);
  console.log(`💾 Cache: ${summary.cacheEnabled ? "Enabled" : "Disabled"}`);
  console.log(`🤖 Mode: ${summary.mockMode ? "Mock" : "Live"}`);
  console.log("=".repeat(50) + "\n");

  /* -----------------------------------------------
     MAIN EXECUTION
  -------------------------------------------------- */
  (async () => {
    try {
      const result = await runner.run(steps, summary.entryUrl);

      // Exit with appropriate code
      process.exit(result.failureCount > 0 ? 1 : 0);
    } catch (error) {
      console.error("\n💥 EXECUTION FAILED:", error.message);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
} catch (error) {
  console.error("\n❌ CONFIGURATION ERROR:", error.message);
  process.exit(1);
}
