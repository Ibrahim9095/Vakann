# AI Autonom Sistem Mühərriki v4.0 (Jobera / TypeScript)

> **Bu fayl agentin beynidir. Hər sessiyada ilk bunu və `memory-bank/MASTER_STATE.md` oxu.**

---

## QANUN 0: Ana qanun

Sistem bitirməyincə dayanma. "Hazırdır" demə, əgər:
- Yeni kod üçün test yazılmayıbsa və ya keçməyibsə
- `memory-bank/` yenilənməyibsə

---

## QANUN 1: Yaddaş

Hər sessiya başında:
1. `memory-bank/` mövcudluğunu yoxla (yoxdursa yarat)
2. `memory-bank/sessions/` — ən son sessiya faylını oxu
3. `memory-bank/MASTER_STATE.md` — layihənin cari vəziyyəti
4. `.agents/memory/` — arxitektura arxivi (köhnə qeydlər)

---

## QANUN 2: Struktur (Jobera monorepo)

Python `src/modules/` yoxdur. Modullar pnpm workspace paketləridir:

```
Talent-Hubzip/
├── memory-bank/          # Agent yaddaşı (SESSION, STATE, TESTS)
├── artifacts/jobera/     # Frontend (React + Vite)
├── artifacts/api-server/ # Backend (Express 5)
├── lib/db/               # Drizzle schema
├── lib/api-client-react/ # Orval hooks
├── lib/api-spec/         # OpenAPI
├── scripts/              # seed-packages və s.
└── tests/                # Vitest (unit + integration)
```

Modul xəritəsi: [`memory-bank/modules/registry.md`](memory-bank/modules/registry.md)

---

## QANUN 3: Modul təcridi

- Paketlər bir-birinin `src/` qovluğuna import etməsin
- Frontend yalnız `/api/*` vasitəsilə backend-ə qoşulsun
- DB yalnız `api-server` və `scripts` tərəfindən istifadə olunsun

---

## QANUN 4: Fayl ölçüsü

Əl ilə yazılan fayllar **300 sətirdən** uzun olmasın. **İstisna:** `**/generated/**`, `node_modules`, `dist`.

---

## QANUN 5: Test

- Yeni biznes məntiqi → `tests/unit/` və ya `tests/integration/`
- Framework: **Vitest**
- `pnpm test` keçmədən "hazırdır" demə
- Nəticəni `memory-bank/TEST_RESULTS.md`-ə yaz

---

## Sessiya protokolu

**Başlanğıc:** MASTER_STATE + son session oxu → istifadəçiyə qısa status.

**Bitiş:** session faylını, PROGRESS, TEST_RESULTS (və lazım olsa BUGS) yenilə.

**Hər ~10 əməliyyat:** memory-bank aktualdırmı, test varmı, 300+ sətir manual fayl varmı?

---

## Qadağalar

1. Test olmadan tamamlama
2. Generated faylları əl ilə redaktə etmə
3. Yaddaş yeniləmədən sessiyanı bağlama
4. UI-da biznes məntiqini təkrarlama (API-də olmalıdır)
5. Plan fayllarını (`.cursor/plans/`) istifadəçi demədən redaktə etmə

---

## Dev əmrləri

```bash
pnpm install --ignore-scripts   # Windows
pnpm dev:api                    # PORT=8080, DATABASE_URL lazım
pnpm dev:web                    # PORT=19796, BASE_PATH=/
pnpm seed:packages
pnpm test
```

Arxitektura arxivi: [`.agents/memory/jobera-architecture.md`](.agents/memory/jobera-architecture.md)
