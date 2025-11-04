// ============================================
// FILE: core/CodeGenerator.js
// ============================================

/**
 * Gestisce la generazione di codice Playwright tramite AI
 */
export class CodeGenerator {
  constructor(client, options = {}) {
    this.client = client;
    this.model = options.model || "gpt-4o";
    this.systemPrompt = options.systemPrompt || 
      "Sei un esperto di automazione browser con Playwright.";
  }

  /**
   * Genera codice Playwright per uno step
   */
  async generate(step, context) {
    const { taskDescription, url, html, errorMessage } = context;

    const resolvedTask = this._resolveVariables(taskDescription);
    const prompt = this._buildPrompt(resolvedTask, url, errorMessage, step.expectations);
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: `${prompt}\n\nHTML:\n${html}` },
      ],
    });

    const rawCode = response.choices[0].message.content
      .replace(/```[a-z]*|```/g, "")
      .trim();

    // Prepend wait for stability
    const code = `await page.waitForLoadState('networkidle');\n${rawCode}`;

    return {
      code,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        cachedTokens: response.usage.prompt_tokens_details.cached_tokens,
      },
    };
  }

  _resolveVariables(text) {
    // Pattern per trovare ${VARIABILE} o ${VAR_NAME}
    return text.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
      const value = process.env[varName]; // ← Accesso diretto, dotenv NON necessario!
      console.log(value);
      if (value === undefined) {
        console.warn(`⚠️ Variabile d'ambiente non trovata: ${varName}`);
        return match; // Lascia il placeholder se non trovata
      }
      
      return value;
    });
  }

  /**
   * Costruisce il prompt per l'AI
   */
  _buildPrompt(taskDescription, url, errorMessage = null, expectations = null) {
    //console.log(expectations);
    let prompt = `
Sei un assistente che genera SOLO codice Playwright (senza test(), describe() o import).
Genera codice che esegue ESATTAMENTE le seguenti azioni sulla pagina corrente:
"${taskDescription}"

La pagina corrente è: ${url}`;

if(expectations.length > 0){
  prompt += `\nDevono verificarsi queste expectations (devi essere case insensitive) altrimenti se non sono verificate devi
  lanciare un eccezione con il nome dell'expectations: ${expectations}. Devi fare throw new Error SOLO SE una di queste expectations non è verificata. 
  Se devi trovare una stringa, una stringa di errore ecc us page locator e isVisible, NON usare selettori se non li hai trovati nella pagina, 
  INOLTRE se devi trovare qualunque cosa dopo un click o un altra azione devi: aspettare 7 secondi, e controllare in quei 7 secondi se è presente/visibile
  Per accettare oppure rifiutare le dialog native devi usare event listener e poi fare accept() oppure dismiss()`
}else{
  prompt += "\nNon inserire assolutamente nessun throw new Error";
}

prompt +=  `\nDevi usare l'oggetto "page" già aperto (non aprire un nuovo browser o una nuova pagina).
Puoi anche usare "expect" se serve per validare elementi visibili o testi, se lanci errori
assicurati di inserire all'inizio del messaggio del throw: "Test failed:" e poi il motivo
Non aggiungere testo extra, solo codice JavaScript eseguibile.
`;



    if (errorMessage) {
      prompt += `\n\n⚠️ ATTENZIONE: Il tentativo precedente ha fallito con questo errore:
"${errorMessage}"

Correggi il codice tenendo conto di questo problema. Analizza l'errore e adatta la strategia:
- Se è un timeout, usa selettori più specifici o attendi caricamenti
- Se è un selettore non trovato, verifica l'HTML fornito
`//- Se è un click fallito, prova alternative (force, scroll into view);
    }
    console.log(prompt);

    return prompt;
  }

  /**
   * Genera una correzione basata sull'errore precedente
   */
  async generateFix(step, context, previousError) {
    return this.generate(step, {
      ...context,
      errorMessage: previousError.message,
    });
  }
}
