// Versi 1.1 - Perubahan kecil untuk memaksa refresh cache server.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3.2.0'
import { corsHeaders } from '../_shared/cors.ts'

// Inisialisasi Resend dengan API key dari environment variables (secrets)
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

Deno.serve(async (req) => {
  // Menangani preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Membuat koneksi ke Supabase dengan hak akses service_role (bisa membaca semua data)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Hitung tanggal 7 hari dari sekarang
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // 2. Ambil semua item yang stoknya kritis ATAU akan kadaluarsa
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('*, users(email)') // Mengambil data item DAN email pemiliknya
      .lt('stock', 10) // Stok kurang dari 10
      .or(`expiry_date.lte.${new Date().toISOString()}, expiry_date.lte.${sevenDaysFromNow.toISOString()}`) // kadaluarsa hari ini ATAU 7 hari ke depan
      
    if (itemsError) {
      throw itemsError
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'Tidak ada item yang butuh perhatian.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Kelompokkan item berdasarkan email pemiliknya
    const reportByUser = items.reduce((acc, item) => {
      // @ts-ignore: Mengabaikan error tipe karena kita tahu users ada
      const email = item.users?.email
      if (email) {
        if (!acc[email]) {
          acc[email] = { lowStock: [], expiringSoon: [] }
        }
        if (item.stock < 10) {
          acc[email].lowStock.push(`- ${item.name} (Sisa: ${item.stock})`)
        }
        if (new Date(item.expiry_date) <= sevenDaysFromNow) {
          acc[email].expiringSoon.push(`- ${item.name} (Kadaluarsa: ${item.expiry_date})`)
        }
      }
      return acc
    }, {} as Record<string, { lowStock: string[]; expiringSoon: string[] }>)

    // 4. Kirim email laporan ke setiap user
    for (const email in reportByUser) {
      const { lowStock, expiringSoon } = reportByUser[email]
      
      let emailHtml = `
        <h1>Laporan Inventaris Penting</h1>
        <p>Berikut adalah ringkasan barang di inventaris Anda yang membutuhkan perhatian:</p>
      `

      if (lowStock.length > 0) {
        emailHtml += `
          <h2>Barang dengan stok menipis (&lt;10):</h2>
          <ul>${lowStock.map(item => `<li>${item}</li>`).join('')}</ul>
        `
      }

      if (expiringSoon.length > 0) {
        emailHtml += `
          <h2>Barang mendekati/sudah kadaluarsa (dalam 7 hari):</h2>
          <ul>${expiringSoon.map(item => `<li>${item}</li>`).join('')}</ul>
        `
      }
       emailHtml += `<p>Silakan periksa inventaris Anda di aplikasi.</p>`

      try {
        await resend.emails.send({
          from: 'Laporan Inventaris <onboarding@resend.dev>',
          to: email,
          subject: `⚠️ Laporan Penting Inventaris Anda`,
          html: emailHtml,
        });
      } catch (error) {
        console.error(`Gagal mengirim email ke ${email}:`, error);
      }
    }

    return new Response(JSON.stringify({ message: 'Laporan berhasil dibuat dan dikirim.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

**Langkah 2: Deploy Ulang Function**

* Simpan perubahan di file `index.ts`.
* Buka terminal di folder proyek Anda.
* Jalankan kembali perintah deploy:

    ```bash
    npx supabase functions deploy email-notifikasi
    

