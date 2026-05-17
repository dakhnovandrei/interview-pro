import { expect, test } from '@playwright/test';

const jwtFor = (payload: Record<string, unknown>) => {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/login', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: jwtFor({ id: '1', role: 'admin', username: 'Admin', email: 'admin@test.local' }),
        refresh_token: 'refresh-token'
      })
    });
  });
  await page.route('**/api/v1/profile/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 1,
        username: 'Admin',
        email: 'admin@test.local',
        created_at: new Date().toISOString(),
        subscription_type: 'Premium',
        role: 'admin'
      })
    });
  });
  await page.route('**/api/v1/admin/users', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { user_id: 2, username: 'Candidate', email: 'candidate@test.local', role: 'candidate', is_active: true, created_at: new Date().toISOString() }
      ])
    });
  });
  await page.route('**/api/v1/admin/assign-role', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ user_id: 2, new_role: 'moderator' }) });
  });
  await page.route('**/api/v1/upload-photo', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ photo_url: 'http://storage.test/photo.png', user_id: 1 }) });
  });
  await page.route('**/api/v3/interviews?**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 1, name: 'Backend', job_position: 'Backend Developer', company: 'ACME', interview_type: 'technical', is_template: true, created_at: new Date().toISOString() }],
        total: 1,
        page: 1,
        page_size: 1,
        total_pages: 1
      })
    });
  });
  await page.route('**/api/v3/recent-interviews?**', async (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/api/v3/ready-templates?**', async (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/ws/v1/**', async (route) => route.abort());
});

test('core business flow: auth restore, roles, pagination, storage and external API fallback', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('admin@test.local');
  await page.getByLabel('Password').fill('admin123456');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/home/);

  await page.goto('/home');
  await expect(page.getByText('Interview Pro')).toBeVisible();

  await page.goto('/admin');
  await page.getByRole('button', { name: /Users/i }).click();
  await page.getByRole('button', { name: /Change Role/i }).click();
  await page.locator('select').selectOption('moderator');
  await page.getByRole('button', { name: /^Assign$/ }).click();

  await page.goto('/interview-templates');
  await expect(page.getByText('Backend Developer')).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();

  await page.route('**/api/v1/auth/logout', async (route) => route.fulfill({ contentType: 'application/json', body: '{}' }));
  await page.getByRole('button', { name: /Logout/i }).click();
  await page.waitForFunction(() => !localStorage.getItem('access_token'));
  await page.goto('/profile');
  await expect(page.getByText(/Welcome Back/i)).toBeVisible();
});
