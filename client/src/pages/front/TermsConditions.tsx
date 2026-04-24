import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";

export default function TermsConditions() {
  const terms = [
    {
      title: "1. Penerimaan Ketentuan",
      content: "Dengan menggunakan layanan Kazana ERP, Anda setuju untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju, harap jangan menggunakan layanan kami."
    },
    {
      title: "2. Lisensi Penggunaan",
      content: "Kazana ERP memberikan lisensi terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk mengakses dan menggunakan platform sesuai dengan paket berlangganan yang Anda pilih."
    },
    {
      title: "3. Akun Pengguna",
      content: "Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun dan password Anda. Kazana ERP tidak bertanggung jawab atas aktivitas yang terjadi di bawah akun Anda tanpa persetujuan Anda."
    },
    {
      title: "4. Pembayaran dan Langganan",
      content: "Layanan kami berbasis langganan bulanan atau tahunan. Penagihan akan dilakukan secara otomatis kecuali Anda membatalkan langganan sebelum tanggal perpanjangan."
    },
    {
      title: "5. Batasan Tanggung Jawab",
      content: "Dalam hal apa pun, Kazana ERP tidak bertanggung jawab atas kehilangan profit atau kerugian tidak langsung yang diakibatkan oleh penggunaan atau ketidakmampuan menggunakan platform kami."
    }
  ];

  return (
    <FrontLayout 
      title="Syarat & Ketentuan" 
      description="Ketentuan penggunaan layanan Kazana ERP. Transparansi dan kejelasan untuk kenyamanan bisnis Anda."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-8">
              Syarat & <span className="text-[#0044CC]">Ketentuan</span>.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="space-y-12">
              {terms.map((t, i) => (
                <div key={i} className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-black text-slate-900 mb-4">{t.title}</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {t.content}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-20 p-10 bg-slate-950 text-white rounded-[3rem] text-center">
               <h3 className="text-xl font-bold mb-4">Butuh Bantuan Memahami Ketentuan Kami?</h3>
               <p className="text-slate-400 mb-8 max-w-lg mx-auto">Kami transparan dalam setiap aturan. Hubungi tim hukum kami jika ada poin yang kurang jelas.</p>
               <a href="/kontak">
                 <button className="h-14 px-10 bg-[#0044CC] hover:bg-blue-700 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs">
                   Hubungi Tim Kazana
                 </button>
               </a>
            </div>
          </motion.div>
        </div>
      </section>
    </FrontLayout>
  );
}
