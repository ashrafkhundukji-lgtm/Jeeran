import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authErrorReason, looksLikeEmail } from './authErrors'

test('maps Supabase auth errors to the website reasons', () => {
  assert.equal(authErrorReason({ code: 'invalid_credentials' }), 'invalidCredentials')
  assert.equal(authErrorReason({ code: 'email_exists' }), 'emailTaken')
  assert.equal(authErrorReason({ code: 'weak_password' }), 'weakPassword')
  assert.equal(authErrorReason({ code: 'over_email_send_rate_limit' }), 'rateLimited')
  assert.equal(authErrorReason({ name: 'AuthRetryableFetchError' }), 'network')
  assert.equal(authErrorReason({ message: 'Invalid login credentials' }), 'invalidCredentials')
  assert.equal(authErrorReason({ message: 'Database error saving new user' }), 'generic')
})

test('email shape check', () => {
  assert.equal(looksLikeEmail(' owner@shop.sa '), true)
  assert.equal(looksLikeEmail('owner@shop'), false)
  assert.equal(looksLikeEmail(''), false)
})
