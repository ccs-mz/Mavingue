"use client";

import { useEffect, useMemo, useState } from "react";
import { stockApi } from "@/features/stock/api";
import type { StockItem, StockMovement } from "@/features/stock/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { AlertTriangle, Boxes, Layers3, PackageSearch, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StockEvolution = {
  mes: string;
  valorEmStock: number;
  quantidade: number;
};

export function StockReportPage() {
  const [rows, setRows] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([stockApi.list(), stockApi.movements()])
      .then(([stockRows, movementRows]) => {
        setRows(stockRows);
        setMovements(movementRows);
      })
      .catch((reason: unknown) => setError(getErrorMessage(reason, "Nao foi possivel carregar o relatorio de stock")))
      .finally(() => setLoading(false));
  }, []);

  const stockEvolution = useMemo(() => {
    const monthMap: Record<string, { valorEmStock: number; quantidade: number; nome: string }> = {};
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString("pt-PT", { month: "short" });
      months.push({ key: monthKey, name: monthName });
      monthMap[monthKey] = { valorEmStock: 0, quantidade: 0, nome: monthName };
    }

    movements.forEach((movement) => {
      if (!movement.criadoEm) return;
      const date = new Date(movement.criadoEm);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (monthMap[monthKey]) {
        const valorMovimento = (movement.quantidade || 0) * (movement.precoUnitario || 0);
        if (movement.tipo === "ENTRADA") {
          monthMap[monthKey].valorEmStock += valorMovimento;
          monthMap[monthKey].quantidade += movement.quantidade || 0;
        } else {
          monthMap[monthKey].valorEmStock -= valorMovimento;
          monthMap[monthKey].quantidade -= movement.quantidade || 0;
        }
      }
    });

    let valorAcumulado = 0;
    let quantidadeAcumulada = 0;
    
    return months.map((month) => {
      valorAcumulado += monthMap[month.key].valorEmStock;
      quantidadeAcumulada += monthMap[month.key].quantidade;
      return {
        mes: month.name,
        valorEmStock: Math.max(0, valorAcumulado),
        quantidade: Math.max(0, quantidadeAcumulada),
      };
    });
  }, [movements]);

  const analytics = useMemo(
    () => ({
      valorTotal: rows.reduce((sum, row) => sum + Number(row.valorEmStock || 0), 0),
      unidades: rows.reduce((sum, row) => sum + Number(row.quantidade || 0), 0),
      alertas: rows.filter((row) => Number(row.quantidade || 0) <= Number(row.stockMinimo || 0)).length,
      topValue: [...rows].sort((left, right) => Number(right.valorEmStock || 0) - Number(left.valorEmStock || 0)).slice(0, 8),
    }),
    [rows]
  );

  if (loading) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-600 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de stock</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">A carregar dados...</h1>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">A carregar relatorio...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-600 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de stock</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Erro</h1>
        </div>
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-600 p-6 text-white shadow-lg shadow-slate-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de stock</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Valor restante e detalhe do inventario</h1>
        <p className="mt-2 text-sm text-cyan-100">Evolução do stock, valor em inventário e monitoramento de produtos</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Valor total em stock", value: formatMoney(analytics.valorTotal), icon: Layers3 },
          { label: "Unidades restantes", value: analytics.unidades, icon: Boxes },
          { label: "Produtos monitorados", value: rows.length, icon: PackageSearch },
          { label: "Alertas de minimo", value: analytics.alertas, icon: AlertTriangle },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                  <div className="mt-3 text-3xl font-black text-slate-900">{card.value}</div>
                </div>
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Evolução do Stock</p>
            <h2 className="text-xl font-black text-slate-900 mt-1">Valor em inventário por mês</h2>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stockEvolution} margin={{ top: 10, right: 5, left: -5, bottom: 10 }}>
              <defs>
                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "4 4" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  padding: "10px 14px",
                  backgroundColor: "#ffffff",
                }}
                labelStyle={{ color: "#6b7280", fontWeight: 600, marginBottom: "4px" }}
                itemStyle={{ color: "#111827", fontWeight: 700 }}
                formatter={(value) => {
                  const numValue = Number(value);
                  return [formatMoney(numValue), "Valor em Stock"];
                }}
              />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
              <YAxis hide domain={["dataMin - 10000", "dataMax + 20000"]} />
              <Area type="monotone" dataKey="valorEmStock" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#stockGradient)" activeDot={{ r: 6, fill: "#0891b2" }} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stock Atual</p>
            <p className="text-lg font-bold text-slate-900">{formatMoney(analytics.valorTotal)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pico Máximo</p>
            <p className="text-lg font-bold text-cyan-600">{formatMoney(Math.max(...stockEvolution.map((d) => d.valorEmStock), 0))}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Variação</p>
            <p className="text-lg font-bold text-slate-900">
              {stockEvolution.length >= 2 ? formatMoney(stockEvolution[stockEvolution.length - 1].valorEmStock - stockEvolution[0].valorEmStock) : formatMoney(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Unidades</p>
            <p className="text-lg font-bold text-slate-900">{analytics.unidades}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Produtos com maior valor</p>
          <div className="mt-5 grid gap-3">
            {analytics.topValue.map((row) => (
              <div key={row.produtoId} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{row.produtoNome}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.quantidade} un. | minimo {row.stockMinimo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-cyan-700">{formatMoney(row.valorEmStock)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatMoney(row.precoUnitario)}/un</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ultimos movimentos</p>
          <div className="mt-5 grid gap-3">
            {movements.slice(0, 8).map((movement) => (
              <div key={movement.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{movement.produtoNome}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(movement.criadoEm)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${movement.tipo === "ENTRADA" ? "text-emerald-700" : "text-rose-700"}`}>
                      {movement.tipo === "ENTRADA" ? "+" : "-"}{movement.quantidade}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{movement.tipo}</p>
                  </div>
                </div>
                {movement.motivo ? <p className="mt-3 text-sm text-slate-600">{movement.motivo}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}