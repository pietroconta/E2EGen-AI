# 🤖 E2EGen AI - AI-Assisted Playwright Test Generation

**Intelligent end-to-end test generation powered by GPT-4o** - Describe test steps in natural language, let AI generate the Playwright code, then execute with confidence.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Playwright](https://img.shields.io/badge/playwright-1.56.0-orange.svg)](https://playwright.dev)

## ✨ Features

- 🧠 **AI-Assisted Code Generation**: GPT-4o converts natural language descriptions into executable Playwright code
- 💾 **Smart Caching**: Zero-cost reruns with intelligent code caching system
- 🔄 **Configurable Retry Logic**: Multi-attempt strategies with error context learning
- 📦 **StepsPacks**: Organize tests into reusable, isolated test suites with dedicated configuration
- 🎯 **Intelligent HTML Cleaning**: Optimize context sent to AI by removing irrelevant HTML elements
- 📊 **Comprehensive Reporting**: JSON and HTML reports with detailed token usage and cost tracking
- 🔧 **Mock Mode**: Debug workflows without API costs using simulated AI responses
- ⚡ **Flexible Strength Levels**: Balance reliability vs. cost with onlycache/medium/high modes
- ✅ **Custom Expectations**: Define validation rules per step with automatic error handling
- 🌍 **Global Expectations**: Apply common validation rules across all steps in a test suite

## 📋 Table of Contents

- [What is E2EGen AI?](#-what-is-e2egen-ai)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [CLI Options](#-cli-options)
- [How It Works](#-how-it-works)
- [StepsPacks](#-stepspacks)
- [Expectations System](#-expectations-system)
- [Examples](#-examples)
- [Cost Optimization](#-cost-optimization)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 What is E2EGen AI?

**E2EGen AI** is an AI-assisted testing framework that bridges the gap between human intent and automated browser testing. Unlike fully autonomous AI-driven testing where AI makes decisions independently, E2EGen AI:

- **Assists developers**: You define test logic in natural language, AI generates the implementation
- **Maintains control**: You review, cache, and reuse generated code for deterministic test execution
- **Reduces friction**: Eliminates the tedious work of writing selectors and handling browser APIs
- **Optimizes costs**: Caching ensures AI is only used for code generation, not repeated execution

**Think of it as**: A coding assistant specialized in Playwright automation, not a replacement for human test design.

## 🚀 Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key (Azure OpenAI or standard OpenAI)

### Setup

```bash
# Clone repository
git clone <your-repo-url>
cd pw-ai-smartpeg

# Install dependencies
npm install

# Configure API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Environment Configuration

Create a `.env` file:

```env
OPENAI_API_KEY=your_azure_openai_key_here
```

## ⚡ Quick Start

### 1. Configure Your Test Suite

Edit `aidriven-settings.json`:

```json
{
  "execution": {
    "entrypoint_url": "https://your-site.com",
    "headless": false,
    "steps_file": "aidriven-steps.json"
  },
  "ai_agent": {
    "type": "gpt-4o",
    "endpoint": "https://your-endpoint.openai.azure.com/openai/deployments/gpt-4o",
    "cost_input_token": "0.000005",
    "cost_output_token": "0.00002",
    "cost_cached_token": "0.0000025"
  }
}
```

### 2. Define Test Steps in Natural Language

Edit `aidriven-steps.json`:

```json
{
  "steps": [
    {
      "sub_prompt": "Click the login button",
      "timeout": "5000"
    },
    {
      "sub_prompt": "Fill username with test@example.com and password with SecurePass123",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Click submit and wait for dashboard",
      "timeout": "8000"
    }
  ]
}
```

### 3. Generate and Execute Tests

```bash
# First run - AI generates Playwright code and builds cache
node index.js --strength medium

# Subsequent runs - Execute cached code (zero AI cost)
node index.js --strength onlycache

# High reliability mode - 3 retry attempts with error learning
node index.js --strength high
```

## ⚙️ Configuration

### Settings File Structure

**aidriven-settings.json**:

| Field | Description | Example |
|-------|-------------|---------|
| `execution.entrypoint_url` | Starting URL for test execution | `"https://example.com"` |
| `execution.headless` | Run browser in headless mode | `false` |
| `execution.steps_file` | Path to steps JSON file | `"aidriven-steps.json"` |
| `execution.global_expectations` | Array of validations applied to all steps | `["No error banner visible"]` |
| `ai_agent.type` | AI model identifier | `"gpt-4o"` |
| `ai_agent.endpoint` | Azure OpenAI deployment endpoint | `"https://..."` |
| `ai_agent.cost_input_token` | Cost per input token (USD) | `"0.000005"` |
| `ai_agent.cost_output_token` | Cost per output token (USD) | `"0.00002"` |
| `ai_agent.cost_cached_token` | Cost per cached token (USD) | `"0.0000025"` |

### Steps File Structure

**aidriven-steps.json**:

```json
{
  "steps": [
    {
      "id": "73443201",              // Auto-generated MD5 hash (optional)
      "sub_prompt": "Your task description in natural language",
      "timeout": "10000",            // Milliseconds to wait after step execution
      "expectations": [              // Optional: step-specific validations
        "Success message must appear",
        "No error dialog visible"
      ]
    }
  ]
}
```

**Step Fields**:
- `sub_prompt` (required): Natural language task description
- `timeout` (optional): Pause duration after step completion (default: 10000ms)
- `expectations` (optional): Array of validation rules specific to this step
- `id` (auto-generated): MD5 hash based on prompt + timeout + expectations (used for caching)

## 🎛️ CLI Options

### Strength Modes

```bash
--strength <level>
```

| Level | Attempts | Cache Behavior | Use Case |
|-------|----------|----------------|----------|
| `onlycache` | 1 | Required | Zero-cost reruns of stable tests (fails if cache missing) |
| `medium` | 2 | Preferred | **Default** - Balance of cost and reliability |
| `high` | 3 | Preferred | Complex workflows requiring retry with error context |

### Additional Flags

```bash
# Disable caching entirely (always generate fresh code)
--nocache

# Mock mode (no API calls, uses predefined actions)
--mock

# Use a specific StepsPack
--stepspack <name>

# Generate HTML report in addition to JSON
--html-report

# Customize HTML cleaning behavior
--htmlclean-remove <items>
--htmlclean-keep <items>

# Clean orphaned cache files
--clean orphans
```

### HTML Cleaning Options

Control which HTML elements are removed before sending context to AI (reduces token usage):

```bash
# Default configuration (recommended)
node index.js

# Aggressive cleaning - remove everything except specific attributes
--htmlclean-remove all --htmlclean-keep id,class,data-testid

# Custom cleaning strategy
--htmlclean-remove comments,script,style,svg,img,longtext
```

**Available cleaning items**: 
- `comments` - HTML comments
- `script` - `<script>` tags and content
- `style` - `<style>` tags and inline styles
- `svg` - SVG graphics and paths
- `img` - Image src attributes
- `inlinestyle` - Inline style attributes
- `attributes` - Non-essential data-* and aria-* attributes
- `longtext` - Text content exceeding 25 characters
- `all` - Remove all of the above (use with `--htmlclean-keep`)

## 🔍 How It Works

### Architecture Overview

```
┌─────────────┐
│   index.js  │  CLI entry point and orchestration
└──────┬──────┘
       │
       ├─► ConfigManager    → Load settings, validate options, manage StepsPacks
       ├─► CodeGenerator    → Generate Playwright code via GPT-4o
       ├─► TestExecutor     → Execute generated code with Playwright
       ├─► RetryManager     → Handle retry logic with error context
       ├─► TestReporter     → Track execution, calculate costs, generate reports
       └─► TestRunner       → Coordinate end-to-end test execution
```

### Execution Flow

#### 1. **Initialization Phase**
   - Parse CLI arguments and validate configuration
   - Load settings from JSON (standard or StepsPack)
   - Initialize OpenAI client (or MockOpenAI for debugging)
   - Configure retry strategy based on `--strength` level

#### 2. **Step Preparation**
   - Read test steps from JSON file
   - Generate unique MD5 hash ID for each step (based on prompt + timeout + expectations)
   - Validate cache availability (critical for `onlycache` mode)
   - Apply global expectations to all steps

#### 3. **Browser Launch**
   - Launch Chromium via Playwright
   - Navigate to entry point URL
   - Wait for initial page load (networkidle)

#### 4. **Step Execution Loop**

   For each test step:
   
   **a) Cache Lookup** (if caching enabled):
   ```javascript
   const cachePath = `./generated/aidriven/step-${hash}.js`;
   if (fs.existsSync(cachePath)) {
     // Use cached code → Zero API cost
     code = fs.readFileSync(cachePath, "utf8");
   }
   ```
   
   **b) AI Code Generation** (if cache miss):
   ```javascript
   // Extract and clean HTML from current page
   const rawHtml = await page.$eval("body", el => el.outerHTML);
   const cleanedHtml = executor.cleanHtml(rawHtml);
   
   // Generate code via GPT-4o with context
   const response = await client.chat.completions.create({
     model: "gpt-4o",
     messages: [
       { role: "system", content: systemPrompt },
       { 
         role: "user", 
         content: `Task: ${step.subPrompt}\nURL: ${page.url()}\nHTML: ${cleanedHtml}` 
       }
     ]
   });
   
   const code = extractCodeFromResponse(response);
   
   // Save to cache for future runs
   fs.writeFileSync(cachePath, code);
   ```
   
   **c) Code Execution**:
   ```javascript
   // Wrap generated code in async function with Playwright context
   const asyncFn = eval(`(async (page, expect) => { ${code} })`);
   
   try {
     await asyncFn(page, expect);
     step.success = true;
   } catch (error) {
     step.errors.push(error);
   }
   ```
   
   **d) Retry Logic** (if execution failed):
   - Check remaining attempts based on strength level
   - On retry: Include previous error message in AI prompt for smarter code generation
   - If error message starts with "Test failed:" → Stop retrying (intentional failure)
   - Update token usage counters for cost tracking
   
   **e) Post-Step Actions**:
   - Log execution result (success/failure, tokens used, cache hit)
   - Wait for configured timeout before next step
   - Proceed to next step (or halt if critical error + `--stop-on-error`)

#### 5. **Completion & Reporting**
   - Close browser session
   - Calculate total token usage and estimated cost
   - Save execution log to `run-logs.json` with detailed analytics
   - Update steps file with auto-generated IDs for caching
   - Generate HTML report (if `--html-report` flag enabled)

### Caching Strategy

**ID Generation**:
```javascript
const stepData = {
  sub_prompt: step.subPrompt,
  timeout: step.timeout,
  expectations: step.expectations
};

const id = crypto.createHash("md5")
  .update(JSON.stringify(stepData))
  .digest("hex")
  .substring(0, 8);

// Cache path: ./generated/aidriven/step-{id}.js
```

**Cache Validation** (onlycache mode):
```javascript
const missingCache = steps.filter(step => !fs.existsSync(`${outputDir}/step-${step.id}.js`));

if (missingCache.length > 0) {
  console.error("❌ Missing cache for steps:", missingCache.map(s => s.index));
  console.error("💡 Run with --strength medium/high to generate cache");
  process.exit(1);
}
```

**Benefits**:
- **Zero AI cost** on cache hits (99% of reruns after initial generation)
- **Deterministic behavior** - same code executes every time
- **Faster execution** - no network latency for AI requests
- **Version control friendly** - cache files can be committed for team sharing

## 📦 StepsPacks

Organize related test scenarios into isolated, self-contained packages with dedicated configuration, cache, and reports.

### Directory Structure

```
stepspacks/
├── login-flow/
│   ├── .env                     # Optional: Pack-specific API keys
│   ├── settings.json            # Pack configuration
│   ├── steps.json               # Test steps definition
│   ├── media/                   # Assets (images, test data files)
│   │   └── test-image.png
│   └── generated/               # Execution artifacts
│       ├── step-{hash}.js       # Cached Playwright code
│       ├── run-logs.json        # Execution history
│       ├── report.html          # HTML report
│       └── debug/               # HTML snapshots (pre/post cleaning)
│           ├── pre-clean/
│           └── post-clean/
├── checkout-flow/
└── admin-panel/
```

### Creating a StepsPack

```bash
# 1. Create pack directory structure
mkdir -p stepspacks/login-flow/{media,generated}

# 2. Create settings.json
cat > stepspacks/login-flow/settings.json << 'EOF'
{
  "execution": {
    "entrypoint_url": "https://myapp.com/login",
    "headless": false,
    "global_expectations": [
      "No error banner with 'Application Error' text visible"
    ]
  },
  "ai_agent": {
    "type": "gpt-4o",
    "endpoint": "https://your-endpoint.openai.azure.com/openai/deployments/gpt-4o",
    "cost_input_token": "0.000005",
    "cost_output_token": "0.00002",
    "cost_cached_token": "0.0000025"
  }
}
EOF

# 3. Create steps.json
cat > stepspacks/login-flow/steps.json << 'EOF'
{
  "steps": [
    {
      "sub_prompt": "Enter email user@example.com in the email field",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Enter password SecurePass123 and click the login button",
      "timeout": "5000",
      "expectations": [
        "Welcome message must appear within 3 seconds"
      ]
    }
  ]
}
EOF

# 4. (Optional) Add pack-specific API key
echo "OPENAI_API_KEY=your_pack_specific_key" > stepspacks/login-flow/.env
```

### Running a StepsPack

```bash
# Execute specific pack
node index.js --stepspack login-flow --strength medium

# With HTML report generation
node index.js --stepspack login-flow --html-report --strength high

# List available packs
ls stepspacks/
# Output: login-flow  checkout-flow  admin-panel
```

### Benefits of StepsPacks

✅ **Isolation**: Separate cache, reports, and configuration per test suite  
✅ **Reusability**: Share packs across projects via version control  
✅ **Security**: Pack-specific `.env` files for different API keys/environments  
✅ **Organization**: Group related scenarios (e.g., all checkout flows)  
✅ **Collaboration**: Team members can work on different packs independently

## 🎯 Expectations System

Expectations allow you to define validation rules that AI must verify during step execution, enabling sophisticated test assertions in natural language.

### Step-Level Expectations

Define expectations specific to a single step:

```json
{
  "steps": [
    {
      "sub_prompt": "Click the submit button",
      "timeout": "5000",
      "expectations": [
        "Success message with text 'Data saved' must appear",
        "No error toast visible"
      ]
    }
  ]
}
```

**How it works**:
- AI generates code that checks for these conditions
- If expectations fail, AI throws error: `Test failed: [expectation description]`
- Failed expectations trigger retries (unless `Test failed:` prefix detected)

### Global Expectations

Apply common validations across **all steps** in a test suite:

```json
{
  "execution": {
    "entrypoint_url": "https://myapp.com",
    "global_expectations": [
      "No banner with 'Application Error' text visible",
      "No network error dialogs present"
    ]
  }
}
```

**Global expectations are automatically merged** with step-specific expectations, so you don't need to repeat common checks.

### Expectation Best Practices

✅ **Use natural language**: "Success banner appears" not "expect(locator).toBeVisible()"  
✅ **Be specific**: "Welcome message contains 'John Doe'" not "Some text appears"  
✅ **Include timeouts**: "Within 3 seconds after clicking, modal must close"  
✅ **Case insensitive**: AI automatically handles case variations  
✅ **Negative assertions**: "No error message visible" is valid

### Example: Login with Validation

```json
{
  "steps": [
    {
      "sub_prompt": "Enter username 'admin' and password 'wrong_password', then click login",
      "timeout": "5000",
      "expectations": [
        "Wait 3 seconds after clicking login",
        "An error banner with text 'Invalid credentials' must appear",
        "Login button must still be visible (not navigated away)"
      ]
    }
  ]
}
```

AI will generate code like:
```javascript
await page.fill('#username', 'admin');
await page.fill('#password', 'wrong_password');
await page.click('#login-btn');

await page.waitForTimeout(3000);

const errorBanner = page.locator('text=/invalid credentials/i');
if (!(await errorBanner.isVisible())) {
  throw new Error("Test failed: Error banner with 'Invalid credentials' not visible");
}

const loginBtn = page.locator('#login-btn');
if (!(await loginBtn.isVisible())) {
  throw new Error("Test failed: Login button not visible after failed attempt");
}
```

## 🎨 Examples

### Example 1: E-commerce Login Flow

**stepspacks/ecommerce-login/steps.json**:
```json
{
  "steps": [
    {
      "sub_prompt": "Wait for page to fully load, then click the 'Sign In' link in the header navigation",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Fill email field with user@example.com and password field with SecurePass123!",
      "timeout": "2000"
    },
    {
      "sub_prompt": "Click the login submit button and wait for dashboard",
      "timeout": "5000",
      "expectations": [
        "Welcome message containing user's name must appear",
        "User avatar icon visible in top-right corner"
      ]
    }
  ]
}
```

**Execution**:
```bash
# Generate cache (first run only)
node index.js --stepspack ecommerce-login --strength medium

# All subsequent runs use cache ($0.00 AI cost)
node index.js --stepspack ecommerce-login --strength onlycache
```

### Example 2: Form Submission with Conditional Validation

**stepspacks/data-export/steps.json**:
```json
{
  "steps": [
    {
      "sub_prompt": "Navigate to Analysis dropdown menu and click 'Smart Compare'",
      "timeout": "5000"
    },
    {
      "sub_prompt": "Select date range 'Last 30 days' from the filter dropdown",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Check if export button is enabled. If disabled, throw error 'Export unavailable'. If enabled, click it.",
      "timeout": "8000",
      "expectations": [
        "Download notification or progress bar must appear within 5 seconds"
      ]
    }
  ]
}
```

**High reliability execution**:
```bash
node index.js --stepspack data-export --strength high --html-report
```

### Example 3: File Upload Workflow

**stepspacks/profile-photo/steps.json**:
```json
{
  "steps": [
    {
      "sub_prompt": "Click the three-dot menu icon in the profile section",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Click the 'Edit Photo' button with id #btn_modifica_foto",
      "timeout": "4000"
    },
    {
      "sub_prompt": "Click 'Choose File' and select /path/to/stepspacks/profile-photo/media/avatar.png. Wait 3 seconds, then click the enabled save button",
      "timeout": "15000",
      "expectations": [
        "Success toast with text 'Photo updated' appears",
        "New photo is visible in profile section"
      ]
    }
  ]
}
```

### Example 4: Negative Testing with Expected Failures

**stepspacks/invalid-login/steps.json**:
```json
{
  "steps": [
    {
      "sub_prompt": "If cookie consent banner is visible, click 'Accept All'",
      "timeout": "3000"
    },
    {
      "sub_prompt": "Click the login button in header",
      "timeout": "2000"
    },
    {
      "sub_prompt": "Enter username 'admin' and password 'wrong_password', then click login",
      "timeout": "5000",
      "expectations": [
        "Wait 3 seconds after clicking login",
        "Error banner with text 'Invalid username or password' must appear"
      ]
    }
  ]
}
```

**Note**: When expectations explicitly validate errors (like above), the test **passes** if the error appears as expected. AI detects this pattern and generates appropriate validation code.

### Example 5: Multi-Step Form with Progress Validation

**stepspacks/onboarding/steps.json**:
```json
{
  "steps": [
    {
      "sub_prompt": "Fill 'First Name' with John, 'Last Name' with Doe, 'Email' with john@example.com, then click Next",
      "timeout": "3000",
      "expectations": [
        "Step 2 indicator becomes active",
        "Step 1 indicator shows completed checkmark"
      ]
    },
    {
      "sub_prompt": "Select 'Developer' from role dropdown, enter company name 'Acme Corp', click Next",
      "timeout": "3000",
      "expectations": [
        "Step 3 indicator becomes active"
      ]
    },
    {
      "sub_prompt": "Check 'I agree to terms' checkbox, click 'Complete Registration'",
      "timeout": "8000",
      "expectations": [
        "Success page with text 'Welcome to the platform' appears",
        "Confirmation email sent message visible"
      ]
    }
  ]
}
```

## 💰 Cost Optimization

### Best Practices

#### 1. Leverage Caching Aggressively

```bash
# First run: Generate code and build cache
node index.js --stepspack my-test --strength medium
# Cost: ~$0.30 (one-time for 10 steps)

# All subsequent runs: Execute cached code
node index.js --stepspack my-test --strength onlycache
# Cost: $0.00 ✨ (indefinitely, until steps change)
```

**Savings**: 100% cost reduction on reruns. For a test suite run daily:
- Month 1: $0.30 (initial) + $0.00 × 29 days = **$0.30**
- Without caching: $0.30 × 30 days = **$9.00**
- **Savings: 97% ($8.70/month)**

#### 2. Start with Medium Strength

- **Default**: `--strength medium` (2 attempts) balances cost and reliability
- **Reserve high**: Use `--strength high` (3 attempts) only for flaky/complex flows
- **Use onlycache**: For stable tests in CI/CD pipelines after initial cache generation

```bash
# Development: Allow AI to retry on failures
npm run test:dev -- --strength medium

# CI/CD: Use cached code only (fails fast if cache missing)
npm run test:ci -- --strength onlycache
```

#### 3. Optimize HTML Cleaning

Reduce token usage by stripping unnecessary HTML elements:

```bash
# Aggressive cleaning (minimal tokens, maximum savings)
node index.js --htmlclean-remove all --htmlclean-keep id,class,data-testid

# Balanced approach (default, recommended)
node index.js --htmlclean-remove comments,script,style,svg,img,longtext

# Conservative (keep more context, higher tokens)
node index.js --htmlclean-remove comments,script
```

**Impact**: Aggressive cleaning can reduce input tokens by **60-80%**, saving ~$0.02-0.05 per step generation.

#### 4. Monitor Token Usage

After execution, review `run-logs.json` for cost insights:

```json
{
  "runs": [{
    "usage": {
      "total_tokens": 12450,
      "input_tokens": 10000,
      "output_tokens": 2000,
      "cached_tokens": 8500,
      "calculated_cost": 0.0375
    }
  }]
}
```

**Key metrics**:
- **Cached tokens**: Azure OpenAI automatically caches repeated prompt content (50% cheaper)
- **Input tokens**: Reduce via HTML cleaning and concise prompts
- **Output tokens**: AI-generated code length (optimize by being specific in prompts)

#### 5. Write Concise, Specific Prompts

✅ **Good**: Clear and focused
```json
{
  "sub_prompt": "Click login button with id #btn_login"
}
```

❌ **Bad**: Verbose and redundant
```json
{
  "sub_prompt": "Please locate the login button on the page, which should be somewhere near the top of the form area, and when you successfully find it, proceed to click on it so we can move to the next step of the authentication process"
}
```

**Impact**: Verbose prompts can **double token usage** with no benefit. Concise prompts also generate simpler, more reliable code.

#### 6. Use Global Expectations Wisely

Instead of repeating common checks:

❌ **Inefficient**:
```json
{
  "steps": [
    {
      "sub_prompt": "Click submit",
      "expectations": ["No error banner visible"]
    },
    {
      "sub_prompt": "Click next",
      "expectations": ["No error banner visible"]
    }
  ]
}
```

✅ **Efficient**:
```json
{
  "execution": {
    "global_expectations": ["No error banner visible"]
  },
  "steps": [
    { "sub_prompt": "Click submit" },
    { "sub_prompt": "Click next" }
  ]
}
```

### Cost Example: 10-Step Test Suite

**Assumptions**:
- 10 steps, ~1000 tokens per step (input)
- ~100 tokens per step (output)
- 50% of input tokens cached by Azure OpenAI on reruns

| Mode | API Calls | Input Tokens | Output Tokens | Cached Tokens | Cost (USD) |
|------|-----------|--------------|---------------|---------------|------------|
| **First run (medium)** | 10 | 10,000 | 1,000 | 0 | **$0.27** |
| **Rerun with cache** | 0 | 0 | 0 | 0 | **$0.00** ✨ |
| **Medium (no cache)** | 10 | 10,000 | 1,000 | 5,000 | **$0.21** |
| **High (3 attempts)** | 15 | 15,000 | 1,500 | 7,500 | **$0.31** |

**Cost breakdown**:
```
Input tokens:  10,000 × $0.000005 = $0.05
Output tokens:  1,000 × $0.00002  = $0.02
Cached tokens:  5,000 × $0.0000025 = $0.0125
Total: $0.0825 (typical rerun with partial cache)
```

**Monthly projection** (30 runs):
- With caching: $0.27 (first) + $0.00 × 29 = **$0.27/month**
- Without caching: $0.27 × 30 = **$8.10/month**
- **Savings: 97% ($7.83/month per test suite)**

### Recommendation

1. **Development**: Use `--strength medium` to build cache
2. **CI/CD**: Use `--strength onlycache` for zero-cost execution
3. **Debugging**: Add `--nocache` temporarily to regenerate problematic steps
4. **Production**: Monitor `run-logs.json` and optimize HTML cleaning if costs exceed budget

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cache file not found" in onlycache mode

```bash
❌ ERRORE: Cache mancante per i seguenti step:
   - Step 1: "Click login button"
     File atteso: ./generated/aidriven/step-aa9c1054.js

💡 Suggerimento: Esegui prima con --strength medium o --strength high
```

**Cause**: Step definition changed (prompt, timeout, or expectations), invalidating cache hash.

**Solutions**:
```bash
# Regenerate cache for all steps
node index.js --strength medium --nocache

# Or use medium strength without nocache (updates only missing cache)
node index.js --strength medium
```

#### 2. "Element not found" or "Selector not visible" errors

**Common causes**:
- Page not fully loaded before step execution
- Dynamic content/selectors changed since code generation
- Element hidden behind modal or outside viewport
- Race condition (element appears/disappears quickly)

**Solutions**:

**a) Increase timeout** to allow more load time:
```json
{
  "sub_prompt": "Click submit button",
  "timeout": "10000"  // Increased from 5000
}
```

**b) Use high strength** for retry with error learning:
```bash
node index.js --strength high
```
AI will receive previous error message and generate smarter code (e.g., explicit waits, alternative selectors
```bash
node index.js --strength high
```
AI will receive previous error message and generate smarter code (e.g., explicit waits, alternative selectors).

**c) Clear cache** if page structure changed:
```bash
node index.js --nocache --strength medium
```

**d) Inspect generated code** to debug selector issues:
```bash
cat ./generated/aidriven/step-{hash}.js
```

**e) Be more specific** in your prompt:
```json
// ❌ Vague
{
  "sub_prompt": "Click the button"
}

// ✅ Specific
{
  "sub_prompt": "Click the blue 'Submit' button with id #btn-submit in the form footer"
}
```

#### 3. Token/Cost Calculation Incorrect

**Symptoms**:
- Reported costs don't match expected values
- Cached token count seems wrong
- Usage stats missing in `run-logs.json`

**Debugging steps**:

1. **Verify cost configuration** in settings:
```json
{
  "ai_agent": {
    "cost_input_token": "0.000005",   // Check Azure pricing page
    "cost_output_token": "0.00002",
    "cost_cached_token": "0.0000025"
  }
}
```

2. **Review execution log**:
```bash
cat ./generated/aidriven/run-logs.json | jq '.runs[-1].usage'
```

3. **Check OpenAI response** for token details:
- Cached tokens only reported by Azure OpenAI (not standard OpenAI API)
- Ensure you're using Azure endpoint with `api-version: 2024-12-01-preview`

#### 4. Incompatible CLI Options Error

```bash
❌ --strength onlycache e --nocache sono opzioni incompatibili
```

**Cause**: Conflicting flags that contradict each other.

**Invalid combinations**:
- `--strength onlycache` + `--nocache` (onlycache requires cache, nocache disables it)
- `--mock` + `--stepspack` (mock mode uses hardcoded actions, incompatible with StepsPacks)

**Solution**: Review your command and remove conflicting flags.

#### 5. "Test failed:" Intentional Failures

```bash
❌ Step 2 fallito (tentativo 1)
   Errore: Test failed: Invalid credentials error banner not visible
```

**This is expected behavior**, not a bug. When AI detects "Test failed:" prefix, it means:
- Your expectations explicitly required an error/condition
- That condition was not met
- Test should fail (no retry attempted)

**Example scenario**:
```json
{
  "sub_prompt": "Enter wrong password and click login",
  "expectations": [
    "Error banner with 'Invalid credentials' must appear"
  ]
}
```

If the error banner doesn't appear, the test **should fail** because the application didn't behave as expected.

**Not an error**: This validates your application is working correctly (or catches bugs).

#### 6. HTML Cleaning Too Aggressive

**Symptoms**:
- AI generates code that can't find elements
- Selectors in generated code are overly generic
- Steps fail that previously worked

**Cause**: `--htmlclean-remove` stripped essential attributes AI needs for locators.

**Solutions**:

**a) Use less aggressive cleaning**:
```bash
# Instead of:
node index.js --htmlclean-remove all --htmlclean-keep id

# Try:
node index.js --htmlclean-remove all --htmlclean-keep id,class,data-testid,aria-label
```

**b) Review cleaned HTML** to verify important attributes remain:
```bash
cat ./generated/aidriven/debug/post-clean/1.html
```

**c) Default cleaning** is usually optimal:
```bash
# Recommended balance of token reduction and context preservation
node index.js
# (no htmlclean flags = default behavior)
```

#### 7. StepsPack Not Found

```bash
❌ StepsPack non trovato: my-pack

StepsPacks disponibili:
   - login-flow
   - checkout-flow
```

**Cause**: Typo in pack name or pack doesn't exist.

**Solutions**:

**a) List available packs**:
```bash
ls stepspacks/
```

**b) Check exact spelling** (case-sensitive):
```bash
# ❌ Wrong
node index.js --stepspack Login-Flow

# ✅ Correct
node index.js --stepspack login-flow
```

**c) Create the pack** if it doesn't exist:
```bash
mkdir -p stepspacks/my-pack
cp stepspacks/login-flow/settings.json stepspacks/my-pack/
# Edit settings.json and create steps.json
```

#### 8. Global Expectations Not Applied

**Symptoms**:
- Global expectations in `settings.json` not validated
- Steps pass when global expectation should fail

**Causes & Solutions**:

**a) Check settings.json syntax**:
```json
{
  "execution": {
    "global_expectations": [        // ✅ Correct: array
      "No error banner visible"
    ]
  }
}

// ❌ Wrong:
{
  "execution": {
    "global_expect": "No error"     // Wrong key name
  }
}
```

**b) Verify in generated prompt**:
```bash
# Check console output during execution - AI prompt should include:
# "Devono verificarsi queste expectations: [global expectations + step expectations]"
```

**c) Cache invalidation**: If you added global expectations after cache generation:
```bash
# Regenerate cache
node index.js --nocache --strength medium
```

#### 9. High Token Usage Despite Caching

**Symptoms**:
- Expected $0.00 costs but seeing charges
- `cached_tokens` count is low or zero

**Possible causes**:

**a) Cache miss** due to modified steps:
- Changed `sub_prompt`, `timeout`, or `expectations`
- Step hash changed, forcing regeneration

**b) First run** after cache clear:
```bash
# This will incur costs (expected)
node index.js --nocache --strength medium
```

**c) Dynamic page content** causing different HTML each run:
- Even with cache, HTML extraction happens for validation
- AI prompt uses current HTML, but code is cached
- Solution: HTML cleaning reduces variability

**d) Azure OpenAI caching not enabled**:
- Ensure `api-version: 2024-12-01-preview` in settings
- Cached tokens only work with Azure OpenAI (not standard API)

### Debugging Workflow

**Step-by-step troubleshooting process**:

#### 1. **Enable Headed Mode** to watch execution:
```json
{
  "execution": {
    "headless": false
  }
}
```

#### 2. **Use Mock Mode** for zero-cost debugging:
```bash
node index.js --mock
```
This simulates AI responses with hardcoded actions (see `mock-openai.js`).

#### 3. **Inspect Generated Code**:
```bash
# Find step hash from error message, then:
cat ./generated/aidriven/step-{hash}.js

# Example:
cat ./generated/aidriven/step-aa9c1054.js
```

#### 4. **Review HTML Context** sent to AI:
```bash
# Pre-cleaning (raw HTML):
cat ./generated/aidriven/debug/pre-clean/1.html

# Post-cleaning (what AI sees):
cat ./generated/aidriven/debug/post-clean/1.html
```

#### 5. **Check Execution Logs**:
```bash
# Latest run details:
cat ./generated/aidriven/run-logs.json | jq '.runs[-1]'

# Failed steps only:
cat ./generated/aidriven/run-logs.json | jq '.runs[-1].results[] | select(.status == "error")'

# Token usage summary:
cat ./generated/aidriven/run-logs.json | jq '.runs[-1].usage'
```

#### 6. **Force Fresh Code Generation**:
```bash
# Regenerate all step code (ignore cache)
node index.js --nocache --strength high

# Regenerate + save new cache:
node index.js --nocache --strength medium
```

#### 7. **Isolate Problematic Step**:
```bash
# Create temporary StepsPack with only failing step:
mkdir -p stepspacks/debug-step
cat > stepspacks/debug-step/steps.json << 'EOF'
{
  "steps": [
    {
      "sub_prompt": "The exact prompt that's failing",
      "timeout": "10000",
      "expectations": ["Your expectations here"]
    }
  ]
}
EOF

# Copy settings and test isolated:
cp stepspacks/original-pack/settings.json stepspacks/debug-step/
node index.js --stepspack debug-step --strength high
```

#### 8. **Validate Settings Schema**:
```bash
# Check for JSON syntax errors:
cat aidriven-settings.json | jq .

# Check StepsPack settings:
cat stepspacks/my-pack/settings.json | jq .
cat stepspacks/my-pack/steps.json | jq .
```

#### 9. **Clean Orphaned Cache Files**:
```bash
# Remove cached code for deleted/modified steps:
node index.js --stepspack my-pack --clean orphans

# Manually inspect cache directory:
ls -lh ./stepspacks/my-pack/generated/step-*.js
```

#### 10. **Enable Verbose Logging** (modify `CodeGenerator.js`):
```javascript
// Temporarily add to _buildPrompt() method:
console.log("=== FULL PROMPT SENT TO AI ===");
console.log(prompt);
console.log("=== END PROMPT ===");
```

### Getting Help

If issues persist after trying the above:

1. **Collect diagnostic info**:
```bash
# Create a support bundle:
tar -czf debug-bundle.tar.gz \
  stepspacks/my-pack/settings.json \
  stepspacks/my-pack/steps.json \
  stepspacks/my-pack/generated/run-logs.json \
  stepspacks/my-pack/generated/step-*.js \
  stepspacks/my-pack/generated/debug/
```

2. **Review logs** for error patterns:
- `run-logs.json`: Execution history
- Console output: Real-time errors
- Generated code: AI's interpretation

3. **Open an issue** on GitHub with:
- E2EGen AI version (`cat package.json | jq .version`)
- Node.js version (`node --version`)
- Operating system
- Full error message
- Redacted configuration files
- Steps to reproduce

## 🔒 Security Considerations

### API Key Management

⚠️ **Critical**: Never commit sensitive credentials to version control.

**Best practices**:

1. **Use `.env` files** (automatically ignored by Git):
```bash
# Root .env for global API key:
echo "OPENAI_API_KEY=your_key_here" > .env

# Pack-specific .env for isolated keys:
echo "OPENAI_API_KEY=pack_specific_key" > stepspacks/my-pack/.env
```

2. **Verify `.gitignore` configuration**:
```bash
# Should include:
.env
.env.local
.env.*.local
stepspacks/*/.env
```

3. **Audit commits** before pushing:
```bash
git diff --cached | grep -i "api_key\|password\|secret"
```

### Credentials in Test Steps

❌ **Never hardcode credentials** in step prompts:
```json
{
  "sub_prompt": "Login with username admin@company.com and password MySecretPass123!"
}
```

✅ **Use generic placeholders** and load from environment:
```json
{
  "sub_prompt": "Login with credentials from environment variables TEST_USER and TEST_PASS"
}
```

Then handle in custom wrapper or use test data files:
```bash
export TEST_USER=admin@company.com
export TEST_PASS=secure_password
node index.js --stepspack login-test
```

### Generated Code Review

**Important**: AI-generated code executes with full Playwright permissions (file system access, network requests, etc.).

**Security checklist**:

1. **Review generated code** before committing to cache:
```bash
cat ./generated/aidriven/step-*.js | grep -i "eval\|exec\|require\|import"
```

2. **Avoid `eval()` in production** - while E2EGen AI uses eval internally, ensure generated code doesn't contain nested eval calls.

3. **Sanitize file paths** in prompts:
```json
// ✅ Safe:
{
  "sub_prompt": "Upload file from ./stepspacks/my-pack/media/test.png"
}

// ❌ Risky:
{
  "sub_prompt": "Upload file from /etc/passwd"
}
```

4. **Run tests in isolated environments**:
- Use Docker containers for CI/CD
- Avoid running on production databases
- Use test accounts with limited permissions

### Report Sanitization

**Execution logs may contain sensitive data**:

- Selectors with internal IDs
- URLs with session tokens
- Error messages with system paths

**Before sharing logs**:
```bash
# Redact sensitive info:
cat run-logs.json | jq 'del(.runs[].results[].errors[].stack)' > run-logs-sanitized.json

# Remove debug HTML snapshots:
rm -rf ./generated/aidriven/debug/
```

### API Key Rotation

**Recommended schedule**:
- Development keys: Rotate every 90 days
- Production keys: Rotate every 30 days
- Immediately rotate if:
  - Key accidentally committed to Git
  - Team member with access leaves
  - Unusual API usage detected

**Rotation process**:
```bash
# 1. Generate new key in Azure Portal
# 2. Update .env files:
echo "OPENAI_API_KEY=new_key_here" > .env

# 3. Test with one StepsPack:
node index.js --stepspack test-pack --strength onlycache

# 4. If successful, update all packs:
for pack in stepspacks/*/; do
  echo "OPENAI_API_KEY=new_key_here" > "$pack/.env"
done

# 5. Invalidate old key in Azure Portal
```

### Headless Mode in Production

**Security consideration**: Running browsers in headed mode on servers can expose sensitive data.

**Production settings**:
```json
{
  "execution": {
    "headless": true  // ✅ Always true for CI/CD
  }
}
```

**Exception**: Use headed mode only in secure, isolated development environments.

## 🤝 Contributing

Contributions are welcome! E2EGen AI is an evolving framework, and community input helps shape its direction.

### Planned Features

Priority features for future releases:

#### High Priority
- [ ] **Environment variable injection** in prompts: `"Login with username ${PROCESS.ENV.TEST_USER}"`
- [ ] **Screenshot capture on failure** automatically saved to reports
- [ ] **Multiple browser support** (Firefox, Safari, WebKit)
- [ ] **Step dependency system**: `"depends_on": ["step-1", "step-2"]` to optimize execution order
- [ ] **Conditional execution**: `"run_if": "previous_step_passed"` for branching logic

#### Medium Priority
- [ ] **Parallel step execution** for independent tests (10x speedup potential)
- [ ] **Visual regression testing** integration (Percy, Applitools, Playwright's visual compare)
- [ ] **CI/CD integration templates** (GitHub Actions, GitLab CI, Jenkins)
- [ ] **Web UI for step configuration** (drag-and-drop test builder)
- [ ] **Video recording** of test execution (Playwright traces)
- [ ] **Real-time progress dashboard** via WebSocket

#### Low Priority
- [ ] **Multi-language prompt support** (English, Italian, Spanish, etc.)
- [ ] **Test data generation** via AI (generate realistic form inputs)
- [ ] **Cross-browser comparison** reports (Chrome vs Firefox differences)
- [ ] **Performance profiling** (execution time per step, network bottlenecks)

### How to Contribute

#### 1. **Fork the Repository**
```bash
git clone https://github.com/your-username/pw-ai-smartpeg.git
cd pw-ai-smartpeg
git remote add upstream https://github.com/original-repo/pw-ai-smartpeg.git
```

#### 2. **Create Feature Branch**
```bash
# Use descriptive branch names:
git checkout -b feature/screenshot-on-failure
git checkout -b fix/cache-invalidation-bug
git checkout -b docs/improve-troubleshooting
```

#### 3. **Make Changes**

**Development setup**:
```bash
# Install dependencies:
npm install

# Run tests (if available):
npm test

# Test your changes with a StepsPack:
node index.js --stepspack test-pack --strength medium
```

**Code style guidelines**:
- Use ES6+ syntax (async/await, destructuring, arrow functions)
- Follow existing naming conventions (`camelCase` for functions, `PascalCase` for classes)
- Add JSDoc comments for public methods:
```javascript
/**
 * Generates Playwright code for a test step
 * @param {Object} step - Step configuration
 * @param {Object} context - Execution context (html, url, error)
 * @returns {Promise<Object>} Generated code and token usage
 */
async generate(step, context) { ... }
```

#### 4. **Write Tests** (if applicable)

Create test files in `tests/` directory:
```javascript
// tests/code-generator.test.js
import { CodeGenerator } from '../core/CodeGenerator.js';
import { MockOpenAI } from '../mock-openai.js';

describe('CodeGenerator', () => {
  it('should generate code for simple click action', async () => {
    const client = new MockOpenAI({ apiKey: 'test' });
    const generator = new CodeGenerator(client);
    
    const result = await generator.generate(
      { subPrompt: 'Click button with id #submit' },
      { html: '<button id="submit">Submit</button>', url: 'http://test.com' }
    );
    
    expect(result.code).toContain('page.click(\'#submit\')');
  });
});
```

#### 5. **Commit Changes**

Use conventional commit messages:
```bash
git add .

# Format: <type>(<scope>): <subject>
git commit -m "feat(retry): add exponential backoff for retries"
git commit -m "fix(cache): resolve hash collision for similar prompts"
git commit -m "docs(readme): add troubleshooting section for cache errors"
git commit -m "refactor(executor): extract HTML cleaning to utility class"
```

**Commit types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no functionality change)
- `test`: Adding/updating tests
- `chore`: Maintenance (dependencies, config)

#### 6. **Push to Branch**
```bash
git push origin feature/your-feature-name
```

#### 7. **Open Pull Request**

**PR template**:
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## Testing
- [ ] Tested manually with StepsPack: [name]
- [ ] Added/updated unit tests
- [ ] All tests pass locally

## Checklist
- [ ] Code follows existing style guidelines
- [ ] Added JSDoc comments for new functions
- [ ] Updated README.md if needed
- [ ] No sensitive data (API keys, passwords) in commits

## Related Issues
Closes #[issue-number]
```

### Development Setup

**Prerequisites**:
```bash
# Node.js 16+
node --version

# Git
git --version
```

**Local development workflow**:
```bash
# Install dependencies:
npm install

# Create test StepsPack:
mkdir -p stepspacks/dev-test
cat > stepspacks/dev-test/settings.json << 'EOF'
{
  "execution": {
    "entrypoint_url": "https://example.com",
    "headless": false
  },
  "ai_agent": {
    "type": "gpt-4o",
    "endpoint": "https://your-endpoint.openai.azure.com/...",
    "cost_input_token": "0.000005",
    "cost_output_token": "0.00002",
    "cost_cached_token": "0.0000025"
  }
}
EOF

cat > stepspacks/dev-test/steps.json << 'EOF'
{
  "steps": [
    {
      "sub_prompt": "Wait for page load",
      "timeout": "3000"
    }
  ]
}
EOF

# Test changes:
node index.js --stepspack dev-test --strength medium

# Use mock mode for rapid iteration:
node index.js --stepspack dev-test --mock
```

### Reporting Issues

**Bug report template**:
```markdown
## Describe the Bug
Clear description of what's happening.

## Steps to Reproduce
1. Configure StepsPack with settings: [attach sanitized settings.json]
2. Run command: `node index.js --stepspack X --strength medium`
3. Observe error: [error message]

## Expected Behavior
What should happen instead.

## Environment
- E2EGen AI version: [cat package.json | jq .version]
- Node.js version: [node --version]
- Operating System: [e.g., Ubuntu 22.04, macOS 14, Windows 11]
- Playwright version: [@playwright/test version from package.json]

## Additional Context
- Execution logs: [attach run-logs.json excerpt]
- Generated code: [attach problematic step-{hash}.js if relevant]
- Screenshots: [if applicable]
```

### Code Review Guidelines

For reviewers:

**Check**:
- [ ] Code follows existing patterns and style
- [ ] No hardcoded credentials or sensitive data
- [ ] New features documented in README
- [ ] Breaking changes clearly marked
- [ ] Error handling is comprehensive
- [ ] Token usage is optimized (avoid unnecessary AI calls)

**Test**:
```bash
# Checkout PR branch:
git fetch origin pull/ID/head:pr-branch
git checkout pr-branch

# Test with multiple StepsPacks:
node index.js --stepspack login-flow --strength medium
node index.js --stepspack checkout-flow --strength high

# Verify cost calculations:
cat stepspacks/*/generated/run-logs.json | jq '.runs[-1].usage'
```

## 📄 License

This project is licensed under the **ISC License** - see [LICENSE](LICENSE) file for details.

**Summary**: Permission to use, copy, modify, and distribute this software for any purpose with or without fee, provided copyright and permission notice are included.

## 🙏 Acknowledgments

E2EGen AI is built on the shoulders of giants:

- **[Playwright](https://playwright.dev/)** - Reliable, fast browser automation framework by Microsoft
- **[OpenAI GPT-4o](https://openai.com/)** - Advanced language model enabling natural language code generation
- **[Azure OpenAI Service](https://azure.microsoft.com/products/ai-services/openai-service)** - Enterprise-grade AI with automatic prompt caching
- **[Commander.js](https://github.com/tj/commander.js)** - Elegant CLI argument parsing
- **[JSDOM](https://github.com/jsdom/jsdom)** - Pure JavaScript HTML parser and DOM implementation
- **[dotenv](https://github.com/motdotla/dotenv)** - Secure environment variable management

Special thanks to the open-source community for testing, feedback, and contributions.

---

## 📞 Support

For issues, feature requests, or questions:

- 📧 **Open an issue** on GitHub with detailed reproduction steps
- 💬 **Check existing issues** for solutions and workarounds
- 📖 **Review this README** and inline code documentation
- 🔍 **Search closed issues** for previously resolved problems

### Community Resources

- **Examples repository**: [github.com/e2egen-ai/examples](https://github.com) (coming soon)
- **Video tutorials**: [youtube.com/@e2egen-ai](https://youtube.com) (coming soon)
- **Discord community**: [discord.gg/e2egen-ai](https://discord.gg) (coming soon)

---

**Happy Testing! 🚀**

*E2EGen AI - Bridging human intent and browser automation through AI assistance*