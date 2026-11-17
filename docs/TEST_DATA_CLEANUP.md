# Temporary production test data

This project currently has a small set of **TEST DATA ONLY** rows in the connected Supabase project so the administrator can exercise the live work queues.

These records are not real properties, clients, inquiries, contact details, ownership evidence, or service requests. They use `example.com` email addresses and fictional Bangladesh locations. Property listings remain in `submitted` status and are not public listings.

## Seeded record IDs

- Property listings:
  - `b1000000-0000-4000-8000-000000000001`
  - `b1000000-0000-4000-8000-000000000002`
- Website inquiries:
  - `b2000000-0000-4000-8000-000000000001`
  - `b2000000-0000-4000-8000-000000000002`
- Service requests:
  - `b3000000-0000-4000-8000-000000000001`
  - `b3000000-0000-4000-8000-000000000002`

The corresponding listing and service-request status history rows are generated/seeded for workflow display. Any audit events or staff notes created while testing these records should also be removed by the cleanup below.

## Targeted cleanup before client handover

Run this SQL only after testing is complete. It deletes only the six listed test records and their associated workflow history/notes/audit rows. It does **not** delete administrator accounts, staff roles, service pages, real customer data, or database schema.

```sql
begin;

delete from public.inquiry_staff_notes
where inquiry_id in (
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002'
);

delete from public.listing_status_events
where listing_id in (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002'
);

delete from public.service_request_status_events
where service_request_id in (
  'b3000000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000002'
);

delete from public.audit_events
where resource_id in (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'b3000000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000002'
);

delete from public.inquiries
where id in (
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002'
);

delete from public.service_requests
where id in (
  'b3000000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000002'
);

delete from public.property_listings
where id in (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002'
);

commit;
```

After cleanup, verify that each of the three tables has zero rows for the IDs above. If test images were uploaded manually during testing, remove those separately through the approved media/storage workflow; this cleanup does not delete storage objects.
