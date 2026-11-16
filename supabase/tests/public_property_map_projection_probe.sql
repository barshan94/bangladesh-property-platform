begin;

do $$
declare
  definition text;
begin
  if not has_function_privilege('anon', 'public.list_public_property_map_points(text[])', 'EXECUTE') then
    raise exception 'PUBLIC_MAP_RPC_NOT_EXECUTABLE_BY_ANON';
  end if;
  if has_table_privilege('anon', 'public.listing_private_details', 'SELECT') then
    raise exception 'PRIVATE_PROPERTY_LOCATION_TABLE_EXPOSED_TO_ANON';
  end if;
  definition := pg_get_functiondef('public.list_public_property_map_points(text[])'::regprocedure);
  if position('cardinality(coalesce(p_public_references' in definition) = 0
     or position('round(d.latitude, 2)' in definition) = 0
     or position('round(d.longitude, 2)' in definition) = 0
     or position('l.status = ''published''' in definition) = 0 then
    raise exception 'PUBLIC_MAP_PROJECTION_MISSING_PRIVACY_FILTERS';
  end if;
end;
$$;

rollback;
