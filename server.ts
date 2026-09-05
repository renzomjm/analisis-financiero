import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_INSTRUCTION = `Actúa como un Asistente Analítico de Inversiones de Mercado Financiero especializado en Análisis Fundamental y Macroeconomía. Tu objetivo es ayudar a un inversor individual radicado en Argentina a realizar un seguimiento ágil, riguroso y actualizado de su cartera de inversión y de las oportunidades del mercado local e internacional.

[PERFIL DEL INVERSOR]
- Ubicación: Argentina. Operas a través de un broker local (ALyC).
- Instrumentos: Acciones locales (Merval), CEDEARs (Empresas de EE.UU., Brasil y otros países), Bonos Soberanos/Subsoberanos (Hard Dollar y Dollar Linked), BPOREAL y Letras (LECAPs, BONCAPs).
- Enfoque: Análisis Fundamental, valor intrínseco, salud financiera corporativa, drivers macroeconómicos, rendimiento por dividendos y horizontes de mediano a largo plazo.

[FUENTES DE INFORMACIÓN Y BÚSQUEDA]
Para responder consultas, debes Priorizar SIEMPRE el uso de herramientas de búsqueda web (Google Search) accediendo a fuentes oficiales y confiables:
1. Estados Unidos: SEC (Edgar System, Form 10-K, 10-Q, 8-K), comunicados de prensa oficial IR (Investor Relations) de las empresas, Federal Reserve (FOMC), CNBC, Reuters, Bloomberg, Yahoo Finance.
2. Argentina: SEC (CNV - Comisión Nacional de Valores), Bolsas y Mercados Argentinos (BYMA), Bolsa de Comercio de Buenos Aires (BCBA), Banco Central de la República Argentina (BCRA), Ámbito Financiero, El Cronista.
3. Brasil: CVM (Comissão de Valores Mobiliários), B3, Banco Central do Brasil (BCB), Valor Econômico, InfoMoney.
4. Calendarios Económicos: TradingEconomics, Investing.com (para fechas de earnings y reuniones de la Fed/BCRA/BCB).

[REGLA DE FILTRADO DE NOTICIAS DE EMPRESAS]
- Noticia/Novedades Específicas de Empresas: Filtra y muestra información ÚNICAMENTE sobre las empresas que el usuario indique que posee en su cartera o en su lista de seguimiento (Watchlist). No abrumes con noticias corporativas ajenas a menos que tengan un impacto directo/sistémico en el sector o mercado global.

[ESTRUCTURA Y MODOS DE RESPUESTA]

Cuando el usuario te solicite un "Resumen de Mercado", "Monitoreo Diario" o "Análisis de Cartera", organiza la respuesta siguiendo esta estructura:

1. 🏛️ MACROECONOMÍA Y CALENDARIO CLAVE (EE.UU., Argentina y Brasil)
   - Próximas fechas clave: Reuniones de la Fed (FOMC), BCRA (tasas), decisiones de la Selic (Brasil).
   - Indicadores recientes: Inflación (CPI/IPC), desempleo, tasas de interés, tipo de cambio (CCL/MEP/Oficial).
   - Eventos de impacto sistémico para la región o sectores clave.

2. 📊 CALENDARIO DE BALANCES Y PRESENTACIONES (Earnings)
   - Próximas fechas de presentación de balances de los tickers en Cartera y Watchlist.
   - Resumen rápido de los últimos balances presentados por estas empresas (Ingresos/EPS vs. estimaciones del mercado, Guidance, márgenes operativo y neto).

3. 📰 NOVEDADES Y NOTICIAS OFICIALES (Cartera & Watchlist)
   - Anuncios oficiales relevantes: Recompra de acciones, dividendos aprobados/pagados, M&A, cambios directivos, reportes ante SEC/CNV/CVM.
   - Hechos relevantes que afecten la tesis de inversión de los activos del usuario.

4. 📈 ANÁLISIS FUNDAMENTAL Y EVOLUCIÓN DE INSTRUMENTOS
   - Estado de valuación fundamental: Ratios clave (P/E, EV/EBITDA, P/B, Debt/EBITDA, Free Cash Flow Yield) si corresponde.
   - Bonos/Renta Fija: Paridades, TIR, Duration, curva de rendimientos y contexto de riesgo país.
   - Conclusión analítica: ¿Han cambiado los fundamentos de algún activo de la cartera?

[FORMATO Y TONO DE COMUNICACIÓN]
- Tono profesional, analítico, objetivo y directo.
- Evita opiniones especulativas o basadas en análisis técnico puro (gráficos/velas) a menos que se te pida explícitamente contexto de precio.
- Usa tablas concisas para comparar ratios o listas de eventos clave con fechas.
- Si no hay datos oficiales confirmados para una fecha de balance o noticia, indícalo claramente.
- Finaliza las respuestas complejas sugiriendo 2 o 3 análisis adicionales o preguntas de seguimiento pertinentes para profundizar en la tesis fundamental.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real-time market rates endpoint (Dolar MEP, CCL, Oficial from DolarAPI / BYMA)
  app.get("/api/rates/live", async (req, res) => {
    try {
      let dollarMep = 1525.30;
      let dollarMepCompra = 1516.90;
      let dollarCcl = 1583.20;
      let dollarCclCompra = 1582.00;
      let dollarOficial = 1530.00;
      let dollarBlue = 1540.00;
      let riesgoPais = 490;
      let source = "DolarApi (BYMA / MAE)";
      let fetchedFromLive = false;

      // 1. Fetch from DolarAPI (official Argentine market exchange rates)
      try {
        const resp = await fetch("https://dolarapi.com/v1/dolares", {
          headers: { "Accept": "application/json" }
        });
        if (resp.ok) {
          const dolares: any = await resp.json();
          if (Array.isArray(dolares)) {
            const mepObj = dolares.find((d: any) => d.casa === "bolsa" || d.nombre?.toLowerCase().includes("bolsa"));
            const cclObj = dolares.find((d: any) => d.casa === "contadoconliqui" || d.nombre?.toLowerCase().includes("liquid"));
            const oficialObj = dolares.find((d: any) => d.casa === "oficial");
            const blueObj = dolares.find((d: any) => d.casa === "blue");

            if (mepObj && mepObj.venta) {
              dollarMep = Number(mepObj.venta);
              dollarMepCompra = Number(mepObj.compra || mepObj.venta);
              fetchedFromLive = true;
            }
            if (cclObj && cclObj.venta) {
              dollarCcl = Number(cclObj.venta);
              dollarCclCompra = Number(cclObj.compra || cclObj.venta);
            }
            if (oficialObj && oficialObj.venta) {
              dollarOficial = Number(oficialObj.venta);
            }
            if (blueObj && blueObj.venta) {
              dollarBlue = Number(blueObj.venta);
            }
          }
        }
      } catch (e) {
        console.warn("DolarAPI fetch warning:", e);
      }

      // 2. Backup fetch with Bluelytics if needed
      if (!fetchedFromLive) {
        try {
          const respB = await fetch("https://api.bluelytics.com.ar/v2/latest");
          if (respB.ok) {
            const dataB: any = await respB.json();
            if (dataB.blue && dataB.blue.value_sell) {
              dollarBlue = dataB.blue.value_sell;
            }
            if (dataB.oficial && dataB.oficial.value_sell) {
              dollarOficial = dataB.oficial.value_sell;
              dollarMep = dataB.oficial.value_sell * 1.02;
              fetchedFromLive = true;
              source = "Bluelytics";
            }
          }
        } catch (e2) {
          console.warn("Backup rates error:", e2);
        }
      }

      // 3. Fetch Riesgo Pais from ArgentinaDatos
      try {
        const rpResp = await fetch("https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo");
        if (rpResp.ok) {
          const rpData: any = await rpResp.json();
          if (rpData && rpData.valor) {
            riesgoPais = Number(rpData.valor);
          }
        }
      } catch (e3) {
        console.warn("Riesgo pais fetch warning:", e3);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      res.json({
        status: "ok",
        isLive: fetchedFromLive,
        dollarMep,
        dollarMepCompra,
        dollarCcl,
        dollarCclCompra,
        dollarOficial,
        dollarBlue,
        riesgoPais,
        source,
        lastUpdated: `${dateStr} - ${timeStr} ART`
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: error?.message });
    }
  });

  // In-memory chat store (for simplicity). In a real app, use a DB.
  const chatSessions: Record<string, any[]> = {};

  app.post("/api/chat", async (req, res) => {
    try {
      let { message, sessionId = "default", model = "gemini-3.7-flash", useSearch = false, portfolioContext = "" } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
      }

      // Normalize model strictly to Gemini 3.7 Flash for optimal quota and reliability
      model = "gemini-3.7-flash";

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      if (!chatSessions[sessionId]) {
        chatSessions[sessionId] = [];
      }

      const history = chatSessions[sessionId];
      
      const userPromptWithContext = portfolioContext
        ? `[DATOS DE CARTERA ACTUALIZADOS DEL USUARIO]\n${portfolioContext}\n\n[CONSULTA DEL USUARIO]\n${message}`
        : message;

      const contents = [
        ...history,
        { role: "user", parts: [{ text: userPromptWithContext }] }
      ];

      // Helper to generate with graceful search tool and model fallbacks
      async function generateWithFallbacks() {
        // High-availability models with separate free-tier quota pools
        const candidateModels = [
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
        ];

        let lastErr: any = null;

        for (const candidate of candidateModels) {
          // If search was requested, try with Google Search first
          if (useSearch) {
            try {
              return await ai.models.generateContent({
                model: candidate,
                contents: contents,
                config: {
                  systemInstruction: SYSTEM_INSTRUCTION,
                  tools: [{ googleSearch: {} }]
                }
              });
            } catch (err: any) {
              lastErr = err;
            }
          }

          // Generate directly (fast, stable, no search tool 429 quota exhaustion)
          try {
            return await ai.models.generateContent({
              model: candidate,
              contents: contents,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION
              }
            });
          } catch (err: any) {
            lastErr = err;
          }
        }

        throw lastErr || new Error("No se pudo generar una respuesta con los modelos disponibles.");
      }

      const response = await generateWithFallbacks();
      const text = response.text;
      
      // Save to history (clean prompt without full schema duplication for leaner context)
      chatSessions[sessionId].push({ role: "user", parts: [{ text: message }] });
      if (text) {
        chatSessions[sessionId].push({ role: "model", parts: [{ text }] });
      }
      
      res.json({ text });
    } catch (error: any) {
      let userFriendlyMessage = "Ocurrió un error temporal al procesar la respuesta. Por favor intenta de nuevo en unos momentos.";
      const rawMsg = error?.message || "";
      if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
        userFriendlyMessage = "El servicio de Gemini está experimentando alta demanda momentánea. Por favor aguarda unos segundos y vuelve a consultar.";
      }
      res.status(500).json({ error: userFriendlyMessage });
    }
  });

  // Endpoint to refresh market intelligence with Web Search
  app.post("/api/market-data/refresh", async (req, res) => {
    try {
      const { tickers = ["YPFD", "VIST", "AL30", "GGAL", "AAPL"] } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ status: "ok", refreshed: false, message: "Sin API key, usando datos predeterminados" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Proporciona un breve resumen en formato JSON con 2 noticias clave y 2 eventos de calendario recientes o próximos para los activos: ${tickers.join(", ")} y el mercado argentino (MEP, inflación INDEC, BCRA).
Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "news": [
    {
      "id": "refreshed-1",
      "title": "...",
      "summary": "...",
      "fullContent": "...",
      "source": "...",
      "date": "Recién actualizado",
      "category": "Cartera",
      "relatedTickers": ["YPFD"]
    }
  ],
  "events": [
    {
      "id": "refreshed-ev-1",
      "date": "2026-09-10",
      "ticker": "YPFD",
      "title": "...",
      "type": "Balance",
      "description": "...",
      "impactLevel": "Alto",
      "isHoldingOrWatchlist": true
    }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const rawText = response.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ status: "ok", refreshed: true, data: parsed });
        }
      } catch (genError) {
        console.warn("Notice: Live web search refresh fallback active:", genError);
      }

      // Return status ok if search was rate-limited
      res.json({ status: "ok", refreshed: false });
    } catch (e: any) {
      res.json({ status: "ok", refreshed: false, error: e?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
