create table if not exists provider_spend_entries (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  provider_slug text not null,
  amount_cad numeric(12,2),
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_month, provider_slug)
);

create index if not exists provider_spend_entries_period_month_idx
  on provider_spend_entries(period_month desc);

create or replace function set_provider_spend_entries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists provider_spend_entries_set_updated_at on provider_spend_entries;
create trigger provider_spend_entries_set_updated_at
before update on provider_spend_entries
for each row execute function set_provider_spend_entries_updated_at();
