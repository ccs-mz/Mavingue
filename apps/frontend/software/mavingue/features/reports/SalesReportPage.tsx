"use client";

import { useEffect, useMemo, useState } from "react";
import { salesApi } from "@/features/sales/api";
import type { Venda } from "@/features/sales/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import {
  TrendingUp,
  ShoppingBag,
  Calendar,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SalesReportPage() {
  const [sales, setSales] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"semanal" | "mensal">("semanal");

  useEffect(() => {
    salesApi
      .list()
      .then((data) => setSales(data as Venda[]))
      .catch((reason: unknown) =>
        setError(getErrorMessage(reason, "Não foi possível carregar o relatório de vendas"))
      )
      .finally(() => setLoading(false));
  }, []);

  // Processar dados por dia da semana ou mês
  const chartData = useMemo(() => {
    if (period === "semanal") {
      const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      const dayMap: Record<string, { vendas: number; quantidade: number }> = {};

      days.forEach((day) => {
        dayMap[day] = { vendas: 0, quantidade: 0 };
      });

      sales.forEach((sale) => {
        if (!sale.criadoEm) return; // ← criadoEm, não createdAt
        const date = new Date(sale.criadoEm);
        const dayIndex = date.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];

        if (dayMap[dayName]) {
          dayMap[dayName].vendas += sale.total || 0;
          dayMap[dayName].quantidade += sale.quantidade || 0;
        }
      });

      return days.map((dia) => ({
        dia,
        vendas: dayMap[dia].vendas,
        quantidade: dayMap[dia].quantidade,
      }));
    } else {
      // Mensal - últimos 6 meses
      const monthMap: Record<string, { vendas: number; quantidade: number }> = {};
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleDateString("pt-PT", { month: "short" });
        months.push({ key: monthKey, name: monthName });
        monthMap[monthKey] = { vendas: 0, quantidade: 0 };
      }

      sales.forEach((sale) => {
        if (!sale.criadoEm) return;
        const date = new Date(sale.criadoEm);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (monthMap[monthKey]) {
          monthMap[monthKey].vendas += sale.total || 0;
          monthMap[monthKey].quantidade += sale.quantidade || 0;
        }
      });

      return months.map((month) => ({
        dia: month.name,
        vendas: monthMap[month.key].vendas,
        quantidade: monthMap[month.key].quantidade,
      }));
    }
  }, [sales, period]);

  // Analytics principais
  const analytics = useMemo(() => {
    const totalVendas = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalItens = sales.reduce((sum, sale) => sum + (sale.quantidade || 0), 0);
    const totalVendasCount = sales.length;
    const ticketMedio = totalVendasCount > 0 ? totalVendas / totalVendasCount : 0;

    // Vendas por mês (para tendência)
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const vendasMesAtual = sales.filter((sale) => {
      if (!sale.criadoEm) return false;
      const date = new Date(sale.criadoEm);
      return date.getMonth() === mesAtual && date.getFullYear() === anoAtual;
    }).length;

    const vendasMesAnterior = sales.filter((sale) => {
      if (!sale.criadoEm) return false;
      const date = new Date(sale.criadoEm);
      const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
      const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
      return date.getMonth() === mesAnterior && date.getFullYear() === anoAnterior;
    }).length;

    const tendencia =
      vendasMesAnterior > 0 ? ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100 : 0;

    // Top produtos (usando items se disponível, ou produto individual)
    const productMap: Record<string, { quantidade: number; receita: number }> = {};

    sales.forEach((sale) => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const productName = item.produtoNome;
          const quantity = item.quantidade;
          const revenue = item.subtotal;

          if (!productMap[productName]) {
            productMap[productName] = { quantidade: 0, receita: 0 };
          }
          productMap[productName].quantidade += quantity;
          productMap[productName].receita += revenue;
        });
      } else {
        // Venda simples sem items
        const productName = sale.produtoNome;
        if (!productMap[productName]) {
          productMap[productName] = { quantidade: 0, receita: 0 };
        }
        productMap[productName].quantidade += sale.quantidade;
        productMap[productName].receita += sale.total;
      }
    });

    const topProducts = Object.entries(productMap)
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    // Últimas vendas
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime())
      .slice(0, 8);

    return {
      totalVendas,
      totalItens,
      totalVendasCount,
      ticketMedio,
      tendencia,
      tendenciaPositiva: tendencia >= 0,
      topProducts,
      recentSales,
    };
  }, [sales]);

  if (loading) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-green-700 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-200">
            Relatório de Vendas
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">A carregar dados...</h1>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
          A carregar relatório...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-green-700 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-200">
            Relatório de Vendas
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Erro</h1>
        </div>
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      {/* Cabeçalho */}
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-green-700 p-6 text-white shadow-lg shadow-slate-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-200">
          Relatório de Vendas
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Receita e desempenho comercial
        </h1>
        <p className="mt-2 text-sm text-green-100">
          Análise completa de vendas, produtos mais vendidos e evolução do negócio
        </p>
      </section>

      {/* Cards principais */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Receita Total", value: formatMoney(analytics.totalVendas), icon: DollarSign },
          { label: "Total de Vendas", value: analytics.totalVendasCount, icon: ShoppingBag },
          { label: "Ticket Médio", value: formatMoney(analytics.ticketMedio), icon: TrendingUp },
          { label: "Total Itens Vendidos", value: analytics.totalItens, icon: Package },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {card.label}
                  </p>
                  <div className="mt-3 text-3xl font-black text-slate-900">{card.value}</div>
                </div>
                <div className="rounded-2xl bg-green-50 p-3 text-green-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Gráfico */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Evolução</p>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {period === "semanal" ? "Vendas por dia da semana" : "Vendas por mês"}
            </h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPeriod("semanal")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                period === "semanal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod("mensal")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                period === "mensal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -5, bottom: 10 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.02} />
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
                  return [formatMoney(numValue), "Receita"];
                }}
              />

              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
              <YAxis hide domain={["dataMin - 200", "dataMax + 300"]} />

              <Area
                type="monotone"
                dataKey="vendas"
                stroke="#2e7d32"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGradient)"
                activeDot={{ r: 6, fill: "#2e7d32" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {period === "semanal" ? "Total Semana" : "Total Período"}
            </p>
            <p className="text-lg font-bold text-slate-900">
              {formatMoney(chartData.reduce((acc, curr) => acc + curr.vendas, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {period === "semanal" ? "Média Diária" : "Média Mensal"}
            </p>
            <p className="text-lg font-bold text-slate-900">
              {formatMoney(chartData.reduce((acc, curr) => acc + curr.vendas, 0) / (chartData.length || 1))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Melhor {period === "semanal" ? "Dia" : "Mês"}
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatMoney(Math.max(...chartData.map((d) => d.vendas), 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tendência</p>
            <div className="flex items-center justify-center gap-1">
              {analytics.tendenciaPositiva ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-600" />
              )}
              <p className={`text-lg font-bold ${analytics.tendenciaPositiva ? "text-green-600" : "text-rose-600"}`}>
                {Math.abs(analytics.tendencia).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos mais vendidos e últimas vendas */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Produtos mais vendidos</p>
          <div className="mt-5 grid gap-3">
            {analytics.topProducts.map((product, idx) => (
              <div key={idx} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{product.nome}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.quantidade} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-700">{formatMoney(product.receita)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatMoney(product.receita / product.quantidade)}/un</p>
                  </div>
                </div>
              </div>
            ))}
            {analytics.topProducts.length === 0 && (
              <div className="text-center py-8 text-slate-400">Nenhum produto vendido</div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Últimas vendas</p>
          <div className="mt-5 grid gap-3">
            {analytics.recentSales.map((sale) => (
              <div key={sale.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">Venda #{sale.id}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(sale.criadoEm)}</p>
                    <p className="mt-1 text-xs text-slate-500">Cliente: {sale.clienteNome}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-700">{formatMoney(sale.total)}</p>
                    <p className="mt-1 text-xs text-slate-500">{sale.quantidade} itens</p>
                  </div>
                </div>
              </div>
            ))}
            {analytics.recentSales.length === 0 && (
              <div className="text-center py-8 text-slate-400">Nenhuma venda registada</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}