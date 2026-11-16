begin;

alter table public.private_documents
  drop constraint private_documents_scan_metadata_consistent;

alter table public.private_documents
  add constraint private_documents_scan_metadata_consistent check (
    (scan_status = 'pending' and scanned_at is null and scan_engine is null)
    or (
      scan_status in ('clean','infected','error')
      and scanned_at is not null
      and scan_engine is not null
      and char_length(scan_engine) between 3 and 80
    )
  ) not valid;

alter table public.private_documents
  validate constraint private_documents_scan_metadata_consistent;

commit;
