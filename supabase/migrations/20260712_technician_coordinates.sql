-- technicians had no coordinates, but Sprint 2's wallet-pass geofencing needs
-- creator coordinates for both business- and technician-created campaigns.
alter table technicians
  add column latitude numeric,
  add column longitude numeric;
