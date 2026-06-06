# Password Recovery Schema Findings

Verified against `https://users.picboard.space/api/v1` on June 6, 2026.

The local `curl` run required `-k` because certificate validation failed with
`unable to get local issuer certificate`. The schema and mutation validation
responses below are from the live GraphQL endpoint.

## Discovered Mutations

```graphql
type Mutation {
  passwordReset(input: PasswordResetInput!): PasswordResetPayload!
  setNewPassword(input: SetNewPasswordInput!): SetNewPasswordPayload!
}
```

## Input And Payload Types

```graphql
input PasswordResetInput {
  email: String!
  captchaToken: String!
}

type PasswordResetPayload {
  message: String!
}

input SetNewPasswordInput {
  code: String!
  password: String!
}

type SetNewPasswordPayload {
  message: String!
}
```

## Captcha Findings

`PasswordResetInput.captchaToken` is required.

No captcha field was found on `SetNewPasswordInput`.

No other exposed schema field, mutation argument, or input field containing
`captcha` was found during introspection.

## Validation Responses

### passwordReset With Missing captchaToken

Request variables:

```json
{
  "input": {
    "email": "not-a-real-user@example.com"
  }
}
```

Response:

```json
{
  "errors": [
    {
      "message": "Variable \"$input\" got invalid value { email: \"not-a-real-user@example.com\" }; Field \"captchaToken\" of required type \"String!\" was not provided.",
      "code": "BAD_USER_INPUT",
      "statusCode": 400,
      "errors": null
    }
  ]
}
```

### passwordReset With Invalid captchaToken

Request variables:

```json
{
  "input": {
    "email": "not-a-real-user@example.com",
    "captchaToken": "invalid-captcha-token"
  }
}
```

Response:

```json
{
  "errors": [
    {
      "message": "Captcha verification failed",
      "code": "BAD_USER_INPUT",
      "statusCode": 400,
      "errors": null
    }
  ],
  "data": null
}
```

### setNewPassword With Missing password

Request variables:

```json
{
  "input": {
    "code": "invalid-password-recovery-code"
  }
}
```

Response:

```json
{
  "errors": [
    {
      "message": "Variable \"$input\" got invalid value { code: \"invalid-password-recovery-code\" }; Field \"password\" of required type \"String!\" was not provided.",
      "code": "BAD_USER_INPUT",
      "statusCode": 400,
      "errors": null
    }
  ]
}
```

### setNewPassword With Invalid code

Request variables:

```json
{
  "input": {
    "code": "invalid-password-recovery-code",
    "password": "NewPassword1!"
  }
}
```

Response:

```json
{
  "errors": [
    {
      "message": "Invalid confirmation code",
      "code": "BAD_USER_INPUT",
      "statusCode": 400,
      "errors": null
    }
  ],
  "data": null
}
```

## Introspection Queries Used

```bash
curl -k -sS -X POST https://users.picboard.space/api/v1 \
  -H 'Content-Type: application/json' \
  --data '{"query":"query PasswordRecoverySchema { __schema { mutationType { fields { name args { name type { kind name ofType { kind name ofType { kind name } } } } type { kind name ofType { kind name ofType { kind name } } } } } } }"}'
```

```bash
curl -k -sS -X POST https://users.picboard.space/api/v1 \
  -H 'Content-Type: application/json' \
  --data '{"query":"query PasswordRecoveryTypes { passwordResetInput: __type(name: \"PasswordResetInput\") { kind name inputFields { name type { kind name ofType { kind name ofType { kind name } } } defaultValue } } passwordResetPayload: __type(name: \"PasswordResetPayload\") { kind name fields { name type { kind name ofType { kind name ofType { kind name } } } } } setNewPasswordInput: __type(name: \"SetNewPasswordInput\") { kind name inputFields { name type { kind name ofType { kind name ofType { kind name } } } defaultValue } } setNewPasswordPayload: __type(name: \"SetNewPasswordPayload\") { kind name fields { name type { kind name ofType { kind name ofType { kind name } } } } } }"}'
```

## Limits Of Verification

Success responses were not executed because a valid reCAPTCHA token and a valid
password recovery code were not available in this environment.

Recovery email link format, route query parameters, auto-login behavior, and
rate limiting details are not exposed by the GraphQL schema and were not
verified by these probes.
