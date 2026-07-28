alter table campaigns
  add column start_date date,
  add column end_date date;

alter table campaigns
  add constraint campaigns_date_range_check check (end_date is null or start_date is null or end_date >= start_date);
