"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listWaterBills,
  listWaterContracts,
  listWaterCustomers,
  listWaterReadings,
} from "@/features/water/api";
import type { WaterBill, WaterContract, WaterCustomer, WaterReading } from "@/features/water/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { CreditCard, Droplets, FileText, Waves, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function WaterReportPage() {
  const [customers, setCustomers] = useState<WaterCustomer[]>([]);
  const [contracts, setContracts] = useState<WaterContract[]>([]);
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [bills, setBills] = useState<WaterBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      listWaterCustomers(),
      listWaterContracts(),
      listWaterReadings(),
      listWaterBills(),
    ])
      .then(([customerRows, contractRows, readingRows, billRows]) => {
        setCustomers(customerRows);
        setContracts(contractRows);
        setReadings(readingRows);
        setBills(billRows);
      })
      .catch((reason: unknown) =>
        setError(getErrorMessage(reason, "Nao foi possivel carregar o relatorio de agua"))
      )
      .finally(() => setLoading(false));
  }, []);

  const consumptionEvolution = useMemo(() => {
    const monthMap: Record<string, { consumo: number; valor: number }> = {};
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString("pt-PT", { month: "short" });
      months.push({ key: monthKey, name: monthName });
      monthMap[monthKey] = { consumo: 0, valor: 0 };
    }

    readings.forEach((reading) => {
      if (!reading.data) return;
      const date = new Date(reading.data);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (monthMap[monthKey]) {
        monthMap[monthKey].consumo += reading.consumoM3 || 0;
        monthMap[monthKey].valor += reading.valorPagar || 0;
      }
    });

    return months.map((month) => ({
      mes: month.name,
      consumo: monthMap[month.key].consumo,
      valor: monthMap[month.key].valor,
    }));
  }, [readings]);

  const analytics = useMemo(() => {
    const pendingBills = bills.filter((bill) => bill.estadoPagamento !== "PAGO");
    const overdueBills = bills.filter((bill) => bill.estadoPagamento === "ATRASADO");
    const activeContracts = contracts.filter((contract) => contract.estado === "ATIVA");

    return {
      customers: customers.length,
      activeContracts: activeContracts.length,
      readings: readings.length,
      bills: bills.length,
      pendingBills: pendingBills.length,
      overdueBills: overdueBills.length,
      pendingAmount: pendingBills.reduce((sum, bill) => sum + Number(bill.valorTotal || 0), 0),
      overdueAmount: overdueBills.reduce((sum, bill) => sum + Number(bill.valorTotal || 0), 0),
      totalConsumption: readings.reduce((sum, reading) => sum + (reading.consumoM3 || 0), 0),
      totalRevenue: readings.reduce((sum, reading) => sum + (reading.valorPagar || 0), 0),
      lastReadings: readings.slice(0, 8),
      priorityBills: [...pendingBills]
        .sort((left, right) => Number(right.valorTotal || 0) - Number(left.valorTotal || 0))
        .slice(0, 8),
    };
  }, [bills, contracts, customers.length, readings]);

  const contractMap = useMemo(
    () => new Map(contracts.map((contract) => [contract.id, contract])),
    [contracts]
  );

  if (loading) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-700 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de agua</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">A carregar dados...</h1>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">A carregar relatorio...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-700 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de agua</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Erro</h1>
        </div>
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-700 p-6 text-white shadow-lg shadow-slate-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Relatorio de agua</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Clientes, consumo, cobranca e caixa do modulo</h1>
        <p className="mt-2 text-sm text-cyan-100">Acompanhamento de consumo, facturação e análise financeira do módulo de água</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Clientes de agua", value: analytics.customers, icon: Droplets, tone: "bg-cyan-50 text-cyan-700" },
          { label: "Contratos activos", value: analytics.activeContracts, icon: Waves, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Facturas pendentes", value: analytics.pendingBills, icon: FileText, tone: "bg-amber-50 text-amber-700" },
          { label: "Em atraso", value: analytics.overdueBills, icon: CreditCard, tone: "bg-rose-50 text-rose-700" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                  <div className="mt-3 text-3xl font-black text-slate-900">{card.value}</div>
                </div>
                <div className={`rounded-2xl p-3 ${card.tone}`}>
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Evolução do Consumo</p>
            <h2 className="text-xl font-black text-slate-900 mt-1">Consumo de água por mês (m³)</h2>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={consumptionEvolution} margin={{ top: 10, right: 5, left: -5, bottom: 10 }}>
              <defs>
                <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
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
                formatter={(value, name) => {
                  const numValue = Number(value);
                  if (name === "consumo") return [`${numValue} m³`, "Consumo"];
                  return [formatMoney(numValue), "Valor"];
                }}
              />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
              <YAxis hide domain={["dataMin - 10", "dataMax + 50"]} />
              <Area type="monotone" dataKey="consumo" name="consumo" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#waterGradient)" activeDot={{ r: 6, fill: "#06b6d4" }} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Consumo Total</p>
            <p className="text-lg font-bold text-slate-900">{analytics.totalConsumption} m³</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Receita Total</p>
            <p className="text-lg font-bold text-cyan-600">{formatMoney(analytics.totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Média Mensal</p>
            <p className="text-lg font-bold text-slate-900">
              {consumptionEvolution.length > 0 ? `${(analytics.totalConsumption / consumptionEvolution.length).toFixed(0)} m³` : "0 m³"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pico Máximo</p>
            <p className="text-lg font-bold text-sky-600">{Math.max(...consumptionEvolution.map((d) => d.consumo), 0)} m³</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Leituras registadas", value: analytics.readings, helper: "Historico consolidado de consumo" },
          { label: "Facturas emitidas", value: analytics.bills, helper: "Todos os ciclos facturados ate agora" },
          { label: "Valor pendente", value: formatMoney(analytics.pendingAmount), helper: "Tudo o que ainda esta por regularizar" },
          { label: "Valor em atraso", value: formatMoney(analytics.overdueAmount), helper: "Cobranca critica com atraso activo" },
        ].map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <div className="mt-3 text-3xl font-black text-slate-900">{card.value}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Maiores valores por cobrar</p>
          <div className="mt-5 grid gap-3">
            {analytics.priorityBills.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Nao existe nenhuma factura pendente neste momento.
              </div>
            ) : (
              analytics.priorityBills.map((bill) => {
                const contract = bill.ligacaoId ? contractMap.get(bill.ligacaoId) : null;
                return (
                  <div key={bill.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">Factura #{bill.id} - {bill.consumidorNome}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Contrato #{bill.ligacaoId ?? "--"} | {contract?.referenciaLocal || "Sem referencia"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatMoney(bill.valorTotal)}</p>
                        <p className="mt-1 text-xs text-slate-500">{bill.estadoPagamento}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ultimas leituras</p>
          <div className="mt-5 grid gap-3">
            {analytics.lastReadings.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Ainda nao existem leituras registadas.
              </div>
            ) : (
              analytics.lastReadings.map((reading) => {
                const contract = contractMap.get(reading.ligacaoId);
                return (
                  <div key={reading.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{contract?.consumidorNome || `Contrato #${reading.ligacaoId}`}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(reading.data)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-cyan-700">{reading.consumoM3} m³</p>
                        <p className="mt-1 text-xs text-slate-500">{formatMoney(reading.valorPagar)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}