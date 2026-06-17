"use client";

import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, Leaf, Scale, Activity, Download, Share2, ArrowLeft, LayoutGrid, Rows3 } from "lucide-react";
import { exportToCSV, downloadCSV } from "@/lib/storage";
import type { DailyResult, SimulationConfig, SimulationSummary } from "@/lib/types";

interface ResultsProps {
  config?: SimulationConfig;
  summary?: SimulationSummary;
  dailyResults?: DailyResult[];
}

export function Results({ config: propConfig, summary: propSummary, dailyResults: propDailyResults }: ResultsProps) {
  const { currentResult, selectedHistoryItem, navigateTo, settings } = useApp();
  const lang = settings.language;
  const [activeTab, setActiveTab] = useState("charts");
  const [layout, setLayout] = useState<"column" | "grid">("column");

  // Use props or context data
  const config = propConfig || selectedHistoryItem?.config || currentResult?.config;
  const summary = propSummary || selectedHistoryItem?.summary || currentResult?.summary;
  const dailyResults = propDailyResults || selectedHistoryItem?.daily_results || currentResult?.daily_results;

  if (!config || !summary || !dailyResults) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          {lang === "es" ? "No hay resultados disponibles" : "No results available"}
        </p>
        <Button onClick={() => navigateTo("new-simulation")}>
          {lang === "es" ? "Nueva Simulación" : "New Simulation"}
        </Button>
      </div>
    );
  }

  const handleExport = () => {
    const csv = exportToCSV(dailyResults, config);
    const filename = `digitwin_${config.crop_name}_${config.fecha_inicio}.csv`;
    downloadCSV(csv, filename);
  };

  const chartConfig = {
    DVS: { label: "DVS", color: "var(--chart-1)" },
    LAI: { label: "LAI", color: "var(--chart-2)" },
    TAGP: { label: "TAGP", color: "var(--chart-3)" },
    SM: { label: "SM", color: "var(--chart-4)" },
  };

  // Format data for charts (convert day string to index)
  const chartData = dailyResults.map((d, i) => ({
    ...d,
    dayIndex: i + 1,
  }));

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Summary KPIs */}
      <section className="grid grid-cols-3 gap-3">

        <Card className="bg-chart-3/5 border-chart-3/20 md:flex-row md:items-center md:justify-between">
          <CardHeader className="pb-2 md:pb-0">
            <CardDescription className="flex items-center gap-2 text-chart-3">
              <Scale className="h-4 w-4" />
              {lang === "es" ? "Produccion" : "Production"} (TAGP)
            </CardDescription>
          </CardHeader>
          <CardContent className="md:text-right">
            <div className="text-2xl font-bold">{summary.final_TAGP.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">kg/ha</p>
          </CardContent>
        </Card>

        <Card className="bg-chart-2/5 border-chart-2/20 md:flex-row md:items-center md:justify-between">
          <CardHeader className="pb-2 md:pb-0">
            <CardDescription className="flex items-center gap-2 text-chart-2">
              <Leaf className="h-4 w-4" />
              LAI
            </CardDescription>
          </CardHeader>
          <CardContent className="md:text-right">
            <div className="text-2xl font-bold">{summary.final_LAI.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              {lang === "es" ? "Indice foliar" : "Leaf area index"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-chart-4/5 border-chart-4/20 md:flex-row md:items-center md:justify-between">
          <CardHeader className="pb-2 md:pb-0">
            <CardDescription className="flex items-center gap-2 text-chart-4">
              <Activity className="h-4 w-4" />
              DVS
            </CardDescription>
          </CardHeader>
          <CardContent className="md:text-right">
            <div className="text-2xl font-bold">{summary.final_DVS.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              {lang === "es" ? "Etapa desarrollo" : "Development stage"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tabs for Charts / Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2">
          <TabsList className="flex-1 grid grid-cols-2">
            <TabsTrigger value="charts">
              {lang === "es" ? "Graficos" : "Charts"}
            </TabsTrigger>
            <TabsTrigger value="table">
              {lang === "es" ? "Tabla" : "Table"}
            </TabsTrigger>
          </TabsList>

          <ToggleGroup
            type="single"
            variant="outline"
            value={layout}
            onValueChange={(value) => value && setLayout(value as "column" | "grid")}
          >
            <ToggleGroupItem value="column" aria-label={lang === "es" ? "Una columna" : "One column"}>
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label={lang === "es" ? "Grilla 2x2" : "2x2 grid"}>
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <TabsContent
          value="charts"
          className={`gap-4 mt-4 grid ${layout === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {/* DVS Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs truncate">
                DVS ({lang === "es" ? "Etapa de Desarrollo" : "Development Stage"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dayIndex"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="DVS"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* TAGP Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs truncate">
                TAGP ({lang === "es" ? "Produccion Aerea Total" : "Total Above-Ground Production"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dayIndex"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="TAGP"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* LAI Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs truncate">
                LAI ({lang === "es" ? "Indice de Area Foliar" : "Leaf Area Index"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dayIndex"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="LAI"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* SM Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs truncate">
                SM ({lang === "es" ? "Humedad del Sustrato" : "Soil Moisture"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dayIndex"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="SM"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-card">
                        {lang === "es" ? "Dia" : "Day"}
                      </TableHead>
                      <TableHead className="sticky top-0 bg-card">DVS</TableHead>
                      <TableHead className="sticky top-0 bg-card">LAI</TableHead>
                      <TableHead className="sticky top-0 bg-card">TAGP</TableHead>

                      <TableHead className="sticky top-0 bg-card">SM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyResults.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.day}</TableCell>
                        <TableCell className="font-mono text-xs">{row.DVS.toFixed(4)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.LAI.toFixed(4)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.TAGP.toFixed(2)}</TableCell>

                        <TableCell className="font-mono text-xs">{row.SM.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          {lang === "es" ? "Exportar CSV" : "Export CSV"}
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={() => navigateTo("new-simulation")}>
          <ArrowLeft className="h-4 w-4" />
          {lang === "es" ? "Nueva" : "New"}
        </Button>
      </div>
    </div>
  );
}
