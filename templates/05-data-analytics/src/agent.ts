/**
 * Data Analytics Agent
 * Handles automated data analysis, KPI tracking, report generation, and forecasting
 */

/**
 * Data source configuration
 */
export interface DataSource {
  id: string;
  name: string;
  type: "google-sheets" | "excel" | "supabase" | "hubspot" | "custom";
  endpoint?: string;
  spreadsheetId?: string;
  table?: string;
  range?: string;
  credentials?: Record<string, string>;
}

/**
 * KPI definition
 */
export interface KPI {
  id: string;
  name: string;
  description: string;
  metric: string;
  unit: string;
  target: number;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  threshold?: {
    warning: number;
    critical: number;
  };
}

/**
 * KPI value with metadata
 */
export interface KPIValue {
  kpiId: string;
  kpiName: string;
  value: number;
  target: number;
  unit: string;
  variance: number;
  percentageToTarget: number;
  timestamp: Date;
  trend?: "up" | "down" | "stable";
  status: "normal" | "warning" | "critical";
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  id: string;
  kpiId: string;
  kpiName: string;
  detectedAt: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestedAction?: string;
}

/**
 * Forecast result
 */
export interface ForecastResult {
  kpiId: string;
  kpiName: string;
  forecastDate: Date;
  forecastedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  model: "linear-regression" | "exponential-smoothing" | "arima";
  accuracy?: number;
}

/**
 * Report entity
 */
export interface Report {
  id: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  kpiValues: KPIValue[];
  anomalies: Anomaly[];
  forecasts: ForecastResult[];
  insights: string[];
  recommendations: string[];
  format: "pdf" | "markdown" | "html" | "json";
  chartData?: ChartData[];
}

/**
 * Chart data for visualization
 */
export interface ChartData {
  type: "line" | "bar" | "pie" | "area";
  title: string;
  kpiId: string;
  data: Array<{
    label: string;
    value: number;
  }>;
  options?: Record<string, unknown>;
}

/**
 * Raw data from sources
 */
export interface RawData {
  sourceId: string;
  sourceName: string;
  records: Record<string, unknown>[];
  fetchedAt: Date;
  recordCount: number;
}

/**
 * Data Analytics Agent
 */
export class DataAnalyticsAgent {
  private dataSources: Map<string, DataSource> = new Map();
  private kpis: Map<string, KPI> = new Map();
  private kpiHistory: Map<string, KPIValue[]> = new Map();
  private reports: Map<string, Report> = new Map();
  private anomalyThreshold: number = 2.0;
  private forecastHorizon: number = 30;

  /**
   * Initialize the Data Analytics Agent
   * @param dataSources Array of data sources
   * @param kpis Array of KPIs to track
   * @param config Agent configuration
   */
  constructor(
    dataSources: DataSource[],
    kpis: KPI[],
    config?: {
      anomalyThreshold?: number;
      forecastHorizon?: number;
    }
  ) {
    dataSources.forEach((source) => {
      this.dataSources.set(source.id, source);
    });

    kpis.forEach((kpi) => {
      this.kpis.set(kpi.id, kpi);
      this.kpiHistory.set(kpi.id, []);
    });

    if (config?.anomalyThreshold) {
      this.anomalyThreshold = config.anomalyThreshold;
    }

    if (config?.forecastHorizon) {
      this.forecastHorizon = config.forecastHorizon;
    }
  }

