'use client';

import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Building2,
  ArrowRight
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ContactosPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("contact.title")}</h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              {t("contact.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-slate-50 rounded-xl p-6 text-center group hover:bg-orange-50 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <MapPin size={22} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{t("contact.location")}</h3>
              <p className="text-slate-500 text-sm">{t("contact.address")}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center group hover:bg-orange-50 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Phone size={22} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{t("contact.phone")}</h3>
              <p className="text-slate-500 text-sm">+258 86 218 0576</p>
              {/* <p className="text-slate-500 text-sm">+258 85 000 0000</p> */}
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center group hover:bg-orange-50 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Mail size={22} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{t("contact.email")}</h3>
              <p className="text-slate-500 text-sm">estaleiromavingue@gmail.com</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center group hover:bg-orange-50 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Clock size={22} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{t("contact.hours")}</h3>
              <p className="text-slate-500 text-sm">{t("contact.hoursDesc")}</p>
              <p className="text-slate-500 text-sm">{t("contact.hoursTime")}</p>
            </div>
          </div>

          {/* loc*/}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Localização</h2>
              <div className="bg-slate-100 rounded-xl overflow-hidden h-96 flex flex-col items-center justify-center">
                <Building2 size={64} className="text-slate-400 mb-4" />
                <p className="text-slate-500 text-lg font-medium">Maputo, Moçambique</p>
                <p className="text-slate-400 text-sm mt-1">--------------</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} />
                  <span>Coordenadas: 25.9692° S, 32.5732° E</span>
                </div>
              </div>
            </div>

            {/* */}
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-800 mb-3">{t("contact.customerSupport")}</h3>
              <p className="text-slate-600 text-sm mb-4">
                {t("contact.supportDesc")}
              </p>
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm hover:text-orange-700 transition">
                {t("common.login")}
                <ArrowRight size={14} />
              </Link>
              <div className="mt-6 pt-6 border-t border-orange-200">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{t("contact.responseTime")}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}