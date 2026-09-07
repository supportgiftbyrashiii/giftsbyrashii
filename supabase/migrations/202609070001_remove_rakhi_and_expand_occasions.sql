-- Remove the retired Rakhi campaign and keep the evergreen gifting occasions managed in admin.
delete from public.homepage_sections where section_type = 'rakhi_sale';
delete from public.navigation_items where lower(label) like '%rakhi%' or lower(url) = '/rakhi-sale';

insert into public.occasions(name,slug,sort_order,is_active) values
  ('Birthday','birthday',1,true),
  ('Anniversary','anniversary',2,true),
  ('Wedding','wedding',3,true),
  ('Thank you','thank-you',4,true),
  ('Congratulations','congratulations',5,true),
  ('Just because','just-because',6,true),
  ('New beginnings','new-beginnings',7,true)
on conflict(slug) do update set name=excluded.name,sort_order=excluded.sort_order,is_active=true;

insert into public.homepage_sections(section_type,title,subtitle,is_enabled,sort_order)
select 'occasion_collection','Gifts for every beautiful reason','Find the feeling first. The perfect gift follows.',true,3
where not exists(select 1 from public.homepage_sections where section_type='occasion_collection');
