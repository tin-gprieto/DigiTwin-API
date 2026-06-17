"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Calendar, Thermometer, Sun, Droplets, Zap, Play, AlertCircle } from "lucide-react";
import { runSimulation, getCrops, getVarieties, DEFAULT_SIMULATION_CONFIG, LIGHT_LEVEL_LABELS, DEFAULT_CROPS, DEFAULT_VARIETIES } from "@/lib/api";
import { saveSimulation } from "@/lib/storage";
import type { SimulationConfig, LightLevel } from "@/lib/types";

export function NewSimulation() {
  const { navigateTo, setCurrentResult, settings } = useApp();
  const lang = settings.language;

  const [config, setConfig] = useState<SimulationConfig>({
    ...DEFAULT_SIMULATION_CONFIG,
    crop_name: "",
    variety_name: "",
    fecha_inicio: new Date().toISOString().split("T")[0],
  });

  const [crops, setCrops] = useState<string[]>([]);
  const [varieties, setVarieties] = useState<string[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingVarieties, setLoadingVarieties] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropsFallback, setCropsFallback] = useState(false);
  const [varietiesFallback, setVarietiesFallback] = useState(false);

  // Fetch crops on mount
  useEffect(() => {
    setLoadingCrops(true);
    getCrops()
      .then((data) => {
        setCrops(data.crops);
        setCropsFallback(false);
        if (data.crops.length > 0 && !config.crop_name) {
          setConfig((prev) => ({ ...prev, crop_name: data.crops[0] }));
        }
      })
      .catch(() => {
        // Fall back to defaults so the form stays usable
        setCrops(DEFAULT_CROPS);
        setCropsFallback(true);
        setConfig((prev) => ({
          ...prev,
          crop_name: prev.crop_name || DEFAULT_SIMULATION_CONFIG.crop_name,
        }));
      })
      .finally(() => setLoadingCrops(false));
  }, []);

  // Fetch varieties when crop changes
  useEffect(() => {
    if (!config.crop_name) return;

    setLoadingVarieties(true);
    getVarieties(config.crop_name)
      .then((data) => {
        setVarieties(data.varieties);
        setVarietiesFallback(false);
        if (data.varieties.length > 0 && !data.varieties.includes(config.variety_name)) {
          setConfig((prev) => ({ ...prev, variety_name: data.varieties[0] }));
        }
      })
      .catch(() => {
        // Fall back to default varieties so the form stays usable
        const fallback = DEFAULT_VARIETIES[config.crop_name] ?? [DEFAULT_SIMULATION_CONFIG.variety_name];
        setVarieties(fallback);
        setVarietiesFallback(true);
        setConfig((prev) => ({
          ...prev,
          variety_name: prev.variety_name || fallback[0],
        }));
      })
      .finally(() => setLoadingVarieties(false));
  }, [config.crop_name]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await runSimulation(config);

      // Save to local storage
      saveSimulation(result.config, result.summary, result.daily_results);

      // Set current result and navigate
      setCurrentResult(result);
      navigateTo("results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "es"
            ? "Error al ejecutar la simulación"
            : "Failed to run simulation"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = <K extends keyof SimulationConfig>(
    key: K,
    value: SimulationConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {cropsFallback && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {lang === "es"
                ? "No se pudo conectar con el servidor. Se muestran cultivos por defecto."
                : "Could not reach the server. Showing default crops."}
            </p>
          </CardContent>
        </Card>
      )}
      {varietiesFallback && !cropsFallback && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {lang === "es"
                ? "No se pudieron cargar las variedades. Se muestran valores por defecto."
                : "Could not load varieties. Showing default values."}
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </span>
              {lang === "es" ? "Configuracion del Cultivo" : "Crop Configuration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>{lang === "es" ? "Cultivo" : "Crop"}</FieldLabel>
                <Select
                  value={config.crop_name}
                  onValueChange={(v) => updateConfig("crop_name", v)}
                  disabled={loadingCrops}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingCrops ? (lang === "es" ? "Cargando..." : "Loading...") : (lang === "es" ? "Seleccionar cultivo" : "Select crop")} />
                  </SelectTrigger>
                  <SelectContent>
                    {crops.map((crop) => (
                      <SelectItem key={crop} value={crop} className="capitalize">
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>{lang === "es" ? "Variedad" : "Variety"}</FieldLabel>
                <Select
                  value={config.variety_name}
                  onValueChange={(v) => updateConfig("variety_name", v)}
                  disabled={loadingVarieties || !config.crop_name}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingVarieties ? (lang === "es" ? "Cargando..." : "Loading...") : (lang === "es" ? "Seleccionar variedad" : "Select variety")} />
                  </SelectTrigger>
                  <SelectContent>
                    {varieties.map((variety) => (
                      <SelectItem key={variety} value={variety}>
                        {variety.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>
                  {lang === "es" ? "Fecha de inicio" : "Start date"}
                </FieldLabel>
                <Input
                  type="date"
                  value={config.fecha_inicio}
                  onChange={(e) => updateConfig("fecha_inicio", e.target.value)}
                  className="w-full"
                />
              </Field>

              <Field>
                <FieldLabel>
                  {lang === "es" ? "Dias de cultivo" : "Cultivation days"}
                </FieldLabel>
                <FieldDescription>
                  {config.dias_cultivo} {lang === "es" ? "dias" : "days"}
                </FieldDescription>
                <Slider
                  value={[config.dias_cultivo]}
                  onValueChange={([v]) => updateConfig("dias_cultivo", v)}
                  min={1}
                  max={90}
                  step={1}
                  className="mt-2"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-3/20">
                  <Thermometer className="h-4 w-4 text-chart-3" />
                </span>
                {lang === "es" ? "Condiciones Ambientales" : "Environmental Conditions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    {lang === "es" ? "Temperatura ambiente" : "Ambient temperature"}
                  </FieldLabel>
                  <FieldDescription>
                    {config.temperatura_ambiente.toFixed(1)}°C
                  </FieldDescription>
                  <Slider
                    value={[config.temperatura_ambiente]}
                    onValueChange={([v]) => updateConfig("temperatura_ambiente", v)}
                    min={10}
                    max={40}
                    step={0.5}
                    className="mt-2"
                  />
                </Field>

                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {lang === "es" ? "Nivel de luz" : "Light level"}
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(["baja", "media", "alta"] as LightLevel[]).map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={config.luz === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig("luz", level)}
                        className="w-full"
                      >
                        {LIGHT_LEVEL_LABELS[level][lang]}
                      </Button>
                    ))}
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-2/20">
                  <Droplets className="h-4 w-4 text-chart-2" />
                </span>
                {lang === "es" ? "Solucion Nutritiva" : "Nutrient Solution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    pH
                  </FieldLabel>
                  <FieldDescription>{config.ph.toFixed(1)}</FieldDescription>
                  <Slider
                    value={[config.ph]}
                    onValueChange={([v]) => updateConfig("ph", v)}
                    min={4}
                    max={9}
                    step={0.1}
                    className="mt-2"
                  />
                </Field>

                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {lang === "es" ? "Conductividad electrica (EC)" : "Electrical Conductivity (EC)"}
                  </FieldLabel>
                  <FieldDescription>{config.ec.toFixed(1)} mS/cm</FieldDescription>
                  <Slider
                    value={[config.ec]}
                    onValueChange={([v]) => updateConfig("ec", v)}
                    min={0.5}
                    max={5}
                    step={0.1}
                    className="mt-2"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full h-14 text-base gap-3"
        onClick={handleSubmit}
        disabled={loading || !config.crop_name || !config.variety_name}
      >
        {loading ? (
          <>
            <Spinner className="h-5 w-5" />
            {lang === "es" ? "Ejecutando..." : "Running..."}
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            {lang === "es" ? "Ejecutar Simulación" : "Run Simulation"}
          </>
        )}
      </Button>
    </div>
  );
}
