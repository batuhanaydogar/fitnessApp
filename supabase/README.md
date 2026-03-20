# Supabase Setup

## 1) Environment

`app/.env` dosyasi olustur:

```bash
cp .env.example .env
```

Degerleri doldur:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2) SQL Migration

Supabase SQL Editor'da su dosyayi calistir:

- `supabase/migrations/001_init_fitness_schema.sql`

Bu script:

- Tum temel tablolari
- RLS policy'leri
- Dashboard view ve RPC function'larini
- Auth trigger ve motivasyon seed verilerini

olusuturur.

## 3) Uygulama Entegrasyonu

Codebase'de eklenenler:

- `lib/supabase/client.ts`
- `lib/supabase/types.ts`
- `services/motivation.service.ts`
- `services/dashboard.service.ts`
- `services/tracking.service.ts`

Motivasyon ekrani Supabase baglantisi varsa veriyi DB'den ceker, yoksa lokal fallback ile calismaya devam eder.
