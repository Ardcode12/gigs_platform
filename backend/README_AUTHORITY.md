# Authority Backend

The authority portal is mounted under `/api` and uses JWTs whose `role` claim is
`authority`. Sign in with `POST /api/auth/society/login` and a JSON body containing
`societyCode` and `password`; send the returned access token as a Bearer token to
the society routes.

Before deploying these routes, apply `alembic/versions/0004_authority_portal.py`
through the normal Alembic deployment process. This change has deliberately not
been run in the workspace. Existing society rows need a unique `society_code` and
`password_hash` provisioned by an operator before authority login can succeed.

The authority models preserve the existing worker/customer tables and APIs. Legacy
workers receive authority KYC columns with a default `pending` status. GPS lookup
routes remain read-only compatibility endpoints; the request endpoint returns an
in-memory acknowledgement because there is no customer-to-society assignment
workflow in the existing schema.
