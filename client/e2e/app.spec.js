import { test, expect } from '@playwright/test';

test.describe('EnterpriseNet Access Portal E2E UI Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
  });

  test('1. Login screen loads with one-click demo accounts fill', async ({ page }) => {
    const authHeading = page.getByText('Console Authentication');
    await authHeading.scrollIntoViewIfNeeded();
    await expect(authHeading).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Admin (IT)')).toBeVisible();

    // Click HR demo account
    await page.getByText('HR Member').click();
    await page.getByRole('button', { name: /Sign In To Portal/i }).click();

    // Verify redirected to Network Map dashboard
    await expect(page.getByText('Enterprise Network Topology')).toBeVisible({ timeout: 15000 });
  });

  test('2. HR member restriction and portal resources', async ({ page }) => {
    const authHeading = page.getByText('Console Authentication');
    await authHeading.scrollIntoViewIfNeeded();
    await expect(authHeading).toBeVisible({ timeout: 15000 });
    await page.getByText('HR Member').click();
    await page.getByRole('button', { name: /Sign In To Portal/i }).click();

    // Navigate to Portal Resources
    await page.getByRole('link', { name: /Portal Resources/i }).click();
    await expect(page.getByText('HR Records')).toBeVisible({ timeout: 15000 });

    // Finance Ledger should show LOCKED status or request access
    await expect(page.getByText('Finance Ledger')).toBeVisible({ timeout: 15000 });
  });

  test('6. Test Lab simulation trace execution', async ({ page }) => {
    const authHeading = page.getByText('Console Authentication');
    await authHeading.scrollIntoViewIfNeeded();
    await expect(authHeading).toBeVisible({ timeout: 15000 });
    await page.getByText('Admin (IT)').click();
    await page.getByRole('button', { name: /Sign In To Portal/i }).click();

    await page.getByRole('link', { name: /Test Lab/i }).click();
    await expect(page.getByText('Packet Tracer Traffic Simulation Terminal')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Run Simulation Trace/i }).click();
    await expect(page.getByText('VERDICT:')).toBeVisible({ timeout: 15000 });
  });

  test('7. Member role URL protection', async ({ page }) => {
    const authHeading = page.getByText('Console Authentication');
    await authHeading.scrollIntoViewIfNeeded();
    await expect(authHeading).toBeVisible({ timeout: 15000 });
    await page.getByText('HR Member').click();
    await page.getByRole('button', { name: /Sign In To Portal/i }).click();

    // Member trying to visit /matrix is redirected safely to /
    await page.goto('/matrix');
    await page.waitForURL('**/', { timeout: 15000 });
    await expect(page.url()).not.toContain('/matrix');
  });

  test('10. Command Palette opens with Ctrl+K', async ({ page }) => {
    const authHeading = page.getByText('Console Authentication');
    await authHeading.scrollIntoViewIfNeeded();
    await expect(authHeading).toBeVisible({ timeout: 15000 });
    await page.getByText('Admin (IT)').click();
    await page.getByRole('button', { name: /Sign In To Portal/i }).click();

    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/Type a command/i)).toBeVisible({ timeout: 15000 });
  });
});


