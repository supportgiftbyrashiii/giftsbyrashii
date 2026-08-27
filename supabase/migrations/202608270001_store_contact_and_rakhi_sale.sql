-- Publish the requested official contact details and Rakhi campaign on existing installations.
insert into public.site_settings(key, value)
values (
  'store',
  '{"name":"GiftsByRashii","legalName":"Giftsvilla Private Limited","supportEmail":"supportgiftbyrashiii@gmail.com","supportPhone":"63751 43789","whatsapp":"63751 43789","address":"4/1/24, K Sewani House, Lane Next To Mercedes Showroom, Nipania, Indore - 452010"}'::jsonb
)
on conflict(key) do update
set value = public.site_settings.value || excluded.value,
    updated_at = now();

insert into public.homepage_sections(section_type, title, subtitle, is_enabled, sort_order)
select
  'rakhi_sale',
  'Rakhi gifts, wrapped in extra joy.',
  'Celebrate the bond with thoughtful picks and festive savings on selected gifts.',
  true,
  1
where not exists (
  select 1 from public.homepage_sections where section_type = 'rakhi_sale'
);
