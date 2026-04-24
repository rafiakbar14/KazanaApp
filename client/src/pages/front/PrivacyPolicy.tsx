import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Informasi yang Kami Kumpulkan",
      content: "Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat mendaftar akun Kazana ERP, termasuk nama, alamat email, nomor telepon, dan detail bisnis Anda. Kami juga secara otomatis mengumpulkan data penggunaan teknis saat Anda mengakses platform kami."
    },
    {
      title: "2. Penggunaan Informasi",
      content: "Informasi yang kami kumpulkan digunakan untuk menyediakan, memelihara, dan meningkatkan layanan Kazana ERP, memproses transaksi, mengirimkan pemberitahuan administratif, dan untuk tujuan keamanan akun Anda."
    },
    {
      title: "3. Keamanan Data",
      content: "Kazana ERP menggunakan enkripsi standar industri (SSL/TLS) untuk melindungi data sensitif Anda. Kami berkomitmen untuk menjaga keamanan data bisnis Anda dari akses yang tidak sah."
    },
    {
      title: "4. Hak Pengguna",
      content: "Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui pengaturan akun atau dengan menghubungi tim dukungan kami."
    }
  ];

  return (
    <FrontLayout 
      title="Kebijakan Privasi" 
      description="Pelajari bagaimana Kazana ERP melindungi data bisnis dan privasi Anda dengan standar keamanan industri."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-8">
              Kebijakan <span className="text-[#0044CC]">Privasi</span>.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="space-y-12">
              {sections.map((s, i) => (
                <div key={i} className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-black text-slate-900 mb-4">{s.title}</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-20 p-8 bg-blue-50 rounded-3xl border border-blue-100 italic text-slate-600 font-medium">
              "Privasi Anda adalah prioritas kami. Kazana ERP tidak pernah menjual data bisnis Anda kepada pihak ketiga manapun."
            </div>
          </motion.div>
        </div>
      </section>
    </FrontLayout>
  );
}
