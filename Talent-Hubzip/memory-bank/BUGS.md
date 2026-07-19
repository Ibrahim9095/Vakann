# BUGS — Açıq məsələlər

## Mühit / infrastruktur

- [ ] **DB push Docker-asılı** — PostgreSQL container (`jobera-postgres`) və ya lokal PG + `DATABASE_URL` tələb olunur
- [ ] **Windows preinstall** — root `preinstall` `sh` istifadə edir; `pnpm install --ignore-scripts` lazım ola bilər

## Prod keyfiyyəti (məlum məhdudiyyətlər)

- [ ] **Real inteqrasiyalar stub** — SMS, Telegram, Instagram, LinkedIn, ödəniş provayderi

## Həll edilmiş (arxiv)

- [x] Auth session in-memory → Redis (`jobera-redis`)
- [x] Parol hash SHA-256 → bcrypt + lazy migration

## Aşağı prioritet

- [ ] OpenAPI-də bütün admin route-lar tam sənədləşdirilməyib (adminApi raw fetch istifadə edir)

## Həll edilmiş (arxiv)

_(yeni həll edilən bug-lar buraya köçürülür)_