  /**
   * Fetch data from all configured sources
   * @returns Array of raw data from sources
   */
  public async fetchData(): Promise<RawData[]> {
    const results: RawData[] = [];

    for (const [, source] of this.dataSources) {
      try {
        const data = await this.fetchFromSource(source);
        results.push(data);
      } catch (error) {
        console.error(
          `Error fetching from source ${source.name}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Fetch data from a specific source
   * @private
   */
  private async fetchFromSource(source: DataSource): Promise<RawData> {
    // Placeholder for actual data fetching from different sources
    // Google Sheets, Supabase, HubSpot, Excel integration
    console.log(`Fetching data from ${source.name} (${source.type})`);

    switch (source.type) {
      case "google-sheets":
        return this.fetchFromGoogleSheets(source);
      case "supabase":
        return this.fetchFromSupabase(source);
      case "hubspot":
        return this.fetchFromHubSpot(source);
      case "excel":
        return this.fetchFromExcel(source);
      default:
        return this.fetchFromCustomSource(source);
    }
  }

  /**
   * Fetch from Google Sheets
   * @private
   */
  private async fetchFromGoogleSheets(source: DataSource): Promise<RawData> {
    // Placeholder implementation
    console.log(
      `Fetching from Google Sheets: ${source.spreadsheetId} - ${source.range}`
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      records: [],
      fetchedAt: new Date(),
      recordCount: 0,
    };
  }

  /**
   * Fetch from Supabase
   * @private
   */
  private async fetchFromSupabase(source: DataSource): Promise<RawData> {
    // Placeholder implementation
    console.log(`Fetching from Supabase table: ${source.table}`);

    return {
      sourceId: source.id,
      sourceName: source.name,
      records: [],
      fetchedAt: new Date(),
      recordCount: 0,
    };
  }

  /**
   * Fetch from HubSpot
   * @private
   */
  private async fetchFromHubSpot(source: DataSource): Promise<RawData> {
    // Placeholder implementation
    console.log(`Fetching from HubSpot endpoint: ${source.endpoint}`);

    return {
      sourceId: source.id,
      sourceName: source.name,
      records: [],
      fetchedAt: new Date(),
      recordCount: 0,
    };
  }

  /**
   * Fetch from Excel
   * @private
   */
  private async fetchFromExcel(source: DataSource): Promise<RawData> {
    // Placeholder implementation
    console.log(`Fetching from Excel: ${source.spreadsheetId}`);

    return {
      sourceId: source.id,
      sourceName: source.name,
      records: [],
      fetchedAt: new Date(),
      recordCount: 0,
    };
  }

  /**
   * Fetch from custom source
   * @private
   */
  private async fetchFromCustomSource(source: DataSource): Promise<RawData> {
    // Placeholder for custom data sources
    return {
      sourceId: source.id,
      sourceName: source.name,
      records: [],
      fetchedAt: new Date(),
      recordCount: 0,
    };
  }

  /**
   * Calculate KPI values from raw data
   * @param rawData Array of raw data from sources
   * @returns Array of calculated KPI values
   */
  public async calculateKPIs(rawData: RawData[]): Promise<KPIValue[]> {
    const kpiValues: KPIValue[] = [];

    for (const [, kpi] of this.kpis) {
      try {
        const value = this.evaluateMetric(kpi.metric, rawData);
        const variance = value - kpi.target;
        const percentageToTarget = (value / kpi.target) * 100;

        let status: "normal" | "warning" | "critical" = "normal";
        if (
          kpi.threshold &&
          percentageToTarget > kpi.threshold.critical
        ) {
          status = "critical";
        } else if (
          kpi.threshold &&
          percentageToTarget > kpi.threshold.warning
        ) {
          status = "warning";
        }

        const kpiValue: KPIValue = {
          kpiId: kpi.id,
          kpiName: kpi.name,
          value,
          target: kpi.target,
          unit: kpi.unit,
          variance,
          percentageToTarget,
          timestamp: new Date(),
          trend: this.calculateTrend(kpi.id, value),
          status,
        };

        kpiValues.push(kpiValue);

        // Store in history
        const history = this.kpiHistory.get(kpi.id) || [];
        history.push(kpiValue);
        if (history.length > 365) {
          history.shift();
        }
        this.kpiHistory.set(kpi.id, history);
      } catch (error) {
        console.error(`Error calculating KPI ${kpi.name}:`, error);
      }
    }

    return kpiValues;
  }

  /**
   * Evaluate a metric expression
   * @private
   */
  private evaluateMetric(metric: string, rawData: RawData[]): number {
    // Placeholder for metric evaluation logic
    // Would parse and evaluate expressions like: sum(revenue), count(leads), etc.
    console.log(`Evaluating metric: ${metric}`);

    // Return a placeholder value
    return Math.random() * 100;
  }

  /**
   * Calculate trend for a KPI
   * @private
   */
  private calculateTrend(
    kpiId: string,
    currentValue: number
  ): "up" | "down" | "stable" {
    const history = this.kpiHistory.get(kpiId) || [];

    if (history.length < 2) {
      return "stable";
    }

    const previousValue = history[history.length - 1].value;
    const change = currentValue - previousValue;
    const changePercent = Math.abs(change / previousValue);

    if (changePercent < 0.01) {
      return "stable";
    }

    return change > 0 ? "up" : "down";
  }

  /**
   * Detect anomalies in KPI values
   * @param kpiValues Array of KPI values
   * @returns Array of detected anomalies
   */
  public async detectAnomalies(kpiValues: KPIValue[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    for (const kpiValue of kpiValues) {
      const history = this.kpiHistory.get(kpiValue.kpiId) || [];

      if (history.length < 3) {
        continue;
      }

      // Calculate mean and standard deviation
      const values = history.map((h) => h.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      // Check if current value is an outlier
      const zScore = Math.abs((kpiValue.value - mean) / stdDev);

      if (zScore > this.anomalyThreshold) {
        let severity: "low" | "medium" | "high" | "critical" = "low";
        if (zScore > 3) {
          severity = "critical";
        } else if (zScore > 2.5) {
          severity = "high";
        } else if (zScore > 2) {
          severity = "medium";
        }

        const anomaly: Anomaly = {
          id: `anomaly-${Date.now()}-${kpiValue.kpiId}`,
          kpiId: kpiValue.kpiId,
          kpiName: kpiValue.kpiName,
          detectedAt: new Date(),
          value: kpiValue.value,
          expectedValue: mean,
          deviation: zScore,
          severity,
          description: `${kpiValue.kpiName} showing unusual behavior with z-score of ${zScore.toFixed(2)}`,
          suggestedAction: this.generateAnomalyAction(
            kpiValue,
            mean,
            severity
          ),
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Generate suggested action for anomaly
   * @private
   */
  private generateAnomalyAction(
    kpiValue: KPIValue,
    expectedValue: number,
    severity: string
  ): string {
    if (kpiValue.value > expectedValue) {
      return `${kpiValue.kpiName} is higher than expected. Investigate reasons for increased activity.`;
    } else {
      return `${kpiValue.kpiName} is lower than expected. Check data sources and investigate potential issues.`;
    }
  }

  /**
   * Generate forecast for KPIs
   * @returns Array of forecast results
   */
  public async forecast(): Promise<ForecastResult[]> {
    const forecasts: ForecastResult[] = [];

    for (const [kpiId, history] of this.kpiHistory) {
      if (history.length < 7) {
        continue;
      }

      const kpi = this.kpis.get(kpiId);
      if (!kpi) {
        continue;
      }

      // Simple linear regression forecast
      const forecastValue = this.linearRegression(
        history.map((h) => h.value),
        this.forecastHorizon
      );

      const forecast: ForecastResult = {
        kpiId,
        kpiName: kpi.name,
        forecastDate: new Date(
          Date.now() + this.forecastHorizon * 24 * 60 * 60 * 1000
        ),
        forecastedValue: forecastValue,
        confidenceInterval: {
          lower: forecastValue * 0.85,
          upper: forecastValue * 1.15,
        },
        model: "linear-regression",
        accuracy: 0.85,
      };

      forecasts.push(forecast);
    }

    return forecasts;
  }

  /**
   * Linear regression for forecasting
   * @private
   */
  private linearRegression(values: number[], horizon: number): number {
    if (values.length === 0) {
      return 0;
    }

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean),
      0
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Forecast at horizon position
    return intercept + slope * (n + horizon);
  }

  /**
   * Generate comprehensive report
   * @param kpiValues Array of KPI values
   * @param anomalies Array of detected anomalies
   * @param forecasts Array of forecasts
   * @returns Generated report
   */
  public async generateReport(
    kpiValues: KPIValue[],
    anomalies: Anomaly[],
    forecasts: ForecastResult[],
    format: "pdf" | "markdown" | "html" | "json" = "pdf"
  ): Promise<Report> {
    const report: Report = {
      id: `report-${Date.now()}`,
      title: "Informe de Análisis de Datos",
      generatedAt: new Date(),
      generatedBy: "DataAnalyticsAgent",
      period: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
      kpiValues,
      anomalies,
      forecasts,
      insights: this.generateInsights(kpiValues, anomalies),
      recommendations: this.generateRecommendations(
        kpiValues,
        anomalies,
        forecasts
      ),
      format,
      chartData: this.generateChartData(kpiValues),
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Generate insights from data
   * @private
   */
  private generateInsights(
    kpiValues: KPIValue[],
    anomalies: Anomaly[]
  ): string[] {
    const insights: string[] = [];

    const criticalKPIs = kpiValues.filter((k) => k.status === "critical");
    if (criticalKPIs.length > 0) {
      insights.push(
        `${criticalKPIs.length} KPI(s) are in critical status and require immediate attention.`
      );
    }

    if (anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter(
        (a) => a.severity === "critical"
      );
      if (criticalAnomalies.length > 0) {
        insights.push(
          `${criticalAnomalies.length} critical anomaly(ies) detected in the data.`
        );
      }
    }

    const improvingKPIs = kpiValues.filter((k) => k.trend === "up");
    if (improvingKPIs.length > 0) {
      insights.push(`${improvingKPIs.length} KPI(s) show positive trends.`);
    }

    return insights;
  }

  /**
   * Generate recommendations
   * @private
   */
  private generateRecommendations(
    kpiValues: KPIValue[],
    anomalies: Anomaly[],
    forecasts: ForecastResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on anomalies
    anomalies.forEach((anomaly) => {
      if (anomaly.suggestedAction) {
        recommendations.push(anomaly.suggestedAction);
      }
    });

    // Recommendations based on forecast trends
    forecasts.forEach((forecast) => {
      if (forecast.forecastedValue < forecast.confidenceInterval.lower) {
        recommendations.push(
          `${forecast.kpiName} is forecasted to decrease. Consider investigating underlying causes.`
        );
      }
    });

    // Recommendations based on KPI status
    const warningKPIs = kpiValues.filter((k) => k.status === "warning");
    if (warningKPIs.length > 0) {
      recommendations.push(
        `Monitor ${warningKPIs.map((k) => k.kpiName).join(", ")} closely to prevent critical status.`
      );
    }

    return recommendations;
  }

  /**
   * Generate chart data for visualization
   * @private
   */
  private generateChartData(kpiValues: KPIValue[]): ChartData[] {
    const charts: ChartData[] = [];

    // KPI comparison chart
    const kpiChart: ChartData = {
      type: "bar",
      title: "KPI Performance vs Target",
      kpiId: "all",
      data: kpiValues.map((k) => ({
        label: k.kpiName,
        value: k.percentageToTarget,
      })),
    };
    charts.push(kpiChart);

    // Individual KPI trend charts
    for (const kpiValue of kpiValues) {
      const history = this.kpiHistory.get(kpiValue.kpiId) || [];
      if (history.length > 1) {
        const trendChart: ChartData = {
          type: "line",
          title: `${kpiValue.kpiName} Trend`,
          kpiId: kpiValue.kpiId,
          data: history.slice(-30).map((h) => ({
            label: h.timestamp.toLocaleDateString("es-ES"),
            value: h.value,
          })),
        };
        charts.push(trendChart);
      }
    }

    return charts;
  }

  /**
   * Send report (placeholder for email/API integration)
   * @param reportId Report ID to send
   * @returns Send status
   */
  public async sendReport(
    reportId: string,
    recipients: string[]
  ): Promise<{ status: string; sentTo: string[] }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    console.log(
      `Sending report ${reportId} to ${recipients.join(", ")}`
    );

    return {
      status: "sent",
      sentTo: recipients,
    };
  }

  /**
   * Get report by ID
   */
  public getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  public getAllReports(): Report[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get KPI history
   */
  public getKPIHistory(kpiId: string): KPIValue[] {
    return this.kpiHistory.get(kpiId) || [];
  }
}

/**
 * Export for use in the agent framework
 */
export default DataAnalyticsAgent;
