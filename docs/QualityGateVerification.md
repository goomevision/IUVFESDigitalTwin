# IUVFES Quality Gate Verification

This document records the verification intent for the scientific validation report layer.

The Quality Gate must pass the repository checks before the branch is considered merge-ready:

1. `pnpm install --frozen-lockfile`
2. `pnpm check`
3. `pnpm test`
4. `pnpm build`

A green Quality Gate is evidence that the repository passes these automated checks; it is not a scientific claim about the validity of simulation results.

## Revalidation

The branch is revalidated through GitHub Actions after the latest report-readiness correction. The intended result is a fully green Quality Gate with all four checks passing.
