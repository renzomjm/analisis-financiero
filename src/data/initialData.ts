import { Holding, Transaction, NewsItem, CalendarEvent, MarketRates } from '../types';

export const initialMarketRates: MarketRates = {
  dollarMep: 1525.30,
  dollarMepCompra: 1516.90,
  dollarCcl: 1583.20,
  dollarCclCompra: 1582.00,
  dollarOficial: 1530.00,
  dollarBlue: 1540.00,
  mervalIndex: 1980500,
  riesgoPais: 490,
  source: 'DolarApi (BYMA / MAE)',
  isLive: true,
  lastUpdated: '05/09/2026 - En tiempo real'
};

export const initialHoldings: Holding[] = [];

export const initialTransactions: Transaction[] = [];

export const initialNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'YPF acelera exportaciones de crudo no convencional y eleva proyecciones de EBITDA',
    summary: 'La petrolera de bandera presentó un avance operativo reportando una suba del 18% interanual en la evacuación de crudo desde la cuenca neuquina.',
    fullContent: `YPF S.A. informó en su última comunicación a los inversores que la puesta en marcha de los nuevos tramos de oleoductos (Oldelval y duplicación Vaca Muerta Sur) ha permitido destrabar el cuello de botella logístico en la Cuenca Neuquina.

Aspectos clave para el inversor:
- Producción shale: Superó los 135.000 barriles diarios netos con un lifting cost consolidado inferior a los USD 7.80 por barril.
- Margen EBITDA ajustado: Se expandió hacia el 38% impulsado por los precios de paridad de exportación y menores subsidios a refinerías.
- Tesis fundamental: Se consolida el plan estratégico de desinversión en campos maduros para concentrar el 85% del CapEx directamente en plays de alta rentabilidad no convencional.`,
    source: 'CNV / Relación con Inversores YPF',
    date: 'Hoy, 09:15 ART',
    category: 'Cartera',
    relatedTickers: ['YPFD', 'VIST']
  },
  {
    id: 'news-2',
    title: 'INDEC publica IPC de agosto: la inflación núcleo confirma tendencia de desaceleración',
    summary: 'El organismo oficial divulgará el dato mensual consolidado; el mercado descuenta tasas reales positivas y estabilidad cambiaria en el dólar MEP/CCL.',
    fullContent: `El Instituto Nacional de Estadística y Censos (INDEC) dará a conocer el Índice de Precios al Consumidor (IPC). Las consultoras privadas y el Relevamiento de Expectativas de Mercado (REM) del BCRA proyectan un registro en torno al 2.8% - 3.2% mensual.

Impacto en la cartera:
- Bonos en dólares (AL30 / GD30): La consolidación del ancla fiscal continúa sosteniendo la compresión del riesgo país hacia la zona de 1.100 puntos básicos.
- Acciones bancarias (GGAL, BMA): El desarme de pasivos remunerados y el traspaso hacia crédito bancario genuino mantiene un ratio de mora históricamente bajo.
- Instrumentos en pesos: Las tasas de LECAPs y BONCAPs se arbitran en el mercado secundario con rendimientos efectivos anuales estables.`,
    source: 'INDEC / BCRA',
    date: 'Hoy, 08:30 ART',
    category: 'Macro',
    relatedTickers: ['AL30', 'GGAL']
  },
  {
    id: 'news-3',
    title: 'Vista Energy eleva su guidance de producción para el segundo semestre de 2026',
    summary: 'La operadora fundada por Miguel Galuccio incrementó sus metas de bombeo diario con nuevos pozos de longitud lateral extendida en Bajada del Palo Oeste.',
    fullContent: `Vista Energy (NYSE: VIST / BYMA) actualizó su guía anual a los mercados de Nueva York y Buenos Aires. La firma proyecta alcanzar los 90.000 boed antes de lo previsto, manteniendo un balance con apalancamiento neto inferior a 0.6x Deuda Neta/EBITDA.

Detalles fundamentales:
- FCF (Free Cash Flow): Con el crudo Brent cotizando sobre los USD 76/barril, la compañía genera flujos operativos robustos destinados a recompras de acciones y CapEx autofinanciado.
- Eficiencia operativa: Los tiempos de perforación y fractura cayeron un 12% por pozo.
- Visión analítica: Excelente activo de crecimiento puro (growth) con bajo riesgo soberano directo gracias a su cotización dual y ventas spot al exterior.`,
    source: 'SEC Filing 6-K / Vista IR',
    date: 'Ayer, 18:40 ART',
    category: 'Balances',
    relatedTickers: ['VIST']
  },
  {
    id: 'news-4',
    title: 'Mercado cambiario: Dólar MEP y CCL operan con volatilidad controlada y brecha en mínimos',
    summary: 'La oferta continua de liquidación de exportaciones bajo el esquema 80/20 y la demanda corporativa mantienen el MEP en torno a los $1.195.',
    fullContent: `Las cotizaciones financieras del dólar registraron una rueda de escasa dispersión en la plaza local. El Dólar MEP (Bolsa) se negoció con un promedio ponderado de $1.195,50, mientras que el Contado con Liquidación (CCL) cerró en $1.220.

Consideraciones para el inversor:
- Costo de dolarización: Atractivo punto de entrada para arbitrar excedentes en pesos hacia CEDEARs o bonos soberanos con vencimientos 2030-2035.
- Brecha cambiaria: Mantiene niveles inferiores al 22%, reduciendo la presión inflacionaria sobre bienes transables.`,
    source: 'Ámbito / BYMA',
    date: '04/09/2026',
    category: 'Mercado',
    relatedTickers: ['AL30', 'AAPL']
  }
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    date: '2026-09-08',
    ticker: 'YPFD',
    title: 'Presentación de Resultados Trimestrales YPF (Q3)',
    type: 'Balance',
    description: 'YPF presentará los estados financieros consolidados ante la CNV y SEC, seguido de la conferencia telefónica con analistas de Wall Street.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: true
  },
  {
    id: 'ev-2',
    date: '2026-09-11',
    ticker: 'INDEC',
    title: 'Informe del Índice de Precios al Consumidor (IPC INDEC)',
    type: 'Macro',
    description: 'Publicación oficial de la inflación del mes previo. Dato clave para proyectar la tasa de política monetaria del BCRA y bonos CER.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-3',
    date: '2026-09-15',
    ticker: 'VIST',
    title: 'Vista Energy - Investor Day & Actualización de Reservas',
    type: 'Balance',
    description: 'Reunión con la comunidad financiera en Houston/Nueva York sobre el avance de pozos en Vaca Muerta y proyecciones 2027.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: true
  },
  {
    id: 'ev-4',
    date: '2026-09-18',
    ticker: 'MECON',
    title: 'Licitación de Letras del Tesoro (LECAPs y BONCAPs)',
    type: 'Licitación',
    description: 'Renovación de vencimientos de la deuda en pesos del Tesoro Nacional. Referencia directa para las tasas cortas del mercado.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-5',
    date: '2026-09-22',
    ticker: 'GGAL',
    title: 'Grupo Financiero Galicia - Pago de Dividendos Aprobados',
    type: 'Cupón / Dividendo',
    description: 'Fecha de corte (ex-dividend date) para la distribución de dividendos en efectivo aprobados en la última asamblea ordinaria.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: true
  },
  {
    id: 'ev-6',
    date: '2026-09-24',
    ticker: 'AAPL',
    title: 'Apple Inc. - Conferencia de Lanzamiento de Productos y Servicios',
    type: 'Balance',
    description: 'Presentación de novedades de hardware y modelos generativos de IA en Cupertino, con impacto inmediato en el ticker global y CEDEAR.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: true
  },
  {
    id: 'ev-7',
    date: '2026-09-28',
    ticker: 'BCRA',
    title: 'Reunión de Directorio BCRA y Decisión de Tasas',
    type: 'Macro',
    description: 'Revisión periódica de la tasa de política monetaria, encajes bancarios y regulaciones del mercado de cambios.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: false
  }
];
