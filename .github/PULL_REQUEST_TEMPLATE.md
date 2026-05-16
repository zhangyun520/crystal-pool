## Scope

- 

## Crystal Pool Mechanism Checklist

- [ ] Mode semantics are explicit when adding or changing a mechanism.
- [ ] Validation rules are covered.
- [ ] Report or replay output is covered when applicable.
- [ ] Tests were added or updated.
- [ ] Migration or rollback note is included when persistence changes.
- [ ] No wallet, token, RPC, real trade, or automatic external anchoring was added.

## Verification

- [ ] `npx tsc --noEmit --incremental false`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
