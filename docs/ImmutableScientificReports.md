# Immutable Scientific Report Integrity

IUVFES scientific validation reports can be protected by a deterministic SHA-256 integrity hash.

## Integrity model

The hash covers the canonical report payload:

- schema version
- report identity
- research and source experiment IDs
- generation timestamp
- overall verdict and readiness
- validation sections and evidence
- provenance references
- scientific boundary

The hash itself is excluded from the payload that it protects.

## Verification

A stored SHA-256 can later be compared with a freshly computed hash. A mismatch means the report content no longer matches the originally recorded evidence state.

The integrity hash does **not** prove that the underlying experiment was scientifically correct. It proves only that the verified report payload has not changed relative to the hashed representation.

## Future persistence

The next persistence layer should store the report hash together with the report version, dataset IDs, provenance record IDs, author/reviewer identity, and creation timestamp. Historical reports must never be silently overwritten; a new scientific interpretation should create a new report version and hash.
