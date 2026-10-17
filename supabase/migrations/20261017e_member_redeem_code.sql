-- ============================================================================
-- Short, typeable redeem code per wallet member.
--
-- The pass barcode encodes "<member uuid>.<hmac>" (70+ characters), and the
-- Google Wallet card showed only "Show to redeem" under it, so a cashier had
-- nothing to type when the camera failed. Each member now gets an 8-character
-- code from an unambiguous alphabet (no 0/O, 1/I/L), shown under the barcode
-- as "ABCD-EFGH" and accepted by /api/redeem's manual entry. The barcode
-- itself is unchanged.
--
-- 31^8 ≈ 8.5 × 10^11 codes. Guessing one only lets a signed-in shop redeem
-- ITS OWN offer for that member (which costs the shop credit), and the same
-- "pass still saved" check applies, so the code is an identifier, not a
-- secret worth more than that.
-- ============================================================================

create or replace function gen_redeem_code()
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  -- 31 symbols: A–Z without I, L, O, plus 2–9.
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- Random bytes from core gen_random_uuid() (no pgcrypto dependency),
  -- skipping bytes 6–9, which carry the UUID version/variant bits.
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  idx int[] := array[0, 1, 2, 3, 4, 5, 10, 11];
  code_out text := '';
begin
  for i in 1..8 loop
    code_out := code_out || substr(alphabet, (get_byte(bytes, idx[i]) % 31) + 1, 1);
  end loop;
  return code_out;
end;
$$;

alter table wallet_members add column if not exists redeem_code text;

-- Backfill existing members (retry on the astronomically unlikely clash).
do $$
declare
  m record;
  code text;
begin
  for m in select id from wallet_members where redeem_code is null loop
    loop
      code := gen_redeem_code();
      exit when not exists (select 1 from wallet_members where redeem_code = code);
    end loop;
    update wallet_members set redeem_code = code where id = m.id;
  end loop;
end;
$$;

alter table wallet_members alter column redeem_code set default gen_redeem_code();
alter table wallet_members alter column redeem_code set not null;
create unique index if not exists wallet_members_redeem_code_key on wallet_members (redeem_code);
