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
    source: 'CNV / Relación con Inversores YPF',
    date: '10/09/2026, 09:15 ART',
    summary: 'YPF informó a la CNV un incremento del 18% interanual en la evacuación de petróleo shale desde Vaca Muerta tras la ampliación de ductos de Oldelval. La compañía proyecta una expansión del margen EBITDA hacia el 38% por mayores despachos a precio de paridad de exportación.',
    fullContent: `YPF S.A. informó en su comunicación oficial a los mercados y a la Comisión Nacional de Valores (CNV) que la puesta en marcha de los nuevos tramos de oleoductos ha permitido destrabar la capacidad de transporte en la Cuenca Neuquina.

Aspectos clave verificados:
- Producción shale: Superó los 135.000 barriles diarios netos con un lifting cost consolidado inferior a USD 7.80/barril.
- Margen EBITDA ajustado: Expansión hacia el 38% respaldada por ventas spot al mercado exterior.
- Enfoque estratégico: Concentración de inversiones en activos no convencionales de alta productividad.`,
    category: 'Cartera',
    relatedTickers: ['YPFD'],
    url: 'https://www.cnv.gov.ar'
  },
  {
    id: 'news-2',
    title: 'Vista Energy eleva su guidance de producción de crudo para el segundo semestre',
    source: 'SEC Filing Form 6-K / Vista IR',
    date: '09/09/2026, 18:40 ART',
    summary: 'Vista Energy presentó ante la SEC su reporte Form 6-K elevando la meta de producción hacia los 90.000 barriles equivalentes diarios. La empresa mantiene un ratio de deuda neta sobre EBITDA inferior a 0.6x con flujo de caja libre positivo.',
    fullContent: `Vista Energy (NYSE: VIST / BYMA) actualizó su guía anual oficial ante la SEC (U.S. Securities and Exchange Commission) y el mercado local.

Métricas clave:
- Meta operativa: 90.000 boed alcanzados con pozos de rama lateral extendida en Bajada del Palo Oeste.
- Solvencia: Apalancamiento neto en mínimos del sector (0.6x Deuda Neta/EBITDA).
- Tesis fundamental: Fuerte generación de flujo de fondos destinada a reinversión y retorno a accionistas.`,
    category: 'Cartera',
    relatedTickers: ['VIST'],
    url: 'https://www.sec.gov/edgar/browse/?CIK=0001762506'
  },
  {
    id: 'news-3',
    title: 'Grupo Financiero Galicia reporta balance con crecimiento en cartera crediticia privada',
    source: 'CNV / BYMA Estados Contables',
    date: '09/09/2026, 14:20 ART',
    summary: 'Grupo Financiero Galicia (GGAL) presentó sus estados contables trimestrales ante la CNV reportando un crecimiento sostenido en préstamos al sector privado y un ratio de morosidad en mínimos históricos. El resultado operativo refleja la normalización del balance tras la reducción de pasivos remunerados del BCRA.',
    fullContent: `Grupo Financiero Galicia S.A. presentó ante la Comisión Nacional de Valores y la Bolsa de Comercio de Buenos Aires sus resultados financieros auditados.

Puntos destacados:
- Expansión de cartera: Aceleración en préstamos en pesos y líneas comerciales corporativas.
- Calidad de activos: Ratios de incobrabilidad controlados y cobertura superior al 140%.
- Posición patrimonial: Fuerte nivel de capitalización para acompañar la demanda crediticia en moneda local.`,
    category: 'Cartera',
    relatedTickers: ['GGAL'],
    url: 'https://www.cnv.gov.ar'
  },
  {
    id: 'news-4',
    title: 'INDEC publica calendario oficial y expectativas del IPC de agosto',
    source: 'INDEC / BCRA',
    date: '10/09/2026, 08:30 ART',
    summary: 'El INDEC confirmó la publicación oficial del IPC de agosto, mientras que el Relevamiento de Expectativas de Mercado (REM) del BCRA proyecta una desaceleración en la inflación núcleo. El ancla fiscal sostiene el arbitraje de rendimientos en la curva de bonos soberanos y letras.',
    fullContent: `El Instituto Nacional de Estadística y Censos (INDEC) ratificó su calendario de difusión oficial para el Índice de Precios al Consumidor.

Impacto en mercado y renta fija:
- Curva soberana: Paridades de bonos AL30 y GD30 con menor dispersión y riesgo país en 490 puntos.
- Tasa en pesos: Instrumentos a tasa fija (LECAPs) consolidan rendimientos acordes a la expectativa de menor inflación.`,
    category: 'Macro',
    relatedTickers: ['AL30'],
    url: 'https://www.indec.gob.ar'
  }
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'ev-indec-ipc',
    date: '2026-09-11',
    ticker: 'INDEC',
    title: 'Informe del Índice de Precios al Consumidor (IPC INDEC)',
    type: 'Macro',
    description: 'Publicación oficial del IPC de agosto según el calendario oficial del INDEC. Clave para la curva de bonos CER y tasas BCRA.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-mecon-presupuesto',
    date: '2026-09-15',
    ticker: 'MECON',
    title: 'Presentación del Proyecto de Presupuesto al Congreso',
    type: 'Macro',
    description: 'Vencimiento constitucional oficial para el envío del Proyecto de Presupuesto Nacional. Define metas de superávit fiscal y tipo de cambio.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-mecon-licitacion',
    date: '2026-09-18',
    ticker: 'MECON',
    title: 'Licitación del Tesoro Nacional (LECAPs / BONCAPs)',
    type: 'Licitación',
    description: 'Subasta oficial de la Secretaría de Finanzas para renovación de deuda en pesos del Tesoro.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-indec-ica',
    date: '2026-09-22',
    ticker: 'INDEC',
    title: 'Intercambio Comercial Argentino (ICA - Balanza Comercial)',
    type: 'Macro',
    description: 'Cifras oficiales de exportaciones, importaciones y superávit comercial en dólares publicado por el INDEC.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-aapl-keynote',
    date: '2026-09-24',
    ticker: 'AAPL',
    title: 'Apple Inc. - Keynote de Servicios y Productos (CEDEAR)',
    type: 'Balance',
    description: 'Evento oficial corporativo de Apple con impacto directo en CEDEARs de tecnología en BYMA.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: true
  },
  {
    id: 'ev-bcra-ipom',
    date: '2026-09-25',
    ticker: 'BCRA',
    title: 'Informe de Política Monetaria y Evolución Cambiaria',
    type: 'Macro',
    description: 'Publicación periódica del BCRA con métricas de reservas netas, tasas efectivas y encajes bancarios.',
    impactLevel: 'Medio',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-indec-emae',
    date: '2026-09-29',
    ticker: 'INDEC',
    title: 'Estimador Mensual de Actividad Económica (EMAE INDEC)',
    type: 'Macro',
    description: 'Informe oficial del nivel de actividad económica y PBI preliminar publicado por el INDEC.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: false
  },
  {
    id: 'ev-ypf-q3-confirmed',
    date: '2026-11-06',
    ticker: 'YPFD',
    title: 'YPF S.A. - Presentación Oficial Resultados Q3 (Noviembre)',
    type: 'Balance',
    description: 'YPF presenta sus estados contables correspondientes al tercer trimestre ante la CNV y SEC en noviembre, tras el cierre del trimestre al 30/09.',
    impactLevel: 'Alto',
    isHoldingOrWatchlist: true
  }
];
