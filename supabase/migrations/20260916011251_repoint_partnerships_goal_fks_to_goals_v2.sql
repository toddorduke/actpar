-- partnerships.goal_id_1/2 still pointed at the pre-migration `goals`
-- table. 209 of 210 goals_v2 rows happened to share their pre-migration
-- id, masking this -- but any genuinely new goal created since the
-- migration fails this FK the moment someone tries to link it to a
-- Journey partnership. Confirmed live: inserting a real goals_v2-only id
-- throws "Key (goal_id_1)=(...) is not present in table goals".
alter table partnerships drop constraint partnerships_goal_id_1_fkey;
alter table partnerships drop constraint partnerships_goal_id_2_fkey;

alter table partnerships
  add constraint partnerships_goal_id_1_fkey
  foreign key (goal_id_1) references goals_v2(id) on delete set null;

alter table partnerships
  add constraint partnerships_goal_id_2_fkey
  foreign key (goal_id_2) references goals_v2(id) on delete set null;
