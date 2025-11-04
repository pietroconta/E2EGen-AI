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